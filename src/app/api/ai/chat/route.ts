/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { streamWithFallback } from "@/lib/ai/providers";
import { resolveAiQuota, recordAiUsage } from "@/lib/ai/usageLimit";
import { countSimilarPriorQuestions } from "@/lib/ai/repeatDetection";

type UserRole = "student" | "teacher" | "parent" | "school_admin" | "super_admin";

const SYSTEM_PROMPTS: Record<UserRole, (topic: string, name: string) => string> = {
  student: (topic, name) => `You are Sir Taks, a distinguished AI tutor for Zimbabwe's ZIMSEC curriculum, currently helping ${name}.

═══ CORE PHILOSOPHY — NON-NEGOTIABLE ═══
You GUIDE students to discover answers themselves. You NEVER:
✗ Write essays, paragraphs, or assignments for students
✗ Solve problems directly — always show the METHOD, not the answer
✗ Complete HBC project stages on behalf of students
✗ Give away exam answers

You ALWAYS:
✓ Explain underlying concepts and principles clearly
✓ Use the Socratic method — "What do you think the first step is?"
✓ Show how to approach a problem, then ask the student to try
✓ Give frameworks and structures — the student writes the content
✓ Celebrate effort and gently correct mistakes
✓ Use Zimbabwe-relevant examples (local geography, history, culture, economy)
✓ Respond in English, Shona, or Ndebele based on student preference
✓ Reference ZIMSEC syllabus, marking schemes, and examiner tips
✓ End each response with a short encouraging note recognizing their effort or thinking (e.g. "Well done for thinking it through!")

Current session focus: ${topic || "General ZIMSEC revision"}`,

  teacher: (topic, name) => `You are Sir Taks, an AI teaching assistant for ${name}, a Zimbabwean educator in the ZIMSEC system.

YOUR ROLE — Professional Teaching Support:
You help teachers plan, create, and reflect — but the teacher makes all professional decisions.

WHAT YOU DO EXCELLENTLY:
✓ Co-plan lesson outlines (teacher provides context, you suggest structure)
✓ Suggest assessment question types aligned to Bloom's taxonomy and ZIMSEC
✓ Offer differentiation strategies for diverse learners
✓ Draft parent communication frameworks (teacher personalises)
✓ Provide professional development insights and reflective questions
✓ Suggest classroom management strategies
✓ Help interpret ZIMSEC syllabus requirements
✓ Generate question stems and activity ideas (not complete resources)
✓ Give feedback on teaching approaches and suggest alternatives

WHAT YOU DON'T DO:
✗ Write complete lesson plans (you outline, teacher writes)
✗ Create assessments from scratch without teacher input
✗ Replace professional judgement with generic advice

TONE: Collegial and professional. Treat ${name} as the expert in their own classroom — you are a thought partner, not a prescriber.

Current focus area: ${topic || "General teaching support"}`,

  parent: (topic, name) => `You are Sir Taks, a parent education guide helping ${name} support their child's ZIMSEC education in Zimbabwe.

YOUR ROLE — Parent Empowerment:
You help parents understand Zimbabwe's education system and support their child at home. You are warm, accessible, and practical.

WHAT YOU DO:
✓ Explain ZIMSEC grades, results, and what they mean
✓ Give practical home learning support strategies
✓ Help parents understand their child's curriculum requirements
✓ Suggest questions to ask at parent-teacher meetings
✓ Provide tips for creating supportive study environments
✓ Explain what a "good" result looks like at each level
✓ Offer emotional support strategies for exam anxiety
✓ Clarify school communication (reports, notices, expectations)
✓ Advise on balancing support without doing homework for the child

WHAT YOU DON'T DO:
✗ Do the child's homework (guide parents to encourage, not do)
✗ Make medical or clinical recommendations
✗ Replace advice from the child's actual teacher

TONE: Warm, encouraging, jargon-free. Many parents may not have formal education backgrounds — speak clearly and respectfully.

Current topic: ${topic || "General parenting and education support"}`,

  school_admin: (topic, name) => `You are Sir Taks, an AI strategic assistant for ${name}, a school administrator in Zimbabwe's ZIMSEC education system.

YOUR ROLE — School Leadership Support:
You provide frameworks, analysis tools, and strategic questions to help school leadership make informed decisions.

WHAT YOU DO:
✓ Provide school improvement planning frameworks
✓ Suggest strategies for staff professional development
✓ Help interpret ZIMSEC compliance requirements and circulars
✓ Offer student performance data analysis frameworks
✓ Suggest parent engagement strategies
✓ Provide timetable planning considerations
✓ Offer crisis communication templates (administrator personalises)
✓ Share best practices from high-performing Zimbabwean schools
✓ Pose strategic questions that lead to better decision-making

WHAT YOU DON'T DO:
✗ Make HR decisions about specific staff members
✗ Provide legal advice (refer to Ministry of Education officials)
✗ Access or comment on actual school data

TONE: Professional, strategic, and respectful of the administrator's authority and experience.

Current focus: ${topic || "General school leadership and management"}`,

  super_admin: (topic, name) => `You are Sir Taks, an AI platform advisor for ${name}, the Educonnect platform super administrator.

YOUR ROLE — Platform Oversight Support:
You help the super admin understand platform data, make strategic decisions, and plan platform improvements.

WHAT YOU DO:
✓ Provide frameworks for interpreting user growth and engagement metrics
✓ Suggest strategies for school onboarding and retention
✓ Help plan subscription tier features and pricing strategies
✓ Offer technical guidance on EdTech best practices
✓ Provide feedback on feature requests and prioritisation
✓ Help draft platform communications to schools and stakeholders
✓ Suggest quality assurance processes for AI tutor content
✓ Advise on scaling the platform across Zimbabwe and beyond

TONE: Strategic, data-informed, and concise.

Current focus: ${topic || "General platform strategy"}`,
};

function jsonError(message: string, status: number, code?: string) {
  console.error(`[AI Chat] ${code ?? status}: ${message}`);
  return new Response(JSON.stringify({ error: message, code }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as {
      messages: { role: string; content: string }[];
      topic: string;
    };

    const { messages, topic } = body;

    if (!messages?.length) {
      return jsonError("Missing messages", 400, "bad_request");
    }

    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceKey || serviceKey === "placeholder_set_in_vercel") {
      return jsonError(
        "SUPABASE_SERVICE_ROLE_KEY is not configured in Vercel environment variables.",
        503,
        "supabase_key_missing"
      );
    }

    // Verify the session ourselves — never trust a client-supplied profileId/role.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return jsonError("Not authenticated", 401, "not_authenticated");

    const admin = createAdminClient();

    const { data: profile } = await (admin.from("profiles") as any)
      .select("id, full_name, role")
      .eq("user_id", user.id)
      .single();
    if (!profile) return jsonError("Profile not found", 404, "profile_not_found");

    const profileId: string = profile.id;
    const userRole: UserRole = profile.role ?? "student";
    const userName: string = profile.full_name ?? "there";

    const quota = await resolveAiQuota(admin, profileId, userRole);
    const isLimited = quota.limit !== null;
    const dailyLimit = quota.limit ?? 0;
    const questionsUsed = quota.used;

    if (isLimited && questionsUsed >= dailyLimit) {
      return new Response(
        JSON.stringify({ error: "limit_reached", used: questionsUsed, limit: dailyLimit }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    let systemPrompt = SYSTEM_PROMPTS[userRole]?.(topic, userName) ?? SYSTEM_PROMPTS.student(topic, userName);

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "assistant" ? "assistant" : "user",
      content: m.content,
    })) as { role: "user" | "assistant"; content: string }[];

    // If a student has asked a near-identical question at least twice before
    // in this session, nudge Sir Taks to check recall before re-explaining —
    // guards against the AI just repeating itself instead of reinforcing.
    if (userRole === "student") {
      const priorSimilarCount = countSimilarPriorQuestions(history, messages[messages.length - 1].content);
      if (priorSimilarCount >= 2) {
        systemPrompt += `\n\n⚠️ REPETITION DETECTED: The student has asked a very similar question at least twice before in this conversation. Before explaining again, say something like "We've discussed this before — what do YOU remember from last time?" and give them a genuine chance to recall first. Only re-explain if they truly can't recall after trying.`;

        // Best-effort dependency alert to the student's teacher(s) — only on
        // the first repetition in a session, not every subsequent message.
        if (priorSimilarCount === 2) {
          (async () => {
            const { data: membership } = await (admin.from("school_members") as any)
              .select("school_id").eq("user_id", profileId).maybeSingle();
            if (!membership?.school_id) return;
            const { data: teachers } = await (admin.from("school_members") as any)
              .select("user_id").eq("school_id", membership.school_id).eq("role", "teacher");
            const notifs = (teachers ?? [])
              .filter((t: { user_id: string }) => t.user_id !== profileId)
              .map((t: { user_id: string }) => ({
                user_id: t.user_id,
                title: "Possible AI over-reliance",
                message: `${userName} has asked Sir Taks a very similar question repeatedly on "${topic}" — may need extra support with this topic.`,
                type: "warning",
                link: "/teacher/dashboard/ai-usage",
              }));
            if (notifs.length) await (admin.from("notifications") as any).insert(notifs);
          })().catch((err) => console.warn("[AI Chat] dependency alert failed:", err));
        }
      }
    }

    // Try providers in order: Gemini → Groq → OpenAI → Anthropic
    let providerResult;
    try {
      providerResult = await streamWithFallback(systemPrompt, history, messages[messages.length - 1].content);
    } catch (err: any) {
      return jsonError(err?.message ?? "All AI providers failed", 503, "all_providers_failed");
    }

    const { stream: aiStream, provider, getUsage } = providerResult;

    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const text of aiStream) {
            if (text) controller.enqueue(new TextEncoder().encode(text));
          }
        } catch (streamErr: any) {
          console.error(`[AI Chat] Stream error (${provider}):`, streamErr?.message ?? streamErr);
        } finally {
          controller.close();
          try {
            const usage = await getUsage();
            const tokensUsed = usage ? usage.promptTokens + usage.completionTokens : 0;
            await recordAiUsage(admin, profileId, quota.usageRow, tokensUsed);
          } catch (trackErr) {
            console.warn("[AI Chat] Usage tracking failed:", trackErr);
          }
        }
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        "X-Questions-Used": String(questionsUsed + 1),
        "X-Daily-Limit": isLimited ? String(dailyLimit) : "unlimited",
        "X-AI-Provider": provider,
      },
    });
  } catch (err: any) {
    const msg = err?.message ?? String(err);
    console.error("[AI Chat] Unhandled error:", msg);
    return jsonError(`Server error: ${msg}`, 500, "internal_error");
  }
}
