/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

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
  welcomeLabel: string;
  welcomeBody: string;
  disclaimer: string;
  topics: { name: string; icon: string; color: string }[];
}> = {
  student: {
    title: "Sir Taks AI Tutor",
    subtitle: "Your personal ZIMSEC guide — select a subject to begin",
    welcomeLabel: "Start Learning",
    welcomeBody: "I guide you through concepts step by step — I won't do your homework, but I'll help you master it deeply.",
    disclaimer: "Sir Taks guides your thinking — he won't do the work for you, but will help you master it.",
    topics: [
      { name: "Mathematics", icon: "📐", color: "#4D7FFF" },
      { name: "English Language", icon: "📚", color: "#00E5A3" },
      { name: "English Literature", icon: "📖", color: "#00B4D8" },
      { name: "Shona", icon: "🗣️", color: "#BD93F9" },
      { name: "Ndebele", icon: "💬", color: "#BD93F9" },
      { name: "History", icon: "🏛️", color: "#F5A623" },
      { name: "Geography", icon: "🌍", color: "#00B4D8" },
      { name: "Biology", icon: "🧬", color: "#00E5A3" },
      { name: "Chemistry", icon: "⚗️", color: "#FF6B6B" },
      { name: "Physics", icon: "⚡", color: "#4D7FFF" },
      { name: "Combined Science", icon: "🔬", color: "#BD93F9" },
      { name: "Agriculture", icon: "🌾", color: "#00B4D8" },
      { name: "Business Studies", icon: "💼", color: "#F5A623" },
      { name: "Accounting", icon: "📊", color: "#4D7FFF" },
      { name: "Computer Science", icon: "💻", color: "#BD93F9" },
      { name: "Art & Design", icon: "🎨", color: "#FF6B6B" },
      { name: "R.M.E", icon: "✝️", color: "#F5A623" },
      { name: "HBC / Heritage", icon: "🏺", color: "#FF6B6B" },
      { name: "Commerce", icon: "🏦", color: "#00E5A3" },
      { name: "General Revision", icon: "📝", color: "#8892B0" },
    ],
  },
  teacher: {
    title: "Sir Taks — Teaching Assistant",
    subtitle: "Your AI co-planner for the Zimbabwean classroom",
    welcomeLabel: "Start Planning",
    welcomeBody: "I'm your professional thought partner. Tell me what you're teaching and we'll plan it together — you make all the final decisions.",
    disclaimer: "Sir Taks is your planning partner — the professional judgement is always yours.",
    topics: [
      { name: "Lesson Planning", icon: "📅", color: "#4D7FFF" },
      { name: "Assessment Design", icon: "📝", color: "#00E5A3" },
      { name: "Differentiation Strategies", icon: "🎯", color: "#BD93F9" },
      { name: "HBC Project Guidance", icon: "🏺", color: "#FF6B6B" },
      { name: "Parent Communication", icon: "💌", color: "#F5A623" },
      { name: "Classroom Management", icon: "🏫", color: "#00B4D8" },
      { name: "ZIMSEC Exam Prep", icon: "📋", color: "#4D7FFF" },
      { name: "Professional Development", icon: "🎓", color: "#00E5A3" },
      { name: "Report Writing", icon: "📄", color: "#BD93F9" },
      { name: "Student Motivation", icon: "⭐", color: "#F5A623" },
    ],
  },
  parent: {
    title: "Sir Taks — Parent Guide",
    subtitle: "Understand your child's education and how to support them",
    welcomeLabel: "Get Guidance",
    welcomeBody: "I help you understand Zimbabwe's school system and give you practical ways to support your child's learning at home.",
    disclaimer: "Always work with your child's actual teacher for personalised advice about your specific child.",
    topics: [
      { name: "Understanding Results", icon: "📊", color: "#4D7FFF" },
      { name: "Home Learning Support", icon: "🏠", color: "#00E5A3" },
      { name: "Exam Season Support", icon: "📅", color: "#F5A623" },
      { name: "Curriculum Questions", icon: "📚", color: "#BD93F9" },
      { name: "School Communication", icon: "💬", color: "#00B4D8" },
      { name: "Study Environment", icon: "💡", color: "#4D7FFF" },
      { name: "Managing Anxiety", icon: "🤝", color: "#00E5A3" },
      { name: "ZIMSEC Explained", icon: "🎓", color: "#FF6B6B" },
    ],
  },
  school_admin: {
    title: "Sir Taks — School Advisor",
    subtitle: "Strategic AI support for school leadership",
    welcomeLabel: "Start Consulting",
    welcomeBody: "I help you think through school challenges and plan improvements. Bring a problem or question and we'll work through it together.",
    disclaimer: "Sir Taks provides frameworks and options — all decisions remain with school leadership.",
    topics: [
      { name: "School Improvement", icon: "📈", color: "#4D7FFF" },
      { name: "Staff Development", icon: "👩‍🏫", color: "#00E5A3" },
      { name: "ZIMSEC Compliance", icon: "📋", color: "#F5A623" },
      { name: "Student Performance", icon: "📊", color: "#BD93F9" },
      { name: "Parent Engagement", icon: "🤝", color: "#00B4D8" },
      { name: "Timetable Planning", icon: "📅", color: "#4D7FFF" },
      { name: "School Policy", icon: "📜", color: "#FF6B6B" },
      { name: "Budget Planning", icon: "💰", color: "#F5A623" },
    ],
  },
  super_admin: {
    title: "Sir Taks — Platform Advisor",
    subtitle: "Strategic AI support for VOA platform management",
    welcomeLabel: "Start Session",
    welcomeBody: "I help you analyse platform metrics, plan growth strategy, and think through product decisions for VOA.",
    disclaimer: "Strategic frameworks only — always validate with real platform data.",
    topics: [
      { name: "Platform Strategy", icon: "🚀", color: "#4D7FFF" },
      { name: "School Onboarding", icon: "🏫", color: "#00E5A3" },
      { name: "Subscription Tiers", icon: "💎", color: "#F5A623" },
      { name: "Feature Planning", icon: "🗺️", color: "#BD93F9" },
      { name: "User Growth", icon: "📈", color: "#00B4D8" },
      { name: "Quality Assurance", icon: "✅", color: "#4D7FFF" },
    ],
  },
};

function renderContent(text: string) {
  return text.split("\n").map((line, i) => {
    const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
    return (
      <span key={i}>
        {parts.map((p, j) => {
          if (p.startsWith("**") && p.endsWith("**")) return <strong key={j} style={{ color: "#CDD6F4", fontWeight: 700 }}>{p.slice(2, -2)}</strong>;
          if (p.startsWith("`") && p.endsWith("`")) return <code key={j} style={{ background: "rgba(77,127,255,0.15)", padding: "1px 5px", borderRadius: 4, fontSize: "0.9em", fontFamily: "monospace", color: "#BD93F9" }}>{p.slice(1, -1)}</code>;
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
  const quotaColor = quotaPct > 80 ? "#F5A623" : "#00E5A3";

  // ── TOPIC SELECTOR ──────────────────────────────────────────────────────
  if (phase === "select") {
    return (
      <div style={{ maxWidth: 860, margin: "0 auto" }}>
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <div style={{
            width: 70, height: 70, borderRadius: "20px", margin: "0 auto 14px",
            background: "linear-gradient(135deg, #1a1f35, #0d1424)",
            border: "1px solid rgba(77,127,255,0.4)",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 34, boxShadow: "0 0 24px rgba(77,127,255,0.2)",
          }}>🎓</div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", marginBottom: 8 }}>{cfg.title}</h1>
          <p style={{ fontSize: 13, color: "#6B7290", maxWidth: 460, margin: "0 auto 12px", lineHeight: 1.6 }}>{cfg.subtitle}</p>
          {dailyLimit !== null && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20 }}>
              <div style={{ width: 70, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${quotaPct}%`, background: quotaColor, transition: "width 0.3s" }} />
              </div>
              <span style={{ fontSize: 11, color: "#6B7290" }}>{questionsUsed}/{dailyLimit} questions today</span>
            </div>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(148px, 1fr))", gap: 10, marginBottom: 20 }}>
          {cfg.topics.map((t) => (
            <button key={t.name} onClick={() => startSession(t.name)} style={{
              display: "flex", flexDirection: "column", alignItems: "center", gap: 8,
              padding: "16px 10px", borderRadius: 14, cursor: "pointer",
              background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)",
              transition: "all 0.15s", textAlign: "center",
            }}
              onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = `${t.color}12`; el.style.borderColor = `${t.color}40`; el.style.transform = "translateY(-2px)"; }}
              onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.background = "rgba(255,255,255,0.025)"; el.style.borderColor = "rgba(255,255,255,0.06)"; el.style.transform = "translateY(0)"; }}
            >
              <span style={{ fontSize: 26 }}>{t.icon}</span>
              <span style={{ fontSize: 12, fontWeight: 600, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", lineHeight: 1.3 }}>{t.name}</span>
            </button>
          ))}
        </div>

        <div style={{ background: "rgba(77,127,255,0.06)", border: "1px solid rgba(77,127,255,0.12)", borderRadius: 12, padding: "12px 16px", display: "flex", gap: 10 }}>
          <span style={{ fontSize: 16, flexShrink: 0 }}>💡</span>
          <p style={{ fontSize: 12, color: "#6B7290", lineHeight: 1.6, margin: 0 }}>
            <strong style={{ color: "#4D7FFF" }}>How Sir Taks works:</strong> {cfg.welcomeBody}
          </p>
        </div>
      </div>
    );
  }

  // ── CHAT ──────────────────────────────────────────────────────────────────
  return (
    <div style={{ maxWidth: 860, margin: "0 auto", display: "flex", flexDirection: "column", height: "calc(100vh - 120px)", minHeight: 500 }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px 16px 0 0", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: "11px", background: "linear-gradient(135deg, #1a1f35, #0d1424)", border: "1px solid rgba(77,127,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>🎓</div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>Sir Taks</p>
            <p style={{ fontSize: 11, color: "#4D7FFF", margin: 0 }}>{topic}</p>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          {dailyLimit !== null && (
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <div style={{ width: 56, height: 4, background: "rgba(255,255,255,0.06)", borderRadius: 2, overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${quotaPct}%`, background: quotaColor, transition: "width 0.3s" }} />
              </div>
              <span style={{ fontSize: 10, color: "#4A5170" }}>{questionsUsed}/{dailyLimit}</span>
            </div>
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
            <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#00E5A3", animation: "pulse 2s ease-in-out infinite" }} />
            <span style={{ fontSize: 11, color: "#00E5A3" }}>Online</span>
          </div>
          <button onClick={() => { setPhase("select"); setMessages([]); setConvId(null); setInput(""); }} style={{ padding: "4px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "#6B7290", cursor: "pointer" }}>
            Change Topic
          </button>
        </div>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "20px 16px", background: "rgba(255,255,255,0.01)", borderLeft: "1px solid rgba(255,255,255,0.06)", borderRight: "1px solid rgba(255,255,255,0.06)", scrollbarWidth: "thin", scrollbarColor: "rgba(255,255,255,0.08) transparent" }}>
        {messages.map((m, i) => (
          <div key={i} style={{ display: "flex", gap: 10, marginBottom: 20, justifyContent: m.role === "user" ? "flex-end" : "flex-start" }}>
            {m.role === "assistant" && (
              <div style={{ width: 36, height: 36, borderRadius: "10px", flexShrink: 0, marginTop: 2, background: "linear-gradient(135deg, #1a1f35, #0d1424)", border: "1px solid rgba(77,127,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎓</div>
            )}
            <div style={{ maxWidth: "72%", padding: "12px 15px", borderRadius: m.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px", background: m.role === "user" ? "linear-gradient(135deg, rgba(189,147,249,0.15), rgba(139,97,249,0.1))" : "rgba(77,127,255,0.08)", border: m.role === "user" ? "1px solid rgba(189,147,249,0.25)" : "1px solid rgba(77,127,255,0.15)" }}>
              <div style={{ fontSize: 14, color: "#CDD6F4", lineHeight: 1.65 }}>{renderContent(m.content)}</div>
              <p style={{ fontSize: 10, color: "#4A5170", marginTop: 6, textAlign: "right", margin: "6px 0 0" }}>{m.ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
            {m.role === "user" && (
              <div style={{ width: 36, height: 36, borderRadius: "10px", flexShrink: 0, marginTop: 2, background: "rgba(189,147,249,0.12)", border: "1px solid rgba(189,147,249,0.25)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#BD93F9", fontFamily: "'Space Grotesk', sans-serif" }}>
                {userName.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ))}

        {streaming && (
          <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
            <div style={{ width: 36, height: 36, borderRadius: "10px", flexShrink: 0, marginTop: 2, background: "linear-gradient(135deg, #1a1f35, #0d1424)", border: "1px solid rgba(77,127,255,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18 }}>🎓</div>
            <div style={{ maxWidth: "72%", padding: "12px 15px", borderRadius: "4px 16px 16px 16px", background: "rgba(77,127,255,0.08)", border: "1px solid rgba(77,127,255,0.15)" }}>
              {streamText ? (
                <div style={{ fontSize: 14, color: "#CDD6F4", lineHeight: 1.65 }}>
                  {renderContent(streamText)}
                  <span style={{ display: "inline-block", width: 8, height: 14, background: "#4D7FFF", marginLeft: 2, verticalAlign: "text-bottom", animation: "blink 1s step-end infinite" }} />
                </div>
              ) : (
                <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
                  <span style={{ fontSize: 11, color: "#4A5170", marginRight: 4 }}>Sir Taks is thinking</span>
                  {[0, 1, 2].map((n) => (
                    <div key={n} style={{ width: 6, height: 6, borderRadius: "50%", background: "#4D7FFF", animation: `bounce 1.2s ease-in-out ${n * 0.2}s infinite` }} />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div style={{ margin: "8px 0 16px", padding: "10px 14px", background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.2)", borderRadius: 10, display: "flex", gap: 8, alignItems: "center" }}>
            <span>⚠️</span>
            <p style={{ fontSize: 13, color: "#FF6B6B", margin: 0 }}>{error}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "12px 16px", background: "#0A0C14", border: "1px solid rgba(255,255,255,0.06)", borderTop: "none", borderRadius: "0 0 16px 16px", flexShrink: 0 }}>
        {dailyLimit !== null && questionsUsed >= dailyLimit ? (
          <div style={{ textAlign: "center", padding: "10px 0" }}>
            <p style={{ fontSize: 13, color: "#F5A623", marginBottom: 4 }}>You&apos;ve reached your {dailyLimit} free questions for today.</p>
            <p style={{ fontSize: 12, color: "#4A5170" }}>Upgrade to Student Pro for unlimited Sir Taks access.</p>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 10, alignItems: "flex-end" }}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
              placeholder="Type your question… (Shift+Enter for new line)"
              rows={1}
              disabled={streaming}
              style={{ flex: 1, resize: "none", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 14px", fontSize: 14, color: "#CDD6F4", fontFamily: "inherit", outline: "none", transition: "border-color 0.15s", minHeight: 42, maxHeight: 140, scrollbarWidth: "none", boxSizing: "border-box" }}
              onFocus={(e) => (e.target.style.borderColor = "rgba(77,127,255,0.4)")}
              onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.08)")}
              onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 140) + "px"; }}
            />
            <button onClick={sendMessage} disabled={!input.trim() || streaming} style={{ padding: "10px 18px", borderRadius: 12, fontSize: 13, fontWeight: 600, cursor: (!input.trim() || streaming) ? "not-allowed" : "pointer", background: (!input.trim() || streaming) ? "rgba(77,127,255,0.15)" : "rgba(77,127,255,0.9)", border: "1px solid rgba(77,127,255,0.3)", color: (!input.trim() || streaming) ? "#4A5170" : "#fff", transition: "all 0.15s", flexShrink: 0, height: 42 }}>
              {streaming ? "…" : "Send →"}
            </button>
          </div>
        )}
        <p style={{ fontSize: 10, color: "#2A2D3E", marginTop: 6, textAlign: "center" }}>{cfg.disclaimer}</p>
      </div>

      <style>{`
        @keyframes bounce { 0%,80%,100%{transform:scale(.6);opacity:.4} 40%{transform:scale(1);opacity:1} }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.4} }
      `}</style>
    </div>
  );
}
