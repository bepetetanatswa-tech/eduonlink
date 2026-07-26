"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadToR2 } from "@/lib/uploadToR2";

interface Assignment {
 id: string; title: string; description: string | null; instructions: string | null;
 due_date: string | null; max_score: number; attachment_url: string | null;
 rubric: string | null; allow_late: boolean;
 class: { name: string; subject: string };
 mySubmission?: Submission | null;
}
interface Submission {
 id: string; content: string | null; file_url: string | null; score: number | null;
 feedback: string | null; submitted_at: string; status: string; is_late: boolean;
}

const S = { border: "rgba(28,38,32,0.07)", text: "#1C2620", muted: "#566257", dim: "#6E7A6C", accent: "#B1502B" };
const inp: React.CSSProperties = { width: "100%", padding: "9px 12px", background: "rgba(28,38,32,0.04)", border: `1px solid ${S.border}`, borderRadius: 9, color: S.text, fontSize: 13, outline: "none", boxSizing: "border-box" };

const GRADE = (score: number, max: number) => {
 const pct = (score / max) * 100;
 if (pct >= 80) return { l: "A", c: "#1F4738" };
 if (pct >= 65) return { l: "B", c: "#B1502B" };
 if (pct >= 50) return { l: "C", c: "#A9873F" };
 if (pct >= 40) return { l: "D", c: "#FF9B6B" };
 return { l: "F", c: "#A3311E" };
};

export function SubmissionPortal({ profileId, lockedClassId }: { profileId: string; lockedClassId?: string }) {
 const supabase = createClient();
 const [assignments, setAssignments] = useState<Assignment[]>([]);
 const [selected, setSelected] = useState<Assignment | null>(null);
 const [content, setContent] = useState("");
 const [file, setFile] = useState<File | null>(null);
 const [submitting, setSubmitting] = useState(false);
 const [uploadPct, setUploadPct] = useState(0);
 const [uploadError, setUploadError] = useState<string | null>(null);
 const [submitted, setSubmitted] = useState(false);
 const [filter, setFilter] = useState<"all"|"pending"|"submitted"|"graded">("all");
 const [submitError, setSubmitError] = useState<string | null>(null);

 useEffect(() => { load(); }, [profileId, lockedClassId]); // eslint-disable-line react-hooks/exhaustive-deps

 const load = async () => {
 let classIds: string[];
 if (lockedClassId) {
 classIds = [lockedClassId];
 } else {
 const { data: enrollments } = await (supabase.from("class_enrollments") as any)
 .select("class_id").eq("student_id", profileId).eq("status", "active");
 classIds = (enrollments ?? []).map((e: any) => e.class_id);
 }
 if (classIds.length === 0) { setAssignments([]); return; }

 const { data: asgns } = await (supabase.from("assignments") as any)
 .select("*, class:classes(name,subject)")
 .in("class_id", classIds).order("due_date", { ascending: true, nullsFirst: false });

 const { data: subs2 } = await (supabase.from("submissions") as any)
 .select("id,assignment_id,content,file_url,score,feedback,submitted_at,status,is_late")
 .eq("student_id", profileId);
 const subMap2: Record<string, Submission> = {};
 (subs2 ?? []).forEach((s: any) => { subMap2[s.assignment_id] = s; });

 const list = (asgns ?? []).map((a: any) => ({ ...a, mySubmission: subMap2[a.id] ?? null }));
 setAssignments(list);
 };

 const openAssignment = (a: Assignment) => {
 setSelected(a);
 setContent(a.mySubmission?.content ?? "");
 setFile(null);
 setSubmitted(false);
 };

 const submit = async () => {
 if (!selected) return;
 setSubmitting(true);
 setSubmitError(null);
 let fileUrl: string | null = selected.mySubmission?.file_url ?? null;
 if (file) {
 setUploadError(null);
 setUploadPct(0);
 try {
 const { fileUrl: uploadedUrl } = await uploadToR2(
 file, "assignment-submission", { assignmentId: selected.id, studentId: profileId }, setUploadPct
 );
 fileUrl = uploadedUrl;
 } catch (err) {
 setUploadError(err instanceof Error ? err.message : "Upload failed");
 setSubmitting(false);
 return;
 }
 }
 const isLate = selected.due_date ? new Date(selected.due_date) < new Date() : false;
 const res = await fetch("/api/assignments/submit", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ assignmentId: selected.id, content: content.trim() || null, fileUrl, isLate }),
 });
 setSubmitting(false);
 if (!res.ok) {
 const data = await res.json().catch(() => null);
 setSubmitError(data?.error ?? "Could not submit. Please try again.");
 return;
 }
 setSubmitted(true);
 load();
 setTimeout(() => { setSelected(null); setSubmitted(false); }, 1500);
 };

 const isOverdue = (a: Assignment) => a.due_date ? new Date(a.due_date) < new Date() : false;

 const filtered = assignments.filter(a => {
 if (filter === "pending") return !a.mySubmission;
 if (filter === "submitted") return a.mySubmission?.status === "submitted";
 if (filter === "graded") return a.mySubmission?.status === "graded";
 return true;
 });

 return (
 <div style={{ display: "flex", gap: 20, minHeight: 500 }}>
 {/* List */}
 <div style={{ width: 300, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
 <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
 {(["all","pending","submitted","graded"] as const).map(f => (
 <button key={f} onClick={() => setFilter(f)}
 style={{ padding: "5px 12px", borderRadius: 20, border: `1px solid ${filter === f ? S.accent : S.border}`, background: filter === f ? "rgba(177,80,43,0.1)" : "transparent", color: filter === f ? S.accent : S.dim, fontSize: 11, fontWeight: filter === f ? 600 : 400, cursor: "pointer", textTransform: "capitalize" }}>
 {f}
 </button>
 ))}
 </div>
 <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
 {filtered.length === 0 && <p style={{ fontSize: 13, color: S.dim, textAlign: "center", padding: "24px 0" }}>No assignments here.</p>}
 {filtered.map(a => {
 const overdue = isOverdue(a);
 const gl = a.mySubmission?.score !== null && a.mySubmission?.score !== undefined ? GRADE(a.mySubmission.score, a.max_score) : null;
 return (
 <div key={a.id} onClick={() => openAssignment(a)}
 style={{ padding: "12px 14px", borderRadius: 12, cursor: "pointer",
 background: selected?.id === a.id ? "rgba(177,80,43,0.1)" : "rgba(28,38,32,0.02)",
 border: `1px solid ${selected?.id === a.id ? "rgba(177,80,43,0.3)" : S.border}` }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
 <p style={{ fontSize: 13, fontWeight: 600, color: S.text, margin: "0 0 3px", flex: 1 }}>{a.title}</p>
 {gl && <span style={{ fontSize: 14, fontWeight: 700, color: gl.c, marginLeft: 8 }}>{gl.l}</span>}
 </div>
 <p style={{ fontSize: 11, color: S.dim, margin: "0 0 6px" }}>{a.class.name} · {a.class.subject}</p>
 <div style={{ display: "flex", gap: 6 }}>
 <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, fontWeight: 600,
 background: a.mySubmission?.status === "graded" ? "rgba(31,71,56,0.15)" : a.mySubmission ? "rgba(177,80,43,0.15)" : overdue ? "rgba(163,49,30,0.15)" : "rgba(255,165,0,0.15)",
 color: a.mySubmission?.status === "graded" ? "#1F4738" : a.mySubmission ? "#B1502B" : overdue ? "#A3311E" : "#A9873F" }}>
 {a.mySubmission?.status === "graded" ? "Graded" : a.mySubmission ? "Submitted" : overdue ? "Overdue" : "Pending"}
 </span>
 </div>
 </div>
 );
 })}
 </div>
 </div>

 {/* Detail */}
 <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 16 }}>
 {!selected ? (
 <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 16 }}>
 <p style={{ fontSize: 14, color: S.dim }}>Select an assignment to view or submit</p>
 </div>
 ) : (
 <>
 <div style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: "20px" }}>
 <h3 style={{ fontSize: 16, fontWeight: 700, color: S.text, fontFamily: "inherit", margin: "0 0 4px" }}>{selected.title}</h3>
 <p style={{ fontSize: 12, color: S.dim, margin: "0 0 10px" }}>
 {selected.class.name} · Max {selected.max_score} pts{selected.due_date ? ` · Due ${new Date(selected.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : ""}
 </p>
 {selected.description && <p style={{ fontSize: 13, color: S.muted, lineHeight: 1.5, margin: "0 0 8px" }}>{selected.description}</p>}
 {selected.instructions && (
 <div style={{ padding: "12px 14px", background: "rgba(177,80,43,0.05)", border: "1px solid rgba(177,80,43,0.1)", borderRadius: 9 }}>
 <p style={{ fontSize: 11, fontWeight: 600, color: "#B1502B", margin: "0 0 4px" }}>Instructions</p>
 <p style={{ fontSize: 12, color: S.muted, lineHeight: 1.6, margin: 0, whiteSpace: "pre-wrap" }}>{selected.instructions}</p>
 </div>
 )}
 {selected.attachment_url && (
 <a href={selected.attachment_url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 6, marginTop: 10, fontSize: 12, color: S.accent, textDecoration: "none" }}> Download attachment</a>
 )}
 </div>

 {/* Graded feedback */}
 {selected.mySubmission?.status === "graded" && (
 <div style={{ background: "rgba(31,71,56,0.06)", border: "1px solid rgba(31,71,56,0.2)", borderRadius: 14, padding: "16px 20px" }}>
 <p style={{ fontSize: 13, fontWeight: 700, color: "#1F4738", margin: "0 0 6px" }}>
 Grade: {selected.mySubmission.score} / {selected.max_score} ({GRADE(selected.mySubmission.score!, selected.max_score).l})
 </p>
 {selected.mySubmission.feedback && (
 <p style={{ fontSize: 13, color: S.muted, margin: 0, lineHeight: 1.5 }}><strong style={{ color: S.text }}>Teacher feedback:</strong> {selected.mySubmission.feedback}</p>
 )}
 </div>
 )}

 {/* Submission form */}
 {selected.mySubmission?.status !== "graded" && (
 <div style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: "20px", display: "flex", flexDirection: "column", gap: 14 }}>
 <h4 style={{ fontSize: 14, fontWeight: 600, color: S.text, margin: 0 }}>
 {selected.mySubmission ? "Edit Submission" : "Submit Your Work"}
 </h4>
 {submitted && <div style={{ padding: "10px 16px", borderRadius: 9, background: "rgba(31,71,56,0.1)", border: "1px solid rgba(31,71,56,0.25)", color: "#1F4738", fontSize: 13 }}>✓ Submitted successfully!</div>}
 <div>
 <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Written Response</label>
 <textarea value={content} onChange={e => setContent(e.target.value)} rows={6}
 placeholder="Type your answer or response here…"
 style={{ ...inp, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />
 </div>
 <div>
 <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>File Upload (PDF, Word, Image)</label>
 {selected.mySubmission?.file_url && <p style={{ fontSize: 11, color: "#1F4738", marginBottom: 6 }}>Current: <a href={selected.mySubmission.file_url} target="_blank" rel="noreferrer" style={{ color: "#1F4738" }}>view file</a></p>}
 <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" onChange={e => setFile(e.target.files?.[0] ?? null)} style={{ ...inp, padding: "7px 12px" }} />
 {submitting && file && (
 <div style={{ height: 4, borderRadius: 4, background: "rgba(28,38,32,0.06)", overflow: "hidden", marginTop: 8 }}>
 <div style={{ height: "100%", width: `${uploadPct}%`, background: S.accent, transition: "width 0.2s" }} />
 </div>
 )}
 {uploadError && <p style={{ fontSize: 11, color: "#A3311E", marginTop: 5 }}>{uploadError}</p>}
 </div>
 {isOverdue(selected) && !selected.allow_late && (
 <p style={{ fontSize: 12, color: "#A3311E", margin: 0 }}>⚠ This assignment is past due and does not accept late submissions.</p>
 )}
 {submitError && <p style={{ fontSize: 12, color: "#A3311E", margin: 0 }}>{submitError}</p>}
 <button onClick={submit} disabled={submitting || (!content.trim() && !file) || (isOverdue(selected) && !selected.allow_late)}
 style={{ padding: "10px 20px", borderRadius: 9, background: S.accent, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", alignSelf: "flex-start", opacity: (submitting || (!content.trim() && !file)) ? 0.5 : 1 }}>
 {submitting ? "Submitting…" : selected.mySubmission ? "Update Submission" : "Submit"}
 </button>
 </div>
 )}
 </>
 )}
 </div>
 </div>
 );
}
