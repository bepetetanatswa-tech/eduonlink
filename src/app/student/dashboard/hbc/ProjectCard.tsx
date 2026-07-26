"use client";

import Link from "next/link";

const STATUS_STYLE: Record<string, { label: string; color: string; bg: string; border: string }> = {
  not_started: { label: "Not Started", color: "#6E7A6C", bg: "rgba(28,38,32,0.04)", border: "rgba(28,38,32,0.08)" },
  in_progress:  { label: "In Progress",  color: "#B1502B", bg: "rgba(177,80,43,0.08)",  border: "rgba(177,80,43,0.2)"  },
  submitted:    { label: "Submitted",    color: "#A9873F", bg: "rgba(169,135,63,0.08)",  border: "rgba(169,135,63,0.2)"  },
  approved:     { label: "Approved",     color: "#1F4738", bg: "rgba(31,71,56,0.08)",   border: "rgba(31,71,56,0.2)"   },
};

interface Project { id: string; title: string; subject: string; stage: number; status: string; description: string | null }

export function ProjectCard({ p }: { p: Project }) {
  const st = STATUS_STYLE[p.status] ?? STATUS_STYLE.not_started;
  return (
    <Link href={`/student/dashboard/hbc/${p.id}`} style={{ textDecoration: "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "16px 20px", background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.06)", borderRadius: 14, transition: "all 0.15s", cursor: "pointer" }}
        onMouseEnter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(177,80,43,0.25)"; el.style.background = "rgba(177,80,43,0.04)"; }}
        onMouseLeave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = "rgba(28,38,32,0.06)"; el.style.background = "rgba(28,38,32,0.02)"; }}
      >
        <div style={{ width: 52, height: 52, flexShrink: 0, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <svg width="52" height="52" viewBox="0 0 52 52" style={{ position: "absolute" }}>
            <circle cx="26" cy="26" r="22" fill="none" stroke="rgba(28,38,32,0.06)" strokeWidth="3" />
            <circle cx="26" cy="26" r="22" fill="none" stroke="#B1502B" strokeWidth="3"
              strokeDasharray={`${((p.stage - 1) / 6) * 138.2} 138.2`}
              strokeLinecap="round" strokeDashoffset="34.5"
            />
          </svg>
          <span style={{ fontSize: 11, fontWeight: 700, color: "#1C2620", fontFamily: "inherit" }}>{Math.max(p.stage - 1, 0)}/6</span>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 15, fontWeight: 700, color: "#1C2620", fontFamily: "inherit", margin: "0 0 3px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</p>
          <p style={{ fontSize: 12, color: "#566257", margin: 0 }}>{p.subject}</p>
          {p.description && <p style={{ fontSize: 11, color: "#6E7A6C", margin: "3px 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.description}</p>}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 12, flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 600, padding: "3px 10px", borderRadius: 20, color: st.color, background: st.bg, border: `1px solid ${st.border}` }}>{st.label}</span>
          <span style={{ fontSize: 13, color: "#6E7A6C" }}>→</span>
        </div>
      </div>
    </Link>
  );
}
