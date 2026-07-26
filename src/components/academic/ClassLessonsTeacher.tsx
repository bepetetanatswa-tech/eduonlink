"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Course {
  id: string; title: string; subject: string; grade_level: string | null; thumbnail_emoji: string;
  materialCount: number;
}

const S = { border: "rgba(28,38,32,0.07)", text: "#1C2620", muted: "#566257", dim: "#6E7A6C", accent: "#B1502B" };

export function ClassLessonsTeacher({ classId, profileId }: { classId: string; profileId: string }) {
  const supabase = createClient();
  const [attached, setAttached] = useState<Course[]>([]);
  const [allCourses, setAllCourses] = useState<{ id: string; title: string; subject: string }[]>([]);
  const [picked, setPicked] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const { data: links } = await (supabase.from("class_courses") as any)
      .select("course_id, course:courses(id,title,subject,grade_level,thumbnail_emoji,course_materials(id))")
      .eq("class_id", classId);

    const list: Course[] = (links ?? [])
      .map((l: any) => l.course)
      .filter(Boolean)
      .map((c: any) => ({ ...c, materialCount: (c.course_materials ?? []).length }));
    setAttached(list);

    const { data: all } = await (supabase.from("courses") as any)
      .select("id,title,subject").eq("is_published", true).order("title");
    const attachedIds = new Set(list.map((c) => c.id));
    setAllCourses((all ?? []).filter((c: any) => !attachedIds.has(c.id)));
    setLoading(false);
  };

  useEffect(() => { load(); }, [classId]); // eslint-disable-line react-hooks/exhaustive-deps

  const attach = async () => {
    if (!picked) return;
    setSaving(true);
    await (supabase.from("class_courses") as any).insert({ class_id: classId, course_id: picked, added_by: profileId });
    setPicked("");
    setSaving(false);
    load();
  };

  const detach = async (courseId: string) => {
    await (supabase.from("class_courses") as any).delete().eq("class_id", classId).eq("course_id", courseId);
    load();
  };

  if (loading) return <p style={{ fontSize: 13, color: S.dim }}>Loading…</p>;

  const inp: React.CSSProperties = { padding: "9px 12px", background: "rgba(28,38,32,0.04)", border: `1px solid ${S.border}`, borderRadius: 9, color: S.text, fontSize: 13, outline: "none" };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", gap: 8 }}>
        <select value={picked} onChange={(e) => setPicked(e.target.value)} style={{ ...inp, flex: 1 }}>
          <option value="" style={{ background: "#F2EEE3" }}>Attach a published course…</option>
          {allCourses.map((c) => (
            <option key={c.id} value={c.id} style={{ background: "#F2EEE3" }}>{c.title} — {c.subject}</option>
          ))}
        </select>
        <button onClick={attach} disabled={!picked || saving} style={{ padding: "9px 16px", borderRadius: 9, background: S.accent, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: picked ? "pointer" : "default", opacity: picked ? 1 : 0.5 }}>
          Attach
        </button>
      </div>

      {attached.length === 0 ? (
        <div style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "32px", textAlign: "center" }}>
          <p style={{ color: S.dim, fontSize: 14 }}>No courses attached to this class yet.</p>
        </div>
      ) : (
        attached.map((c) => (
          <div key={c.id} style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ fontSize: 20 }}>{c.thumbnail_emoji}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: S.text, margin: 0 }}>{c.title}</p>
              <p style={{ fontSize: 11, color: S.dim, margin: 0 }}>{c.subject}{c.grade_level ? ` · Grade ${c.grade_level}` : ""} · {c.materialCount} material{c.materialCount !== 1 ? "s" : ""}</p>
            </div>
            <button onClick={() => detach(c.id)} style={{ background: "none", border: "none", color: S.dim, cursor: "pointer", fontSize: 14 }}>✕</button>
          </div>
        ))
      )}
    </div>
  );
}
