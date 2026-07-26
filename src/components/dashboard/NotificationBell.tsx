"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/database";
import { createReconnectingSubscription } from "@/lib/supabase/reconnect";

const ROLE_PATH: Record<UserRole, string> = {
  student: "/student/dashboard/notifications",
  teacher: "/teacher/dashboard/notifications",
  parent: "/parent/dashboard/notifications",
  school_admin: "/school/dashboard/notifications",
  super_admin: "/admin/dashboard/notifications",
};

// Tapping the bell navigates straight to the dedicated notifications page
// (like Facebook's "See all") rather than opening a dropdown — a dropdown
// here previously ran off the left edge of the screen on narrower
// viewports since it was anchored to this button's own 36px wrapper
// instead of the viewport.
export function NotificationBell({ profileId, role }: { profileId: string; role: UserRole }) {
  const [unread, setUnread] = useState(0);
  const supabase = createClient();
  const router = useRouter();

  useEffect(() => {
    supabase
      .from("notifications")
      .select("id", { count: "exact", head: true })
      .eq("user_id", profileId)
      .eq("read", false)
      .then(({ count }) => setUnread(count ?? 0));

    // Recreated with backoff on CHANNEL_ERROR/TIMED_OUT/CLOSED instead of
    // silently going stale on a dropped connection.
    const stop = createReconnectingSubscription((onStatus) => {
      const channel = supabase
        .channel(`notifs:${profileId}`)
        .on("postgres_changes", {
          event: "INSERT", schema: "public", table: "notifications",
          filter: `user_id=eq.${profileId}`,
        }, () => {
          setUnread((n) => n + 1);
        })
        .subscribe(onStatus);
      return { remove: () => supabase.removeChannel(channel) };
    }, () => {});

    return () => stop();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profileId]);

  return (
    <button
      onClick={() => router.push(ROLE_PATH[role])}
      className="relative w-9 h-9 rounded flex items-center justify-center border border-edu-slate-300 text-edu-slate-600 hover:bg-edu-slate-100 transition-colors duration-150"
    >
      <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
      </svg>
      {unread > 0 && (
        <span
          className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-white font-bold bg-edu-copper"
          style={{ fontSize: 9, border: "2px solid #F2EEE3" }}
        >
          {unread > 9 ? "9+" : unread}
        </span>
      )}
    </button>
  );
}
