"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Project {
  id: string; title: string; subject: string; stage: number; status: string;
  school_id: string | null; school_name: string | null; created_at: string;
  profiles: { full_name: string; email: string } | null;
}
interface Stage {
  id: string; stage_number: number; title: string; content: string | null;
  ai_feedback: string | null; teacher_comment: string | null;
  is_approved: boolean; submitted_at: string | null;
}

const STATUS_COLORS: Record<string, { color: string; bg: string; border: string }> = {
  not_started: { color: "#6E7A6C", bg: "rgba(28,38,32,0.04)", border: "rgba(28,38,32,0.08)" },
  in_progress:  { color: "#B1502B", bg: "rgba(177,80,43,0.08)",  border: "rgba(177,80,43,0.2)"  },
  submitted:    { color: "#A9873F", bg: "rgba(169,135,63,0.08)",  border: "rgba(169,135,63,0.2)"  },
  approved:     { color: "#1F4738", bg: "rgba(31,71,56,0.08)",   border: "rgba(31,71,56,0.2)"   },
};

const STAGE_NAMES = ["", "Topic Selection", "Research", "Analysis", "Presentation Plan", "Product Creation", "Evaluation"];

export function AdminHBCClient({
  projects, totalProjects, inProgress, submitted, approved, avgStage, bySchool,
}: {
  projects: Project[]; totalProjects: number; inProgress: number; submitted: number;
  approved: number; avgStage: number; bySchool: [string, number][];
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [loadingStages, setLoadingStages] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const supabase = createClient();

  const openProject = async (id: string) => {
    if (selected === id) { setSelected(null); return; }
    setSelected(id);
    setLoadingStages(true);
    const { data } = await (supabase.from("hbc_stages") as any)
      .select("id, stage_number, title, content, ai_feedback, teacher_comment, is_approved, submitted_at")
      .eq("project_id", id)
      .order("stage_number");
    setStages(data ?? []);
    setLoadingStages(false);
  };

  const filtered = statusFilter === "all" ? projects : projects.filter((p) => p.status === statusFilter);

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1C2620", fontFamily: "inherit", margin: 0 }}>SBP Generator</h2>
        <p style={{ fontSize: 12, color: "#6E7A6C", marginTop: 4 }}>School-Based Projects across the platform, any ZIMSEC subject</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
        {[
          { label: "Total Projects", value: totalProjects, color: "#B1502B" },
          { label: "In Progress", value: inProgress, color: "#A9873F" },
          { label: "Submitted", value: submitted, color: "#A9873F" },
          { label: "Approved", value: approved, color: "#1F4738" },
          { label: "Avg. Stage", value: avgStage.toFixed(1), color: "#B1502B" },
        ].map((s) => (
          <div key={s.label} style={{ background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.06)", borderRadius: 14, padding: "16px 18px" }}>
            <p style={{ fontSize: 22, fontWeight: 700, color: s.color, margin: "0 0 4px", fontFamily: "inherit" }}>{s.value}</p>
            <p style={{ fontSize: 11, color: "#6E7A6C", margin: 0 }}>{s.label}</p>
          </div>
        ))}
      </div>

      {bySchool.length > 0 && (
        <div>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "#566257", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Projects by School</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {bySchool.map(([name, count]) => (
              <div key={name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.05)", borderRadius: 10 }}>
                <span style={{ fontSize: 12, color: "#566257" }}>{name}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: "#1F4738" }}>{count}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: "#566257", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>All Projects</h3>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: "6px 10px", background: "rgba(28,38,32,0.04)", border: "1px solid rgba(28,38,32,0.1)", borderRadius: 8, fontSize: 12, color: "#1C2620", outline: "none" }}
          >
            <option value="all">All statuses</option>
            <option value="not_started">Not started</option>
            <option value="in_progress">In progress</option>
            <option value="submitted">Submitted</option>
            <option value="approved">Approved</option>
          </select>
        </div>

        {filtered.length === 0 ? (
          <div style={{ background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.06)", borderRadius: 14, padding: "36px", textAlign: "center", color: "#6E7A6C", fontSize: 13 }}>
            No SBP projects {statusFilter === "all" ? "yet" : `with status "${statusFilter.replace("_", " ")}"`}.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {filtered.map((p) => {
              const st = STATUS_COLORS[p.status] ?? STATUS_COLORS.not_started;
              const isOpen = selected === p.id;
              return (
                <div key={p.id} style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${isOpen ? "rgba(177,80,43,0.25)" : "rgba(28,38,32,0.06)"}`, borderRadius: 14, overflow: "hidden" }}>
                  <button
                    onClick={() => openProject(p.id)}
                    style={{ width: "100%", padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
                  >
                    <div style={{ width: 38, height: 38, borderRadius: 10, background: "rgba(169,135,63,0.1)", border: "1px solid rgba(169,135,63,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16, fontWeight: 700, color: "#A9873F", fontFamily: "inherit" }}>
                      {p.profiles?.full_name?.charAt(0).toUpperCase() ?? "?"}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 14, fontWeight: 700, color: "#1C2620", fontFamily: "inherit", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</p>
                      <p style={{ fontSize: 11, color: "#566257", margin: 0 }}>
                        {p.profiles?.full_name ?? "Unknown"} · {p.subject} · {p.school_name ?? "No school linked"}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
                      <span style={{ fontSize: 11, color: "#6E7A6C" }}>Stage {p.stage}/6</span>
                      <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, color: st.color, background: st.bg, border: `1px solid ${st.border}` }}>
                        {p.status.replace("_", " ")}
                      </span>
                      <span style={{ color: "#6E7A6C", fontSize: 13 }}>{isOpen ? "▲" : "▼"}</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div style={{ borderTop: "1px solid rgba(28,38,32,0.06)", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
                      {loadingStages ? (
                        <p style={{ fontSize: 13, color: "#6E7A6C", textAlign: "center", padding: "12px 0" }}>Loading stages…</p>
                      ) : stages.length === 0 ? (
                        <p style={{ fontSize: 13, color: "#6E7A6C" }}>No stages submitted yet.</p>
                      ) : (
                        stages.map((s) => (
                          <div key={s.id} style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${s.is_approved ? "rgba(31,71,56,0.2)" : "rgba(28,38,32,0.05)"}`, borderRadius: 12, padding: "14px 16px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                              <div style={{ width: 28, height: 28, borderRadius: 7, background: s.is_approved ? "rgba(31,71,56,0.12)" : "rgba(177,80,43,0.1)", border: `1px solid ${s.is_approved ? "rgba(31,71,56,0.3)" : "rgba(177,80,43,0.25)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, fontWeight: 700, color: s.is_approved ? "#1F4738" : "#B1502B" }}>
                                {s.is_approved ? "✓" : s.stage_number}
                              </div>
                              <div>
                                <p style={{ fontSize: 12, fontWeight: 700, color: "#1C2620", margin: 0 }}>Stage {s.stage_number}: {STAGE_NAMES[s.stage_number] ?? s.title}</p>
                                {s.submitted_at && <p style={{ fontSize: 10, color: "#6E7A6C", margin: 0 }}>Submitted {new Date(s.submitted_at).toLocaleDateString()}</p>}
                              </div>
                              {s.is_approved && <span style={{ marginLeft: "auto", fontSize: 10, color: "#1F4738", fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: "rgba(31,71,56,0.1)", border: "1px solid rgba(31,71,56,0.2)" }}>Approved</span>}
                            </div>

                            {s.content && (
                              <div style={{ marginBottom: 10, padding: "10px 12px", background: "rgba(28,38,32,0.02)", borderRadius: 8, maxHeight: 140, overflowY: "auto" }}>
                                <p style={{ fontSize: 12, color: "#566257", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{s.content}</p>
                              </div>
                            )}
                            {!s.submitted_at && !s.content && (
                              <p style={{ fontSize: 11, color: "#6E7A6C", margin: 0, fontStyle: "italic" }}>Not yet submitted by student</p>
                            )}
                            {s.teacher_comment && (
                              <div style={{ marginTop: 10, padding: "8px 12px", background: "rgba(177,80,43,0.06)", border: "1px solid rgba(177,80,43,0.15)", borderRadius: 8 }}>
                                <p style={{ fontSize: 10, fontWeight: 700, color: "#B1502B", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}>Teacher Comment</p>
                                <p style={{ fontSize: 12, color: "#566257", margin: 0, lineHeight: 1.5 }}>{s.teacher_comment}</p>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
