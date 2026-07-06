"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { DirectMessages } from "@/components/communication/DirectMessages";
import { AnnouncementFeed } from "@/components/communication/AnnouncementFeed";

type Tab = "chats" | "groups" | "announcements" | "calls";

const TABS: { key: Tab; label: string; icon: string }[] = [
  { key: "chats", label: "Chats", icon: "💬" },
  { key: "groups", label: "Groups", icon: "👥" },
  { key: "announcements", label: "Announcements", icon: "📢" },
  { key: "calls", label: "Calls", icon: "📞" },
];

const S = { border: "rgba(255,255,255,0.07)", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170", accent: "#4D7FFF" };

interface ClassRow { id: string; name: string; subject: string | null; role: "student" | "teacher" }

export function EduChatHub({
  profileId, userRole, allowedRoles, schoolId, basePath,
}: {
  profileId: string;
  userRole: string;
  allowedRoles: string[];
  schoolId?: string | null;
  basePath: string; // e.g. "/student/dashboard"
}) {
  const supabase = createClient();
  const [tab, setTab] = useState<Tab>("chats");
  const [classes, setClasses] = useState<ClassRow[]>([]);
  const [liveSessions, setLiveSessions] = useState<any[]>([]);
  const [loadingGroups, setLoadingGroups] = useState(false);
  const [loadingCalls, setLoadingCalls] = useState(false);

  useEffect(() => {
    if (tab === "groups" && classes.length === 0) loadClasses();
    if (tab === "calls" && liveSessions.length === 0) loadCalls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab]);

  const loadClasses = async () => {
    setLoadingGroups(true);
    if (userRole === "student") {
      const { data } = await (supabase.from("class_enrollments") as any)
        .select("classes(id,name,subject)").eq("student_id", profileId).eq("status", "active");
      setClasses((data ?? []).map((e: any) => ({ ...e.classes, role: "student" })).filter((c: any) => c.id));
    } else if (userRole === "teacher") {
      const { data } = await (supabase.from("classes") as any).select("id,name,subject").eq("teacher_id", profileId);
      setClasses((data ?? []).map((c: any) => ({ ...c, role: "teacher" })));
    }
    setLoadingGroups(false);
  };

  const loadCalls = async () => {
    setLoadingCalls(true);
    const classIds = classes.length ? classes.map((c) => c.id) : [];
    let ids = classIds;
    if (ids.length === 0) {
      if (userRole === "student") {
        const { data } = await (supabase.from("class_enrollments") as any).select("class_id").eq("student_id", profileId).eq("status", "active");
        ids = (data ?? []).map((e: any) => e.class_id);
      } else if (userRole === "teacher") {
        const { data } = await (supabase.from("classes") as any).select("id").eq("teacher_id", profileId);
        ids = (data ?? []).map((c: any) => c.id);
      }
    }
    if (ids.length === 0) { setLiveSessions([]); setLoadingCalls(false); return; }
    const { data } = await (supabase.from("live_sessions") as any)
      .select("id,class_id,scheduled_at,status,classes(name)")
      .in("class_id", ids).in("status", ["scheduled", "live"])
      .order("scheduled_at", { ascending: true }).limit(20);
    setLiveSessions(data ?? []);
    setLoadingCalls(false);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", minHeight: 0 }}>
      <div style={{ flex: 1, minHeight: 0, overflowY: tab === "chats" ? "hidden" : "auto", paddingBottom: tab === "chats" ? 0 : 76 }}>
        {tab === "chats" && (
          <DirectMessages profileId={profileId} userRole={userRole} allowedRoles={allowedRoles} heightOffset={76} />
        )}

        {tab === "groups" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "4px 2px" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: "0 0 4px" }}>Groups</h2>
            {loadingGroups ? (
              <p style={{ fontSize: 13, color: S.dim }}>Loading…</p>
            ) : classes.length === 0 ? (
              <p style={{ fontSize: 13, color: S.dim }}>No class groups yet.</p>
            ) : classes.map((c) => (
              <Link key={c.id} href={`${basePath}/classes/${c.id}/chat`}
                style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, textDecoration: "none" }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: "linear-gradient(135deg,#4D7FFF,#2D5BDF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, color: "#fff", flexShrink: 0 }}>
                  {c.name?.[0]?.toUpperCase() ?? "C"}
                </div>
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: 14, fontWeight: 600, color: S.text, margin: 0 }}>{c.name}</p>
                  {c.subject && <p style={{ fontSize: 11, color: S.dim, margin: "2px 0 0" }}>{c.subject}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}

        {tab === "announcements" && (
          <div style={{ padding: "4px 2px" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: "0 0 12px" }}>Announcements</h2>
            <AnnouncementFeed profileId={profileId} userRole={userRole} schoolId={schoolId ?? undefined} showAuthorControls={false} />
          </div>
        )}

        {tab === "calls" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "4px 2px" }}>
            <h2 style={{ fontSize: 18, fontWeight: 700, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: "0 0 4px" }}>Calls</h2>
            <p style={{ fontSize: 12, color: S.dim, margin: "0 0 8px" }}>Scheduled and live class video sessions</p>
            {loadingCalls ? (
              <p style={{ fontSize: 13, color: S.dim }}>Loading…</p>
            ) : liveSessions.length === 0 ? (
              <p style={{ fontSize: 13, color: S.dim }}>No scheduled or live calls right now.</p>
            ) : liveSessions.map((s) => (
              <Link key={s.id} href={`${basePath}/classes/${s.class_id}/live`}
                style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, textDecoration: "none" }}>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 600, color: S.text, margin: 0 }}>{s.classes?.name ?? "Class"}</p>
                  <p style={{ fontSize: 11, color: S.dim, margin: "2px 0 0" }}>{new Date(s.scheduled_at).toLocaleString()}</p>
                </div>
                <span style={{ fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 20, color: s.status === "live" ? "#00E5A3" : "#4D7FFF", background: s.status === "live" ? "rgba(0,229,163,0.1)" : "rgba(77,127,255,0.1)" }}>
                  {s.status === "live" ? "● LIVE" : "Scheduled"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* WhatsApp-style bottom nav — only rendered on EduChat pages */}
      <div style={{
        position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 40,
        display: "flex", background: "#0E1117", borderTop: `1px solid ${S.border}`,
        paddingBottom: "env(safe-area-inset-bottom)",
      }} className="lg:pl-[220px]">
        {TABS.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
              padding: "9px 4px", background: "none", border: "none", cursor: "pointer",
              color: tab === t.key ? S.accent : S.dim,
            }}>
            <span style={{ fontSize: 18 }}>{t.icon}</span>
            <span style={{ fontSize: 10, fontWeight: tab === t.key ? 700 : 500 }}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
