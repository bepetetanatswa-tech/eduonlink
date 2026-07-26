/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Project {
 id: string;
 title: string;
 subject: string;
 stage: number;
 status: string;
 description: string | null;
 created_at: string;
 profiles: { full_name: string; email: string } | null;
}

interface Stage {
 id: string;
 stage_number: number;
 title: string;
 content: string | null;
 ai_feedback: string | null;
 teacher_comment: string | null;
 is_approved: boolean;
 submitted_at: string | null;
}

const STATUS_COLORS: Record<string, { color: string; bg: string; border: string }> = {
 not_started: { color: "#6E7A6C", bg: "rgba(28,38,32,0.04)", border: "rgba(28,38,32,0.08)" },
 in_progress: { color: "#B1502B", bg: "rgba(177,80,43,0.08)", border: "rgba(177,80,43,0.2)" },
 submitted: { color: "#A9873F", bg: "rgba(169,135,63,0.08)", border: "rgba(169,135,63,0.2)" },
 approved: { color: "#1F4738", bg: "rgba(31,71,56,0.08)", border: "rgba(31,71,56,0.2)" },
};

const STAGE_NAMES = ["", "Topic Selection", "Research", "Analysis", "Presentation Plan", "Product Creation", "Evaluation"];

export function HBCTeacherView({ teacherId, projects, hasSchool }: { teacherId: string; projects: Project[]; hasSchool: boolean }) {
 const [selected, setSelected] = useState<string | null>(null);
 const [stages, setStages] = useState<Stage[]>([]);
 const [loadingStages, setLoadingStages] = useState(false);
 const [comment, setComment] = useState<Record<string, string>>({});
 const [saving, setSaving] = useState<string | null>(null);
 const [notification, setNotification] = useState<string | null>(null);
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
 const initial: Record<string, string> = {};
 (data ?? []).forEach((s: Stage) => { initial[s.id] = s.teacher_comment ?? ""; });
 setComment(initial);
 setLoadingStages(false);
 };

 const approveStage = async (stageId: string, approve: boolean) => {
 setSaving(stageId);
 await (supabase.from("hbc_stages") as any)
 .update({ is_approved: approve, teacher_comment: comment[stageId] ?? null, approved_by: teacherId, completed_at: approve ? new Date().toISOString() : null })
 .eq("id", stageId);
 setStages((prev) => prev.map((s) => s.id === stageId ? { ...s, is_approved: approve, teacher_comment: comment[stageId] ?? null } : s));
 setNotification(approve ? "Stage approved ✓" : "Approval removed");
 setSaving(null);
 setTimeout(() => setNotification(null), 3000);
 };

 if (!hasSchool) {
 return (
 <div style={{ maxWidth: 700 }}>
 <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1C2620", fontFamily: "inherit", marginBottom: 8 }}>SBP Generator</h2>
 <div style={{ background: "rgba(169,135,63,0.08)", border: "1px solid rgba(169,135,63,0.2)", borderRadius: 12, padding: 16, color: "#A9873F", fontSize: 13 }}>
 You&apos;re not linked to a school and don&apos;t teach any classes yet — join a school or create a class to review your students&apos; SBP projects here.
 </div>
 </div>
 );
 }

 return (
 <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 20 }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
 <div>
 <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1C2620", fontFamily: "inherit", margin: 0 }}>SBP Generator</h2>
 <p style={{ fontSize: 12, color: "#6E7A6C", marginTop: 4 }}>Review, comment, and approve student project stages</p>
 </div>
 {notification && (
 <div style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(31,71,56,0.1)", border: "1px solid rgba(31,71,56,0.25)", color: "#1F4738", fontSize: 12, fontWeight: 600 }}>
 {notification}
 </div>
 )}
 </div>

 {projects.length === 0 ? (
 <div style={{ background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.06)", borderRadius: 16, padding: "40px 24px", textAlign: "center" }}>
 <div style={{ fontSize: 36, marginBottom: 10 }}></div>
 <p style={{ fontSize: 14, color: "#566257", margin: 0 }}>No student projects yet. Projects will appear here once students start their SBP work.</p>
 </div>
 ) : (
 <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
 {projects.map((p) => {
 const st = STATUS_COLORS[p.status] ?? STATUS_COLORS.not_started;
 const isOpen = selected === p.id;
 return (
 <div key={p.id} style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${isOpen ? "rgba(177,80,43,0.25)" : "rgba(28,38,32,0.06)"}`, borderRadius: 14, overflow: "hidden", transition: "border-color 0.15s" }}>
 {/* Project Row */}
 <button
 onClick={() => openProject(p.id)}
 style={{ width: "100%", padding: "14px 18px", display: "flex", alignItems: "center", gap: 14, background: "none", border: "none", cursor: "pointer", textAlign: "left" }}
 >
 <div style={{ width: 38, height: 38, borderRadius: "10px", background: "rgba(169,135,63,0.1)", border: "1px solid rgba(169,135,63,0.2)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, fontSize: 16, fontWeight: 700, color: "#A9873F", fontFamily: "inherit" }}>
 {p.profiles?.full_name?.charAt(0).toUpperCase() ?? "?"}
 </div>
 <div style={{ flex: 1, minWidth: 0 }}>
 <p style={{ fontSize: 14, fontWeight: 700, color: "#1C2620", fontFamily: "inherit", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{p.title}</p>
 <p style={{ fontSize: 11, color: "#566257", margin: 0 }}>{p.profiles?.full_name ?? "Unknown"} · {p.subject}</p>
 </div>
 <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
 <span style={{ fontSize: 11, color: "#6E7A6C" }}>Stage {Math.max(p.stage - 1, 0)}/6</span>
 <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, color: st.color, background: st.bg, border: `1px solid ${st.border}` }}>
 {p.status.replace("_", "")}
 </span>
 <span style={{ color: "#6E7A6C", fontSize: 13 }}>{isOpen ? "▲" : "▼"}</span>
 </div>
 </button>

 {/* Stages Expansion */}
 {isOpen && (
 <div style={{ borderTop: "1px solid rgba(28,38,32,0.06)", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 12 }}>
 {loadingStages ? (
 <p style={{ fontSize: 13, color: "#6E7A6C", textAlign: "center", padding: "12px 0" }}>Loading stages…</p>
 ) : stages.length === 0 ? (
 <p style={{ fontSize: 13, color: "#6E7A6C" }}>Student hasn&apos;t submitted any stages yet.</p>
 ) : (
 stages.map((s) => (
 <div key={s.id} style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${s.is_approved ? "rgba(31,71,56,0.2)" : "rgba(28,38,32,0.05)"}`, borderRadius: 12, padding: "14px 16px" }}>
 <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
 <div style={{ width: 28, height: 28, borderRadius: "7px", background: s.is_approved ? "rgba(31,71,56,0.12)" : "rgba(177,80,43,0.1)", border: `1px solid ${s.is_approved ? "rgba(31,71,56,0.3)" : "rgba(177,80,43,0.25)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, flexShrink: 0, fontWeight: 700, color: s.is_approved ? "#1F4738" : "#B1502B" }}>
 {s.is_approved ? "✓" : s.stage_number}
 </div>
 <div>
 <p style={{ fontSize: 12, fontWeight: 700, color: "#1C2620", margin: 0 }}>Stage {s.stage_number}: {STAGE_NAMES[s.stage_number] ?? s.title}</p>
 {s.submitted_at && <p style={{ fontSize: 10, color: "#6E7A6C", margin: 0 }}>Submitted {new Date(s.submitted_at).toLocaleDateString()}</p>}
 </div>
 {s.is_approved && <span style={{ marginLeft: "auto", fontSize: 10, color: "#1F4738", fontWeight: 600, padding: "2px 8px", borderRadius: 6, background: "rgba(31,71,56,0.1)", border: "1px solid rgba(31,71,56,0.2)" }}>Approved</span>}
 </div>

 {s.content && (
 <div style={{ marginBottom: 10, padding: "10px 12px", background: "rgba(28,38,32,0.02)", borderRadius: 8, maxHeight: 120, overflowY: "auto", scrollbarWidth: "thin" }}>
 <p style={{ fontSize: 12, color: "#566257", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{s.content}</p>
 </div>
 )}

 {!s.submitted_at && !s.content && (
 <p style={{ fontSize: 11, color: "#6E7A6C", margin: "0 0 10px", fontStyle: "italic" }}>Not yet submitted by student</p>
 )}

 {s.ai_feedback && (
 <div style={{ marginBottom: 10, padding: "10px 12px", background: "rgba(169,135,63,0.06)", border: "1px solid rgba(169,135,63,0.15)", borderRadius: 8 }}>
 <p style={{ fontSize: 10, fontWeight: 700, color: "#A9873F", margin: "0 0 4px", textTransform: "uppercase", letterSpacing: "0.05em" }}> Sir Taks Blueprint/Feedback</p>
 <p style={{ fontSize: 12, color: "#566257", margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap", maxHeight: 120, overflowY: "auto" }}>{s.ai_feedback.replace("[BLUEPRINT]\n", "")}</p>
 </div>
 )}

 <div style={{ display: "flex", gap: 8, alignItems: "flex-end" }}>
 <div style={{ flex: 1 }}>
 <label style={{ fontSize: 10, color: "#6E7A6C", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Your Comment</label>
 <textarea
 value={comment[s.id] ?? ""}
 onChange={(e) => setComment((prev) => ({ ...prev, [s.id]: e.target.value }))}
 placeholder="Add feedback for the student..."
 rows={2}
 style={{ width: "100%", padding: "8px 10px", background: "rgba(28,38,32,0.04)", border: "1px solid rgba(28,38,32,0.08)", borderRadius: 8, fontSize: 12, color: "#1C2620", fontFamily: "inherit", outline: "none", resize: "none", boxSizing: "border-box" }}
 />
 </div>
 <div style={{ display: "flex", flexDirection: "column", gap: 6, flexShrink: 0 }}>
 <button
 onClick={() => approveStage(s.id, true)}
 disabled={saving === s.id || s.is_approved || !s.content}
 style={{ padding: "7px 14px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: (saving === s.id || s.is_approved || !s.content) ? "not-allowed" : "pointer", background: s.is_approved ? "rgba(31,71,56,0.08)" : "rgba(31,71,56,0.12)", border: "1px solid rgba(31,71,56,0.25)", color: "#1F4738", opacity: (!s.content) ? 0.5 : 1 }}
 >
 {saving === s.id ? "…" : s.is_approved ? "✓ Approved" : "Approve"}
 </button>
 {s.is_approved && (
 <button
 onClick={() => approveStage(s.id, false)}
 disabled={saving === s.id}
 style={{ padding: "5px 12px", borderRadius: 8, fontSize: 10, cursor: "pointer", background: "rgba(163,49,30,0.08)", border: "1px solid rgba(163,49,30,0.2)", color: "#A3311E" }}
 >
 Remove
 </button>
 )}
 </div>
 </div>
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
 );
}
