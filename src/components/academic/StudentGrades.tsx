"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { GRADE_COLOR } from "@/lib/grading";
import { generateReportCardPdf } from "@/lib/reportCard";

interface GradeRecord { id: string; term: number; academic_year: string; score: number | null; grade: string | null; teacher_comment: string | null; class_rank: number | null; locked: boolean; class: { name: string; subject: string } }
const S = { border: "rgba(28,38,32,0.07)", text: "#1C2620", muted: "#566257", dim: "#6E7A6C", accent: "#B1502B" };

export function StudentGrades({ profileId }: { profileId: string; parentView?: boolean }) {
 const supabase = createClient();
 const [grades, setGrades] = useState<GradeRecord[]>([]);
 const [term, setTerm] = useState<number | "all">("all");
 const [year, setYear] = useState(new Date().getFullYear().toString());
 const [loading, setLoading] = useState(true);
 const [generating, setGenerating] = useState(false);

 useEffect(() => { load(); }, [profileId, year]); // eslint-disable-line react-hooks/exhaustive-deps

 const load = async () => {
 setLoading(true);
 const { data } = await (supabase.from("grades") as any)
 .select("id,term,academic_year,score,grade,teacher_comment,class_rank,locked,class:classes(name,subject)")
 .eq("student_id", profileId).eq("academic_year", year).order("term").order("created_at");
 setGrades(data ?? []);
 setLoading(false);
 };

 const filtered = term === "all" ? grades : grades.filter(g => g.term === term);
 const avg = () => {
 const scores = filtered.filter(g => g.score !== null).map(g => g.score!);
 if (scores.length === 0) return null;
 return (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1);
 };

 const downloadReportCard = async () => {
 if (term === "all" || generating) return;
 setGenerating(true);
 const { data: profile } = await (supabase.from("profiles") as any)
 .select("full_name,school_name").eq("id", profileId).single();

 const { data: attendance } = await (supabase.from("attendance") as any)
 .select("status").eq("student_id", profileId).like("date", `${year}%`);
 const attList = attendance ?? [];
 const attPresent = attList.filter((a: any) => a.status === "present" || a.status === "late").length;
 const attTotal = attList.length;

 generateReportCardPdf({
 schoolName: profile?.school_name || "EduOnLink School",
 studentName: profile?.full_name ?? "Student",
 term,
 academicYear: year,
 subjects: filtered.map(g => ({
 subject: g.class?.subject ?? "Unknown",
 className: g.class?.name ?? "",
 score: g.score,
 grade: g.grade,
 classRank: g.class_rank,
 teacherComment: g.teacher_comment,
 })),
 attendanceRate: attTotal > 0 ? Math.round((attPresent / attTotal) * 100) : null,
 attendancePresent: attPresent,
 attendanceTotal: attTotal,
 });
 setGenerating(false);
 };

 const inp: React.CSSProperties = { padding: "9px 12px", background: "rgba(28,38,32,0.04)", border: `1px solid ${S.border}`, borderRadius: 9, color: S.text, fontSize: 13, outline: "none" };

 return (
 <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
 <select value={term} onChange={e => setTerm(e.target.value === "all" ? "all" : Number(e.target.value))} style={inp}>
 <option value="all">All Terms</option>
 <option value={1}>Term 1</option>
 <option value={2}>Term 2</option>
 <option value={3}>Term 3</option>
 </select>
 <select value={year} onChange={e => setYear(e.target.value)} style={inp}>
 {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y.toString()} style={{ background: "#F2EEE3" }}>{y}</option>)}
 </select>
 <button onClick={downloadReportCard} disabled={term === "all" || generating}
 title={term === "all" ? "Select a specific term to download a report card" : undefined}
 style={{ padding: "9px 16px", borderRadius: 9, background: "rgba(28,38,32,0.05)", border: `1px solid ${S.border}`, color: S.muted, fontSize: 12, cursor: term === "all" ? "not-allowed" : "pointer", opacity: term === "all" ? 0.5 : 1 }}>
 {generating ? "Generating…" : " Download Report Card (PDF)"}
 </button>
 </div>

 {/* Summary cards */}
 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10 }}>
 {[
 { label: "Subjects", value: Array.from(new Set(filtered.map(g => g.class?.subject))).length, color: S.accent },
 { label: "Average", value: avg() ? `${avg()}%` : "—", color: "#A9873F" },
 { label: "A Grades", value: filtered.filter(g => g.grade === "A").length, color: "#1F4738" },
 ].map(stat => (
 <div key={stat.label} style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "14px 16px" }}>
 <p style={{ fontSize: 11, color: S.dim, margin: "0 0 4px" }}>{stat.label}</p>
 <p style={{ fontSize: 22, fontWeight: 700, color: stat.color, fontFamily: "inherit", margin: 0 }}>{stat.value}</p>
 </div>
 ))}
 </div>

 {loading && <p style={{ fontSize: 13, color: S.dim }}>Loading grades…</p>}

 {!loading && filtered.length === 0 && (
 <div style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: "40px", textAlign: "center" }}>
 <p style={{ fontSize: 14, color: S.dim }}>No grades recorded yet for {year}.</p>
 </div>
 )}

 {/* Term groups */}
 {[1, 2, 3].filter(t => term === "all" || t === term).map(t => {
 const termGrades = filtered.filter(g => g.term === t);
 if (termGrades.length === 0) return null;
 return (
 <div key={t}>
 <h3 style={{ fontSize: 14, fontWeight: 700, color: S.text, fontFamily: "inherit", margin: "0 0 12px" }}>Term {t}</h3>
 <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
 {termGrades.map(g => {
 const gl = g.grade ? { l: g.grade, c: GRADE_COLOR[g.grade] ?? S.muted } : null;
 const pct = g.score !== null ? g.score : null;
 return (
 <div key={g.id} style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "14px 16px" }}>
 <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
 {gl && (
 <div style={{ width: 46, height: 46, borderRadius: 13, background: `${gl.c}15`, border: `1px solid ${gl.c}30`, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
 <span style={{ fontSize: 18, fontWeight: 700, color: gl.c }}>{gl.l}</span>
 </div>
 )}
 <div style={{ flex: 1 }}>
 <p style={{ fontSize: 13, fontWeight: 600, color: S.text, margin: "0 0 2px" }}>{g.class?.subject ?? "Unknown"}</p>
 <p style={{ fontSize: 11, color: S.dim, margin: 0 }}>
 {g.class?.name}
 {g.class_rank && ` · Rank #${g.class_rank} in class`}
 {g.locked && " · Locked"}
 </p>
 </div>
 {pct !== null && (
 <div style={{ textAlign: "right" }}>
 <p style={{ fontSize: 18, fontWeight: 700, color: gl?.c ?? S.muted, fontFamily: "inherit", margin: 0 }}>{pct}%</p>
 </div>
 )}
 </div>
 {pct !== null && (
 <div style={{ marginTop: 10 }}>
 <div style={{ height: 5, background: "rgba(28,38,32,0.06)", borderRadius: 3 }}>
 <div style={{ height: "100%", width: `${pct}%`, background: gl?.c ?? S.accent, borderRadius: 3, transition: "width 0.4s" }} />
 </div>
 </div>
 )}
 {g.teacher_comment && (
 <p style={{ fontSize: 12, color: S.muted, margin: "8px 0 0", lineHeight: 1.5, fontStyle: "italic" }}>&ldquo;{g.teacher_comment}&rdquo;</p>
 )}
 </div>
 );
 })}
 </div>
 </div>
 );
 })}
 </div>
 );
}
