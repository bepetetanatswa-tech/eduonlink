"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Cls { id: string; name: string; subject: string }
interface Student { id: string; full_name: string }
interface GradeEntry { id?: string; student_id: string; score: string; comment: string }

const GRADE = (score: number) => {
  if (score >= 80) return { l: "A", c: "#00E5A3" };
  if (score >= 65) return { l: "B", c: "#4D7FFF" };
  if (score >= 50) return { l: "C", c: "#F5A623" };
  if (score >= 40) return { l: "D", c: "#FF9B6B" };
  return { l: "F", c: "#FF6B6B" };
};

const S = { border: "rgba(255,255,255,0.07)", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170", accent: "#4D7FFF" };

export function GradeBook({ profileId }: { profileId: string }) {
  const supabase = createClient();
  const [classes, setClasses] = useState<Cls[]>([]);
  const [classId, setClassId] = useState("");
  const [term, setTerm] = useState(1);
  const [year, setYear] = useState(new Date().getFullYear().toString());
  const [students, setStudents] = useState<Student[]>([]);
  const [grades, setGrades] = useState<Record<string, GradeEntry>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    (supabase.from("classes") as any).select("id,name,subject").eq("teacher_id", profileId).order("name")
      .then(({ data }: any) => {
        const list = data ?? [];
        setClasses(list);
        if (list.length > 0) setClassId(list[0].id);
      });
  }, [profileId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (classId) loadGrades(); }, [classId, term, year]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadGrades = async () => {
    const { data: enroll } = await (supabase.from("class_enrollments") as any)
      .select("student:profiles!class_enrollments_student_id_fkey(id,full_name)")
      .eq("class_id", classId).eq("status", "active");
    const studs = (enroll ?? []).map((e: any) => e.student).filter(Boolean);
    setStudents(studs);

    const { data: existing } = await (supabase.from("grades") as any)
      .select("id,student_id,score,grade,teacher_comment")
      .eq("class_id", classId).eq("term", term).eq("academic_year", year);

    const map: Record<string, GradeEntry> = {};
    studs.forEach((s: Student) => { map[s.id] = { student_id: s.id, score: "", comment: "" }; });
    (existing ?? []).forEach((g: any) => {
      map[g.student_id] = { id: g.id, student_id: g.student_id, score: g.score?.toString() ?? "", comment: g.teacher_comment ?? "" };
    });
    setGrades(map);
  };

  const setScore = (sid: string, score: string) => setGrades(prev => ({ ...prev, [sid]: { ...prev[sid], score } }));
  const setComment = (sid: string, comment: string) => setGrades(prev => ({ ...prev, [sid]: { ...prev[sid], comment } }));

  const saveAll = async () => {
    setSaving(true);
    const cls = classes.find(c => c.id === classId);
    const records = students
      .filter(s => grades[s.id]?.score !== "")
      .map(s => {
        const sc = parseFloat(grades[s.id].score);
        const gl = isNaN(sc) ? null : GRADE(sc).l;
        return {
          student_id: s.id, class_id: classId, term, academic_year: year,
          score: isNaN(sc) ? null : sc, grade: gl,
          teacher_comment: grades[s.id].comment || null,
          subject_id: null,
        };
      });
    if (records.length > 0) {
      await (supabase.from("grades") as any).upsert(records, { onConflict: "student_id,class_id,term,academic_year" });
    }
    // Notify students server-side (SECURITY DEFINER RPC, migration 032) —
    // the notifications RLS insert policy only allows user_id =
    // get_my_profile_id(), so this used to insert rows for other users
    // (students) directly, which RLS silently rejected.
    const gradedStudents = students.filter(s => grades[s.id]?.score !== "");
    if (gradedStudents.length > 0) {
      await supabase.rpc("notify_grades_posted", {
        p_class_id: classId,
        p_student_ids: gradedStudents.map(s => s.id),
        p_term: term,
        p_subject: cls?.subject ?? "",
      } as any);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    loadGrades();
  };

  const avgScore = () => {
    const scores = students.map(s => parseFloat(grades[s.id]?.score ?? "")).filter(n => !isNaN(n));
    if (scores.length === 0) return null;
    return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
  };

  const inp: React.CSSProperties = { padding: "8px 12px", background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`, borderRadius: 9, color: S.text, fontSize: 13, outline: "none" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <select value={classId} onChange={e => setClassId(e.target.value)} style={inp}>
          {classes.map(c => <option key={c.id} value={c.id} style={{ background: "#0E1117" }}>{c.name} — {c.subject}</option>)}
        </select>
        <select value={term} onChange={e => setTerm(Number(e.target.value))} style={inp}>
          <option value={1} style={{ background: "#0E1117" }}>Term 1</option>
          <option value={2} style={{ background: "#0E1117" }}>Term 2</option>
          <option value={3} style={{ background: "#0E1117" }}>Term 3</option>
        </select>
        <select value={year} onChange={e => setYear(e.target.value)} style={inp}>
          {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y.toString()} style={{ background: "#0E1117" }}>{y}</option>)}
        </select>
      </div>

      {saved && <div style={{ padding: "10px 16px", borderRadius: 10, background: "rgba(0,229,163,0.1)", border: "1px solid rgba(0,229,163,0.25)", color: "#00E5A3", fontSize: 13 }}>✓ Grades saved and students notified</div>}

      {/* Summary */}
      {students.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10 }}>
          {[
            { label: "Students", value: students.length, color: S.accent },
            { label: "Graded", value: students.filter(s => grades[s.id]?.score !== "").length, color: "#00E5A3" },
            { label: "Class Average", value: avgScore() ? `${avgScore()}%` : "—", color: "#F5A623" },
          ].map(stat => (
            <div key={stat.label} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "14px 16px" }}>
              <p style={{ fontSize: 11, color: S.dim, margin: "0 0 4px" }}>{stat.label}</p>
              <p style={{ fontSize: 22, fontWeight: 700, color: stat.color, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>{stat.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Grade table */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {students.length === 0 && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "32px", textAlign: "center" }}>
            <p style={{ color: S.dim, fontSize: 14 }}>No enrolled students for this class.</p>
          </div>
        )}
        {students
          .slice()
          .sort((a, b) => {
            const sa = parseFloat(grades[a.id]?.score ?? "0");
            const sb = parseFloat(grades[b.id]?.score ?? "0");
            return sb - sa;
          })
          .map((s, rank) => {
            const g = grades[s.id] ?? { score: "", comment: "" };
            const sc = parseFloat(g.score);
            const gl = !isNaN(sc) && g.score !== "" ? GRADE(sc) : null;
            return (
              <div key={s.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <span style={{ fontSize: 12, color: S.dim, width: 24, flexShrink: 0 }}>#{rank + 1}</span>
                  <p style={{ fontSize: 13, fontWeight: 500, color: S.text, margin: 0, flex: 1, minWidth: 120 }}>{s.full_name}</p>
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div>
                      <label style={{ fontSize: 10, color: S.dim, display: "block", marginBottom: 3 }}>Score / 100</label>
                      <input type="number" min="0" max="100" value={g.score}
                        onChange={e => setScore(s.id, e.target.value)}
                        style={{ ...inp, width: 80 }} />
                    </div>
                    {gl && (
                      <div style={{ width: 42, height: 42, borderRadius: 11, background: `${gl.c}15`, border: `1px solid ${gl.c}30`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <span style={{ fontSize: 18, fontWeight: 700, color: gl.c }}>{gl.l}</span>
                      </div>
                    )}
                    <div style={{ minWidth: 200 }}>
                      <label style={{ fontSize: 10, color: S.dim, display: "block", marginBottom: 3 }}>Teacher comment</label>
                      <input value={g.comment} onChange={e => setComment(s.id, e.target.value)}
                        placeholder="Optional comment…" style={{ ...inp, width: "100%" }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
      </div>

      {students.length > 0 && (
        <button onClick={saveAll} disabled={saving}
          style={{ padding: "11px 24px", borderRadius: 10, background: S.accent, border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", alignSelf: "flex-start", opacity: saving ? 0.6 : 1, fontFamily: "'Space Grotesk',sans-serif" }}>
          {saving ? "Saving…" : "Save All Grades"}
        </button>
      )}
    </div>
  );
}
