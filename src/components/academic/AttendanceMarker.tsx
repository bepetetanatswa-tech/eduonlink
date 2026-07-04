"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Cls { id: string; name: string; subject: string }
interface Student { id: string; full_name: string; avatar_url: string | null }
interface AttRow { student_id: string; status: string; reason: string }

const STATUS_COLORS: Record<string, string> = {
  present: "#00E5A3", absent: "#FF6B6B", late: "#F5A623", excused: "#4D7FFF",
};
const S = { border: "rgba(255,255,255,0.07)", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170", accent: "#4D7FFF" };

export function AttendanceMarker({ profileId }: { profileId: string }) {
  const supabase = createClient();
  const [classes, setClasses] = useState<Cls[]>([]);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [students, setStudents] = useState<Student[]>([]);
  const [rows, setRows] = useState<Record<string, AttRow>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [monthStats, setMonthStats] = useState<Record<string, { present: number; total: number }>>({});
  const [tab, setTab] = useState<"mark"|"report">("mark");

  useEffect(() => {
    (supabase.from("classes") as any).select("id,name,subject").eq("teacher_id", profileId).order("name")
      .then(({ data }: any) => {
        const list = data ?? [];
        setClasses(list);
        if (list.length > 0) setClassId(list[0].id);
      });
  }, [profileId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!classId) return;
    (supabase.from("class_enrollments") as any)
      .select("student:profiles!class_enrollments_student_id_fkey(id,full_name,avatar_url)")
      .eq("class_id", classId).eq("status", "active")
      .then(({ data }: any) => {
        const studs = (data ?? []).map((e: any) => e.student).filter(Boolean);
        setStudents(studs);
        initRows(studs, classId, date);
      });
  }, [classId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { if (classId && students.length > 0) initRows(students, classId, date); }, [date]); // eslint-disable-line react-hooks/exhaustive-deps

  const initRows = async (studs: Student[], cid: string, d: string) => {
    const { data: existing } = await (supabase.from("attendance") as any)
      .select("student_id,status,reason").eq("class_id", cid).eq("date", d);
    const map: Record<string, AttRow> = {};
    studs.forEach(s => { map[s.id] = { student_id: s.id, status: "present", reason: "" }; });
    (existing ?? []).forEach((r: any) => { map[r.student_id] = { student_id: r.student_id, status: r.status, reason: r.reason ?? "" }; });
    setRows(map);
  };

  const markAll = (status: string) => {
    setRows(prev => {
      const next = { ...prev };
      students.forEach(s => { next[s.id] = { ...next[s.id], status }; });
      return next;
    });
  };

  const setStatus = (sid: string, status: string) => setRows(prev => ({ ...prev, [sid]: { ...prev[sid], status } }));
  const setReason = (sid: string, reason: string) => setRows(prev => ({ ...prev, [sid]: { ...prev[sid], reason } }));

  const saveAttendance = async () => {
    setSaving(true);
    const records = students.map(s => ({
      class_id: classId, student_id: s.id, date,
      status: rows[s.id]?.status ?? "present",
      reason: rows[s.id]?.reason || null,
      marked_by: profileId,
    }));
    await (supabase.from("attendance") as any).upsert(records, { onConflict: "class_id,student_id,date" });
    // Notify parents of absent/late students, resolved via parent_children
    // (the previous version filtered profiles by role="parent" AND
    // id IN <the students' own ids>, which can never match anyone — it
    // never actually looked up each student's linked parent).
    const absentStudents = students.filter(s => rows[s.id]?.status === "absent" || rows[s.id]?.status === "late");
    if (absentStudents.length > 0) {
      const { data: links } = await (supabase.from("parent_children") as any)
        .select("parent_id, child_id").eq("status", "confirmed").in("child_id", absentStudents.map(s => s.id));
      const notifs = (links ?? []).map((l: any) => ({
        user_id: l.parent_id,
        title: "Attendance Alert",
        message: `${absentStudents.find(s => s.id === l.child_id)?.full_name ?? "Your child"} was marked ${rows[l.child_id]?.status ?? "absent"} on ${date}`,
        type: "warning",
      }));
      if (notifs.length > 0) await (supabase.from("notifications") as any).insert(notifs);
    }
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
    if (tab === "report") loadMonthStats();
  };

  const loadMonthStats = async () => {
    const [y, m] = date.split("-");
    const start = `${y}-${m}-01`, end = `${y}-${m}-31`;
    const { data } = await (supabase.from("attendance") as any)
      .select("student_id,status").eq("class_id", classId).gte("date", start).lte("date", end);
    const stats: Record<string, { present: number; total: number }> = {};
    (data ?? []).forEach((r: any) => {
      if (!stats[r.student_id]) stats[r.student_id] = { present: 0, total: 0 };
      stats[r.student_id].total++;
      if (r.status === "present" || r.status === "late") stats[r.student_id].present++;
    });
    setMonthStats(stats);
  };

  useEffect(() => { if (tab === "report" && classId) loadMonthStats(); }, [tab, classId, date]); // eslint-disable-line react-hooks/exhaustive-deps

  const inp: React.CSSProperties = { padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`, borderRadius: 9, color: S.text, fontSize: 13, outline: "none" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <select value={classId} onChange={e => setClassId(e.target.value)} style={inp}>
          {classes.map(c => <option key={c.id} value={c.id} style={{ background: "#0E1117" }}>{c.name} — {c.subject}</option>)}
        </select>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} />
        <div style={{ display: "flex", borderRadius: 9, overflow: "hidden", border: `1px solid ${S.border}` }}>
          {(["mark", "report"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "9px 16px", background: tab === t ? "rgba(77,127,255,0.15)" : "rgba(255,255,255,0.02)", border: "none", color: tab === t ? "#4D7FFF" : S.muted, fontSize: 12, fontWeight: tab === t ? 600 : 400, cursor: "pointer", textTransform: "capitalize" }}>
              {t === "mark" ? "Mark Attendance" : "Monthly Report"}
            </button>
          ))}
        </div>
      </div>

      {saved && <div style={{ padding: "10px 16px", borderRadius: 10, background: "rgba(0,229,163,0.1)", border: "1px solid rgba(0,229,163,0.25)", color: "#00E5A3", fontSize: 13 }}>✓ Attendance saved successfully</div>}

      {tab === "mark" && (
        <>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {["present", "absent", "late", "excused"].map(s => (
              <button key={s} onClick={() => markAll(s)}
                style={{ padding: "7px 14px", borderRadius: 9, border: `1px solid ${STATUS_COLORS[s]}30`, background: `${STATUS_COLORS[s]}10`, color: STATUS_COLORS[s], fontSize: 12, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
                All {s}
              </button>
            ))}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {students.length === 0 && <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "32px", textAlign: "center" }}><p style={{ color: S.dim, fontSize: 14 }}>No enrolled students.</p></div>}
            {students.map(s => {
              const row = rows[s.id] ?? { status: "present", reason: "" };
              return (
                <div key={s.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${STATUS_COLORS[row.status]}20`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ width: 34, height: 34, borderRadius: 9, background: "linear-gradient(135deg,#4D7FFF,#2D5BDF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                    {s.full_name.split(" ").map((w: string) => w[0]).slice(0, 2).join("")}
                  </div>
                  <p style={{ flex: 1, fontSize: 13, fontWeight: 500, color: S.text, margin: 0, minWidth: 120 }}>{s.full_name}</p>
                  <div style={{ display: "flex", gap: 6 }}>
                    {["present", "absent", "late", "excused"].map(st => (
                      <button key={st} onClick={() => setStatus(s.id, st)}
                        style={{ padding: "5px 10px", borderRadius: 7, border: `1px solid ${row.status === st ? STATUS_COLORS[st] : STATUS_COLORS[st] + "30"}`,
                          background: row.status === st ? `${STATUS_COLORS[st]}15` : "transparent",
                          color: row.status === st ? STATUS_COLORS[st] : S.dim, fontSize: 11, fontWeight: 600, cursor: "pointer", textTransform: "capitalize" }}>
                        {st}
                      </button>
                    ))}
                  </div>
                  {(row.status === "absent" || row.status === "excused") && (
                    <select value={row.reason} onChange={e => setReason(s.id, e.target.value)}
                      style={{ ...inp, padding: "5px 10px", fontSize: 11 }}>
                      <option value="" style={{ background: "#0E1117" }}>Reason…</option>
                      <option value="sick" style={{ background: "#0E1117" }}>Sick</option>
                      <option value="family" style={{ background: "#0E1117" }}>Family matter</option>
                      <option value="unknown" style={{ background: "#0E1117" }}>Unknown</option>
                    </select>
                  )}
                </div>
              );
            })}
          </div>
          {students.length > 0 && (
            <button onClick={saveAttendance} disabled={saving}
              style={{ padding: "11px 24px", borderRadius: 10, background: S.accent, border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", alignSelf: "flex-start", opacity: saving ? 0.6 : 1, fontFamily: "'Space Grotesk',sans-serif" }}>
              {saving ? "Saving…" : "Save Attendance"}
            </button>
          )}
        </>
      )}

      {tab === "report" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: 12, color: S.dim, margin: 0 }}>Monthly attendance for {new Date(date).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
          {students.map(s => {
            const stat = monthStats[s.id] ?? { present: 0, total: 0 };
            const pct = stat.total > 0 ? Math.round((stat.present / stat.total) * 100) : 0;
            const color = pct >= 80 ? "#00E5A3" : pct >= 60 ? "#F5A623" : "#FF6B6B";
            return (
              <div key={s.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <p style={{ flex: 1, fontSize: 13, fontWeight: 500, color: S.text, margin: 0 }}>{s.full_name}</p>
                  <span style={{ fontSize: 15, fontWeight: 700, color }}>{pct}%</span>
                  <span style={{ fontSize: 11, color: S.dim }}>{stat.present}/{stat.total} days</span>
                </div>
                <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 3 }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 3, transition: "width 0.4s" }} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
