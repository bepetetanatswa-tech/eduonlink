/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ClassCard } from "./ClassCard";

export default async function StudentClassesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await (supabase.from("profiles") as any).select("id").eq("user_id", user.id).single();
  if (!profile) redirect("/auth/login");

  const { data: enrollments } = await (supabase.from("class_enrollments") as any)
    .select("class_id, status, classes(id,name,subject,grade_level,teacher_id,profiles!classes_teacher_id_fkey(full_name))")
    .eq("student_id", profile.id)
    .eq("status", "active");

  const classes = (enrollments ?? []).map((e: any) => ({ ...e.classes, teacherName: e.classes?.profiles?.full_name }));

  const S = { border: "rgba(255,255,255,0.07)", accent: "#4D7FFF", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170" };

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>My Classes</h2>
        <p style={{ fontSize: 12, color: S.dim, marginTop: 4 }}>{classes.length} class{classes.length !== 1 ? "es" : ""} enrolled</p>
      </div>

      {classes.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 16, padding: "48px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: S.dim }}>You are not enrolled in any classes yet. Ask your school administrator.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {classes.map((c: any) => <ClassCard key={c.id} c={c} />)}
        </div>
      )}
    </div>
  );
}
