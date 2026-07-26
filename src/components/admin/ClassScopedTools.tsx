"use client";

import { useState } from "react";
import { ClassPicker, type PickedClass } from "@/components/admin/ClassPicker";
import { AssignmentManager } from "@/components/academic/AssignmentManager";
import { AttendanceMarker } from "@/components/academic/AttendanceMarker";
import { GradeBook } from "@/components/academic/GradeBook";
import { TimetableGrid } from "@/components/academic/TimetableGrid";

const S = { border: "rgba(28,38,32,0.07)", text: "#1C2620", muted: "#566257", dim: "#6E7A6C", accent: "#B1502B" };

export type ClassScopedFeature = "assignments" | "attendance" | "grades" | "timetable";

export function ClassScopedTools({ feature }: { feature: ClassScopedFeature }) {
  const [cls, setCls] = useState<PickedClass | null>(null);

  if (!cls) return <ClassPicker onSelect={setCls} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap",
        padding: "10px 16px", borderRadius: 12, background: "rgba(177,80,43,0.06)", border: "1px solid rgba(177,80,43,0.2)",
      }}>
        <p style={{ fontSize: 12, color: S.text, margin: 0 }}>
          Viewing <strong>{cls.name}</strong> — {cls.school_name} · {cls.teacher_name}
        </p>
        <button
          onClick={() => setCls(null)}
          style={{ fontSize: 11, fontWeight: 600, color: S.accent, background: "none", border: "none", cursor: "pointer", padding: 0 }}
        >
          Change class
        </button>
      </div>

      {feature === "timetable" && <TimetableGrid classId={cls.id} />}
      {feature === "assignments" && <AssignmentManager profileId={cls.teacher_id} lockedClassId={cls.id} />}
      {feature === "attendance" && <AttendanceMarker profileId={cls.teacher_id} lockedClassId={cls.id} />}
      {feature === "grades" && <GradeBook profileId={cls.teacher_id} />}
    </div>
  );
}
