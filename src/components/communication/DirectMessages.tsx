"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { createReconnectingSubscription, type ConnStatus } from "@/lib/supabase/reconnect";

interface Profile { id: string; full_name: string; avatar_url: string | null; role: string; email: string }
interface ParentMsg { id: string; content: string; sender: { full_name: string } }
interface DMsg {
  id: string; sender_id: string; receiver_id: string; content: string; read_at: string | null; created_at: string;
  message_type: string; file_url: string | null; attachment_name: string | null;
  parent_id: string | null; is_deleted: boolean;
  sender: Profile; receiver: Profile;
  parent: ParentMsg | null;
}
interface PendingMessage { tempId: string; content: string; parentId: string | null; receiverId: string; status: "offline" | "failed" | "retrying" }

interface Props {
  profileId: string;
  userRole: string;
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

function dmChannelKey(a: string, b: string) {
  return [a, b].sort().join(":");
}

export function DirectMessages({ profileId, userRole, allowedRoles }: Props) {
  const supabase = createClient();
  const S = { bg: "#07080C", card: "#0A0B10", border: "rgba(255,255,255,0.07)", accent: "#4D7FFF", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170" };

  const [conversations, setConversations] = useState<{ other: Profile; lastMsg: DMsg; unread: number }[]>([]);
  const [selected, setSelected] = useState<Profile | null>(null);
  const [messages, setMessages] = useState<DMsg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [contacts, setContacts] = useState<Profile[]>([]);
  const [showNewDm, setShowNewDm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);
  const [otherTyping, setOtherTyping] = useState(false);
  const [otherOnline, setOtherOnline] = useState(false);
  const [blockedByMe, setBlockedByMe] = useState(false);
  const [blockedMe, setBlockedMe] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [muted, setMuted] = useState(false);
  const [dmRequestStatus, setDmRequestStatus] = useState<"checking" | "none" | "pending_sent" | "pending_received" | "accepted" | "declined">("accepted");
  const bottomRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const presenceChannelRef = useRef<any>(null);
  const typingTimerRef = useRef<ReturnType<typeof setTimeout>>();
  const [connStatus, setConnStatus] = useState<ConnStatus>("connecting");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messageInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const prevMessageCount = useRef(0);
  const [replyTo, setReplyTo] = useState<DMsg | null>(null);
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [recording, setRecording] = useState(false);
  const [recordSeconds, setRecordSeconds] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordChunksRef = useRef<Blob[]>([]);
  const recordTimerRef = useRef<ReturnType<typeof setInterval>>();
  const [isOnline, setIsOnline] = useState(true);
  const [pendingMessages, setPendingMessages] = useState<PendingMessage[]>([]);
  const pendingMessagesRef = useRef<PendingMessage[]>([]);
  const [starredIds, setStarredIds] = useState<Set<string>>(new Set());
  const [showStarred, setShowStarred] = useState(false);

  const scrollToBottom = (smooth = true) => {
    bottomRef.current?.scrollIntoView({ behavior: smooth ? "smooth" : "auto" });
    setNewMessageCount(0);
  };

  function handleScroll() {
    const el = messagesContainerRef.current;
    if (!el) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    setIsNearBottom(nearBottom);
    if (nearBottom) setNewMessageCount(0);
  }

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    loadConversations();
    loadStarred();
    const cleanupMsgs = setupRealtime();
    return () => {
      cleanupMsgs();
      if (presenceChannelRef.current) supabase.removeChannel(presenceChannelRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  async function loadStarred() {
    const { data } = await (supabase.from("message_stars") as any).select("message_id").eq("user_id", profileId);
    setStarredIds(new Set((data ?? []).map((r: any) => r.message_id)));
  }

  async function toggleStar(messageId: string) {
    if (starredIds.has(messageId)) {
      await (supabase.from("message_stars") as any).delete().eq("message_id", messageId).eq("user_id", profileId);
      setStarredIds(prev => { const next = new Set(prev); next.delete(messageId); return next; });
    } else {
      await (supabase.from("message_stars") as any).insert({ message_id: messageId, user_id: profileId });
      setStarredIds(prev => new Set(prev).add(messageId));
    }
  }

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

  // Deep link from a push notification: /messages?with={id}&focus=1
  useEffect(() => {
    if (loading) return;
    const withId = searchParams.get("with");
    if (!withId || selected?.id === withId) return;
    const existing = conversations.find((c) => c.other.id === withId)?.other
      ?? contacts.find((c) => c.id === withId);
    if (existing) {
      openConversation(existing).then(() => {
        if (searchParams.get("focus")) setTimeout(() => messageInputRef.current?.focus(), 200);
      });
    } else {
      (supabase.from("profiles") as any).select("id,full_name,avatar_url,role,email").eq("id", withId).single()
        .then(({ data }: any) => {
          if (data) openConversation(data).then(() => {
            if (searchParams.get("focus")) setTimeout(() => messageInputRef.current?.focus(), 200);
          });
        });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, searchParams]);

  useEffect(() => {
    const grew = messages.length > prevMessageCount.current;
    if (grew) {
      if (isNearBottom) scrollToBottom();
      else setNewMessageCount((n) => n + (messages.length - prevMessageCount.current));
    }
    prevMessageCount.current = messages.length;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages]);

  async function loadConversations() {
    setLoading(true);
    const { data: sent } = await (supabase.from("messages") as any)
      .select("*, sender:profiles!messages_sender_id_fkey(id,full_name,avatar_url,role,email), receiver:profiles!messages_receiver_id_fkey(id,full_name,avatar_url,role,email)")
      .is("class_id", null)
      .eq("is_deleted", false)
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
    // Recreated with backoff on CHANNEL_ERROR/TIMED_OUT/CLOSED instead of
    // silently going stale on a dropped connection.
    return createReconnectingSubscription((onStatus) => {
      const ch = supabase.channel(`dm:${profileId}`)
        .on("postgres_changes", {
          event: "INSERT", schema: "public", table: "messages",
          filter: `receiver_id=eq.${profileId}`,
        }, async (payload) => {
          const { data } = await (supabase.from("messages") as any)
            .select("*, sender:profiles!messages_sender_id_fkey(id,full_name,avatar_url,role,email), receiver:profiles!messages_receiver_id_fkey(id,full_name,avatar_url,role,email), parent:messages!messages_parent_id_fkey(id,content,sender:profiles!messages_sender_id_fkey(full_name))")
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
        .subscribe(onStatus);
      return { remove: () => supabase.removeChannel(ch) };
    }, setConnStatus);
  }

  const setupPresence = useCallback((other: Profile) => {
    if (presenceChannelRef.current) {
      supabase.removeChannel(presenceChannelRef.current);
      presenceChannelRef.current = null;
    }
    const key = dmChannelKey(profileId, other.id);
    const channel = supabase.channel(`dm-presence:${key}`, { config: { presence: { key: profileId } } });
    channel
      .on("presence", { event: "sync" }, () => {
        const state = channel.presenceState<{ typing: boolean }>();
        const otherState = state[other.id];
        setOtherOnline(!!otherState);
        setOtherTyping(!!otherState?.some((u: any) => u.typing));
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") await channel.track({ typing: false });
      });
    presenceChannelRef.current = channel;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  function handleInputChange(val: string) {
    setInput(val);
    if (presenceChannelRef.current) {
      presenceChannelRef.current.track({ typing: true });
      clearTimeout(typingTimerRef.current);
      typingTimerRef.current = setTimeout(() => {
        presenceChannelRef.current?.track({ typing: false });
      }, 1500);
    }
  }

  async function checkBlockStatus(other: Profile) {
    const { data } = await (supabase.from("blocked_users") as any)
      .select("blocker_id, blocked_id")
      .or(`and(blocker_id.eq.${profileId},blocked_id.eq.${other.id}),and(blocker_id.eq.${other.id},blocked_id.eq.${profileId})`);
    setBlockedByMe((data ?? []).some((r: any) => r.blocker_id === profileId));
    setBlockedMe((data ?? []).some((r: any) => r.blocker_id === other.id));
  }

  async function checkDmRequestStatus(other: Profile, hasHistory: boolean) {
    if (hasHistory) { setDmRequestStatus("accepted"); return; }

    if (userRole === "student" && other.role === "teacher") {
      const { data } = await (supabase.from("dm_requests") as any)
        .select("requester_id, status").eq("requester_id", profileId).eq("recipient_id", other.id).maybeSingle();
      if (!data) setDmRequestStatus("none");
      else if (data.status === "accepted") setDmRequestStatus("accepted");
      else if (data.status === "declined") setDmRequestStatus("declined");
      else setDmRequestStatus("pending_sent");
    } else if (userRole === "teacher" && other.role === "student") {
      const { data } = await (supabase.from("dm_requests") as any)
        .select("status").eq("requester_id", other.id).eq("recipient_id", profileId).maybeSingle();
      setDmRequestStatus(data?.status === "pending" ? "pending_received" : "accepted");
    } else {
      setDmRequestStatus("accepted");
    }
  }

  async function respondToRequest(accept: boolean) {
    if (!selected) return;
    await (supabase.from("dm_requests") as any)
      .update({ status: accept ? "accepted" : "declined", decided_at: new Date().toISOString() })
      .eq("requester_id", selected.id).eq("recipient_id", profileId);
    setDmRequestStatus(accept ? "accepted" : "declined");
  }

  async function checkMuteStatus(other: Profile) {
    const { data } = await (supabase.from("muted_conversations") as any)
      .select("id").eq("user_id", profileId).eq("other_user_id", other.id).maybeSingle();
    setMuted(!!data);
  }

  async function toggleMute() {
    if (!selected) return;
    if (muted) {
      await (supabase.from("muted_conversations") as any).delete().eq("user_id", profileId).eq("other_user_id", selected.id);
      setMuted(false);
    } else {
      await (supabase.from("muted_conversations") as any).insert({ user_id: profileId, other_user_id: selected.id });
      setMuted(true);
    }
  }

  async function openConversation(other: Profile) {
    setSelected(other);
    setShowNewDm(false);
    setOtherTyping(false);
    setOtherOnline(false);
    setIsNearBottom(true);
    setNewMessageCount(0);
    setDmRequestStatus("checking");
    setReplyTo(null);
    setShowSearch(false);
    setSearchQuery("");
    prevMessageCount.current = 0;
    // Fetch the most recent 100 (descending), then reverse to ascending —
    // ordering ascending with a limit returns the oldest 100 messages ever
    // sent instead, hiding all recent activity past 100 messages.
    const { data } = await (supabase.from("messages") as any)
      .select("*, sender:profiles!messages_sender_id_fkey(id,full_name,avatar_url,role,email), receiver:profiles!messages_receiver_id_fkey(id,full_name,avatar_url,role,email), parent:messages!messages_parent_id_fkey(id,content,sender:profiles!messages_sender_id_fkey(full_name))")
      .is("class_id", null)
      .eq("is_deleted", false)
      .or(`and(sender_id.eq.${profileId},receiver_id.eq.${other.id}),and(sender_id.eq.${other.id},receiver_id.eq.${profileId})`)
      .order("created_at", { ascending: false })
      .limit(100);
    if (data) setMessages([...data].reverse());

    await (supabase.from("messages") as any)
      .update({ read_at: new Date().toISOString() })
      .eq("receiver_id", profileId)
      .eq("sender_id", other.id)
      .is("read_at", null);

    setConversations(prev => prev.map(c => c.other.id === other.id ? { ...c, unread: 0 } : c));
    setupPresence(other);
    checkBlockStatus(other);
    checkMuteStatus(other);
    checkDmRequestStatus(other, (data ?? []).length > 0);
  }

  async function sendMessage() {
    if (!input.trim() || !selected || sending || blockedByMe || blockedMe) return;
    if (dmRequestStatus !== "accepted" && dmRequestStatus !== "none") return;

    if (dmRequestStatus === "none") {
      setSending(true);
      const { error } = await (supabase.from("dm_requests") as any).insert({ requester_id: profileId, recipient_id: selected.id });
      setSending(false);
      if (!error) {
        setDmRequestStatus("pending_sent");
        setInput("");
        // Client can't insert a notification row for another user under RLS —
        // this RPC runs SECURITY DEFINER and re-checks the pending request server-side.
        await (supabase.rpc as any)("notify_dm_request", { p_recipient_id: selected.id });
      }
      return;
    }

    setSending(true);
    setSendError(null);
    const text = input;
    const receiverId = selected.id;
    setInput("");
    const parentId = replyTo?.id ?? null;
    setReplyTo(null);

    const ok = await attemptSend(text, receiverId, parentId);
    if (!ok) {
      setPendingMessages(prev => [...prev, {
        tempId: `pending-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        content: text, parentId, receiverId, status: navigator.onLine ? "failed" : "offline",
      }]);
    }
    setSending(false);
  }

  // Sends now go through here so a dropped connection or offline device
  // doesn't just silently lose the message — it's queued locally with a
  // retry button (and auto-retried once "online" fires) instead.
  async function attemptSend(content: string, receiverId: string, parentId: string | null): Promise<boolean> {
    if (!navigator.onLine) return false;
    const { data, error } = await (supabase.from("messages") as any)
      .insert({ sender_id: profileId, receiver_id: receiverId, content, class_id: null, message_type: "text", parent_id: parentId })
      .select("*, sender:profiles!messages_sender_id_fkey(id,full_name,avatar_url,role,email), receiver:profiles!messages_receiver_id_fkey(id,full_name,avatar_url,role,email), parent:messages!messages_parent_id_fkey(id,content,sender:profiles!messages_sender_id_fkey(full_name))")
      .single();

    if (error || !data) {
      setSendError("Message failed to send. Try again.");
      return false;
    }

    if (selected?.id === receiverId) setMessages(prev => [...prev, data]);
    setConversations(prev => {
      const idx = prev.findIndex(c => c.other.id === receiverId);
      if (idx >= 0) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], lastMsg: data };
        return updated;
      }
      return selected ? [{ other: selected, lastMsg: data, unread: 0 }, ...prev] : prev;
    });
    // Client can't insert a notification row for another user under RLS —
    // this RPC runs SECURITY DEFINER and re-checks block/mute status server-side.
    await (supabase.rpc as any)("notify_dm_message", { p_recipient_id: receiverId, p_preview: content.slice(0, 80) });
    return true;
  }

  async function retryPending(tempId: string) {
    const msg = pendingMessagesRef.current.find(p => p.tempId === tempId);
    if (!msg) return;
    setPendingMessages(prev => prev.map(p => p.tempId === tempId ? { ...p, status: "retrying" } : p));
    const ok = await attemptSend(msg.content, msg.receiverId, msg.parentId);
    if (ok) setPendingMessages(prev => prev.filter(p => p.tempId !== tempId));
    else setPendingMessages(prev => prev.map(p => p.tempId === tempId ? { ...p, status: navigator.onLine ? "failed" : "offline" } : p));
  }

  async function retryAllPending() {
    for (const p of pendingMessagesRef.current) {
      const ok = await attemptSend(p.content, p.receiverId, p.parentId);
      if (ok) setPendingMessages(prev => prev.filter(x => x.tempId !== p.tempId));
    }
  }

  function discardPending(tempId: string) {
    setPendingMessages(prev => prev.filter(p => p.tempId !== tempId));
  }

  async function uploadFile(file: File) {
    if (!file || !selected || blockedByMe || blockedMe || dmRequestStatus !== "accepted") return;
    setUploading(true);
    const ext = file.name.split(".").pop();
    const path = `dm/${dmChannelKey(profileId, selected.id)}/${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("chat-attachments").upload(path, file);
    if (uploadErr) {
      setSendError("Upload failed. Try again.");
      setUploading(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from("chat-attachments").getPublicUrl(path);
    const type = file.type.startsWith("image/") ? "image" : "file";
    const { data, error } = await (supabase.from("messages") as any)
      .insert({
        sender_id: profileId, receiver_id: selected.id, class_id: null,
        content: file.name, message_type: type, file_url: publicUrl, attachment_name: file.name,
        parent_id: replyTo?.id ?? null,
      })
      .select("*, sender:profiles!messages_sender_id_fkey(id,full_name,avatar_url,role,email), receiver:profiles!messages_receiver_id_fkey(id,full_name,avatar_url,role,email), parent:messages!messages_parent_id_fkey(id,content,sender:profiles!messages_sender_id_fkey(full_name))")
      .single();
    if (!error && data) {
      setReplyTo(null);
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
    }
    setUploading(false);
  }

  async function startRecording() {
    if (!selected || blockedByMe || blockedMe || dmRequestStatus !== "accepted" || recording) return;
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
    if (!selected) return;
    setUploading(true);
    try {
      const filename = `voice-${Date.now()}.webm`;
      // Reuses the "voice-note" R2 category (folder keyed by `classId`) with
      // the sorted DM pair key standing in for a class id — same category,
      // just a different kind of conversation identifier.
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category: "voice-note", filename, contentType: "audio/webm", fileSize: blob.size, ids: { classId: dmChannelKey(profileId, selected.id) } }),
      });
      if (!presignRes.ok) throw new Error("presign failed");
      const { uploadUrl, fileUrl } = await presignRes.json();

      const putRes = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": "audio/webm" }, body: blob });
      if (!putRes.ok) throw new Error("upload failed");

      const mins = Math.floor(seconds / 60), secs = seconds % 60;
      const { data, error } = await (supabase.from("messages") as any)
        .insert({
          sender_id: profileId, receiver_id: selected.id, class_id: null,
          content: `${mins}:${secs.toString().padStart(2, "0")}`, message_type: "voice",
          file_url: fileUrl, attachment_name: "voice-note.webm", parent_id: replyTo?.id ?? null,
        })
        .select("*, sender:profiles!messages_sender_id_fkey(id,full_name,avatar_url,role,email), receiver:profiles!messages_receiver_id_fkey(id,full_name,avatar_url,role,email), parent:messages!messages_parent_id_fkey(id,content,sender:profiles!messages_sender_id_fkey(full_name))")
        .single();
      if (!error && data) {
        setReplyTo(null);
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
        await (supabase.rpc as any)("notify_dm_message", { p_recipient_id: selected.id, p_preview: "🎤 Voice message" });
      }
    } catch {
      // best-effort, matches uploadFile's existing lack of error UI
    }
    setUploading(false);
  }

  async function deleteMessage(id: string) {
    await (supabase.from("messages") as any).update({ is_deleted: true }).eq("id", id);
    setMessages(prev => prev.filter(m => m.id !== id));
  }

  async function toggleBlock() {
    if (!selected) return;
    if (blockedByMe) {
      await (supabase.from("blocked_users") as any).delete().eq("blocker_id", profileId).eq("blocked_id", selected.id);
      setBlockedByMe(false);
    } else {
      await (supabase.from("blocked_users") as any).insert({ blocker_id: profileId, blocked_id: selected.id });
      setBlockedByMe(true);
    }
    setShowBlockConfirm(false);
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
                  {conv.lastMsg.sender_id === profileId ? "You: " : ""}{conv.lastMsg.message_type === "text" ? conv.lastMsg.content : conv.lastMsg.message_type === "voice" ? "🎤 Voice message" : `📎 ${conv.lastMsg.attachment_name ?? "Attachment"}`}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );

  const isBlocked = blockedByMe || blockedMe;

  const ChatPanel = selected ? (
    <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "10px 16px", borderBottom: `1px solid ${S.border}`, display: "flex", alignItems: "center", gap: 10, background: S.card, flexShrink: 0 }}>
        {isMobile && (
          <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: S.muted, cursor: "pointer", fontSize: 18 }}>←</button>
        )}
        <div style={{ position: "relative" }}>
          <Avatar name={selected.full_name} url={selected.avatar_url} size={34} />
          <span style={{ position: "absolute", bottom: -1, right: -1, width: 10, height: 10, borderRadius: "50%", background: otherOnline ? "#00E5A3" : "#4A5170", border: `2px solid ${S.card}` }} />
        </div>
        <div style={{ flex: 1 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: S.text, margin: 0 }}>{selected.full_name}</p>
          <p style={{ fontSize: 11, color: !isOnline ? "#FF6B6B" : connStatus !== "connected" ? "#F5A623" : otherTyping ? S.accent : S.dim, textTransform: otherTyping ? "none" : "capitalize", margin: 0 }}>
            {!isOnline ? "Offline — messages will send when reconnected" : connStatus !== "connected" ? (connStatus === "connecting" ? "Connecting…" : "Reconnecting…") : otherTyping ? "typing…" : otherOnline ? "Online" : selected.role.replace("_", " ")}
          </p>
        </div>
        <button onClick={() => setShowSearch(!showSearch)} style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${S.border}`, background: showSearch ? `${S.accent}20` : "transparent", color: showSearch ? S.accent : S.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" /></svg>
        </button>
        <button onClick={() => setShowStarred(!showStarred)} title="Starred messages" style={{ width: 32, height: 32, borderRadius: 8, border: `1px solid ${S.border}`, background: showStarred ? "rgba(245,166,35,0.15)" : "transparent", color: showStarred ? "#F5A623" : S.muted, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 14 }}>
          ★
        </button>
        <button onClick={toggleMute} title={muted ? "Unmute notifications" : "Mute notifications"} style={{ background: "none", border: `1px solid ${S.border}`, borderRadius: 8, color: muted ? "#F5A623" : S.muted, cursor: "pointer", fontSize: 13, padding: "6px 8px", display: "flex", alignItems: "center" }}>
          {muted ? "🔕" : "🔔"}
        </button>
        <button onClick={() => setShowBlockConfirm(true)} style={{ background: "none", border: `1px solid ${S.border}`, borderRadius: 8, color: blockedByMe ? "#00E5A3" : S.muted, cursor: "pointer", fontSize: 11, padding: "6px 10px" }}>
          {blockedByMe ? "Unblock" : "Block"}
        </button>
      </div>

      {/* Search bar */}
      {showSearch && (
        <div style={{ padding: "8px 16px", borderBottom: `1px solid ${S.border}`, background: S.card, flexShrink: 0 }}>
          <input
            autoFocus
            placeholder="Search messages..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`, borderRadius: 8, padding: "7px 12px", fontSize: 13, color: S.text, outline: "none" }}
          />
        </div>
      )}

      {/* Messages */}
      <div style={{ flex: 1, position: "relative", minHeight: 0 }}>
      <div ref={messagesContainerRef} onScroll={handleScroll} style={{ height: "100%", overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: 6 }}>
        {(() => {
          const displayed = showSearch && searchQuery
            ? messages.filter(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
            : messages;
          return displayed.length === 0 ? (
            <p style={{ textAlign: "center", fontSize: 13, color: S.dim, marginTop: 40 }}>
              {showSearch && searchQuery ? "No messages match your search" : "Start the conversation"}
            </p>
          ) : displayed.map(m => {
          const isOwn = m.sender_id === profileId;
          return (
            <div key={m.id} className="dm-msg-row" style={{ display: "flex", flexDirection: isOwn ? "row-reverse" : "row", gap: 8, alignItems: "flex-end" }}>
              {!isOwn && <Avatar name={m.sender.full_name} url={m.sender.avatar_url} size={26} />}
              <div style={{ maxWidth: "65%", display: "flex", flexDirection: "column", alignItems: isOwn ? "flex-end" : "flex-start" }}>
                {m.parent && (
                  <div style={{ background: isOwn ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.05)", borderLeft: `2px solid ${S.accent}`, borderRadius: "6px 6px 0 0", padding: "5px 10px", fontSize: 11, color: S.muted, maxWidth: "100%" }}>
                    <span style={{ color: S.accent, fontWeight: 600 }}>{m.parent.sender?.full_name} </span>
                    <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", maxWidth: "100%" }}>{m.parent.content}</span>
                  </div>
                )}
                <div style={{ position: "relative", display: "flex", alignItems: "center", gap: 6, flexDirection: isOwn ? "row-reverse" : "row" }} className="dm-msg-bubble-wrap">
                  <div style={{ background: isOwn ? "linear-gradient(135deg,#1E3A6E,#1A3060)" : "rgba(255,255,255,0.05)", border: `1px solid ${isOwn ? "rgba(77,127,255,0.3)" : S.border}`, borderRadius: isOwn ? (m.parent ? "12px 4px 12px 12px" : "12px 4px 12px 12px") : (m.parent ? "4px 12px 12px 12px" : "4px 12px 12px 12px"), padding: "8px 12px" }}>
                    {m.message_type === "image" && m.file_url && (
                      <img src={m.file_url} alt={m.attachment_name ?? "image"} style={{ maxWidth: 220, borderRadius: 8, display: "block", marginBottom: 4 }} />
                    )}
                    {m.message_type === "file" && m.file_url && (
                      <a href={m.file_url} target="_blank" rel="noreferrer" style={{ display: "flex", gap: 8, alignItems: "center", color: S.accent, textDecoration: "none", fontSize: 13, marginBottom: 4 }}>
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                        {m.attachment_name}
                      </a>
                    )}
                    {m.message_type === "voice" && m.file_url && (
                      <div style={{ marginBottom: 4 }}>
                        <audio controls src={m.file_url} style={{ height: 32, maxWidth: 220 }} />
                      </div>
                    )}
                    {m.message_type === "text" && <p style={{ fontSize: 13, color: S.text, lineHeight: 1.5, margin: 0, wordBreak: "break-word" }}>{m.content}</p>}
                  </div>
                  <div className="dm-msg-actions" style={{ display: "none", gap: 4 }}>
                    <button onClick={() => setReplyTo(m)} title="Reply" style={{ background: "none", border: "none", cursor: "pointer", color: S.muted, fontSize: 13, padding: 2 }}>↩</button>
                    <button onClick={() => toggleStar(m.id)} title={starredIds.has(m.id) ? "Unstar" : "Star"} style={{ background: "none", border: "none", cursor: "pointer", color: starredIds.has(m.id) ? "#F5A623" : S.muted, fontSize: 13, padding: 2 }}>{starredIds.has(m.id) ? "★" : "☆"}</button>
                    {isOwn && <button onClick={() => deleteMessage(m.id)} title="Delete" style={{ background: "none", border: "none", cursor: "pointer", color: "#FF6B6B", fontSize: 13, padding: 2 }}>✕</button>}
                  </div>
                </div>
                <p style={{ fontSize: 10, color: S.dim, marginTop: 2, textAlign: isOwn ? "right" : "left" }}>
                  {fmt(m.created_at)}{isOwn && m.read_at && " ✓✓"}{starredIds.has(m.id) && " ★"}
                </p>
              </div>
            </div>
          );
        });
        })()}

        {/* Queued/failed sends for this conversation */}
        {pendingMessages.filter(p => p.receiverId === selected.id).map(p => (
          <div key={p.tempId} style={{ display: "flex", flexDirection: "row-reverse", gap: 8 }}>
            <div style={{ maxWidth: "65%" }}>
              <div style={{ background: "rgba(255,107,107,0.08)", border: "1px solid rgba(255,107,107,0.3)", borderRadius: "12px 4px 12px 12px", padding: "8px 12px" }}>
                <p style={{ fontSize: 13, color: S.text, lineHeight: 1.5, margin: 0, wordBreak: "break-word" }}>{p.content}</p>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 2 }}>
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

        {otherTyping && (
          <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "4px 0" }}>
            <div style={{ display: "flex", gap: 4 }}>
              {[0, 1, 2].map(i => (
                <div key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: S.dim, animation: `dm-bounce 1.2s ${i * 0.2}s infinite` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {!isNearBottom && (
        <button
          onClick={() => scrollToBottom()}
          style={{ position: "absolute", bottom: 16, left: "50%", transform: "translateX(-50%)", padding: "7px 16px", borderRadius: 20, background: S.accent, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 16px rgba(0,0,0,0.4)", zIndex: 10 }}
        >
          {newMessageCount > 0 ? `${newMessageCount} new message${newMessageCount > 1 ? "s" : ""}` : "Jump to latest"} ↓
        </button>
      )}
      </div>
      {/* Input */}
      {sendError && (
        <p style={{ margin: "0 14px", fontSize: 12, color: "#FF6B6B" }}>{sendError}</p>
      )}
      {isBlocked && (
        <p style={{ margin: "0 14px 8px", fontSize: 12, color: "#FF9A3C", textAlign: "center" }}>
          {blockedByMe ? "You have blocked this user." : "You cannot message this user."}
        </p>
      )}
      {dmRequestStatus === "pending_sent" && (
        <p style={{ margin: "0 14px 8px", fontSize: 12, color: "#F5A623", textAlign: "center" }}>
          Message request sent — waiting for {selected.full_name.split(" ")[0]} to accept.
        </p>
      )}
      {dmRequestStatus === "declined" && (
        <p style={{ margin: "0 14px 8px", fontSize: 12, color: "#FF6B6B", textAlign: "center" }}>
          This request was declined. You can&apos;t message {selected.full_name.split(" ")[0]} right now.
        </p>
      )}
      {dmRequestStatus === "pending_received" && (
        <div style={{ margin: "0 14px 10px", padding: "10px 14px", background: "rgba(77,127,255,0.06)", border: `1px solid ${S.accent}30`, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10 }}>
          <span style={{ fontSize: 12, color: S.text }}>{selected.full_name} wants to message you</span>
          <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
            <button onClick={() => respondToRequest(true)} style={{ padding: "5px 12px", borderRadius: 7, background: "#00E5A3", border: "none", color: "#0E1117", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Accept</button>
            <button onClick={() => respondToRequest(false)} style={{ padding: "5px 12px", borderRadius: 7, background: "rgba(255,107,107,0.1)", border: "1px solid rgba(255,107,107,0.3)", color: "#FF6B6B", fontSize: 11, fontWeight: 600, cursor: "pointer" }}>Decline</button>
          </div>
        </div>
      )}
      <div style={{ padding: "10px 14px", borderTop: `1px solid ${S.border}`, background: S.card, flexShrink: 0 }}>
        {replyTo && (
          <div style={{ background: "rgba(255,255,255,0.04)", borderLeft: `2px solid ${S.accent}`, borderRadius: 6, padding: "5px 10px", marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <span style={{ fontSize: 11, color: S.accent, fontWeight: 600 }}>Replying to {replyTo.sender_id === profileId ? "yourself" : replyTo.sender.full_name}</span>
              <p style={{ fontSize: 11, color: S.muted, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 250 }}>{replyTo.content}</p>
            </div>
            <button onClick={() => setReplyTo(null)} style={{ background: "none", border: "none", color: S.dim, cursor: "pointer", fontSize: 14 }}>✕</button>
          </div>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*,.pdf,.doc,.docx,.txt" onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0]); e.target.value = ""; }} />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={isBlocked || uploading || dmRequestStatus !== "accepted"}
            style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${S.border}`, background: "rgba(255,255,255,0.04)", color: uploading ? S.accent : S.muted, cursor: (isBlocked || dmRequestStatus !== "accepted") ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >
            {uploading ? <span style={{ fontSize: 11 }}>…</span> : <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>}
          </button>
          <button
            onMouseDown={startRecording}
            onMouseUp={() => stopRecording(false)}
            onMouseLeave={() => { if (recording) stopRecording(true); }}
            onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
            onTouchEnd={(e) => { e.preventDefault(); stopRecording(false); }}
            disabled={isBlocked || uploading || dmRequestStatus !== "accepted"}
            title="Hold to record a voice note"
            style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${recording ? "#FF6B6B" : S.border}`, background: recording ? "rgba(255,107,107,0.15)" : "rgba(255,255,255,0.04)", color: recording ? "#FF6B6B" : S.muted, cursor: (isBlocked || dmRequestStatus !== "accepted") ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, position: "relative" }}
          >
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" /></svg>
            {recording && <span style={{ position: "absolute", bottom: -16, fontSize: 9, color: "#FF6B6B", whiteSpace: "nowrap" }}>{recordSeconds}s</span>}
          </button>
          <input
            ref={messageInputRef}
            value={input}
            onChange={e => handleInputChange(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
            placeholder={isBlocked ? "Messaging unavailable" : recording ? "Recording…" : dmRequestStatus === "checking" ? "…" : dmRequestStatus === "none" ? `Send a message request to ${selected.full_name.split(" ")[0]}…` : dmRequestStatus !== "accepted" ? "Messaging unavailable" : `Message ${selected.full_name.split(" ")[0]}…`}
            disabled={isBlocked || recording || (dmRequestStatus !== "accepted" && dmRequestStatus !== "none")}
            style={{ flex: 1, background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`, borderRadius: 10, padding: "9px 14px", fontSize: 13, color: S.text, outline: "none" }}
          />
          <button onClick={sendMessage} disabled={!input.trim() || sending || isBlocked || (dmRequestStatus !== "accepted" && dmRequestStatus !== "none")}
            style={{ width: 36, height: 36, borderRadius: 10, background: (!input.trim() || isBlocked) ? "rgba(77,127,255,0.2)" : S.accent, border: "none", color: "#fff", cursor: isBlocked ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
          </button>
        </div>
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

  const BlockConfirm = showBlockConfirm && selected && (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div style={{ background: "#0E1117", border: `1px solid ${S.border}`, borderRadius: 14, padding: 24, width: 300 }}>
        <p style={{ fontSize: 14, color: S.text, marginBottom: 16 }}>
          {blockedByMe ? `Unblock ${selected.full_name}? They will be able to message you again.` : `Block ${selected.full_name} from messaging you?`}
        </p>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={toggleBlock} style={{ flex: 1, padding: "8px", borderRadius: 8, background: blockedByMe ? "#00E5A3" : "#FF6B6B", border: "none", color: "#0E1117", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            {blockedByMe ? "Unblock" : "Block"}
          </button>
          <button onClick={() => setShowBlockConfirm(false)} style={{ flex: 1, padding: "8px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: `1px solid ${S.border}`, color: S.text, cursor: "pointer", fontSize: 13 }}>Cancel</button>
        </div>
      </div>
    </div>
  );

  const StarredPanel = showStarred && (
    <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 50 }}>
      <div style={{ background: "#0E1117", border: `1px solid ${S.border}`, borderRadius: 14, padding: 20, width: 340, maxHeight: 440, display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
          <span style={{ fontSize: 14, fontWeight: 600, color: S.text }}>★ Starred Messages</span>
          <button onClick={() => setShowStarred(false)} style={{ background: "none", border: "none", color: S.dim, cursor: "pointer", fontSize: 16 }}>✕</button>
        </div>
        <div style={{ overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {(() => {
            const starred = messages.filter(m => starredIds.has(m.id));
            return starred.length === 0 ? (
              <p style={{ fontSize: 12, color: S.dim, textAlign: "center", padding: "12px 0" }}>No starred messages in this conversation</p>
            ) : starred.map(m => (
              <div key={m.id} style={{ padding: "8px 10px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: `1px solid ${S.border}` }}>
                <p style={{ fontSize: 11, color: "#F5A623", margin: "0 0 3px", fontWeight: 600 }}>{m.sender_id === profileId ? "You" : m.sender.full_name}</p>
                <p style={{ fontSize: 12, color: S.text, margin: 0, wordBreak: "break-word" }}>{m.content}</p>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );

  return (
    <div style={{ display: "flex", height: "calc(100vh - 80px)", background: S.bg, borderRadius: 16, border: `1px solid ${S.border}`, overflow: "hidden", position: "relative" }}>
      {ConversationList}
      {ChatPanel}
      {NewDmPanel}
      {BlockConfirm}
      {StarredPanel}
      <style>{`
        @keyframes dm-bounce { 0%,80%,100% { transform: translateY(0); } 40% { transform: translateY(-4px); } }
        .dm-msg-row:hover .dm-msg-actions { display: flex !important; }
      `}</style>
    </div>
  );
}
