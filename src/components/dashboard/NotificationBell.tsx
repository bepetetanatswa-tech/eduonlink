"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Notification } from "@/types/database";

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const TYPE_COLOR: Record<string, string> = {
  info: "#4D7FFF", warning: "#F5A623", success: "#00E5A3",
  assignment: "#BD93F9", grade: "#FF9A3C", announcement: "#4D7FFF",
};

const TYPE_LABELS: Record<string, string> = {
  info: "General", success: "Success", warning: "Warnings",
  assignment: "Assignments", grade: "Grades", message: "Messages", announcement: "Announcements",
};

export function NotificationBell({ profileId }: { profileId: string }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [showPrefs, setShowPrefs] = useState(false);
  const [disabledTypes, setDisabledTypes] = useState<Set<string>>(new Set());
  const supabase = createClient();
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

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

  useEffect(() => {
    supabase
      .from("notifications")
      .select("*")
      .eq("user_id", profileId)
      .order("created_at", { ascending: false })
      .limit(15)
      .then(({ data }) => setNotifications(data ?? []));

    const channel = supabase
      .channel(`notifs:${profileId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "notifications",
        filter: `user_id=eq.${profileId}`,
      }, (payload) => {
        setNotifications((prev) => [payload.new as Notification, ...prev].slice(0, 15));
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const unread = notifications.filter((n) => !n.read).length;

  const markAllRead = async () => {
    const ids = notifications.filter((n) => !n.read).map((n) => n.id);
    if (!ids.length) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("notifications") as any).update({ read: true }).in("id", ids);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = async (n: Notification) => {
    if (!n.read) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("notifications") as any).update({ read: true }).eq("id", n.id);
      setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x));
    }
    setOpen(false);
    if (n.link) router.push(n.link);
  };

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: "relative", width: 36, height: 36, borderRadius: "10px",
          background: open ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.08)",
          display: "flex", alignItems: "center", justifyContent: "center",
          cursor: "pointer", color: "#8892B0", transition: "all 0.15s",
        }}
        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)"; }}
        onMouseLeave={(e) => { if (!open) (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.03)"; }}
      >
        <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {unread > 0 && (
          <span style={{
            position: "absolute", top: -4, right: -4,
            width: 16, height: 16, borderRadius: "50%",
            background: "#4D7FFF", color: "#fff",
            fontSize: "9px", fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
            border: "2px solid #07080C",
          }}>
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          width: 320, maxHeight: 420, overflowY: "auto",
          background: "#0E1117", border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "14px", boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          zIndex: 100,
        }}>
          <div style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            padding: "14px 16px 10px", borderBottom: "1px solid rgba(255,255,255,0.06)",
          }}>
            <span style={{ fontSize: "13px", fontWeight: 600, color: "#CDD6F4" }}>Notifications</span>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              {unread > 0 && !showPrefs && (
                <button onClick={markAllRead} style={{ fontSize: "11px", color: "#4D7FFF", cursor: "pointer", background: "none", border: "none" }}>
                  Mark all read
                </button>
              )}
              <button
                onClick={() => { if (!showPrefs) loadPrefs(); setShowPrefs((p) => !p); }}
                title="Notification preferences"
                style={{ fontSize: "13px", color: showPrefs ? "#4D7FFF" : "#6B7290", cursor: "pointer", background: "none", border: "none" }}
              >
                ⚙
              </button>
            </div>
          </div>

          {showPrefs ? (
            <div style={{ padding: "12px 16px" }}>
              <p style={{ fontSize: "11px", color: "#4A5170", margin: "0 0 10px" }}>Turn off push notifications for specific types. In-app notifications are unaffected.</p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {Object.entries(TYPE_LABELS).map(([type, label]) => {
                  const enabled = !disabledTypes.has(type);
                  return (
                    <div key={type} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "12px", color: "#CDD6F4" }}>{label}</span>
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
          ) : notifications.length === 0 ? (
            <p style={{ padding: "24px", textAlign: "center", fontSize: "13px", color: "#4A5170" }}>
              No notifications yet
            </p>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => handleNotificationClick(n)}
                style={{
                  padding: "12px 16px",
                  borderBottom: "1px solid rgba(255,255,255,0.04)",
                  background: n.read ? "transparent" : "rgba(77,127,255,0.04)",
                  cursor: n.link ? "pointer" : "default",
                  transition: "background 0.15s",
                }}
                onMouseEnter={(e) => { if (n.link) (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.05)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.background = n.read ? "transparent" : "rgba(77,127,255,0.04)"; }}
              >
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%", flexShrink: 0, marginTop: 5,
                    background: n.read ? "rgba(255,255,255,0.15)" : TYPE_COLOR[n.type] ?? "#4D7FFF",
                  }} />
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: "12px", fontWeight: 600, color: "#CDD6F4", marginBottom: 2 }}>{n.title}</p>
                    <p style={{ fontSize: "11px", color: "#6B7290", lineHeight: 1.4 }}>{n.message}</p>
                    <p style={{ fontSize: "10px", color: "#4A5170", marginTop: 4 }}>{timeAgo(n.created_at)}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
