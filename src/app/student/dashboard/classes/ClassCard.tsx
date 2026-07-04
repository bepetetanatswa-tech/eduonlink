"use client";

import Link from "next/link";

interface ClassInfo {
  id: string;
  name: string;
  subject: string | null;
  grade_level: string | null;
  teacherName?: string;
  teacherAvatar?: string | null;
  nextSessionAt?: string | null;
  lastActivityAt?: string | null;
  unreadCount?: number;
  attendanceToday?: string | null;
}

const S = { border: "rgba(255,255,255,0.07)", accent: "#4D7FFF", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170" };

const ATTENDANCE_COLOR: Record<string, string> = {
  present: "#00E5A3", absent: "#FF6B6B", late: "#F5A623", excused: "#4D7FFF",
};

function initials(name?: string) {
  if (!name) return "?";
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

function formatWhen(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const time = d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  if (sameDay) return `Today, ${time}`;
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1);
  if (d.toDateString() === tomorrow.toDateString()) return `Tomorrow, ${time}`;
  return `${d.toLocaleDateString([], { month: "short", day: "numeric" })}, ${time}`;
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export function ClassCard({ c }: { c: ClassInfo }) {
  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 16, padding: "20px", display: "flex", flexDirection: "column", gap: 14, transition: "border-color 0.15s" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${S.accent}40`)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = S.border)}>
      <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        {c.teacherAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.teacherAvatar} alt={c.teacherName ?? ""} style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
        ) : (
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#4D7FFF,#2D5BDF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
            {initials(c.teacherName)}
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: "0 0 3px" }}>{c.name}</h3>
          {c.subject && <p style={{ fontSize: 12, color: S.muted, margin: 0 }}>{c.subject}{c.grade_level ? ` · Grade ${c.grade_level}` : ""}</p>}
          {c.teacherName && <p style={{ fontSize: 11, color: S.dim, marginTop: 3 }}>{c.teacherName}</p>}
        </div>
        {!!c.unreadCount && (
          <span style={{ minWidth: 20, height: 20, borderRadius: 10, background: S.accent, color: "#fff", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 6px", flexShrink: 0 }}>
            {c.unreadCount > 9 ? "9+" : c.unreadCount}
          </span>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
        {c.nextSessionAt && (
          <p style={{ fontSize: 11, color: "#00E5A3", margin: 0 }}>● Next live: {formatWhen(c.nextSessionAt)}</p>
        )}
        {c.lastActivityAt && (
          <p style={{ fontSize: 11, color: S.dim, margin: 0 }}>Last activity {timeAgo(c.lastActivityAt)}</p>
        )}
        {c.attendanceToday && (
          <p style={{ fontSize: 11, margin: 0, color: ATTENDANCE_COLOR[c.attendanceToday] ?? S.dim, textTransform: "capitalize" }}>
            Today: {c.attendanceToday}
          </p>
        )}
      </div>

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
        <Link href={`/student/dashboard/classes/${c.id}/chat`} style={{ flex: "1 1 40%", padding: "8px", borderRadius: 8, background: `${S.accent}15`, border: `1px solid ${S.accent}30`, color: S.accent, fontSize: 12, fontWeight: 600, textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>
          Chat
        </Link>
        <Link href={`/student/dashboard/classes/${c.id}/live`} style={{ flex: "1 1 40%", padding: "8px", borderRadius: 8, background: "rgba(0,229,163,0.1)", border: "1px solid rgba(0,229,163,0.25)", color: "#00E5A3", fontSize: 12, fontWeight: 600, textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          <svg width="13" height="13" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
          Live
        </Link>
        <Link href="/student/dashboard/lessons" style={{ flex: "1 1 40%", padding: "8px", borderRadius: 8, background: "rgba(189,147,249,0.1)", border: "1px solid rgba(189,147,249,0.25)", color: "#BD93F9", fontSize: 12, fontWeight: 600, textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          Lessons
        </Link>
        <Link href="/student/dashboard/assignments" style={{ flex: "1 1 40%", padding: "8px", borderRadius: 8, background: "rgba(245,166,35,0.1)", border: "1px solid rgba(245,166,35,0.25)", color: "#F5A623", fontSize: 12, fontWeight: 600, textAlign: "center", textDecoration: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 5 }}>
          Assignments
        </Link>
      </div>
    </div>
  );
}
