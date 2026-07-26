"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { TimetableGrid } from "./TimetableGrid";

interface Cls { id: string; name: string; subject: string }
interface Teacher { id: string; full_name: string }
interface Slot { day_of_week: number; period_number: number; subject_name: string; teacher_id: string | null; start_time: string; end_time: string; room: string | null }
interface SlotForm { subject: string; teacherId: string; startTime: string; endTime: string; room: string }

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
const S = { border: "rgba(28,38,32,0.07)", text: "#1C2620", muted: "#566257", dim: "#6E7A6C", accent: "#B1502B" };
const inp: React.CSSProperties = { width: "100%", padding: "9px 12px", background: "rgba(28,38,32,0.04)", border: `1px solid ${S.border}`, borderRadius: 9, color: S.text, fontSize: 13, outline: "none", boxSizing: "border-box" };
const emptyForm: SlotForm = { subject: "", teacherId: "", startTime: "08:00", endTime: "08:45", room: "" };

export function TimetableEditor({ schoolId }: { schoolId: string; profileId?: string }) {
  const supabase = createClient();
  const [classes, setClasses] = useState<Cls[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classId, setClassId] = useState("");
  const [slots, setSlots] = useState<Slot[]>([]);
  const [editing, setEditing] = useState<{ day: number; period: number } | null>(null);
  const [form, setForm] = useState<SlotForm>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [periods] = useState([1, 2, 3, 4, 5, 6, 7, 8]);

  useEffect(() => {
    (supabase.from("classes") as any).select("id,name,subject").eq("school_id", schoolId).order("name")
      .then(({ data }: any) => {
        const list = data ?? [];
        setClasses(list);
        if (list.length > 0) setClassId((prev) => prev || list[0].id);
      });
    (supabase.from("school_members") as any).select("profile:profiles(id,full_name)").eq("school_id", schoolId).eq("role", "teacher")
      .then(({ data }: any) => setTeachers((data ?? []).map((m: any) => m.profile).filter(Boolean)));
  }, [schoolId]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!classId) return;
    (supabase.from("timetable_slots") as any)
      .select("day_of_week,period_number,subject_name,teacher_id,start_time,end_time,room")
      .eq("school_id", schoolId).eq("class_id", classId)
      .then(({ data }: any) => setSlots(data ?? []));
  }, [classId, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const getSlot = (day: number, period: number) => slots.find(s => s.day_of_week === day && s.period_number === period);

  const openSlot = (day: number, period: number) => {
    const existing = getSlot(day, period);
    setForm(existing ? {
      subject: existing.subject_name, teacherId: existing.teacher_id ?? "",
      startTime: existing.start_time, endTime: existing.end_time, room: existing.room ?? "",
    } : emptyForm);
    setEditing({ day, period });
  };

  const saveSlot = async () => {
    if (!form.subject.trim() || !editing || !classId) return;
    setSaving(true);
    await (supabase.from("timetable_slots") as any).upsert({
      school_id: schoolId,
      class_id: classId,
      subject_name: form.subject.trim(),
      teacher_id: form.teacherId || null,
      day_of_week: editing.day,
      period_number: editing.period,
      start_time: form.startTime,
      end_time: form.endTime,
      room: form.room.trim() || null,
    }, { onConflict: "school_id,class_id,day_of_week,period_number" });
    setSaving(false);
    setEditing(null);
    setRefreshKey(k => k + 1);
  };

  const deleteSlot = async (day: number, period: number) => {
    if (!classId) return;
    await (supabase.from("timetable_slots") as any)
      .delete().eq("school_id", schoolId).eq("class_id", classId).eq("day_of_week", day).eq("period_number", period);
    setEditing(null);
    setRefreshKey(k => k + 1);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <select value={classId} onChange={e => setClassId(e.target.value)} style={{ ...inp, width: "auto", minWidth: 200 }}>
          {classes.map(c => <option key={c.id} value={c.id} style={{ background: "#F2EEE3" }}>{c.name} — {c.subject}</option>)}
        </select>
        <p style={{ fontSize: 13, color: S.dim, margin: 0 }}>Click any slot to assign a lesson for this class. Changes apply instantly.</p>
      </div>

      {classes.length === 0 ? (
        <div style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: "40px", textAlign: "center" }}>
          <p style={{ color: S.dim, fontSize: 14 }}>No classes yet — create a class first, then build its timetable here.</p>
        </div>
      ) : (
        <>
          {/* Clickable grid — one class's weekly schedule at a time */}
          <div style={{ overflowX: "auto" }}>
            <div style={{ minWidth: 700 }}>
              <div style={{ display: "grid", gridTemplateColumns: `80px repeat(5, 1fr)`, gap: 6, marginBottom: 6 }}>
                <div />
                {DAYS.map(d => (
                  <div key={d} style={{ padding: "10px", background: "rgba(177,80,43,0.08)", border: "1px solid rgba(177,80,43,0.15)", borderRadius: 10, textAlign: "center" }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: "#B1502B", fontFamily: "inherit", margin: 0 }}>{d.slice(0, 3).toUpperCase()}</p>
                  </div>
                ))}
              </div>
              {periods.map(p => (
                <div key={p} style={{ display: "grid", gridTemplateColumns: `80px repeat(5, 1fr)`, gap: 6, marginBottom: 6 }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 10 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color: S.muted }}>P{p}</span>
                  </div>
                  {[0, 1, 2, 3, 4].map(d => {
                    const slot = getSlot(d, p);
                    return (
                      <div key={d} onClick={() => openSlot(d, p)}
                        style={{ minHeight: 60, borderRadius: 10, border: `1px ${slot ? "solid" : "dashed"} ${slot ? "rgba(177,80,43,0.3)" : S.border}`, background: slot ? "rgba(177,80,43,0.06)" : "rgba(28,38,32,0.01)", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 6, transition: "all 0.15s" }}
                        onMouseEnter={e => { if (!slot) { (e.currentTarget as HTMLElement).style.background = "rgba(177,80,43,0.06)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(177,80,43,0.3)"; } }}
                        onMouseLeave={e => { if (!slot) { (e.currentTarget as HTMLElement).style.background = "rgba(28,38,32,0.01)"; (e.currentTarget as HTMLElement).style.borderColor = S.border; } }}>
                        {slot ? (
                          <>
                            <span style={{ fontSize: 11, fontWeight: 700, color: "#B1502B", textAlign: "center" }}>{slot.subject_name}</span>
                            {slot.room && <span style={{ fontSize: 9, color: S.dim }}>Rm {slot.room}</span>}
                          </>
                        ) : (
                          <span style={{ fontSize: 20, color: "rgba(28,38,32,0.08)" }}>+</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* Whole-school preview */}
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 600, color: S.text, fontFamily: "inherit", margin: "0 0 12px" }}>Whole-School Timetable (one entry shown per slot)</h3>
            <TimetableGrid key={refreshKey} schoolId={schoolId} />
          </div>
        </>
      )}

      {/* Slot modal */}
      {editing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#F2EEE3", border: `1px solid ${S.border}`, borderRadius: 18, padding: 28, width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 14 }}>
            <h3 style={{ fontSize: 15, fontWeight: 700, color: S.text, fontFamily: "inherit", margin: 0 }}>
              {classes.find(c => c.id === classId)?.name} · {DAYS[editing.day]} · Period {editing.period}
            </h3>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Subject Name *</label>
              <input value={form.subject} onChange={e => setForm(f => ({ ...f, subject: e.target.value }))} placeholder="e.g. Mathematics" style={inp} />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Teacher</label>
              <select value={form.teacherId} onChange={e => setForm(f => ({ ...f, teacherId: e.target.value }))} style={{ ...inp, cursor: "pointer" }}>
                <option value="" style={{ background: "#F2EEE3" }}>— No teacher assigned —</option>
                {teachers.map(t => <option key={t.id} value={t.id} style={{ background: "#F2EEE3" }}>{t.full_name}</option>)}
              </select>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Start</label>
                <input type="time" value={form.startTime} onChange={e => setForm(f => ({ ...f, startTime: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>End</label>
                <input type="time" value={form.endTime} onChange={e => setForm(f => ({ ...f, endTime: e.target.value }))} style={inp} />
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Room</label>
                <input value={form.room} onChange={e => setForm(f => ({ ...f, room: e.target.value }))} placeholder="A1" style={inp} />
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "space-between" }}>
              <button onClick={() => deleteSlot(editing.day, editing.period)}
                style={{ padding: "9px 14px", borderRadius: 9, background: "rgba(163,49,30,0.08)", border: "1px solid rgba(163,49,30,0.2)", color: "#A3311E", fontSize: 12, cursor: "pointer" }}>
                Clear Slot
              </button>
              <div style={{ display: "flex", gap: 8 }}>
                <button onClick={() => setEditing(null)} style={{ padding: "9px 16px", borderRadius: 9, background: "rgba(28,38,32,0.05)", border: `1px solid ${S.border}`, color: S.muted, fontSize: 12, cursor: "pointer" }}>Cancel</button>
                <button onClick={saveSlot} disabled={saving || !form.subject.trim()}
                  style={{ padding: "9px 16px", borderRadius: 9, background: S.accent, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", opacity: (saving || !form.subject.trim()) ? 0.5 : 1 }}>
                  {saving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
