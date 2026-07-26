"use client";

import Link from "next/link";

interface ClassInfo {
  id: string;
  name: string;
  subject: string | null;
  grade_level: string | null;
  teacherName?: string;
  studentCount: number;
}

const S = { border: "rgba(28,38,32,0.07)", accent: "#B1502B", text: "#1C2620", muted: "#566257", dim: "#6E7A6C" };

export function SchoolClassCard({ c }: { c: ClassInfo }) {
  return (
    <div style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 16, padding: "20px", display: "flex", flexDirection: "column", gap: 12, transition: "border-color 0.15s" }}
      onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${S.accent}40`)}
      onMouseLeave={(e) => (e.currentTarget.style.borderColor = S.border)}>
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 700, color: S.text, fontFamily: "inherit", margin: "0 0 4px" }}>{c.name}</h3>
        {c.subject && <p style={{ fontSize: 12, color: S.muted, margin: 0 }}>{c.subject}{c.grade_level ? ` · Grade ${c.grade_level}` : ""}</p>}
        <p style={{ fontSize: 11, color: S.dim, marginTop: 4 }}>{c.teacherName ?? "No teacher assigned"} · {c.studentCount} student{c.studentCount !== 1 ? "s" : ""}</p>
      </div>
      <Link href="/school/dashboard/teachers" style={{ padding: "8px", borderRadius: 8, background: `${S.accent}15`, border: `1px solid ${S.accent}30`, color: S.accent, fontSize: 12, fontWeight: 600, textAlign: "center", textDecoration: "none" }}>
        View Teachers
      </Link>
    </div>
  );
}
