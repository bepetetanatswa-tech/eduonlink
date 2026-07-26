"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface PickedClass {
  id: string;
  name: string;
  subject: string;
  grade_level: string | null;
  teacher_id: string;
  teacher_name: string;
  school_name: string;
}

const S = { border: "rgba(28,38,32,0.07)", text: "#1C2620", muted: "#566257", dim: "#6E7A6C", accent: "#B1502B" };

export function ClassPicker({ onSelect }: { onSelect: (cls: PickedClass) => void }) {
  const supabase = createClient();
  const [classes, setClasses] = useState<PickedClass[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data } = await (supabase.from("classes") as any)
        .select("id,name,subject,grade_level,teacher_id,school:schools(name),teacher:profiles!classes_teacher_id_fkey(full_name)")
        .order("name");
      const list = (data ?? []).map((c: any) => ({
        id: c.id, name: c.name, subject: c.subject, grade_level: c.grade_level,
        teacher_id: c.teacher_id, teacher_name: c.teacher?.full_name ?? "Unassigned",
        school_name: c.school?.name ?? "Unknown school",
      }));
      setClasses(list);
      setLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = classes.filter((c) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.subject.toLowerCase().includes(q)
      || c.teacher_name.toLowerCase().includes(q) || c.school_name.toLowerCase().includes(q);
  });

  const bySchool = filtered.reduce<Record<string, PickedClass[]>>((acc, c) => {
    (acc[c.school_name] ??= []).push(c);
    return acc;
  }, {});

  if (loading) return <p style={{ fontSize: 13, color: S.dim }}>Loading classes…</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by class, subject, teacher or school…"
        style={{ padding: "9px 16px", background: "rgba(28,38,32,0.04)", border: `1px solid ${S.border}`, borderRadius: 10, fontSize: 13, color: S.text, outline: "none" }}
      />
      {classes.length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: S.dim, fontSize: 13, background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 16 }}>
          No classes exist on the platform yet.
        </div>
      ) : Object.keys(bySchool).length === 0 ? (
        <div style={{ padding: 40, textAlign: "center", color: S.dim, fontSize: 13, background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 16 }}>
          No classes match &quot;{search}&quot;.
        </div>
      ) : (
        Object.entries(bySchool).map(([school, list]) => (
          <div key={school}>
            <p style={{ fontSize: 10, fontWeight: 600, letterSpacing: "0.06em", textTransform: "uppercase", color: S.dim, marginBottom: 8 }}>{school}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {list.map((c) => (
                <button
                  key={c.id}
                  onClick={() => onSelect(c)}
                  style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10,
                    padding: "12px 16px", borderRadius: 12, background: "rgba(28,38,32,0.02)",
                    border: `1px solid ${S.border}`, cursor: "pointer", textAlign: "left",
                  }}
                >
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: S.text, margin: 0 }}>{c.name}</p>
                    <p style={{ fontSize: 11, color: S.dim, margin: "2px 0 0" }}>{c.subject}{c.grade_level ? ` · ${c.grade_level}` : ""} · {c.teacher_name}</p>
                  </div>
                  <span style={{ fontSize: 11, color: S.accent }}>Select →</span>
                </button>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}
