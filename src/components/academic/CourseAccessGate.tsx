"use client";

import { useState } from "react";
import { CoursePurchase } from "@/components/academic/CoursePurchase";

interface Material {
  id: string; title: string; type: string; file_url: string | null; order_index: number;
}

interface Props {
  courseId: string;
  courseTitle: string;
  price: number;
  hasPurchased: boolean;
  materials: Material[];
  completedIds: string[];
  accentColor: string;
}

export function CourseAccessGate({ courseId, courseTitle, price, hasPurchased, materials, completedIds, accentColor }: Props) {
  const [showPurchase, setShowPurchase] = useState(false);
  const done = new Set(completedIds);
  const locked = price > 0 && !hasPurchased;

  if (locked) {
    return (
      <>
        <div style={{ padding: "18px 14px", textAlign: "center" }}>
          <p style={{ fontSize: 12, color: "#4A5170", marginBottom: 10 }}>
            {materials.length} lesson{materials.length !== 1 ? "s" : ""} · unlock for <strong style={{ color: "#F5A623" }}>${price.toFixed(2)}</strong>
          </p>
          <button
            onClick={() => setShowPurchase(true)}
            style={{ padding: "8px 20px", borderRadius: 9, background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.3)", color: "#F5A623", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
          >
            🔒 Unlock this course
          </button>
        </div>
        {showPurchase && (
          <CoursePurchase courseId={courseId} courseTitle={courseTitle} price={price} onClose={() => setShowPurchase(false)} />
        )}
      </>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      {materials.sort((a, b) => a.order_index - b.order_index).map((m) => (
        <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 20, height: 20, borderRadius: "5px", background: done.has(m.id) ? "rgba(0,229,163,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${done.has(m.id) ? "rgba(0,229,163,0.3)" : "rgba(255,255,255,0.08)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0 }}>
            {done.has(m.id) ? "✓" : ""}
          </div>
          <span style={{ fontSize: 12, color: "#8892B0", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.title}</span>
          {m.file_url && (
            <a href={m.file_url} target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, color: accentColor, background: `${accentColor}10`, border: `1px solid ${accentColor}20`, padding: "2px 8px", borderRadius: 5, textDecoration: "none", flexShrink: 0 }}>
              Open
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
