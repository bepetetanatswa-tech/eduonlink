"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Cls { id: string; name: string; subject: string }
interface StudentStat { id: string; full_name: string; present: number; total: number }

const STATUS_COLORS: Record<string, string> = {
  present: "#1F4738", absent: "#A3311E", late: "#A9873F", excused: "#B1502B",
};
const S = { border: "rgba(28,38,32,0.07)", text: "#1C2620", muted: "#566257", dim: "#6E7A6C", accent: "#B1502B" };

export function SchoolAttendanceDashboard({ schoolId }: { schoolId: string }) {
  const supabase = createClient();
  const [classes, setClasses] = useState<Cls[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [tab, setTab] = useState<"today" | "atrisk">("today");
  const [dayCounts, setDayCounts] = useState<Record<string, Record<string, number>>>({});
  const [atRisk, setAtRisk] = useState<StudentStat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (supabase.from("classes") as any).select("id,name,subject").eq("school_id", schoolId).order("name")
      .then(({ data }: any) => setClasses(data ?? []));
  }, [schoolId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (classes.length === 0) { setLoading(false); return; }
    if (tab === "today") loadDay();
    if (tab === "atrisk") loadAtRisk();
  }, [tab, date, classes]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDay = async () => {
    setLoading(true);
    const classIds = classes.map(c => c.id);
    const { data } = await (supabase.from("attendance") as any)
      .select("class_id,status").in("class_id", classIds).eq("date", date);
    const counts: Record<string, Record<string, number>> = {};
    classes.forEach(c => { counts[c.id] = { present: 0, absent: 0, late: 0, excused: 0 }; });
    (data ?? []).forEach((r: any) => { if (counts[r.class_id]) counts[r.class_id][r.status] = (counts[r.class_id][r.status] ?? 0) + 1; });
    setDayCounts(counts);
    setLoading(false);
  };

  const loadAtRisk = async () => {
    setLoading(true);
    const classIds = classes.map(c => c.id);
    const [y, m] = date.split("-");
    const start = `${y}-${m}-01`, end = `${y}-${m}-31`;
    const { data } = await (supabase.from("attendance") as any)
      .select("student_id,status,student:profiles!attendance_student_id_fkey(full_name)")
      .in("class_id", classIds).gte("date", start).lte("date", end);
    const stats: Record<string, StudentStat> = {};
    (data ?? []).forEach((r: any) => {
      if (!stats[r.student_id]) stats[r.student_id] = { id: r.student_id, full_name: r.student?.full_name ?? "Unknown", present: 0, total: 0 };
      stats[r.student_id].total++;
      if (r.status === "present" || r.status === "late") stats[r.student_id].present++;
    });
    const list = Object.values(stats).filter(s => s.total > 0 && (s.present / s.total) < 0.8).sort((a, b) => (a.present / a.total) - (b.present / b.total));
    setAtRisk(list);
    setLoading(false);
  };

  const inp: React.CSSProperties = { padding: "9px 12px", background: "rgba(28,38,32,0.04)", border: `1px solid ${S.border}`, borderRadius: 9, color: S.text, fontSize: 13, outline: "none" };

  const totals = classes.reduce((acc, c) => {
    const d = dayCounts[c.id] ?? { present: 0, absent: 0, late: 0, excused: 0 };
    acc.present += d.present; acc.absent += d.absent; acc.late += d.late; acc.excused += d.excused;
    return acc;
  }, { present: 0, absent: 0, late: 0, excused: 0 });
  const totalMarked = totals.present + totals.absent + totals.late + totals.excused;
  const schoolRate = totalMarked > 0 ? Math.round(((totals.present + totals.late) / totalMarked) * 100) : null;

  if (classes.length === 0) return (
    <div style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: "40px", textAlign: "center" }}>
      <p style={{ color: S.dim, fontSize: 14 }}>No classes at this school yet.</p>
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={inp} />
        <div style={{ display: "flex", borderRadius: 9, overflow: "hidden", border: `1px solid ${S.border}` }}>
          {(["today", "atrisk"] as const).map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding: "9px 16px", background: tab === t ? "rgba(177,80,43,0.15)" : "rgba(28,38,32,0.02)", border: "none", color: tab === t ? "#B1502B" : S.muted, fontSize: 12, fontWeight: tab === t ? 600 : 400, cursor: "pointer" }}>
              {t === "today" ? "Day View" : "At-Risk Students"}
            </button>
          ))}
        </div>
      </div>

      {loading && <p style={{ fontSize: 13, color: S.dim }}>Loading…</p>}

      {!loading && tab === "today" && (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(160px,1fr))", gap: 10 }}>
            <div style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "14px 16px" }}>
              <p style={{ fontSize: 11, color: S.dim, margin: "0 0 4px" }}>School attendance rate</p>
              <p style={{ fontSize: 24, fontWeight: 700, color: schoolRate === null ? S.dim : schoolRate >= 80 ? "#1F4738" : schoolRate >= 60 ? "#A9873F" : "#A3311E", fontFamily: "inherit", margin: 0 }}>{schoolRate === null ? "—" : `${schoolRate}%`}</p>
            </div>
            {Object.entries(STATUS_COLORS).map(([status, color]) => (
              <div key={status} style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "14px 16px" }}>
                <p style={{ fontSize: 11, color: S.dim, margin: "0 0 4px", textTransform: "capitalize" }}>{status}</p>
                <p style={{ fontSize: 22, fontWeight: 700, color, fontFamily: "inherit", margin: 0 }}>{(totals as any)[status]}</p>
              </div>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {classes.map(c => {
              const d = dayCounts[c.id] ?? { present: 0, absent: 0, late: 0, excused: 0 };
              const marked = d.present + d.absent + d.late + d.excused;
              const rate = marked > 0 ? Math.round(((d.present + d.late) / marked) * 100) : null;
              return (
                <div key={c.id} style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: S.text, margin: 0 }}>{c.subject}</p>
                    <p style={{ fontSize: 11, color: S.dim, margin: "2px 0 0" }}>{c.name}</p>
                  </div>
                  {marked === 0 ? (
                    <span style={{ fontSize: 12, color: S.dim }}>Not marked yet</span>
                  ) : (
                    <>
                      <span style={{ fontSize: 15, fontWeight: 700, color: rate! >= 80 ? "#1F4738" : rate! >= 60 ? "#A9873F" : "#A3311E" }}>{rate}%</span>
                      <span style={{ fontSize: 11, color: S.dim }}>{d.present}P · {d.absent}A · {d.late}L · {d.excused}E</span>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {!loading && tab === "atrisk" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          <p style={{ fontSize: 12, color: S.dim, margin: 0 }}>Students below 80% attendance for {new Date(date).toLocaleDateString("en-GB", { month: "long", year: "numeric" })}</p>
          {atRisk.length === 0 ? (
            <div style={{ background: "rgba(31,71,56,0.06)", border: "1px solid rgba(31,71,56,0.2)", borderRadius: 12, padding: "24px", textAlign: "center" }}>
              <p style={{ color: "#1F4738", fontSize: 13 }}>No at-risk students this month.</p>
            </div>
          ) : atRisk.map(s => {
            const pct = Math.round((s.present / s.total) * 100);
            return (
              <div key={s.id} style={{ background: "rgba(163,49,30,0.05)", border: "1px solid rgba(163,49,30,0.15)", borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <p style={{ flex: 1, fontSize: 13, fontWeight: 500, color: S.text, margin: 0 }}>{s.full_name}</p>
                <span style={{ fontSize: 15, fontWeight: 700, color: "#A3311E" }}>{pct}%</span>
                <span style={{ fontSize: 11, color: S.dim }}>{s.present}/{s.total} days</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
