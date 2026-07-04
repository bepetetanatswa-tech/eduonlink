"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/types/database";
import { createReconnectingSubscription } from "@/lib/supabase/reconnect";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Notification message notifications embed the sender's profile id as
// ?with=<id> in their link (see notify_dm_message / notify_class_message,
// migration 026) — there's no separate sender_id column on notifications.
function parseWithId(link?: string | null): string | null {
  if (!link) return null;
  const q = link.split("?")[1];
  if (!q) return null;
  return new URLSearchParams(q).get("with");
}

const TYPE_COLOR: Record<string, string> = {
  info: "#4D7FFF", warning: "#F5A623", success: "#00E5A3",
  assignment: "#BD93F9", grade: "#FF9A3C", announcement: "#4D7FFF",
  message: "#00E5A3", payment: "#4D7FFF",
};

const TYPE_LABELS: Record<string, string> = {
  info: "General", success: "Success", warning: "Warnings",
  assignment: "Assignments", grade: "Grades", message: "Messages",
  announcement: "Announcements", payment: "Payments",
};

const TABS = ["All", "Unread", "Messages", "Academic", "Payments"] as const;
type Tab = typeof TABS[number];

function matchesTab(n: Notification, tab: Tab): boolean {
  if (tab === "All") return true;
  if (tab === "Unread") return !n.read;
  if (tab === "Messages") return n.type === "message";
  if (tab === "Academic") return n.type === "assignment" || n.type === "grade" || n.type === "announcement";
  if (tab === "Payments") return n.type === "payment";
  return true;
}

const S = { bg: "#07080C", card: "#0E1117", border: "rgba(255,255,255,0.07)", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170", accent: "#4D7FFF" };

export function NotificationsPage({ profileId }: { profileId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("All");
  const [showPrefs, setShowPrefs] = useState(false);
  const [disabledTypes, setDisabledTypes] = useState<Set<string>>(new Set());
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replySending, setReplySending] = useState<Record<string, boolean>>({});
  const [replySent, setReplySent] = useState<Record<string, boolean>>({});
  const supabase = createClient();
  const router = useRouter();

  const load = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profileId)
      .order("created_at", { ascending: false })
      .limit(200);
    setNotifications(data ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();

    const stop = createReconnectingSubscription((onStatus) => {
      const channel = supabase
        .channel(`notifs-page:${profileId}`)
        .on("postgres_changes", {
          event: "INSERT", schema: "public", table: "notifications",
          filter: `user_id=eq.${profileId}`,
        }, (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
        })
        .subscribe(onStatus);
      return { remove: () => supabase.removeChannel(channel) };
    }, () => {});

    return () => stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  const loadPrefs = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase.from("disabled_push_types") as any).select("type").eq("user_id", profileId);
    setDisabledTypes(new Set((data ?? []).map((r: { type: string }) => r.type)));
  };

  const togglePrefType = async (type: string) => {
    const isDisabled = disabledTypes.has(type);
    if (isDisabled) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("disabled_push_types") as any).delete().eq("user_id", profileId).eq("type", type);
      setDisabledTypes((prev) => { const next = new Set(prev); next.delete(type); return next; });
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("disabled_push_types") as any).insert({ user_id: profileId, type });
      setDisabledTypes((prev) => new Set(prev).add(type));
    }
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    const ids = notifications.filter((n) => !n.read).map((n) => n.id);
    if (!ids.length) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("notifications") as any).update({ read: true }).in("id", ids);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const clearAll = async () => {
    if (!confirm("Delete all notifications? This can't be undone.")) return;
    const ids = notifications.map((n) => n.id);
    if (!ids.length) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("notifications") as any).delete().in("id", ids);
    setNotifications([]);
  };

  const deleteOne = async (id: string) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("notifications") as any).delete().eq("id", id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markRead = async (n: Notification) => {
    if (n.read) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("notifications") as any).update({ read: true }).eq("id", n.id);
    setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
  };

  const handleOpen = async (n: Notification) => {
    await markRead(n);
    if (n.link) router.push(n.link);
  };

  const sendReply = async (n: Notification) => {
    const recipientId = parseWithId(n.link);
    const text = (replyDrafts[n.id] ?? "").trim();
    if (!recipientId || !text) return;

    setReplySending((prev) => ({ ...prev, [n.id]: true }));

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: blocked } = await (supabase.from("blocked_users") as any)
      .select("id")
      .or(`and(blocker_id.eq.${profileId},blocked_id.eq.${recipientId}),and(blocker_id.eq.${recipientId},blocked_id.eq.${profileId})`)
      .maybeSingle();

    if (blocked) {
      setReplySending((prev) => ({ ...prev, [n.id]: false }));
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase.from("messages") as any)
      .insert({ sender_id: profileId, receiver_id: recipientId, content: text, class_id: null, message_type: "text" });

    if (!error) {
      // Client can't insert a notification row for another user under RLS —
      // this RPC (migration 026) runs SECURITY DEFINER and re-checks
      // block/mute status server-side.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await supabase.rpc("notify_dm_message", { p_recipient_id: recipientId, p_preview: text.slice(0, 80) } as any);
      setReplyDrafts((prev) => ({ ...prev, [n.id]: "" }));
      setReplySent((prev) => ({ ...prev, [n.id]: true }));
      setTimeout(() => setReplySent((prev) => ({ ...prev, [n.id]: false })), 3000);
      await markRead(n);
    }
    setReplySending((prev) => ({ ...prev, [n.id]: false }));
  };

  const filtered = notifications.filter((n) => matchesTab(n, tab));

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexWrap: "wrap", gap: 10 }}>
        <h1 style={{ fontSize: 20, fontWeight: 700, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>Notifications</h1>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          {unreadCount > 0 && (
            <button onClick={markAllRead} style={{ fontSize: 12, color: S.accent, background: "none", border: "none", cursor: "pointer" }}>Mark all read</button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAll} style={{ fontSize: 12, color: "#FF6B6B", background: "none", border: "none", cursor: "pointer" }}>Clear all</button>
          )}
          <button
            onClick={() => { if (!showPrefs) loadPrefs(); setShowPrefs((p) => !p); }}
            title="Notification preferences"
            style={{ fontSize: 15, color: showPrefs ? S.accent : S.muted, background: "none", border: "none", cursor: "pointer" }}
          >
            ⚙
          </button>
        </div>
      </div>

      {showPrefs && (
        <div style={{ background: S.card, border: `1px solid ${S.border}`, borderRadius: 14, padding: "14px 16px", marginBottom: 16 }}>
          <p style={{ fontSize: 12, color: S.dim, margin: "0 0 12px" }}>Turn off push notifications for specific types. In-app notifications are unaffected.</p>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {Object.entries(TYPE_LABELS).filter(([type]) => type !== "success").map(([type, label]) => {
              const enabled = !disabledTypes.has(type);
              return (
                <div key={type} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span style={{ fontSize: 13, color: S.text }}>{label}</span>
                  <button
                    onClick={() => togglePrefType(type)}
                    style={{ width: 34, height: 18, borderRadius: 10, background: enabled ? "rgba(0,229,163,0.2)" : "rgba(255,255,255,0.06)", border: `1px solid ${enabled ? "#00E5A3" : "rgba(255,255,255,0.1)"}`, cursor: "pointer", position: "relative", flexShrink: 0 }}
                  >
                    <div style={{ position: "absolute", top: 1, left: enabled ? 17 : 1, width: 14, height: 14, borderRadius: "50%", background: enabled ? "#00E5A3" : "#6B7290", transition: "left 0.15s" }} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div style={{ display: "flex", gap: 6, marginBottom: 14, overflowX: "auto" }}>
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: "6px 14px", borderRadius: 20, fontSize: 12, fontWeight: 600, whiteSpace: "nowrap",
              background: tab === t ? S.accent : "rgba(255,255,255,0.04)",
              color: tab === t ? "#fff" : S.muted,
              border: `1px solid ${tab === t ? S.accent : S.border}`,
              cursor: "pointer",
            }}
          >
            {t}{t === "Unread" && unreadCount > 0 ? ` (${unreadCount})` : ""}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ textAlign: "center", color: S.dim, fontSize: 13, padding: 40 }}>Loading…</p>
      ) : filtered.length === 0 ? (
        <p style={{ textAlign: "center", color: S.dim, fontSize: 13, padding: 40 }}>No notifications here</p>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {filtered.map((n) => {
            const isMessage = n.type === "message" && !!parseWithId(n.link);
            return (
              <div key={n.id} style={{
                background: S.card, border: `1px solid ${S.border}`, borderRadius: 12,
                padding: "12px 14px", borderLeft: `3px solid ${n.read ? S.border : TYPE_COLOR[n.type] ?? S.accent}`,
              }}>
                <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                  <div
                    onClick={() => handleOpen(n)}
                    style={{ flex: 1, cursor: n.link ? "pointer" : "default" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <p style={{ fontSize: 13, fontWeight: 600, color: S.text, margin: 0 }}>{n.title}</p>
                      {!n.read && <span style={{ width: 6, height: 6, borderRadius: "50%", background: S.accent, flexShrink: 0 }} />}
                    </div>
                    <p style={{ fontSize: 12, color: S.muted, marginTop: 3, lineHeight: 1.5 }}>{n.message}</p>
                    <p style={{ fontSize: 11, color: S.dim, marginTop: 5 }}>{timeAgo(n.created_at)}</p>
                  </div>
                  <button
                    onClick={() => deleteOne(n.id)}
                    title="Delete"
                    style={{ background: "none", border: "none", color: S.dim, cursor: "pointer", fontSize: 14, flexShrink: 0, padding: 2 }}
                  >
                    ✕
                  </button>
                </div>

                {isMessage && (
                  <div style={{ display: "flex", gap: 8, marginTop: 10 }} onClick={(e) => e.stopPropagation()}>
                    <input
                      value={replyDrafts[n.id] ?? ""}
                      onChange={(e) => setReplyDrafts((prev) => ({ ...prev, [n.id]: e.target.value }))}
                      onKeyDown={(e) => { if (e.key === "Enter") sendReply(n); }}
                      placeholder={replySent[n.id] ? "Sent ✓" : "Reply…"}
                      disabled={!!replySending[n.id]}
                      style={{
                        flex: 1, padding: "7px 10px", background: "rgba(255,255,255,0.04)",
                        border: `1px solid ${S.border}`, borderRadius: 8, color: S.text, fontSize: 12, outline: "none",
                      }}
                    />
                    <button
                      onClick={() => sendReply(n)}
                      disabled={!!replySending[n.id] || !(replyDrafts[n.id] ?? "").trim()}
                      style={{
                        padding: "7px 14px", borderRadius: 8, border: "none", cursor: "pointer",
                        background: S.accent, color: "#fff", fontSize: 12, fontWeight: 600,
                        opacity: !(replyDrafts[n.id] ?? "").trim() ? 0.5 : 1,
                      }}
                    >
                      Send
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
