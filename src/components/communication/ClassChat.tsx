"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { LinkPreviewCard, extractFirstUrl } from "./LinkPreviewCard";
import { createReconnectingSubscription, type ConnStatus } from "@/lib/supabase/reconnect";

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

interface PendingMessage { tempId: string; content: string; parentId: string | null; status: "offline" | "failed" | "retrying" }

interface Props {
  classId: string;
  profileId: string;
  userRole?: string;
  userName: string;
  className: string;
  isTeacher?: boolean;
  height?: string;
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

function dayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const yesterday = new Date(now); yesterday.setDate(now.getDate() - 1);
  if (d.toDateString() === now.toDateString()) return "Today";
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  const daysAgo = Math.floor((now.getTime() - d.getTime()) / 86400000);
  if (daysAgo < 7) return d.toLocaleDateString([], { weekday: "long" });
  return d.toLocaleDateString([], { weekday: "long", day: "numeric", month: "long" });
}

export function ClassChat({ classId, profileId, userName, className, isTeacher = false, height = "calc(100vh - 80px)" }: Props) {
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
  const [notifMuted, setNotifMuted] = useState(false);
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const [forwarding, setForwarding] = useState<ChatMessage | null>(null);
  const [myClasses, setMyClasses] = useState<{ id: string; name: string }[] | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const presenceChannelRef = useRef<any>(null);
  const [connStatus, setConnStatus] = useState<ConnStatus>("connecting");
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval>>();
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const prevMessageCount = useRef(0);
  const [showInfo, setShowInfo] = useState(false);
  const [infoTab, setInfoTab] = useState<"members" | "media" | "files" | "links">("members");
  const [members, setMembers] = useState<{ id: string; full_name: string; avatar_url: string | null; role: string }[] | null>(null);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const pendingMessagesRef = useRef<PendingMessage[]>([]);

  const scrollToBottom = useCallback((smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    setNewMessageCount(0);
  }, []);

  function handleScroll() {
    const el = messagesContainerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setIsNearBottom(nearBottom);
    if (nearBottom) setNewMessageCount(0);
  }

  useEffect(() => {
    loadMessages();
    checkMuted();
    checkNotifMuted();
    const teardown = setupRealtime();
    return () => teardown();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId]);

  useEffect(() => { pendingMessagesRef.current = pendingMessages; }, [pendingMessages]);

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const goOnline = () => { setIsOnline(true); retryAllPending(); };
    const goOffline = () => setIsOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const grew = messages.length > prevMessageCount.current;
    if (grew) {
      if (isNearBottom) {
        scrollToBottom();
      } else {
        setNewMessageCount((n) => n + (messages.length - prevMessageCount.current));
      }
    }
    prevMessageCount.current = messages.length;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  async function loadMessages() {
    // Fetch the most recent 100 (descending), then reverse to ascending for
    // display — ordering ascending with a limit would return the oldest 100
    // messages ever sent instead, hiding all recent activity once a class
    // chat has grown past 100 messages.
    const { data } = await (supabase.from("messages") as any)
      .select(`*, sender:profiles!messages_sender_id_fkey(id,full_name,avatar_url,role), reactions:message_reactions(emoji,user_id), parent:messages!messages_parent_id_fkey(id,content,sender:profiles!messages_sender_id_fkey(full_name))`)
      .eq("class_id", classId)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(100);

    if (data) {
      const p = data.find((m: ChatMessage) => m.is_pinned); // data is newest-first; take the most recent pin
      if (p) setPinned(p);
      setMessages([...data].reverse());
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

  async function checkNotifMuted() {
    const { data } = await (supabase.from("muted_classes") as any)
      .select("id").eq("user_id", profileId).eq("class_id", classId).maybeSingle();
    setNotifMuted(!!data);
  }

  async function toggleNotifMute() {
    if (notifMuted) {
      await (supabase.from("muted_classes") as any).delete().eq("user_id", profileId).eq("class_id", classId);
      setNotifMuted(false);
    } else {
      await (supabase.from("muted_classes") as any).insert({ user_id: profileId, class_id: classId });
      setNotifMuted(true);
    }
  }

  async function notifyClassMembers(preview: string) {
    // Notification rows must target other users, which client-side inserts can't
    // do under RLS (insert policy requires user_id = the caller's own profile).
    // This RPC runs SECURITY DEFINER and re-validates class membership server-side.
    await (supabase.rpc as any)("notify_class_message", { p_class_id: classId, p_preview: preview });
  }

  function setupRealtime() {
    // Message channel: recreated with backoff on CHANNEL_ERROR/TIMED_OUT/CLOSED
    // instead of silently going stale on a dropped connection (relevant on
    // high-latency/unstable links). The previous version's returned cleanup
    // closure was discarded by the caller — msgChannel was never removed on
    // unmount/classId change, leaking a subscription on every remount.
    const stopMsgReconnect = createReconnectingSubscription((onStatus) => {
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
        .subscribe(onStatus);
      return { remove: () => supabase.removeChannel(msgChannel) };
    }, setConnStatus);

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
      stopMsgReconnect();
      supabase.removeChannel(presenceChannel);
    };
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

  // Sends now go through here so a dropped connection or offline device
  // doesn't just silently lose the message — it's queued locally with a
  // retry button (and auto-retried once "online" fires) instead.
  async function attemptSend(content: string, parentId: string | null): Promise<boolean> {
    if (!navigator.onLine) return false;
    const { error } = await (supabase.from("messages") as any).insert({
      sender_id: profileId,
      class_id: classId,
      content,
      message_type: "text",
      parent_id: parentId,
    });
    if (error) return false;
    notifyClassMembers(content.slice(0, 80));
    return true;
  }

  async function sendMessage() {
    const text = input.trim();
    if (!text || sending || isMuted) return;
    setSending(true);
    setInput("");
    const parentId = replyTo?.id ?? null;
    setReplyTo(null);

    const ok = await attemptSend(text, parentId);
    if (!ok) {
      setPendingMessages(prev => [...prev, {
        tempId: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        content: text, parentId, status: navigator.onLine ? "failed" : "offline",
      }]);
    }
    setSending(false);
  }

  async function retryPending(tempId: string) {
    const msg = pendingMessagesRef.current.find(p => p.tempId === tempId);
    if (!msg) return;
    setPendingMessages(prev => prev.map(p => p.tempId === tempId ? { ...p, status: "retrying" } : p));
    const ok = await attemptSend(msg.content, msg.parentId);
    if (ok) setPendingMessages(prev => prev.filter(p => p.tempId !== tempId));
    else setPendingMessages(prev => prev.map(p => p.tempId === tempId ? { ...p, status: navigator.onLine ? "failed" : "offline" } : p));
  }

  async function retryAllPending() {
    for (const p of pendingMessagesRef.current) {
      const ok = await attemptSend(p.content, p.parentId);
      if (ok) setPendingMessages(prev => prev.filter(x => x.tempId !== p.tempId));
    }
  }

  function discardPending(tempId: string) {
    setPendingMessages(prev => prev.filter(p => p.tempId !== tempId));
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
      notifyClassMembers(type === "image" ? "📷 Photo" : `📎 ${file.name}`);
      setReplyTo(null);
    }
    setUploading(false);
  }

  async function startRecording() {
    if (isMuted || recording) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      recordChunksRef.current = [];
      recorder.ondataavailable = (e) => { if (e.data.size > 0) recordChunksRef.current.push(e.data); };
      recorder.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        clearInterval(recordTimerRef.current);
        const seconds = recordSeconds;
        setRecording(false);
        setRecordSeconds(0);
        if (seconds < 1) return; // too short — treat as cancelled
        const blob = new Blob(recordChunksRef.current, { type: "audio/webm" });
        uploadVoiceNote(blob, seconds);
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
      setRecording(true);
      setRecordSeconds(0);
      recordTimerRef.current = setInterval(() => setRecordSeconds((s) => s + 1), 1000);
    } catch {
      // permission denied or no mic — silently no-op, button just won't record
    }
  }

  function stopRecording(cancel = false) {
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state === "inactive") return;
    if (cancel) recordChunksRef.current = [];
    mediaRecorderRef.current.stop();
  }

  async function uploadVoiceNote(blob: Blob, seconds: number) {
    setUploading(true);
    try {
      const filename = `voice-${Date.now()}.webm`;
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "voice-note", filename, contentType: "audio/webm", fileSize: blob.size, ids: { classId } }),
      });
      if (!presignRes.ok) throw new Error("presign failed");
      const { uploadUrl, fileUrl } = await presignRes.json();

      const putRes = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": "audio/webm" }, body: blob });
      if (!putRes.ok) throw new Error("upload failed");

      const mins = Math.floor(seconds / 60), secs = seconds % 60;
      await (supabase.from("messages") as any).insert({
        sender_id: profileId,
        class_id: classId,
        content: `${mins}:${secs.toString().padStart(2, "0")}`,
        message_type: "voice",
        file_url: fileUrl,
        attachment_name: "voice-note.webm",
        parent_id: replyTo?.id ?? null,
      });
      notifyClassMembers("🎤 Voice message");
      setReplyTo(null);
    } catch {
      // best-effort, matches uploadFile's existing lack of error UI
    }
    setUploading(false);
  }

  async function openInfoPanel() {
    setShowInfo(true);
    if (members === null) {
      const { data: enrolled } = await (supabase.from("class_enrollments") as any)
        .select("profiles(id,full_name,avatar_url,role)").eq("class_id", classId).eq("status", "active");
      const { data: cls } = await (supabase.from("classes") as any)
        .select("profiles!classes_teacher_id_fkey(id,full_name,avatar_url,role)").eq("id", classId).single();
      const list = (enrolled ?? []).map((r: any) => r.profiles).filter(Boolean);
      if (cls?.profiles) list.unshift(cls.profiles);
      setMembers(list);
    }
  }

  async function openForward(msg: ChatMessage) {
    setForwarding(msg);
    setShowEmoji(null);
    if (myClasses === null) {
      const { data } = isTeacher
        ? await (supabase.from("classes") as any).select("id,name").eq("teacher_id", profileId).order("name")
        : await (supabase.from("class_enrollments") as any).select("classes(id,name)").eq("student_id", profileId).eq("status", "active");
      const list = isTeacher ? (data ?? []) : (data ?? []).map((r: any) => r.classes).filter(Boolean);
      setMyClasses(list.filter((c: { id: string }) => c.id !== classId));
    }
  }

  async function forwardTo(targetClassId: string) {
    if (!forwarding) return;
    await (supabase.from("messages") as any).insert({
      sender_id: profileId,
      class_id: targetClassId,
      content: forwarding.content,
      message_type: forwarding.message_type,
      file_url: forwarding.file_url,
      attachment_name: forwarding.attachment_name,
    });
    setForwarding(null);
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
    <div style={{ display: "flex", flexDirection: "column", height, background: S.bg, borderRadius: 16, border: `1px solid ${S.border}`, overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "12px 16px", borderBottom: `1px solid ${S.border}`, display: "flex", alignItems: "center", justifyContent: "space-between", background: "#0A0B10", flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#4D7FFF22,#2D5BDF22)", border: `1px solid ${S.accent}33`, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="16" height="16" fill="none" stroke={S.accent} viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
          </div>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: S.text, fontFamily: "'Space Grotesk',sans-serif" }}>{className}</p>
            {!isOnline ? (
              <p style={{ fontSize: 11, color: "#FF6B6B" }}>Offline — messages will send when reconnected</p>
            ) : connStatus === "connected" ? (
              <p style={{ fontSize: 11, color: S.dim }}>{onlineCount} online</p>
            ) : (
              <p style={{ fontSize: 11, color: "#F5A623" }}>{connStatus === "connecting" ? "Connecting…" : "Reconnecting…"}</p>
            )}
          </div>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <button onClick={() => setShowSearch(!showSearch)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${S.border}`, background: showSearch ? `${S.accent}20` : "transparent", color: showSearch ? S.accent : S.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" /></svg>
          </button>
          <button onClick={openInfoPanel} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${S.border}`, background: showInfo ? `${S.accent}20` : "transparent", color: showInfo ? S.accent : S.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
          </button>
          <button onClick={toggleNotifMute} title={notifMuted ? "Unmute notifications" : "Mute notifications"} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${S.border}`, background: notifMuted ? "rgba(245,166,35,0.15)" : "transparent", color: notifMuted ? "#F5A623" : S.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14 }}>
            {notifMuted ? "🔕" : "🔔"}
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
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
      <div ref={messagesContainerRef} onScroll={handleScroll} style={{ height: "100%", overflowY: "auto", padding: "12px 16px", display: "flex", flexDirection: "column", gap: 2 }}>
        {displayed.length === 0 && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <p style={{ fontSize: 14, color: S.dim }}>No messages yet. Say hello!</p>
          </div>
        )}
        {displayed.map((msg, i) => {
          const isOwn = msg.sender_id === profileId;
          const showAvatar = !isOwn && (i === 0 || displayed[i - 1].sender_id !== msg.sender_id);
          const showName = !isOwn && showAvatar;
          const showDateDivider = i === 0 || new Date(displayed[i - 1].created_at).toDateString() !== new Date(msg.created_at).toDateString();
          const grouped = msg.reactions.reduce<{ emoji: string; count: number; users: string[] }[]>((acc, r) => {
            const ex = acc.find(a => a.emoji === r.emoji);
            if (ex) { ex.count++; ex.users.push(r.user_id); }
            else acc.push({ emoji: r.emoji, count: 1, users: [r.user_id] });
            return acc;
          }, []);
          const url = msg.message_type === "text" ? extractFirstUrl(msg.content) : null;

          return (
            <div key={msg.id}>
            {showDateDivider && (
              <div style={{ display: "flex", justifyContent: "center", margin: "12px 0" }}>
                <span style={{ fontSize: 11, color: S.dim, background: "rgba(255,255,255,0.05)", padding: "3px 12px", borderRadius: 20 }}>{dayLabel(msg.created_at)}</span>
              </div>
            )}
            <div style={{ display: "flex", flexDirection: isOwn ? "row-reverse" : "row", gap: 8, alignItems: "flex-end", marginBottom: 4, position: "relative" }}
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
                  {msg.message_type === "voice" && msg.file_url && (
                    <div style={{ marginBottom: 4 }}>
                      <audio controls src={msg.file_url} style={{ height: 32, maxWidth: 220 }} />
                    </div>
                  )}
                  {(msg.message_type === "text" || msg.message_type === "video_link") && (
                    <>
                      <p style={{ fontSize: 13, color: S.text, lineHeight: 1.5, margin: 0, wordBreak: "break-word" }}>{msg.content}</p>
                      {url && <LinkPreviewCard url={url} />}
                    </>
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
                      <button onClick={() => openForward(msg)} style={{ background: "none", border: "none", cursor: "pointer", padding: "3px", color: S.muted, fontSize: 11 }} title="Forward">➦</button>
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
            </div>
          );
        })}

        {/* Queued/failed sends */}
        {pendingMessages.map(p => (
          <div key={p.tempId} style={{ display: "flex", flexDirection: "row-reverse", gap: 8, marginBottom: 4 }}>
            <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 2 }}>
              <div style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: "12px 4px 12px 12px", padding: "8px 12px" }}>
                <p style={{ fontSize: 13, color: S.text, lineHeight: 1.5, margin: 0, wordBreak: "break-word" }}>{p.content}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 10, color: "#FF6B6B" }}>
                  {p.status === "retrying" ? "Retrying…" : p.status === "offline" ? "Waiting for connection…" : "Failed to send"}
                </span>
                {p.status !== "retrying" && (
                  <>
                    <button onClick={() => retryPending(p.tempId)} style={{ background: "none", border: "none", color: S.accent, fontSize: 10, fontWeight: 600, cursor: "pointer", padding: 0 }}>Retry</button>
                    <button onClick={() => discardPending(p.tempId)} style={{ background: "none", border: "none", color: S.dim, fontSize: 10, cursor: "pointer", padding: 0 }}>Discard</button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

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

      {/* Jump to latest / new messages banner */}
      {!isNearBottom && (
        <button
          onClick={() => scrollToBottom()}
          style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", padding: "7px 16px", borderRadius: 20, background: S.accent, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.4)", zIndex: 10 }}
        >
          {newMessageCount > 0 ? `${newMessageCount} new message${newMessageCount > 1 ? "s" : ""}` : "Jump to latest"} ↓
        </button>
      )}
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

      {/* Chat info panel */}
      {showInfo && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#0E1117", border: `1px solid ${S.border}`, borderRadius: 14, padding: 20, width: 340, maxHeight: 480, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: S.text }}>{className}</span>
              <button onClick={() => setShowInfo(false)} style={{ background: "none", border: "none", color: S.dim, cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <div style={{ display: "flex", gap: 4, marginBottom: 12, borderBottom: `1px solid ${S.border}`, paddingBottom: 8 }}>
              {(["members", "media", "files", "links"] as const).map((t) => (
                <button key={t} onClick={() => setInfoTab(t)} style={{ padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, textTransform: "capitalize", cursor: "pointer", background: infoTab === t ? `${S.accent}20` : "transparent", color: infoTab === t ? S.accent : S.muted, border: "none" }}>
                  {t}
                </button>
              ))}
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {infoTab === "members" && (
                members === null ? <p style={{ fontSize: 12, color: S.dim, textAlign: "center", padding: "12px 0" }}>Loading…</p> :
                members.length === 0 ? <p style={{ fontSize: 12, color: S.dim, textAlign: "center", padding: "12px 0" }}>No members yet</p> :
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {members.map((m, i) => (
                    <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Avatar name={m.full_name} url={m.avatar_url} size={32} />
                      <div>
                        <p style={{ fontSize: 13, color: S.text, margin: 0, fontWeight: 600 }}>{m.full_name}</p>
                        <p style={{ fontSize: 10, color: S.dim, margin: 0, textTransform: "capitalize" }}>{i === 0 && m.role === "teacher" ? "Teacher" : m.role.replace("_", " ")}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {infoTab === "media" && (() => {
                const media = messages.filter((m) => m.message_type === "image" && m.file_url);
                return media.length === 0 ? <p style={{ fontSize: 12, color: S.dim, textAlign: "center", padding: "12px 0" }}>No shared media yet</p> : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 6 }}>
                    {media.map((m) => (
                      <a key={m.id} href={m.file_url!} target="_blank" rel="noreferrer">
                        <img src={m.file_url!} alt="" style={{ width: "100%", aspectRatio: "1", objectFit: "cover", borderRadius: 8 }} />
                      </a>
                    ))}
                  </div>
                );
              })()}
              {infoTab === "files" && (() => {
                const files = messages.filter((m) => m.message_type === "file" && m.file_url);
                return files.length === 0 ? <p style={{ fontSize: 12, color: S.dim, textAlign: "center", padding: "12px 0" }}>No shared files yet</p> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                    {files.map((m) => (
                      <a key={m.id} href={m.file_url!} target="_blank" rel="noreferrer" style={{ display: "flex", gap: 8, alignItems: "center", color: S.accent, textDecoration: "none", fontSize: 12, padding: "6px 8px", borderRadius: 8, background: "rgba(255,255,255,0.03)" }}>
                        <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        {m.attachment_name}
                      </a>
                    ))}
                  </div>
                );
              })()}
              {infoTab === "links" && (() => {
                const links = messages.filter((m) => m.message_type === "text" && extractFirstUrl(m.content));
                return links.length === 0 ? <p style={{ fontSize: 12, color: S.dim, textAlign: "center", padding: "12px 0" }}>No shared links yet</p> : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {links.map((m) => (
                      <div key={m.id}>
                        <p style={{ fontSize: 11, color: S.dim, margin: "0 0 3px" }}>{m.sender?.full_name}</p>
                        <LinkPreviewCard url={extractFirstUrl(m.content)!} />
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Forward message */}
      {forwarding && (
        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
          <div style={{ background: "#0E1117", border: `1px solid ${S.border}`, borderRadius: 14, padding: 20, width: 300, maxHeight: 400, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: S.text }}>Forward to…</span>
              <button onClick={() => setForwarding(null)} style={{ background: "none", border: "none", color: S.dim, cursor: "pointer", fontSize: 16 }}>✕</button>
            </div>
            <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
              {myClasses === null ? (
                <p style={{ fontSize: 12, color: S.dim, textAlign: "center", padding: "12px 0" }}>Loading…</p>
              ) : myClasses.length === 0 ? (
                <p style={{ fontSize: 12, color: S.dim, textAlign: "center", padding: "12px 0" }}>No other classes available</p>
              ) : (
                myClasses.map((c) => (
                  <button key={c.id} onClick={() => forwardTo(c.id)} style={{ textAlign: "left", padding: "10px 12px", borderRadius: 10, border: `1px solid ${S.border}`, background: "rgba(255,255,255,0.02)", color: S.text, fontSize: 13, cursor: "pointer" }}>
                    {c.name}
                  </button>
                ))
              )}
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
          <button
            onMouseDown={startRecording}
            onMouseUp={() => stopRecording(false)}
            onMouseLeave={() => { if (recording) stopRecording(true); }}
            onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
            onTouchEnd={(e) => { e.preventDefault(); stopRecording(false); }}
            disabled={isMuted || uploading}
            title="Hold to record a voice note"
            style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${recording ? "#FF6B6B" : S.border}`, background: recording ? "rgba(255,107,107,0.15)" : "rgba(255,255,255,0.04)", color: recording ? "#FF6B6B" : S.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
            {recording && <span style={{ position: "absolute", bottom: -16, fontSize: 9, color: "#FF6B6B", whiteSpace: "nowrap" }}>{recordSeconds}s</span>}
          </button>
          <input
            value={input}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={isMuted ? "You are muted" : recording ? "Recording…" : "Type a message…"}
            disabled={isMuted || recording}
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
