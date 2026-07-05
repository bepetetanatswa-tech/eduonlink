"use client";

import { useState } from "react";
import { ClassPicker, type PickedClass } from "@/components/admin/ClassPicker";
import { AssignmentManager } from "@/components/academic/AssignmentManager";
import { AttendanceMarker } from "@/components/academic/AttendanceMarker";
import { GradeBook } from "@/components/academic/GradeBook";
import { TimetableGrid } from "@/components/academic/TimetableGrid";

const S = { border: "rgba(255,255,255,0.07)", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170", accent: "#4D7FFF" };

export type ClassScopedFeature = "assignments" | "attendance" | "grades" | "timetable";

export function ClassScopedTools({ feature }: { feature: ClassScopedFeature }) {
  const [cls, setCls] = useState<PickedClass | null>(null);

  if (!cls) return <ClassPicker onSelect={setCls} />;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, flexWrap: "wrap",
        padding: "10px 16px", borderRadius: 12, background: "rgba(77,127,255,0.06)", border: "1px solid rgba(77,127,255,0.2)",
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
