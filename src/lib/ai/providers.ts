/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Multi-provider AI fallback chain.
 * Order: Gemini → Groq → OpenAI → Anthropic
 * Any provider whose key is missing is skipped automatically.
 * Only free-tier providers (Gemini + Groq) are needed for startup.
 */

export interface AIMessage {
  role: "user" | "assistant";
  content: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface ProviderStream {
  stream: AsyncIterable<string>;
  provider: string;
  /** Resolves after the stream has fully drained. Null if the provider doesn't report usage. */
  getUsage: () => Promise<TokenUsage | null>;
}

// ── Gemini ─────────────────────────────────────────────────────────────────

async function tryGemini(
  systemPrompt: string,
  history: AIMessage[],
  userMessage: string
): Promise<ProviderStream> {
  const key = process.env.GEMINI_API_KEY;
  if (!key || key === "placeholder_set_in_vercel") throw new Error("Gemini key not set");

  const { GoogleGenerativeAI } = await import("@google/generative-ai");
  const genAI = new GoogleGenerativeAI(key);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: systemPrompt,
  });

  // Gemini requires history to start with "user" and strictly alternate user/model.
  // Drop any leading assistant messages (UI welcome messages must not reach the API).
  const firstUserIdx = history.findIndex((m) => m.role === "user");
  const safeHistory = firstUserIdx >= 0 ? history.slice(firstUserIdx) : [];

  const geminiHistory = safeHistory.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const chat = model.startChat({ history: geminiHistory });
  const result = await chat.sendMessageStream(userMessage);

  return {
    provider: "gemini",
    stream: (async function* () {
      for await (const chunk of result.stream) {
        const text = chunk.text();
        if (text) yield text;
      }
    })(),
    getUsage: async () => {
      const finalResponse = await result.response;
      const usage = finalResponse.usageMetadata;
      if (!usage) return null;
      return {
        promptTokens: usage.promptTokenCount ?? 0,
        completionTokens: usage.candidatesTokenCount ?? 0,
      };
    },
  };
}

// ── Groq (free tier — llama-3.3-70b) ───────────────────────────────────────

async function tryGroq(
  systemPrompt: string,
  history: AIMessage[],
  userMessage: string
): Promise<ProviderStream> {
  const key = process.env.GROQ_API_KEY;
  if (!key || key === "placeholder_set_in_vercel") throw new Error("Groq key not set");

  const { default: Groq } = await import("groq-sdk");
  const groq = new Groq({ apiKey: key });

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: userMessage },
  ];

  const stream = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages,
    stream: true,
    max_tokens: 2048,
  });

  return {
    provider: "groq",
    stream: (async function* () {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) yield text;
      }
    })(),
    // Groq's streaming API can report usage via stream_options, but that's not
    // wired up yet — Gemini is the only provider actually configured today.
    getUsage: async () => null,
  };
}

// ── OpenAI (paid — gpt-4o-mini) ────────────────────────────────────────────

async function tryOpenAI(
  systemPrompt: string,
  history: AIMessage[],
  userMessage: string
): Promise<ProviderStream> {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key === "placeholder_set_in_vercel") throw new Error("OpenAI key not set");

  const { default: OpenAI } = await import("openai");
  const openai = new OpenAI({ apiKey: key });

  const messages = [
    { role: "system" as const, content: systemPrompt },
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: userMessage },
  ];

  const stream = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages,
    stream: true,
    max_tokens: 2048,
  });

  return {
    provider: "openai",
    stream: (async function* () {
      for await (const chunk of stream) {
        const text = chunk.choices[0]?.delta?.content;
        if (text) yield text;
      }
    })(),
    // OpenAI's streaming API can report usage via stream_options, but that's
    // not wired up yet — Gemini is the only provider actually configured today.
    getUsage: async () => null,
  };
}

// ── Anthropic (paid — claude-haiku) ────────────────────────────────────────

async function tryAnthropic(
  systemPrompt: string,
  history: AIMessage[],
  userMessage: string
): Promise<ProviderStream> {
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key || key === "placeholder_set_in_vercel") throw new Error("Anthropic key not set");

  const Anthropic = (await import("@anthropic-ai/sdk")).default;
  const anthropic = new Anthropic({ apiKey: key });

  const anthropicMessages = [
    ...history.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user" as const, content: userMessage },
  ];

  // anthropic.messages.stream() returns a MessageStream (not a Promise) — no await needed
  const msgStream = anthropic.messages.stream({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 2048,
    system: systemPrompt,
    messages: anthropicMessages,
  });

  return {
    provider: "anthropic",
    stream: (async function* () {
      for await (const event of msgStream) {
        if (
          event.type === "content_block_delta" &&
          (event.delta as any).type === "text_delta"
        ) {
          yield (event.delta as any).text;
        }
      }
    })(),
    // Anthropic's finalMessage().usage would give real counts, but that's not
    // wired up yet — Gemini is the only provider actually configured today.
    getUsage: async () => null,
  };
}

// ── Fallback chain ──────────────────────────────────────────────────────────

const PROVIDERS = [
  { name: "Gemini",    fn: tryGemini    },
  { name: "Groq",      fn: tryGroq      },
  { name: "OpenAI",    fn: tryOpenAI    },
  { name: "Anthropic", fn: tryAnthropic },
];

/**
 * Tries each provider in order. Skips providers with no key set.
 * Returns the first successful stream.
 */
export async function streamWithFallback(
  systemPrompt: string,
  history: AIMessage[],
  userMessage: string
): Promise<ProviderStream> {
  const errors: string[] = [];

  for (const { name, fn } of PROVIDERS) {
    try {
      const result = await fn(systemPrompt, history, userMessage);
      if (errors.length > 0) {
        console.info(`[AI] ${name} succeeded after ${errors.length} failure(s):`, errors);
      } else {
        console.info(`[AI] Using ${name}`);
      }
      return result;
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      // Only log as warning if it's a real failure (not just "key not set")
      if (!msg.includes("key not set")) {
        console.warn(`[AI] ${name} failed:`, msg);
      }
      errors.push(`${name}: ${msg}`);
    }
  }

  throw new Error(
    `All AI providers failed or have no keys configured.\n${errors.join("\n")}\n\n` +
    "Set at least GEMINI_API_KEY or GROQ_API_KEY in your Vercel environment variables."
  );
}
