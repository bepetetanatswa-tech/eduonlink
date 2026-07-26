/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { IconChip, IconAlertTriangle, IconChevronRight } from "@/components/icons";

type UserRole = "student" | "teacher" | "parent" | "school_admin" | "super_admin";

interface Message { role: "user" | "assistant"; content: string; ts: Date; }

interface Props {
  profileId: string;
  userName: string;
  userRole: UserRole;
  initialQuestionsUsed?: number;
  /** Resolved server-side (see src/lib/ai/usageLimit.ts). null = unlimited. */
  dailyLimit?: number | null;
}

const ROLE_CONFIG: Record<UserRole, {
  title: string;
  subtitle: string;
  welcomeBody: string;
  disclaimer: string;
  topics: string[];
}> = {
  student: {
    title: "Sir Taks AI Tutor",
    subtitle: "Your personal ZIMSEC guide — select a subject to begin",
    welcomeBody: "I guide you through concepts step by step — I won't do your homework, but I'll help you master it deeply.",
    disclaimer: "Sir Taks guides your thinking — he won't do the work for you, but will help you master it.",
    topics: [
      "Mathematics", "English Language", "English Literature", "Shona", "Ndebele",
      "History", "Geography", "Biology", "Chemistry", "Physics", "Combined Science",
      "Agriculture", "Business Studies", "Accounting", "Computer Science",
      "Art & Design", "R.M.E", "HBC / Heritage", "Commerce", "General Revision",
    ],
  },
  teacher: {
    title: "Sir Taks — Teaching Assistant",
    subtitle: "Your AI co-planner for the Zimbabwean classroom",
    welcomeBody: "I'm your professional thought partner. Tell me what you're teaching and we'll plan it together — you make all the final decisions.",
    disclaimer: "Sir Taks is your planning partner — the professional judgement is always yours.",
    topics: [
      "Lesson Planning", "Assessment Design", "Differentiation Strategies",
      "HBC Project Guidance", "Parent Communication", "Classroom Management",
      "ZIMSEC Exam Prep", "Professional Development", "Report Writing", "Student Motivation",
    ],
  },
  parent: {
    title: "Sir Taks — Parent Guide",
    subtitle: "Understand your child's education and how to support them",
    welcomeBody: "I help you understand Zimbabwe's school system and give you practical ways to support your child's learning at home.",
    disclaimer: "Always work with your child's actual teacher for personalised advice about your specific child.",
    topics: [
      "Understanding Results", "Home Learning Support", "Exam Season Support",
      "Curriculum Questions", "School Communication", "Study Environment",
      "Managing Anxiety", "ZIMSEC Explained",
    ],
  },
  school_admin: {
    title: "Sir Taks — School Advisor",
    subtitle: "Strategic AI support for school leadership",
    welcomeBody: "I help you think through school challenges and plan improvements. Bring a problem or question and we'll work through it together.",
    disclaimer: "Sir Taks provides frameworks and options — all decisions remain with school leadership.",
    topics: [
      "School Improvement", "Staff Development", "ZIMSEC Compliance",
      "Student Performance", "Parent Engagement", "Timetable Planning",
      "School Policy", "Budget Planning",
    ],
  },
  super_admin: {
    title: "Sir Taks — Platform Advisor",
    subtitle: "Strategic AI support for EduOnLink platform management",
    welcomeBody: "I help you analyse platform metrics, plan growth strategy, and think through product decisions for EduOnLink.",
    disclaimer: "Strategic frameworks only — always validate with real platform data.",
    topics: [
      "Platform Strategy", "School Onboarding", "Subscription Tiers",
      "Feature Planning", "User Growth", "Quality Assurance",
    ],
  },
};

function renderContent(text: string) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return (
      <span key={i}>
        {parts.map((p, j) => {
          if (p.startsWith("**") && p.endsWith("**")) return <strong key={j} className="text-edu-ink font-bold">{p.slice(2, -2)}</strong>;
          if (p.startsWith("`") && p.endsWith("`")) return <code key={j} className="bg-edu-copper-100 px-1.5 py-0.5 rounded text-[0.9em] text-edu-copper-dark">{p.slice(1, -1)}</code>;
          return <span key={j}>{p}</span>;
        })}
        {i < text.split("\n").length - 1 && <br />}
      </span>
    );
  });
}

export function SirTaksChat({ profileId, userName, userRole, initialQuestionsUsed = 0, dailyLimit = null }: Props) {
  const cfg = ROLE_CONFIG[userRole] ?? ROLE_CONFIG.student;
  const [phase, setPhase] = useState<"select" | "chat">("select");
  const [topic, setTopic] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [questionsUsed, setQuestionsUsed] = useState(initialQuestionsUsed);
  const [convId, setConvId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, streamText]);

  const startSession = (selectedTopic: string) => {
    setTopic(selectedTopic);
    setPhase("chat");
    const firstName = userName.split(" ")[0];
    const welcomes: Record<UserRole, string> = {
      student: `Welcome, ${firstName}! I'm Sir Taks, your ZIMSEC **${selectedTopic}** guide.\n\nI'm here to help you *understand* the material — not to do the work for you. Ask me to explain a concept, generate practice questions, or review your attempts.\n\nWhat would you like to explore today?`,
      teacher: `Hello, ${firstName}! I'm ready to help with **${selectedTopic}**.\n\nTell me what you're working on — describe your class, the topic, and what you need, and we'll think through it together.\n\nWhat's the teaching challenge on your mind?`,
      parent: `Hello, ${firstName}! I'm here to help you with **${selectedTopic}**.\n\nFeel free to ask anything about your child's education, the school system, or how to support learning at home. No question is too basic.\n\nWhat would you like to understand better?`,
      school_admin: `Hello, ${firstName}! Let's work through **${selectedTopic}** together.\n\nDescribe the challenge or question facing your school, and I'll help you think through options, frameworks, and best practices.\n\nWhat's on your agenda?`,
      super_admin: `Hello, ${firstName}! Ready to work on **${selectedTopic}**.\n\nWhat platform challenge or strategic question would you like to think through?`,
    };
    setMessages([{ role: "assistant", content: welcomes[userRole] ?? welcomes.student, ts: new Date() }]);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || streaming) return;
    if (dailyLimit !== null && questionsUsed >= dailyLimit) {
      setError(`You've used all ${dailyLimit} free questions today. Upgrade to Student Pro for unlimited access.`);
      return;
    }
    setInput("");
    setError(null);
    const userMsg: Message = { role: "user", content: text, ts: new Date() };
    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setStreaming(true);
    setStreamText("");

    try {
      // Strip leading assistant messages — the welcome message is UI-only.
      // Every AI provider requires the first message to be from the user.
      const flat = nextMessages.map((m) => ({ role: m.role, content: m.content }));
      const firstUserIdx = flat.findIndex((m) => m.role === "user");
      const apiMessages = firstUserIdx > 0 ? flat.slice(firstUserIdx) : flat;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: apiMessages,
          topic,
        }),
      });

      if (res.status === 429) {
        const data = await res.json();
        setError(`Daily limit of ${data.limit} questions reached. Upgrade for unlimited access.`);
        setMessages((p) => p.slice(0, -1));
        setStreaming(false);
        return;
      }

      if (!res.ok || !res.body) {
        let errMsg = `Sir Taks is unavailable (${res.status})`;
        try {
          const errData = await res.json();
          if (errData?.error) errMsg = errData.error;
        } catch {
          try { const txt = await res.text(); if (txt) errMsg = txt; } catch { /* ignore */ }
        }
        console.error("[SirTaks]", res.status, errMsg);
        setError(errMsg);
        setMessages((p) => p.slice(0, -1));
        setStreaming(false);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        setStreamText(accumulated);
      }

      const aiMsg: Message = { role: "assistant", content: accumulated, ts: new Date() };
      const final = [...nextMessages, aiMsg];
      setMessages(final);
      setStreamText("");
      setStreaming(false);

      const used = res.headers.get("X-Questions-Used");
      if (used) setQuestionsUsed(parseInt(used));

      // Save conversation
      const payload = final.map((m) => ({ role: m.role, content: m.content, ts: m.ts.toISOString() }));
      if (convId) {
        await (supabase.from("ai_conversations") as any).update({ messages: payload, updated_at: new Date().toISOString() }).eq("id", convId);
      } else if (userRole === "student") {
        const { data: conv } = await (supabase.from("ai_conversations") as any)
          .insert({ student_id: profileId, subject: topic, title: text.slice(0, 80), messages: payload })
          .select("id").single();
        if (conv?.id) setConvId(conv.id);
      }
    } catch {
      setError("Connection error. Check your internet and try again.");
      setMessages((p) => p.slice(0, -1));
      setStreaming(false);
    }
  }, [input, streaming, messages, topic, profileId, convId, dailyLimit, questionsUsed, supabase, userRole]);

  const quotaPct = dailyLimit ? Math.min((questionsUsed / dailyLimit) * 100, 100) : 0;
  const quotaColor = quotaPct > 80 ? "#A9873F" : "#1F4738";

  // ── TOPIC SELECTOR ──────────────────────────────────────────────────────
  if (phase === "select") {
    return (
      <div className="max-w-[860px] mx-auto">
        <div className="mb-7 text-center">
          <div className="w-16 h-16 rounded mx-auto mb-3.5 flex items-center justify-center bg-edu-slate-100 border border-edu-copper-200 text-edu-copper">
            <IconChip size={28} />
          </div>
          <h1 className="font-display font-semibold text-2xl text-edu-ink mb-2">{cfg.title}</h1>
          <p className="text-[13px] text-edu-slate-600 max-w-[460px] mx-auto mb-3 leading-relaxed">{cfg.subtitle}</p>
          {dailyLimit !== null && (
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 border border-edu-slate-200 rounded-full">
              <div className="w-16 h-1 rounded-full bg-edu-slate-200 overflow-hidden">
                <div className="h-full transition-[width] duration-300" style={{ width: `${quotaPct}%`, background: quotaColor }} />
              </div>
              <span className="text-[11px] text-edu-slate-500">{questionsUsed}/{dailyLimit} questions today</span>
            </div>
          )}
        </div>

        <div className="grid gap-2 mb-5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))" }}>
          {cfg.topics.map((t) => (
            <button
              key={t}
              onClick={() => startSession(t)}
              className="px-3 py-4 rounded border border-edu-slate-200 hover:border-edu-copper-300 hover:bg-edu-copper-50 transition-colors duration-150 text-center"
            >
              <span className="text-xs font-semibold text-edu-ink leading-snug">{t}</span>
            </button>
          ))}
        </div>

        <div className="border border-edu-copper-200 bg-edu-copper-50 rounded px-4 py-3 flex gap-2.5">
          <p className="text-xs leading-relaxed text-edu-slate-600">
            <strong className="text-edu-copper-dark">How Sir Taks works:</strong> {cfg.welcomeBody}
          </p>
        </div>
      </div>
    );
  }

  // ── CHAT ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[860px] mx-auto flex flex-col" style={{ height: "calc(100vh - 120px)", minHeight: 500 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border border-edu-slate-200 rounded-t flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0 bg-edu-slate-100 border border-edu-copper-200 text-edu-copper">
            <IconChip size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-edu-ink">Sir Taks</p>
            <p className="text-[11px] text-edu-copper">{topic}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {dailyLimit !== null && (
            <div className="flex items-center gap-1.5">
              <div className="w-14 h-1 rounded-full bg-edu-slate-200 overflow-hidden">
                <div className="h-full transition-[width] duration-300" style={{ width: `${quotaPct}%`, background: quotaColor }} />
              </div>
              <span className="text-[10px] text-edu-slate-500">{questionsUsed}/{dailyLimit}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-edu-bottle" />
            <span className="text-[11px] text-edu-bottle">Online</span>
          </div>
          <button
            onClick={() => { setPhase("select"); setMessages([]); setConvId(null); setInput(""); }}
            className="btn-ghost py-1 px-2.5 text-[11px]"
          >
            Change topic
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-5 border-l border-r border-edu-slate-200">
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-2.5 mb-5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            {m.role === "assistant" && (
              <div className="w-8 h-8 rounded flex-shrink-0 mt-0.5 flex items-center justify-center bg-edu-slate-100 border border-edu-copper-200 text-edu-copper">
                <IconChip size={16} />
              </div>
            )}
            <div
              className={`max-w-[72%] px-4 py-3 rounded border ${
                m.role === "user"
                  ? "bg-edu-slate-100 border-edu-slate-200"
                  : "bg-edu-copper-50 border-edu-copper-200"
              }`}
            >
              <div className="text-sm text-edu-ink leading-relaxed">{renderContent(m.content)}</div>
              <p className="text-[10px] text-edu-slate-500 mt-1.5 text-right">{m.ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
            {m.role === "user" && (
              <div className="w-8 h-8 rounded flex-shrink-0 mt-0.5 flex items-center justify-center text-xs font-bold text-edu-paper bg-edu-copper">
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ))}

        {streaming && (
          <div className="flex gap-2.5 mb-5">
            <div className="w-8 h-8 rounded flex-shrink-0 mt-0.5 flex items-center justify-center bg-edu-slate-100 border border-edu-copper-200 text-edu-copper">
              <IconChip size={16} />
            </div>
            <div className="max-w-[72%] px-4 py-3 rounded border bg-edu-copper-50 border-edu-copper-200">
              {streamText ? (
                <div className="text-sm text-edu-ink leading-relaxed">{renderContent(streamText)}</div>
              ) : (
                <div className="flex gap-1.5 items-center text-edu-copper">
                  <span className="text-[11px] text-edu-slate-500 mr-1">Sir Taks is thinking</span>
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="my-2 px-3.5 py-2.5 bg-edu-clay-100 border border-edu-clay-200 rounded flex gap-2 items-center">
            <IconAlertTriangle size={16} className="flex-shrink-0 text-edu-clay" />
            <p className="text-[13px] text-edu-clay-dark">{error}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border border-edu-slate-200 border-t-0 rounded-b flex-shrink-0 bg-edu-paper">
        {dailyLimit !== null && questionsUsed >= dailyLimit ? (
          <div className="text-center py-2.5">
            <p className="text-[13px] text-edu-gold-dark mb-1">You&apos;ve reached your {dailyLimit} free questions for today.</p>
            <p className="text-xs text-edu-slate-500">Upgrade to Student Pro for unlimited Sir Taks access.</p>
          </div>
        ) : (
          <div className="flex gap-2.5 items-end">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Type your question… (Shift+Enter for new line)"
              rows={1}
              disabled={streaming}
              className="flex-1 resize-none rounded border border-edu-slate-300 px-3.5 py-2.5 text-sm text-edu-ink outline-none transition-colors duration-150 focus:border-edu-copper"
              style={{ minHeight: 42, maxHeight: 140, boxSizing: "border-box" }}
              onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 140) + "px"; }}
            />
            <button onClick={sendMessage} disabled={!input.trim() || streaming} className="btn-primary h-[42px] px-4 text-[13px] disabled:opacity-40 flex-shrink-0">
              {streaming ? "…" : <>Send <IconChevronRight size={14} /></>}
            </button>
          </div>
        )}
        <p className="text-[10px] text-edu-slate-400 mt-1.5 text-center">{cfg.disclaimer}</p>
      </div>
    </div>
  );
}
