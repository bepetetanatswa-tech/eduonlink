"use client";

import Link from "next/link";

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  not_started: { label: "Not Started", color: "#4A5170", bg: "rgba(255,255,255,0.04)", border: "rgba(255,255,255,0.08)" },
  in_progress:  { label: "In Progress",  color: "#4D7FFF", bg: "rgba(77,127,255,0.08)",  border: "rgba(77,127,255,0.2)"  },
  submitted:    { label: "Submitted",    color: "#F5A623", bg: "rgba(245,166,35,0.08)",  border: "rgba(245,166,35,0.2)"  },
  approved:     { label: "Approved",     color: "#00E5A3", bg: "rgba(0,229,163,0.08)",   border: "rgba(0,229,163,0.2)"   },
};

interface Project { id: string; title: string; subject: string; stage: number; status: string; description: string | null }

export function ProjectCard({ p }: { p: Project }) {
  const st = STATUS_STYLE[p.status] ?? STATUS_STYLE.not_started;
  return (
    <Link href={`/student/dashboard/hbc/${p.id}`} style={{ textDecoration: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, transition: "all 0.15s", cursor: "pointer" }}
        onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(77,127,255,0.25)"; el.style.background = "rgba(77,127,255,0.04)"; }}
        onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(255,255,255,0.06)"; el.style.background = "rgba(255,255,255,0.02)"; }}
      >
        <div style={{ width: 52, height: 52, flexShrink: 0, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="52" height="52" viewBox="0 0 52 52" style={{ position: "absolute" }}>
            <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
            <circle cx="26" cy="26" r="22" fill="none" stroke="#4D7FFF" strokeWidth="3"
              strokeDasharray={`${((p.stage - 1) / 6) * 138.2} 138.2`}
              strokeLinecap="round" strokeDashoffset="34.5"
            />
          </svg>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>{Math.max(p.stage - 1, 0)}/6</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", margin: "0 0 3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</p>
          <p style={{ fontSize: 12, color: "#6B7290", margin: 0 }}>{p.subject}</p>
          {p.description && <p style={{ fontSize: 11, color: "#4A5170", margin: "3px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.description}</p>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, color: st.color, background: st.bg, border: `1px solid ${st.border}` }}>{st.label}</span>
          <span style={{ fontSize: 13, color: "#4A5170" }}>→</span>
        </div>
      </div>
    </Link>
  );
}
