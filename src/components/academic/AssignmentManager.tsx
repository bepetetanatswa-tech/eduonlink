"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Cls { id: string; name: string; subject: string }
interface Assignment {
  id: string; class_id: string; title: string; description: string | null;
  instructions: string | null; due_date: string | null; max_score: number;
  attachment_url: string | null; rubric: string | null; allow_late: boolean;
  created_at: string;
  submissions?: Submission[];
}
interface Submission {
  id: string; student_id: string; content: string | null; file_url: string | null;
  score: number | null; feedback: string | null; submitted_at: string; status: string; is_late: boolean;
  student: { full_name: string; avatar_url: string | null };
}

const S = { border: "rgba(255,255,255,0.07)", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170", accent: "#4D7FFF" };
const inp: React.CSSProperties = { width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`, borderRadius: 9, color: S.text, fontSize: 13, outline: "none", boxSizing: "border-box" };

export function AssignmentManager({ profileId }: { profileId: string }) {
  const supabase = createClient();
  const [classes, setClasses] = useState<Cls[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [view, setView] = useState<"list"|"create"|"grade">("list");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Form state
  const [fTitle, setFTitle] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fInstructions, setFInstructions] = useState("");
  const [fDue, setFDue] = useState("");
  const [fMax, setFMax] = useState("100");
  const [fRubric, setFRubric] = useState("");
  const [fAllowLate, setFAllowLate] = useState(true);
  const [fFile, setFFile] = useState<File | null>(null);

  // Grading
  const [grades, setGrades] = useState<Record<string, { score: string; feedback: string }>>({});

  useEffect(() => {
    (supabase.from("classes") as any).select("id,name,subject").eq("teacher_id", profileId).order("name")
      .then(({ data }: any) => {
        const list = data ?? [];
        setClasses(list);
        if (list.length > 0) setSelectedClass(list[0].id);
      });
  }, [profileId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (selectedClass) loadAssignments(); }, [selectedClass]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadAssignments = async () => {
    const { data } = await (supabase.from("assignments") as any)
      .select("*").eq("class_id", selectedClass).order("created_at", { ascending: false });
    setAssignments(data ?? []);
  };

  const loadSubmissions = async (a: Assignment) => {
    const { data } = await (supabase.from("submissions") as any)
      .select("*, student:profiles!submissions_student_id_fkey(full_name,avatar_url)")
      .eq("assignment_id", a.id).order("submitted_at");
    const enriched = { ...a, submissions: data ?? [] };
    setSelectedAssignment(enriched);
    const g: Record<string, { score: string; feedback: string }> = {};
    (data ?? []).forEach((s: Submission) => {
      g[s.id] = { score: s.score?.toString() ?? "", feedback: s.feedback ?? "" };
    });
    setGrades(g);
    setView("grade");
  };

  const createAssignment = async () => {
    if (!fTitle.trim() || !selectedClass) return;
    setSaving(true);
    let attachmentUrl: string | null = null;
    if (fFile) {
      setUploading(true);
      const ext = fFile.name.split(".").pop();
      const path = `assignments/${selectedClass}/${Date.now()}.${ext}`;
      await supabase.storage.from("course-materials").upload(path, fFile, { upsert: true });
      const { data: u } = supabase.storage.from("course-materials").getPublicUrl(path);
      attachmentUrl = u.publicUrl;
      setUploading(false);
    }
    await (supabase.from("assignments") as any).insert({
      class_id: selectedClass, title: fTitle.trim(),
      description: fDesc.trim() || null, instructions: fInstructions.trim() || null,
      due_date: fDue || null, max_score: parseFloat(fMax) || 100,
      attachment_url: attachmentUrl, rubric: fRubric.trim() || null,
      allow_late: fAllowLate, created_by: profileId,
    });
    setSaving(false);
    setFTitle(""); setFDesc(""); setFInstructions(""); setFDue(""); setFMax("100"); setFRubric(""); setFFile(null);
    setView("list");
    loadAssignments();
  };

  const saveGrade = async (submissionId: string) => {
    const g = grades[submissionId];
    if (!g) return;
    await (supabase.from("submissions") as any).update({
      score: g.score ? parseFloat(g.score) : null,
      feedback: g.feedback || null,
      status: "graded",
      graded_at: new Date().toISOString(),
      graded_by: profileId,
    }).eq("id", submissionId);
    if (selectedAssignment) loadSubmissions(selectedAssignment);
  };

  const deleteAssignment = async (id: string) => {
    if (!confirm("Delete this assignment and all submissions?")) return;
    await (supabase.from("assignments") as any).delete().eq("id", id);
    loadAssignments();
    setView("list");
  };

  const isOverdue = (due: string | null) => due ? new Date(due) < new Date() : false;
  const gradeLetter = (score: number, max: number) => {
    const pct = (score / max) * 100;
    if (pct >= 80) return { l: "A", c: "#00E5A3" };
    if (pct >= 65) return { l: "B", c: "#4D7FFF" };
    if (pct >= 50) return { l: "C", c: "#F5A623" };
    if (pct >= 40) return { l: "D", c: "#FF9B6B" };
    return { l: "F", c: "#FF6B6B" };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <select value={selectedClass} onChange={e => { setSelectedClass(e.target.value); setView("list"); setSelectedAssignment(null); }}
          style={{ ...inp, width: "auto", minWidth: 180 }}>
          {classes.map(c => <option key={c.id} value={c.id} style={{ background: "#0E1117" }}>{c.name} — {c.subject}</option>)}
        </select>
        {view !== "create" && (
          <button onClick={() => setView("create")}
            style={{ padding: "9px 16px", borderRadius: 9, background: S.accent, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
            + Create Assignment
          </button>
        )}
        {view !== "list" && (
          <button onClick={() => setView("list")}
            style={{ padding: "9px 16px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: `1px solid ${S.border}`, color: S.muted, fontSize: 13, cursor: "pointer" }}>
            ← Back
          </button>
        )}
      </div>

      {/* Create form */}
      {view === "create" && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 16, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
          <h3 style={{ fontSize: 15, fontWeight: 700, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>New Assignment</h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Title *</label>
              <input value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="Assignment title…" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Max Score</label>
              <input type="number" value={fMax} onChange={e => setFMax(e.target.value)} style={inp} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Description</label>
            <input value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Brief overview…" style={inp} />
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Instructions</label>
            <textarea value={fInstructions} onChange={e => setFInstructions(e.target.value)} rows={4}
              placeholder="Detailed instructions for students…" style={{ ...inp, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Due Date & Time</label>
              <input type="datetime-local" value={fDue} onChange={e => setFDue(e.target.value)} style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Attachment (optional)</label>
              <input type="file" accept=".pdf,.doc,.docx,.png,.jpg,.ppt,.pptx" onChange={e => setFFile(e.target.files?.[0] ?? null)} style={{ ...inp, padding: "7px 12px" }} />
            </div>
          </div>
          <div>
            <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Marking Rubric (optional)</label>
            <textarea value={fRubric} onChange={e => setFRubric(e.target.value)} rows={3}
              placeholder="Marking criteria, e.g. 'Clarity 20pts, Structure 30pts, Content 50pts'…"
              style={{ ...inp, resize: "vertical", fontFamily: "inherit" }} />
          </div>
          <div onClick={() => setFAllowLate(!fAllowLate)} style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
            <div style={{ width: 36, height: 20, borderRadius: 10, background: fAllowLate ? S.accent : "rgba(255,255,255,0.1)", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: fAllowLate ? 19 : 3, transition: "left 0.2s" }} />
            </div>
            <span style={{ fontSize: 13, color: S.muted }}>Allow late submissions</span>
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button onClick={() => setView("list")} style={{ padding: "9px 18px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: `1px solid ${S.border}`, color: S.muted, fontSize: 13, cursor: "pointer" }}>Cancel</button>
            <button onClick={createAssignment} disabled={saving || uploading || !fTitle.trim()}
              style={{ padding: "9px 18px", borderRadius: 9, background: S.accent, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: (saving || uploading || !fTitle.trim()) ? 0.5 : 1 }}>
              {uploading ? "Uploading…" : saving ? "Creating…" : "Create Assignment"}
            </button>
          </div>
        </div>
      )}

      {/* Assignment list */}
      {view === "list" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {assignments.length === 0 && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: "40px", textAlign: "center" }}>
              <p style={{ fontSize: 14, color: S.dim }}>No assignments for this class yet.</p>
            </div>
          )}
          {assignments.map(a => {
            const overdue = isOverdue(a.due_date);
            return (
              <div key={a.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: S.text, margin: 0 }}>{a.title}</p>
                      {overdue && <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20, background: "rgba(255,107,107,0.15)", color: "#FF6B6B", fontWeight: 600 }}>Past Due</span>}
                    </div>
                    {a.description && <p style={{ fontSize: 12, color: S.muted, margin: "0 0 6px", lineHeight: 1.4 }}>{a.description}</p>}
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
                      <span style={{ fontSize: 11, color: S.dim }}>Max: {a.max_score} pts</span>
                      {a.due_date && <span style={{ fontSize: 11, color: overdue ? "#FF6B6B" : S.dim }}>Due: {new Date(a.due_date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}</span>}
                      <span style={{ fontSize: 11, color: a.allow_late ? "#00E5A3" : "#FF6B6B" }}>{a.allow_late ? "Late OK" : "No late"}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                    <button onClick={() => loadSubmissions(a)}
                      style={{ padding: "8px 14px", borderRadius: 9, background: "rgba(77,127,255,0.1)", border: `1px solid rgba(77,127,255,0.2)`, color: "#4D7FFF", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                      Grade
                    </button>
                    <button onClick={() => deleteAssignment(a.id)}
                      style={{ padding: "8px 14px", borderRadius: 9, background: "rgba(255,107,107,0.08)", border: `1px solid rgba(255,107,107,0.2)`, color: "#FF6B6B", fontSize: 12, cursor: "pointer" }}>
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Grading view */}
      {view === "grade" && selectedAssignment && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: "16px 20px" }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: "0 0 4px" }}>{selectedAssignment.title}</h3>
            <div style={{ display: "flex", gap: 16 }}>
              <span style={{ fontSize: 12, color: S.dim }}>Max score: {selectedAssignment.max_score}</span>
              <span style={{ fontSize: 12, color: S.dim }}>{selectedAssignment.submissions?.length ?? 0} submission{selectedAssignment.submissions?.length !== 1 ? "s" : ""}</span>
            </div>
            {selectedAssignment.rubric && (
              <div style={{ marginTop: 10, padding: "10px 14px", background: "rgba(77,127,255,0.05)", border: `1px solid rgba(77,127,255,0.1)`, borderRadius: 9 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: "#4D7FFF", margin: "0 0 4px" }}>Marking Rubric</p>
                <p style={{ fontSize: 12, color: S.muted, margin: 0, lineHeight: 1.5, whiteSpace: "pre-wrap" }}>{selectedAssignment.rubric}</p>
              </div>
            )}
          </div>

          {(selectedAssignment.submissions ?? []).length === 0 ? (
            <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "32px", textAlign: "center" }}>
              <p style={{ fontSize: 14, color: S.dim }}>No submissions yet.</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {(selectedAssignment.submissions ?? []).map(s => {
                const g = grades[s.id] ?? { score: "", feedback: "" };
                const gl = s.score !== null ? gradeLetter(s.score, selectedAssignment.max_score) : null;
                return (
                  <div key={s.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "16px 20px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                      <div style={{ width: 32, height: 32, borderRadius: 9, background: "linear-gradient(135deg, #4D7FFF, #2D5BDF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                        {s.student.full_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                      </div>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: S.text, margin: 0 }}>{s.student.full_name}</p>
                        <div style={{ display: "flex", gap: 10 }}>
                          <span style={{ fontSize: 11, color: S.dim }}>{new Date(s.submitted_at).toLocaleDateString("en-GB")}</span>
                          {s.is_late && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 20, background: "rgba(255,165,0,0.15)", color: "#F5A623", fontWeight: 600 }}>LATE</span>}
                          <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 20,
                            background: s.status === "graded" ? "rgba(0,229,163,0.15)" : "rgba(255,255,255,0.06)",
                            color: s.status === "graded" ? "#00E5A3" : S.dim, fontWeight: 600 }}>
                            {s.status?.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      {gl && (
                        <div style={{ width: 44, height: 44, borderRadius: 12, background: `${gl.c}15`, border: `1px solid ${gl.c}30`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: 16, fontWeight: 700, color: gl.c }}>{gl.l}</span>
                          <span style={{ fontSize: 9, color: S.dim }}>{s.score}/{selectedAssignment.max_score}</span>
                        </div>
                      )}
                    </div>

                    {s.content && (
                      <div style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${S.border}`, borderRadius: 9, padding: "10px 14px", marginBottom: 12 }}>
                        <p style={{ fontSize: 11, fontWeight: 600, color: S.dim, margin: "0 0 4px" }}>Student submission</p>
                        <p style={{ fontSize: 12, color: S.muted, margin: 0, lineHeight: 1.6, whiteSpace: "pre-wrap" }}>{s.content}</p>
                      </div>
                    )}
                    {s.file_url && (
                      <a href={s.file_url} target="_blank" rel="noreferrer"
                        style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 12, color: S.accent, background: "rgba(77,127,255,0.08)", border: `1px solid rgba(77,127,255,0.15)`, padding: "6px 12px", borderRadius: 8, textDecoration: "none", marginBottom: 12 }}>
                        📎 View submitted file
                      </a>
                    )}

                    <div style={{ display: "grid", gridTemplateColumns: "120px 1fr auto", gap: 10, alignItems: "flex-end" }}>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 4 }}>Score / {selectedAssignment.max_score}</label>
                        <input type="number" value={g.score} onChange={e => setGrades(prev => ({ ...prev, [s.id]: { ...prev[s.id], score: e.target.value } }))}
                          min="0" max={selectedAssignment.max_score} style={inp} />
                      </div>
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 4 }}>Written Feedback</label>
                        <input value={g.feedback} onChange={e => setGrades(prev => ({ ...prev, [s.id]: { ...prev[s.id], feedback: e.target.value } }))}
                          placeholder="Feedback for student…" style={inp} />
                      </div>
                      <button onClick={() => saveGrade(s.id)}
                        style={{ padding: "9px 16px", borderRadius: 9, background: S.accent, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>
                        Return Grade
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
