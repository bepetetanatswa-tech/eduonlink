"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Profile { id: string; full_name: string; avatar_url: string | null; role: string; email: string }
interface DMsg { id: string; sender_id: string; receiver_id: string; content: string; read_at: string | null; created_at: string; sender: Profile; receiver: Profile }

interface Props {
  profileId: string;
  userRole: string;
  profile: Profile;
  allowedRoles?: string[];
}

function Avatar({ name, url, size = 32 }: { name: string; url?: string | null; size?: number }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg,#4D7FFF,#2D5BDF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.36, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}

function fmt(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { day: "numeric", month: "short" });
}

export function DirectMessages({ profileId, userRole, profile, allowedRoles }: Props) {
  const supabase = createClient();
  const S = { bg: "#07080C", card: "#0A0B10", border: "rgba(255,255,255,0.07)", accent: "#4D7FFF", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170" };

  const [conversations, setConversations] = useState<{ other: Profile; lastMsg: DMsg; unread: number }[]>([]);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<DMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [showNewDm, setShowNewDm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    loadConversations();
    setupRealtime();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  async function loadConversations() {
    setLoading(true);
    const { data: sent } = await (supabase.from("messages") as any)
      .select("*, sender:profiles!messages_sender_id_fkey(id,full_name,avatar_url,role,email), receiver:profiles!messages_receiver_id_fkey(id,full_name,avatar_url,role,email)")
      .is("class_id", null)
      .or(`sender_id.eq.${profileId},receiver_id.eq.${profileId}`)
      .order("created_at", { ascending: false })
      .limit(200);

    if (sent) {
      const convMap = new Map<string, { other: Profile; lastMsg: DMsg; unread: number }>();
      sent.forEach((m: DMsg) => {
        const other = m.sender_id === profileId ? m.receiver : m.sender;
        if (!other) return;
        if (!convMap.has(other.id)) {
          convMap.set(other.id, {
            other,
            lastMsg: m,
            unread: (!m.read_at && m.receiver_id === profileId) ? 1 : 0,
          });
        } else {
          const existing = convMap.get(other.id)!;
          if (!m.read_at && m.receiver_id === profileId) existing.unread++;
        }
      });
      setConversations(Array.from(convMap.values()));
    }

    // Load contacts based on role
    const roles = allowedRoles ?? (userRole === "parent" ? ["teacher"] : userRole === "teacher" ? ["student","parent"] : ["student","teacher","parent","school_admin","super_admin"]);
    const { data: c } = await (supabase.from("profiles") as any)
      .select("id,full_name,avatar_url,role,email")
      .in("role", roles)
      .neq("id", profileId)
      .limit(50);
    if (c) setContacts(c);
    setLoading(false);
  }

  function setupRealtime() {
    const ch = supabase.channel(`dm:${profileId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `receiver_id=eq.${profileId}`,
      }, async (payload) => {
        const { data } = await (supabase.from("messages") as any)
          .select("*, sender:profiles!messages_sender_id_fkey(id,full_name,avatar_url,role,email), receiver:profiles!messages_receiver_id_fkey(id,full_name,avatar_url,role,email)")
          .eq("id", payload.new.id)
          .single();
        if (data) {
          setMessages(prev => [...prev, data]);
          setConversations(prev => {
            const idx = prev.findIndex(c => c.other.id === data.sender.id);
            if (idx >= 0) {
              const updated = [...prev];
              updated[idx] = { ...updated[idx], lastMsg: data, unread: updated[idx].unread + 1 };
              return updated;
            }
            return [{ other: data.sender, lastMsg: data, unread: 1 }, ...prev];
          });
        }
      })
      .subscribe();
    return () => supabase.removeChannel(ch);
  }

  async function openConversation(other: Profile) {
    setSelected(other);
    setShowNewDm(false);
    const { data } = await (supabase.from("messages") as any)
      .select("*, sender:profiles!messages_sender_id_fkey(id,full_name,avatar_url,role,email), receiver:profiles!messages_receiver_id_fkey(id,full_name,avatar_url,role,email)")
      .is("class_id", null)
      .or(`and(sender_id.eq.${profileId},receiver_id.eq.${other.id}),and(sender_id.eq.${other.id},receiver_id.eq.${profileId})`)
      .order("created_at", { ascending: true })
      .limit(100);
    if (data) setMessages(data);

    // Mark unread as read
    await (supabase.from("messages") as any)
      .update({ read_at: new Date().toISOString() })
      .eq("receiver_id", profileId)
      .eq("sender_id", other.id)
      .is("read_at", null);

    setConversations(prev => prev.map(c => c.other.id === other.id ? { ...c, unread: 0 } : c));
  }

  async function sendMessage() {
    if (!input.trim() || !selected || sending) return;
    setSending(true);
    setSendError(null);
    const text = input;
    const { data, error } = await (supabase.from("messages") as any)
      .insert({ sender_id: profileId, receiver_id: selected.id, content: text, class_id: null })
      .select("*, sender:profiles!messages_sender_id_fkey(id,full_name,avatar_url,role,email), receiver:profiles!messages_receiver_id_fkey(id,full_name,avatar_url,role,email)")
      .single();

    if (error || !data) {
      setSendError("Message failed to send. Try again.");
      setSending(false);
      return;
    }

    setInput("");
    setMessages(prev => [...prev, data]);
    setConversations(prev => {
      const idx = prev.findIndex(c => c.other.id === selected.id);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], lastMsg: data };
        return updated;
      }
      return [{ other: selected, lastMsg: data, unread: 0 }, ...prev];
    });
    // Notify receiver (best-effort — the message itself already sent successfully)
    await (supabase.from("notifications") as any).insert({
      user_id: selected.id,
      title: `New message from ${profile.full_name}`,
      message: text.slice(0, 80),
      type: "info",
      link: `/${userRole}/dashboard/messages`,
    });
    setSending(false);
  }

  const ConversationList = (
    <div style={{ width: isMobile && selected ? 0 : 280, minWidth: isMobile && selected ? 0 : 280, borderRight: `1px solid ${S.border}`, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <div style={{ padding: "12px 14px", borderBottom: `1px solid ${S.border}`, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: S.text }}>Messages</span>
        <button onClick={() => setShowNewDm(true)} style={{ width: 28, height: 28, borderRadius: 8, background: S.accent, border: "none", color: "#fff", cursor: "pointer", fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center" }}>+</button>
      </div>
      <div style={{ flex: 1, overflowY: "auto" }}>
        {loading ? (
          <p style={{ padding: "20px", textAlign: "center", fontSize: 12, color: S.dim }}>Loading…</p>
        ) : conversations.length === 0 ? (
          <p style={{ padding: "20px", textAlign: "center", fontSize: 12, color: S.dim }}>No conversations yet</p>
        ) : (
          conversations.map(conv => (
            <div key={conv.other.id} onClick={() => openConversation(conv.other)}
              style={{ padding: "10px 14px", cursor: "pointer", display: "flex", gap: 10, alignItems: "center", borderBottom: `1px solid ${S.border}`, background: selected?.id === conv.other.id ? `${S.accent}10` : "transparent", transition: "background 0.1s" }}>
              <div style={{ position: "relative" }}>
                <Avatar name={conv.other.full_name} url={conv.other.avatar_url} size={38} />
                {conv.unread > 0 && (
                  <span style={{ position: "absolute", top: -2, right: -2, width: 16, height: 16, borderRadius: "50%", background: S.accent, color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${S.bg}` }}>{conv.unread}</span>
                )}
              </div>
              <div style={{ flex: 1, overflow: "hidden" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <span style={{ fontSize: 13, fontWeight: 600, color: S.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{conv.other.full_name}</span>
                  <span style={{ fontSize: 10, color: S.dim, flexShrink: 0, marginLeft: 4 }}>{timeAgo(conv.lastMsg.created_at)}</span>
                </div>
                <p style={{ fontSize: 11, color: S.muted, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", margin: "2px 0 0" }}>
                  {conv.lastMsg.sender_id === profileId ? "You: " : ""}{conv.lastMsg.content}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const ChatPanel = selected ? (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "10px 16px", borderBottom: `1px solid ${S.border}`, display: "flex", alignItems: "center", gap: 10, background: S.card, flexShrink: 0 }}>
        {isMobile && (
          <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: S.muted, cursor: "pointer", fontSize: 18 }}>←</button>
        )}
        <Avatar name={selected.full_name} url={selected.avatar_url} size={34} />
        <div>
          <p style={{ fontSize: 13, fontWeight: 600, color: S.text }}>{selected.full_name}</p>
          <p style={{ fontSize: 11, color: S.dim, textTransform: "capitalize" }}>{selected.role.replace("_", " ")}</p>
        </div>
      </div>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 6 }}>
        {messages.length === 0 && <p style={{ textAlign: "center", fontSize: 13, color: S.dim, marginTop: 40 }}>Start the conversation</p>}
        {messages.map(m => {
          const isOwn = m.sender_id === profileId;
          return (
            <div key={m.id} style={{ display: "flex", flexDirection: isOwn ? "row-reverse" : "row", gap: 8, alignItems: "flex-end" }}>
              {!isOwn && <Avatar name={m.sender.full_name} url={m.sender.avatar_url} size={26} />}
              <div style={{ maxWidth: "65%" }}>
                <div style={{ background: isOwn ? "linear-gradient(135deg,#1E3A6E,#1A3060)" : "rgba(255,255,255,0.05)", border: `1px solid ${isOwn ? "rgba(77,127,255,0.3)" : S.border}`, borderRadius: isOwn ? "12px 4px 12px 12px" : "4px 12px 12px 12px", padding: "8px 12px" }}>
                  <p style={{ fontSize: 13, color: S.text, lineHeight: 1.5, margin: 0, wordBreak: "break-word" }}>{m.content}</p>
                </div>
                <p style={{ fontSize: 10, color: S.dim, marginTop: 2, textAlign: isOwn ? "right" : "left" }}>
                  {fmt(m.created_at)}{isOwn && m.read_at && " ✓✓"}
                </p>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>
      {/* Input */}
      {sendError && (
        <p style={{ margin: "0 14px", fontSize: 12, color: "#FF6B6B" }}>{sendError}</p>
      )}
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${S.border}`, background: S.card, display: "flex", gap: 8, flexShrink: 0 }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
          placeholder={`Message ${selected.full_name.split(" ")[0]}…`}
          style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`, borderRadius: 10, padding: "9px 14px", fontSize: 13, color: S.text, outline: "none" }}
        />
        <button onClick={sendMessage} disabled={!input.trim() || sending}
          style={{ width: 36, height: 36, borderRadius: 10, background: !input.trim() ? "rgba(77,127,255,0.2)" : S.accent, border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
        </button>
      </div>
    </div>
  ) : (
    <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, color: S.dim }}>
      <svg width="40" height="40" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
      <p style={{ fontSize: 13 }}>Select a conversation or start a new one</p>
      <button onClick={() => setShowNewDm(true)} style={{ padding: "8px 18px", borderRadius: 8, background: S.accent, border: "none", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>New Message</button>
    </div>
  );

  const NewDmPanel = showNewDm && (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div style={{ background: "#0E1117", border: `1px solid ${S.border}`, borderRadius: 16, padding: 20, width: 320, maxHeight: 480 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: S.text }}>New Message</span>
          <button onClick={() => setShowNewDm(false)} style={{ background: "none", border: "none", color: S.dim, cursor: "pointer", fontSize: 18 }}>✕</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 6, overflowY: "auto", maxHeight: 360 }}>
          {contacts.map(c => (
            <div key={c.id} onClick={() => openConversation(c)} style={{ display: "flex", gap: 10, alignItems: "center", padding: "10px 12px", borderRadius: 10, border: `1px solid ${S.border}`, cursor: "pointer", transition: "background 0.1s" }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}>
              <Avatar name={c.full_name} url={c.avatar_url} size={36} />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: S.text, margin: 0 }}>{c.full_name}</p>
                <p style={{ fontSize: 11, color: S.dim, margin: 0, textTransform: "capitalize" }}>{c.role.replace("_", " ")}</p>
              </div>
            </div>
          ))}
          {contacts.length === 0 && <p style={{ fontSize: 12, color: S.dim, textAlign: "center", padding: "20px 0" }}>No contacts available</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "calc(100vh - 80px)", background: S.bg, borderRadius: 16, border: `1px solid ${S.border}`, overflow: "hidden", position: "relative" }}>
      {ConversationList}
      {ChatPanel}
      {NewDmPanel}
    </div>
  );
}
