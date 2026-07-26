"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { CoursePurchase } from "@/components/academic/CoursePurchase";
import { LessonQA } from "@/components/academic/LessonQA";
import { FileActions } from "@/components/academic/FileActions";

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
 profileId: string;
}

export function CourseAccessGate({ courseId, courseTitle, price, hasPurchased, materials, completedIds, accentColor, profileId }: Props) {
 const supabase = createClient();
 const router = useRouter();
 const [showPurchase, setShowPurchase] = useState(false);
 const [pending, setPending] = useState<string | null>(null);
 const [qaOpen, setQaOpen] = useState<string | null>(null);
 const done = new Set(completedIds);
 const locked = price > 0 && !hasPurchased;

 const toggleComplete = async (materialId: string) => {
 setPending(materialId);
 if (done.has(materialId)) {
 await (supabase.from("course_progress") as any)
 .delete().eq("material_id", materialId);
 } else {
 await (supabase.from("course_progress") as any)
 .insert({ course_id: courseId, material_id: materialId })
 .select();
 }
 setPending(null);
 router.refresh();
 };

 if (locked) {
 return (
 <>
 <div style={{ padding: "18px 14px", textAlign: "center" }}>
 <p style={{ fontSize: 12, color: "#6E7A6C", marginBottom: 10 }}>
 {materials.length} lesson{materials.length !== 1 ? "s" : ""} · unlock for <strong style={{ color: "#A9873F" }}>${price.toFixed(2)}</strong>
 </p>
 <button
 onClick={() => setShowPurchase(true)}
 style={{ padding: "8px 20px", borderRadius: 9, background: "rgba(169,135,63,0.12)", border: "1px solid rgba(169,135,63,0.3)", color: "#A9873F", fontSize: 12, fontWeight: 700, cursor: "pointer" }}
 >
 Unlock this course
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
 {materials.sort((a, b) => a.order_index - b.order_index).map((m) => {
 const isDone = done.has(m.id);
 return (
 <div key={m.id}>
 <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
 <button
 onClick={() => toggleComplete(m.id)}
 disabled={pending === m.id}
 title={isDone ? "Mark as not completed" : "Mark as completed"}
 style={{ width: 20, height: 20, borderRadius: "5px", background: isDone ? "rgba(31,71,56,0.15)" : "rgba(28,38,32,0.04)", border: `1px solid ${isDone ? "rgba(31,71,56,0.3)" : "rgba(28,38,32,0.08)"}`, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 10, flexShrink: 0, cursor: "pointer", padding: 0, opacity: pending === m.id ? 0.5 : 1, color: "#1F4738" }}
 >
 {isDone ? "✓" : ""}
 </button>
 <span style={{ fontSize: 12, color: "#566257", flex: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{m.title}</span>
 <button onClick={() => setQaOpen(qaOpen === m.id ? null : m.id)}
 style={{ fontSize: 10, color: "#1F4738", background: "rgba(31,71,56,0.08)", border: "1px solid rgba(31,71,56,0.2)", padding: "2px 8px", borderRadius: 5, cursor: "pointer", flexShrink: 0 }}>
 Q&amp;A
 </button>
 {m.file_url && <FileActions fileUrl={m.file_url} accentColor={accentColor} />}
 </div>
 {qaOpen === m.id && (
 <div style={{ marginLeft: 28, marginTop: 4, paddingLeft: 10, borderLeft: "1px solid rgba(28,38,32,0.06)" }}>
 <LessonQA materialId={m.id} profileId={profileId} isTeacher={false} />
 </div>
 )}
 </div>
 );
 })}
 </div>
 );
}
