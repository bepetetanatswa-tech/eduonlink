"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface Sender { id: string; full_name: string; avatar_url: string | null; role: string }
interface Reaction { emoji: string; user_id: string }
interface ParentMsg { id: string; content: string; sender: { full_name: string } }

interface ChatMessage {
  id: string;
  sender_id: string;
  content: string;
  message_type: string;
  parent_id: string | null;
  is_pinned: boolean;
  file_url: string | null;
  attachment_name: string | null;
  is_deleted: boolean;
  created_at: string;
  sender: Sender;
  reactions: Reaction[];
  parent: ParentMsg | null;
}

interface Props {
  classId: string;
  profileId: string;
  userRole?: string;
  userName: string;
  className: string;
  isTeacher?: boolean;
}

const EMOJIS = ["👍", "❤️", "😂", "😮", "😢", "🔥", "✅", "👎"];

function Avatar({ name, url, size = 28 }: { name: string; url?: string | null; size?: number }) {
  const initials = name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase();
  if (url) return <img src={url} alt={name} style={{ width: size, height: size, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />;
  return (
    <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg,#4D7FFF,#2D5BDF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: size * 0.38, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
      {initials}
    </div>
  );
}

function fmt(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString([], { day: "numeric", month: "short" }) + " " + d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export function ClassChat({ classId, profileId, userName, className, isTeacher = false }: Props) {
  const supabase = createClient();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [uploading, setUploading] = useState(false);
  const [replyTo, setReplyTo] = useState<ChatMessage | null>(null);
  const [showEmoji, setShowEmoji] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [onlineCount, setOnlineCount] = useState(1);
  const [pinned, setPinned] = useState<ChatMessage | null>(null);
  const [sending, setSending] = useState(false);
  const [showMute, setShowMute] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const presenceChannelRef = useRef<any>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    loadMessages();
    checkMuted();
    setupRealtime();
    return () => cleanup();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  async function loadMessages() {
    const { data } = await (supabase.from("messages") as any)
      .select(`*, sender:profiles!messages_sender_id_fkey(id,full_name,avatar_url,role), reactions:message_reactions(emoji,user_id), parent:messages!messages_parent_id_fkey(id,content,sender:profiles!messages_sender_id_fkey(full_name))`)
      .eq("class_id", classId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: true })
      .limit(100);

    if (data) {
      setMessages(data);
      const p = [...data].reverse().find((m: ChatMessage) => m.is_pinned);
      if (p) setPinned(p);
    }
  }

  async function checkMuted() {
    if (isTeacher) return;
    const { data } = await (supabase.from("chat_moderations") as any)
      .select("id, expires_at")
      .eq("class_id", classId)
      .eq("user_id", profileId)
      .maybeSingle();
    if (data) {
      if (!data.expires_at || new Date(data.expires_at) > new Date()) setIsMuted(true);
    }
  }

  function setupRealtime() {
    const msgChannel = supabase
      .channel(`class-msgs:${classId}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `class_id=eq.${classId}` }, async (payload) => {
        const { data } = await (supabase.from("messages") as any)
          .select(`*, sender:profiles!messages_sender_id_fkey(id,full_name,avatar_url,role), reactions:message_reactions(emoji,user_id), parent:messages!messages_parent_id_fkey(id,content,sender:profiles!messages_sender_id_fkey(full_name))`)
          .eq("id", payload.new.id)
          .single();
        if (data) setMessages(prev => [...prev, data]);
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "messages", filter: `class_id=eq.${classId}` }, (payload) => {
        setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m));
        if (payload.new.is_pinned) {
          setMessages(prev => {
            const p = prev.find(m => m.id === payload.new.id);
            if (p) setPinned(p);
            return prev;
          });
        }
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "message_reactions" }, (payload) => {
        setMessages(prev => prev.map(m => m.id === payload.new.message_id ? {
          ...m, reactions: [...m.reactions, { emoji: payload.new.emoji, user_id: payload.new.user_id }]
        } : m));
      })
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "message_reactions" }, (payload) => {
        setMessages(prev => prev.map(m => m.id === payload.old.message_id ? {
          ...m, reactions: m.reactions.filter(r => !(r.emoji === payload.old.emoji && r.user_id === payload.old.user_id))
        } : m));
      })
      .subscribe();

    const presenceChannel = supabase.channel(`class-presence:${classId}`, {
      config: { presence: { key: profileId } },
    });
    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState<{ name: string; typing: boolean }>();
        const keys = Object.keys(state);
        setOnlineCount(keys.length);
        const typing = keys
          .filter(k => k !== profileId)
          .flatMap(k => state[k])
          .filter((u: any) => u.typing)
          .map((u: any) => u.name);
        setTypingUsers(typing);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({ name: userName.split(" ")[0], typing: false });
        }
      });

    presenceChannelRef.current = presenceChannel;

    return () => {
      supabase.removeChannel(msgChannel);
      supabase.removeChannel(presenceChannel);
    };
  }

  function cleanup() {
    if (presenceChannelRef.current) supabase.removeChannel(presenceChannelRef.current);
  }

  function handleInputChange(val: string) {
    setInput(val);
    if (presenceChannelRef.current) {
      presenceChannelRef.current.track({ name: userName.split(" ")[0], typing: true });
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        presenceChannelRef.current?.track({ name: userName.split(" ")[0], typing: false });
      }, 1500);
    }
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending || isMuted) return;
    setSending(true);
    setInput("");
    setReplyTo(null);
    await (supabase.from("messages") as any).insert({
      sender_id: profileId,
      class_id: classId,
      content: text,
      message_type: "text",
      parent_id: replyTo?.id ?? null,
    });
    setSending(false);
  }

  async function uploadFile(file: File) {
    if (!file) return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `class/${classId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("chat-attachments").upload(path, file);
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from("chat-attachments").getPublicUrl(path);
      const type = file.type.startsWith("image/") ? "image" : "file";
      await (supabase.from("messages") as any).insert({
        sender_id: profileId,
        class_id: classId,
        content: file.name,
        message_type: type,
        file_url: publicUrl,
        attachment_name: file.name,
        parent_id: replyTo?.id ?? null,
      });
      setReplyTo(null);
    }
    setUploading(false);
  }

  async function toggleReaction(messageId: string, emoji: string) {
    const msg = messages.find(m => m.id === messageId);
    const already = msg?.reactions.find(r => r.emoji === emoji && r.user_id === profileId);
    if (already) {
      await (supabase.from("message_reactions") as any)
        .delete()
        .eq("message_id", messageId)
        .eq("user_id", profileId)
        .eq("emoji", emoji);
    } else {
      await (supabase.from("message_reactions") as any).insert({ message_id: messageId, user_id: profileId, emoji });
    }
    setShowEmoji(null);
  }

  async function pinMessage(msg: ChatMessage) {
    if (!isTeacher) return;
    await (supabase.from("messages") as any).update({ is_pinned: !msg.is_pinned }).eq("id", msg.id);
    if (!msg.is_pinned) setPinned(msg);
    else setPinned(null);
  }

  async function deleteMessage(id: string) {
    await (supabase.from("messages") as any).update({ is_deleted: true }).eq("id", id);
    setMessages(prev => prev.filter(m => m.id !== id));
  }

  async function muteUser(userId: string) {
    await (supabase.from("chat_moderations") as any).insert({ class_id: classId, user_id: userId, muted_by: profileId });
    setShowMute(null);
  }

  const displayed = showSearch && searchQuery
    ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
    : messages;

  const S = { bg: "#07080C", card: "rgba(255,255,255,0.02)", border: "rgba(255,255,255,0.07)", accent: "#4D7FFF", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170" };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 80px)", background: S.bg, borderRadius: 16, border: `1px solid ${S.border}`, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${S.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0A0B10", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#4D7FFF22,#2D5BDF22)", border: `1px solid ${S.accent}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" fill="none" stroke={S.accent} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: S.text, fontFamily: "'Space Grotesk',sans-serif" }}>{className}</p>
            <p style={{ fontSize: 11, color: S.dim }}>{onlineCount} online</p>
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setShowSearch(!showSearch)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${S.border}`, background: showSearch ? `${S.accent}20` : "transparent", color: showSearch ? S.accent : S.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" /></svg>
          </button>
        </div>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div style={{ padding: "8px 16px", borderBottom: `1px solid ${S.border}`, background: "#0A0B10", flexShrink: 0 }}>
          <input
            autoFocus
            placeholder="Search messages..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`, borderRadius: 8, padding: "7px 12px", fontSize: 13, color: S.text, outline: "none" }}
          />
        </div>
      )}

      {/* Pinned message */}
      {pinned && !showSearch && (
        <div style={{ padding: "8px 16px", background: `${S.accent}10`, borderBottom: `1px solid ${S.accent}30`, display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
          <svg width="12" height="12" fill={S.accent} viewBox="0 0 24 24"><path d="M16 12V4a4 4 0 00-8 0v8H5l2 6h10l2-6h-3z" /></svg>
          <span style={{ fontSize: 12, color: S.muted, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            <span style={{ color: S.accent, fontWeight: 600 }}>Pinned: </span>{pinned.content}
          </span>
          {isTeacher && <button onClick={() => pinMessage(pinned)} style={{ fontSize: 11, color: S.dim, background: "none", border: "none", cursor: "pointer" }}>Unpin</button>}
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 2 }}>
        {displayed.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ fontSize: 14, color: S.dim }}>No messages yet. Say hello!</p>
          </div>
        )}
        {displayed.map((msg, i) => {
          const isOwn = msg.sender_id === profileId;
          const showAvatar = !isOwn && (i === 0 || displayed[i - 1].sender_id !== msg.sender_id);
          const showName = !isOwn && showAvatar;
          const grouped = msg.reactions.reduce<{ emoji: string; count: number; users: string[] }[]>((acc, r) => {
            const ex = acc.find(a => a.emoji === r.emoji);
            if (ex) { ex.count++; ex.users.push(r.user_id); }
            else acc.push({ emoji: r.emoji, count: 1, users: [r.user_id] });
            return acc;
          }, []);

          return (
            <div key={msg.id} style={{ display: "flex", flexDirection: isOwn ? "row-reverse" : "row", gap: 8, alignItems: "flex-end", marginBottom: 4, position: "relative" }}
              onMouseLeave={() => setShowEmoji(null)}>
              {/* Avatar */}
              {!isOwn && (
                <div style={{ width: 28, flexShrink: 0, alignSelf: "flex-end" }}>
                  {showAvatar && <Avatar name={msg.sender?.full_name ?? "?"} url={msg.sender?.avatar_url} size={28} />}
                </div>
              )}

              <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", alignItems: isOwn ? "flex-end" : "flex-start", gap: 2 }}>
                {showName && <span style={{ fontSize: 11, fontWeight: 600, color: S.accent, marginLeft: 4 }}>{msg.sender?.full_name}</span>}

                {/* Reply quote */}
                {msg.parent && (
                  <div style={{ background: isOwn ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)", borderLeft: `2px solid ${S.accent}`, borderRadius: "6px 6px 0 0", padding: "5px 10px", fontSize: 11, color: S.muted, maxWidth: "100%" }}>
                    <span style={{ color: S.accent, fontWeight: 600 }}>{msg.parent.sender?.full_name} </span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", maxWidth: "100%" }}>{msg.parent.content}</span>
                  </div>
                )}

                {/* Bubble */}
                <div
                  style={{
                    background: isOwn ? "linear-gradient(135deg,#1E3A6E,#1A3060)" : "rgba(255,255,255,0.05)",
                    border: `1px solid ${isOwn ? "rgba(77,127,255,0.3)" : S.border}`,
                    borderRadius: isOwn
                      ? (msg.parent ? "12px 4px 12px 12px" : "12px 4px 12px 12px")
                      : (msg.parent ? "4px 12px 12px 12px" : "4px 12px 12px 12px"),
                    padding: "8px 12px",
                    position: "relative",
                  }}
                  onMouseEnter={() => setShowEmoji(msg.id)}
                >
                  {/* File/image */}
                  {msg.message_type === "image" && msg.file_url && (
                    <img src={msg.file_url} alt={msg.attachment_name ?? "image"} style={{ maxWidth: 220, borderRadius: 8, display: "block", marginBottom: 4 }} />
                  )}
                  {msg.message_type === "file" && msg.file_url && (
                    <a href={msg.file_url} target="_blank" rel="noreferrer" style={{ display: "flex", gap: 8, alignItems: "center", color: S.accent, textDecoration: "none", fontSize: 13, marginBottom: 4 }}>
                      <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                      {msg.attachment_name}
                    </a>
                  )}
                  {(msg.message_type === "text" || msg.message_type === "video_link") && (
                    <p style={{ fontSize: 13, color: S.text, lineHeight: 1.5, margin: 0, wordBreak: "break-word" }}>{msg.content}</p>
                  )}
                  <p style={{ fontSize: 10, color: isOwn ? "rgba(205,214,244,0.5)" : S.dim, marginTop: 4, textAlign: "right" }}>{fmt(msg.created_at)}{msg.is_pinned && " 📌"}</p>

                  {/* Hover action row */}
                  {showEmoji === msg.id && (
                    <div style={{ position: "absolute", [isOwn ? "left" : "right"]: "-120px", top: 0, background: "#0E1117", border: `1px solid ${S.border}`, borderRadius: 10, padding: "4px 6px", display: "flex", gap: 4, zIndex: 20, boxShadow: "0 8px 24px rgba(0,0,0,0.4)", flexWrap: "wrap", width: 116 }}>
                      {EMOJIS.map(e => (
                        <button key={e} onClick={() => toggleReaction(msg.id, e)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, lineHeight: 1, padding: "2px 3px", borderRadius: 6, transition: "background 0.1s" }}
                          onMouseEnter={(ev) => (ev.currentTarget.style.background = "rgba(255,255,255,0.08)")}
                          onMouseLeave={(ev) => (ev.currentTarget.style.background = "none")}>
                          {e}
                        </button>
                      ))}
                      <button onClick={() => setReplyTo(msg)} style={{ background: "none", border: "none", cursor: "pointer", padding: "3px", color: S.muted, fontSize: 11 }} title="Reply">↩</button>
                      {isOwn && <button onClick={() => deleteMessage(msg.id)} style={{ background: "none", border: "none", cursor: "pointer", padding: "3px", color: "#FF6B6B", fontSize: 11 }} title="Delete">✕</button>}
                      {isTeacher && !isOwn && (
                        <>
                          <button onClick={() => pinMessage(msg)} style={{ background: "none", border: "none", cursor: "pointer", color: S.accent, fontSize: 11, padding: "3px" }} title="Pin">📌</button>
                          <button onClick={() => setShowMute(msg.sender_id)} style={{ background: "none", border: "none", cursor: "pointer", color: "#FF9A3C", fontSize: 11, padding: "3px" }} title="Mute">🔇</button>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* Reactions */}
                {grouped.length > 0 && (
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {grouped.map(r => (
                      <button key={r.emoji} onClick={() => toggleReaction(msg.id, r.emoji)}
                        style={{ background: r.users.includes(profileId) ? `${S.accent}25` : "rgba(255,255,255,0.06)", border: `1px solid ${r.users.includes(profileId) ? S.accent + "50" : S.border}`, borderRadius: 12, padding: "2px 7px", fontSize: 12, cursor: "pointer", color: S.muted, display: "flex", gap: 3, alignItems: "center" }}>
                        {r.emoji} <span style={{ fontSize: 11 }}>{r.count}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {/* Typing indicator */}
        {typingUsers.length > 0 && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: S.dim, animation: `bounce 1.2s ${i * 0.2}s infinite` }} />
              ))}
            </div>
            <span style={{ fontSize: 11, color: S.dim }}>{typingUsers.join(", ")} typing…</span>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Mute confirm */}
      {showMute && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#0E1117", border: `1px solid ${S.border}`, borderRadius: 14, padding: 24, width: 280 }}>
            <p style={{ fontSize: 14, color: S.text, marginBottom: 16 }}>Mute this student from class chat?</p>
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => muteUser(showMute)} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "#FF9A3C", border: "none", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>Mute</button>
              <button onClick={() => setShowMute(null)} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: `1px solid ${S.border}`, color: S.text, cursor: "pointer", fontSize: 13 }}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${S.border}`, background: "#0A0B10", flexShrink: 0 }}>
        {isMuted && (
          <p style={{ fontSize: 12, color: "#FF9A3C", textAlign: "center", marginBottom: 8 }}>You have been muted by the teacher.</p>
        )}

        {/* Reply quote */}
        {replyTo && (
          <div style={{ background: "rgba(255,255,255,0.04)", borderLeft: `2px solid ${S.accent}`, borderRadius: 6, padding: "5px 10px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 11, color: S.accent, fontWeight: 600 }}>Replying to {replyTo.sender?.full_name}</span>
              <p style={{ fontSize: 11, color: S.muted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 250 }}>{replyTo.content}</p>
            </div>
            <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", color: S.dim, cursor: "pointer", fontSize: 14 }}>✕</button>
          </div>
        )}

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*,.pdf,.doc,.docx,.txt" onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0]); e.target.value = ""; }} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isMuted || uploading}
            style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${S.border}`, background: "rgba(255,255,255,0.04)", color: uploading ? S.accent : S.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            {uploading ? <span style={{ fontSize: 11 }}>…</span> : <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>}
          </button>
          <input
            value={input}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={isMuted ? "You are muted" : "Type a message…"}
            disabled={isMuted}
            style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`, borderRadius: 10, padding: "9px 14px", fontSize: 13, color: S.text, outline: "none", resize: "none" }}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending || isMuted}
            style={{ width: 36, height: 36, borderRadius: 10, background: (!input.trim() || sending || isMuted) ? "rgba(77,127,255,0.2)" : S.accent, border: "none", color: "#fff", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, transition: "background 0.15s" }}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
      </div>

      <style>{`@keyframes bounce { 0%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-4px); } }`}</style>
    </div>
  );
}
