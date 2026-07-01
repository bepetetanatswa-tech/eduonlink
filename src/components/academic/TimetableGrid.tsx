"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Slot {
  id: string; class_id: string | null; subject_name: string; teacher_id: string | null;
  day_of_week: number; period_number: number; start_time: string; end_time: string; room: string | null;
  class?: { name: string } | null; teacher?: { full_name: string } | null;
}

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const S = { border: "rgba(255,255,255,0.07)", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170" };
const COLORS = ["#4D7FFF", "#00E5A3", "#F5A623", "#FF6B6B", "#BD93F9", "#FF9B6B", "#00B4D8", "#50FA7B"];

export function TimetableGrid({ schoolId, classId, teacherId }: { schoolId?: string; classId?: string; teacherId?: string }) {
  const supabase = createClient();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<number[]>([]);

  useEffect(() => {
    load();
  }, [schoolId, classId, teacherId]); // eslint-disable-line react-hooks/exhaustive-deps

  const load = async () => {
    setLoading(true);
    let q = (supabase.from("timetable_slots") as any)
      .select(`*, class:classes(name), teacher:profiles!timetable_slots_teacher_id_fkey(full_name)`);

    if (schoolId) q = q.eq("school_id", schoolId);
    if (classId) q = q.eq("class_id", classId);
    if (teacherId) q = q.eq("teacher_id", teacherId);

    const { data } = await q.order("day_of_week").order("period_number");
    const list = data ?? [];
    setSlots(list);
    const allPeriods: number[] = list.map((s: Slot) => s.period_number);
    const uniquePeriods: number[] = allPeriods.filter((v, i, a) => a.indexOf(v) === i).sort((a, b) => a - b);
    setPeriods(uniquePeriods.length > 0 ? uniquePeriods : [1, 2, 3, 4, 5, 6, 7, 8]);
    setLoading(false);
  };

  const getSlot = (day: number, period: number) =>
    slots.find(s => s.day_of_week === day && s.period_number === period);

  const subjectColor = (subject: string) => {
    let h = 0;
    for (let i = 0; i < subject.length; i++) h = (h * 31 + subject.charCodeAt(i)) % COLORS.length;
    return COLORS[h];
  };

  if (loading) return <div style={{ color: S.dim, fontSize: 13, padding: 20 }}>Loading timetable…</div>;

  if (slots.length === 0) return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: "48px 24px", textAlign: "center" }}>
      <div style={{ fontSize: 40, marginBottom: 12 }}>📅</div>
      <p style={{ fontSize: 14, color: S.muted, marginBottom: 4 }}>No timetable set up yet</p>
      <p style={{ fontSize: 12, color: S.dim }}>Your school admin will publish the timetable here.</p>
    </div>
  );

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ minWidth: 700 }}>
        {/* Header */}
        <div style={{ display: "grid", gridTemplateColumns: `80px repeat(5, 1fr)`, gap: 6, marginBottom: 6 }}>
          <div />
          {DAYS.map(d => (
            <div key={d} style={{ padding: "10px 12px", background: "rgba(77,127,255,0.08)", border: "1px solid rgba(77,127,255,0.15)", borderRadius: 10, textAlign: "center" }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: "#4D7FFF", fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>{d.slice(0, 3).toUpperCase()}</p>
            </div>
          ))}
        </div>

        {/* Rows */}
        {periods.map(p => (
          <div key={p} style={{ display: "grid", gridTemplateColumns: `80px repeat(5, 1fr)`, gap: 6, marginBottom: 6 }}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 10, padding: "8px 4px" }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: S.muted }}>P{p}</span>
              {(() => {
                const anySlot = slots.find(s => s.period_number === p);
                return anySlot ? (
                  <span style={{ fontSize: 9, color: S.dim, marginTop: 2 }}>
                    {anySlot.start_time}–{anySlot.end_time}
                  </span>
                ) : null;
              })()}
            </div>
            {[0, 1, 2, 3, 4].map(d => {
              const slot = getSlot(d, p);
              const color = slot ? subjectColor(slot.subject_name) : null;
              return (
                <div key={d} style={{
                  padding: "10px 12px", borderRadius: 10, minHeight: 70,
                  background: slot ? `${color}0D` : "rgba(255,255,255,0.01)",
                  border: `1px solid ${slot ? `${color}25` : S.border}`,
                  display: "flex", flexDirection: "column", justifyContent: "center",
                }}>
                  {slot ? (
                    <>
                      <p style={{ fontSize: 12, fontWeight: 700, color: color ?? undefined, margin: "0 0 3px", lineHeight: 1.2 }}>{slot.subject_name}</p>
                      {slot.class?.name && <p style={{ fontSize: 10, color: S.muted, margin: "0 0 2px" }}>{slot.class.name}</p>}
                      {slot.teacher?.full_name && <p style={{ fontSize: 10, color: S.dim, margin: 0 }}>{slot.teacher.full_name.split(" ")[0]}</p>}
                      {slot.room && <p style={{ fontSize: 10, color: S.dim, margin: 0 }}>Rm {slot.room}</p>}
                    </>
                  ) : (
                    <p style={{ fontSize: 11, color: "rgba(255,255,255,0.06)", textAlign: "center" }}>—</p>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
