/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { IconChip, IconAlertTriangle, IconChevronRight, IconChevronDown } from "@/components/icons";
import { useLongPress } from "@/components/ui/useLongPress";
import { MessageMenu, CopiedFlash, type MessageMenuAction } from "@/components/ui/MessageMenu";
import { useConfirm } from "@/components/ui/ConfirmProvider";
import { useToast } from "@/components/ui/ToastProvider";

type UserRole = "student" | "teacher" | "parent" | "school_admin" | "super_admin";
type MsgStatus = "sending" | "sent" | "failed";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: Date;
  status: MsgStatus;
  deletedAt?: string;
  editedAt?: string;
}

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

function newId() {
  return typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`;
}

export function SirTaksChat({ profileId, userName, userRole, initialQuestionsUsed = 0, dailyLimit = null }: Props) {
  const cfg = ROLE_CONFIG[userRole] ?? ROLE_CONFIG.student;
  const [phase, setPhase] = useState<"select" | "chat">("select");
  const [topic, setTopic] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [streaming, setStreaming] = useState(false);
  const [streamText, setStreamText] = useState("");
  const [questionsUsed, setQuestionsUsed] = useState(initialQuestionsUsed);
  const [convId, setConvId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [menu, setMenu] = useState<{ x: number; y: number; messageId: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [newBelow, setNewBelow] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollBoxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const supabase = createClient();
  const confirmDialog = useConfirm();
  const showToast = useToast();

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    setNewBelow(0);
  }, []);

  useEffect(() => {
    if (isNearBottom) {
      scrollToBottom(true);
    } else if (messages.length > 0) {
      setNewBelow((n) => n + 1);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length]);

  useEffect(() => {
    if (isNearBottom) messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streamText]);

  const handleScroll = () => {
    const el = scrollBoxRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 100;
    setIsNearBottom(nearBottom);
    if (nearBottom) setNewBelow(0);
  };

  const persist = useCallback(async (msgs: Message[], idOverride?: string) => {
    if (userRole !== "student") return;
    const payload = msgs.filter((m) => !m.deletedAt).map((m) => ({ role: m.role, content: m.content, ts: m.ts.toISOString() }));
    const targetId = idOverride ?? convId;
    if (targetId) {
      await (supabase.from("ai_conversations") as any).update({ messages: payload, updated_at: new Date().toISOString() }).eq("id", targetId);
    }
  }, [userRole, convId, supabase]);

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
    setMessages([{ id: newId(), role: "assistant", content: welcomes[userRole] ?? welcomes.student, ts: new Date(), status: "sent" }]);
    setTimeout(() => inputRef.current?.focus(), 100);
  };

  const sendMessage = useCallback(async (overrideText?: string, overrideId?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || streaming) return;
    if (dailyLimit !== null && questionsUsed >= dailyLimit) {
      setError(`You've used all ${dailyLimit} free questions today. Upgrade to Student Pro for unlimited access.`);
      return;
    }
    if (!overrideId) setInput("");
    setError(null);

    const userMsgId = overrideId ?? newId();
    let nextMessages: Message[];
    if (overrideId) {
      // Retry: flip the existing failed message back to sending.
      nextMessages = messages.map((m) => m.id === overrideId ? { ...m, status: "sending" as MsgStatus } : m);
      setMessages(nextMessages);
    } else {
      const userMsg: Message = { id: userMsgId, role: "user", content: text, ts: new Date(), status: "sending" };
      nextMessages = [...messages, userMsg];
      setMessages(nextMessages);
    }
    setStreaming(true);
    setStreamText("");

    try {
      const flat = nextMessages.filter((m) => !m.deletedAt).map((m) => ({ role: m.role, content: m.content }));
      const firstUserIdx = flat.findIndex((m) => m.role === "user");
      const apiMessages = firstUserIdx > 0 ? flat.slice(firstUserIdx) : flat;

      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: apiMessages, topic }),
      });

      if (res.status === 429) {
        const data = await res.json();
        setError(`Daily limit of ${data.limit} questions reached. Upgrade for unlimited access.`);
        setMessages((p) => p.map((m) => m.id === userMsgId ? { ...m, status: "failed" as MsgStatus } : m));
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
        setMessages((p) => p.map((m) => m.id === userMsgId ? { ...m, status: "failed" as MsgStatus } : m));
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

      const aiMsg: Message = { id: newId(), role: "assistant", content: accumulated, ts: new Date(), status: "sent" };
      const confirmed = nextMessages.map((m) => m.id === userMsgId ? { ...m, status: "sent" as MsgStatus } : m);
      const final = [...confirmed, aiMsg];
      setMessages(final);
      setStreamText("");
      setStreaming(false);

      const used = res.headers.get("X-Questions-Used");
      if (used) setQuestionsUsed(parseInt(used));

      if (userRole === "student") {
        if (convId) {
          await persist(final);
        } else {
          const payload = final.map((m) => ({ role: m.role, content: m.content, ts: m.ts.toISOString() }));
          const { data: conv } = await (supabase.from("ai_conversations") as any)
            .insert({ student_id: profileId, subject: topic, title: text.slice(0, 80), messages: payload })
            .select("id").single();
          if (conv?.id) setConvId(conv.id);
        }
      }
    } catch {
      setError("Connection error. Check your internet and try again.");
      setMessages((p) => p.map((m) => m.id === userMsgId ? { ...m, status: "failed" as MsgStatus } : m));
      setStreaming(false);
    }
  }, [input, streaming, messages, topic, profileId, convId, dailyLimit, questionsUsed, supabase, userRole, persist]);

  const retrySend = (m: Message) => sendMessage(m.content, m.id);

  const copyMessage = async (m: Message) => {
    try {
      await navigator.clipboard.writeText(m.content);
      setCopiedId(m.id);
      setTimeout(() => setCopiedId((c) => (c === m.id ? null : c)), 1500);
    } catch {
      showToast("Couldn't copy — try selecting the text manually.", "error");
    }
  };

  const deleteMessage = async (m: Message) => {
    const ok = await confirmDialog({
      title: "Delete this message?",
      message: "This removes it from your conversation with Sir Taks. This can't be undone.",
      danger: true,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    const deletedAt = new Date().toISOString();
    setMessages((prev) => {
      const next = prev.map((x) => x.id === m.id ? { ...x, deletedAt } : x);
      persist(next);
      return next;
    });
    showToast("Message deleted.", "success");
  };

  const startEdit = (m: Message) => {
    setEditingId(m.id);
    setInput(m.content);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const text = input.trim();
    if (!text) return;
    const editedAt = new Date().toISOString();
    setMessages((prev) => {
      const next = prev.map((m) => m.id === editingId ? { ...m, content: text, editedAt } : m);
      persist(next);
      return next;
    });
    setEditingId(null);
    setInput("");
    showToast("Message updated.", "success");
  };

  const cancelEdit = () => { setEditingId(null); setInput(""); };

  const openMenu = (messageId: string, x: number, y: number) => setMenu({ x, y, messageId });

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

  const visibleMessages = messages.filter((m) => !m.deletedAt);
  const menuMessage = menu ? messages.find((m) => m.id === menu.messageId) : null;

  // ── CHAT ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-[860px] mx-auto flex flex-col relative" style={{ height: "calc(100vh - 120px)", minHeight: 500 }}>
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
            onClick={() => { setPhase("select"); setMessages([]); setConvId(null); setInput(""); setEditingId(null); }}
            className="btn-ghost py-1 px-2.5 text-[11px]"
          >
            Change topic
          </button>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollBoxRef} onScroll={handleScroll} className="flex-1 overflow-y-auto px-4 py-5 border-l border-r border-edu-slate-200">
        {visibleMessages.map((m) => (
          <MessageBubble
            key={m.id}
            message={m}
            userName={userName}
            copied={copiedId === m.id}
            onOpenMenu={openMenu}
            onRetry={() => retrySend(m)}
          />
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

      {!isNearBottom && newBelow > 0 && (
        <button
          onClick={() => scrollToBottom(true)}
          className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-edu-ink text-edu-paper text-xs font-semibold shadow-elevated"
          style={{ bottom: 96 }}
        >
          {newBelow} new {newBelow === 1 ? "message" : "messages"} <IconChevronDown size={13} />
        </button>
      )}

      {/* Input */}
      <div className="px-4 py-3 border border-edu-slate-200 border-t-0 rounded-b flex-shrink-0 bg-edu-paper">
        {editingId && (
          <div className="flex items-center justify-between mb-2 px-1">
            <span className="text-[11px] text-edu-copper font-semibold">Editing message</span>
            <button onClick={cancelEdit} className="text-[11px] text-edu-slate-500">Cancel</button>
          </div>
        )}
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
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  if (editingId) saveEdit(); else sendMessage();
                }
                if (e.key === "Escape" && editingId) cancelEdit();
              }}
              placeholder={streaming ? "Sir Taks is replying…" : editingId ? "Edit your message… (Enter to save)" : "Type your question… (Shift+Enter for new line)"}
              rows={1}
              disabled={streaming}
              aria-disabled={streaming}
              className="flex-1 resize-none rounded border border-edu-slate-300 px-3.5 py-2.5 text-sm text-edu-ink outline-none transition-colors duration-150 focus:border-edu-copper disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ minHeight: 42, maxHeight: 140, boxSizing: "border-box" }}
              onInput={(e) => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 140) + "px"; }}
            />
            <button
              onClick={() => editingId ? saveEdit() : sendMessage()}
              disabled={!input.trim() || streaming}
              className="btn-primary h-[42px] px-4 text-[13px] disabled:opacity-40 flex-shrink-0"
            >
              {streaming ? "…" : editingId ? "Save" : <>Send <IconChevronRight size={14} /></>}
            </button>
          </div>
        )}
        <p className="text-[10px] text-edu-slate-400 mt-1.5 text-center">{cfg.disclaimer}</p>
      </div>

      {menu && menuMessage && (
        <MessageMenu
          x={menu.x}
          y={menu.y}
          onClose={() => setMenu(null)}
          actions={buildActions(menuMessage, userName, {
            onCopy: () => copyMessage(menuMessage),
            onEdit: () => startEdit(menuMessage),
            onDelete: () => deleteMessage(menuMessage),
          })}
        />
      )}
    </div>
  );
}

function buildActions(
  m: Message,
  userName: string,
  handlers: { onCopy: () => void; onEdit: () => void; onDelete: () => void }
): MessageMenuAction[] {
  const actions: MessageMenuAction[] = [{ label: "Copy text", onSelect: handlers.onCopy }];
  if (m.role === "user" && m.status !== "sending") {
    actions.push({ label: "Edit", onSelect: handlers.onEdit });
    actions.push({ label: "Delete", onSelect: handlers.onDelete, danger: true });
  }
  return actions;
}

function MessageBubble({
  message: m, userName, copied, onOpenMenu, onRetry,
}: {
  message: Message;
  userName: string;
  copied: boolean;
  onOpenMenu: (id: string, x: number, y: number) => void;
  onRetry: () => void;
}) {
  const longPress = useLongPress((x, y) => onOpenMenu(m.id, x, y));

  return (
    <div className={`flex gap-2.5 mb-5 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
      {m.role === "assistant" && (
        <div className="w-8 h-8 rounded flex-shrink-0 mt-0.5 flex items-center justify-center bg-edu-slate-100 border border-edu-copper-200 text-edu-copper">
          <IconChip size={16} />
        </div>
      )}
      <div className="flex flex-col" style={{ maxWidth: "72%" }}>
        <div
          {...longPress}
          className={`px-4 py-3 rounded border select-none ${
            m.role === "user" ? "bg-edu-slate-100 border-edu-slate-200" : "bg-edu-copper-50 border-edu-copper-200"
          } ${m.status === "failed" ? "opacity-60" : m.status === "sending" ? "opacity-70" : ""}`}
        >
          <div className="text-sm text-edu-ink leading-relaxed">{renderContent(m.content)}</div>
          <div className="flex items-center justify-end gap-1 mt-1.5">
            {m.editedAt && <span className="text-[10px] text-edu-slate-400">edited</span>}
            <p className="text-[10px] text-edu-slate-500">{m.ts.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</p>
            <CopiedFlash show={copied} />
          </div>
        </div>
        {m.status === "sending" && (
          <span className="text-[10px] text-edu-slate-400 mt-1 text-right">Sending…</span>
        )}
        {m.status === "failed" && (
          <div className="flex items-center gap-1.5 mt-1 justify-end">
            <span className="text-[10px] text-edu-clay">Not sent</span>
            <button onClick={onRetry} className="text-[10px] font-semibold text-edu-copper underline">Retry</button>
          </div>
        )}
      </div>
      {m.role === "user" && (
        <div className="w-8 h-8 rounded flex-shrink-0 mt-0.5 flex items-center justify-center text-xs font-bold text-edu-paper bg-edu-copper">
          {userName.charAt(0).toUpperCase()}
        </div>
      )}
    </div>
  );
}
