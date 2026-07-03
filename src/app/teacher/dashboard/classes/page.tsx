/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TeacherClassCard } from "./TeacherClassCard";

export default async function TeacherClassesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id,role").eq("user_id", user.id).single();
  if (!profile || profile.role !== "teacher") redirect("/dashboard");

  const { data: classesRaw } = await (supabase.from("classes") as any)
    .select("id,name,subject,grade_level")
    .eq("teacher_id", profile.id)
    .order("name");
  const classes = classesRaw ?? [];

  const classIds = classes.map((c: { id: string }) => c.id);
  const { data: enrollments } = classIds.length
    ? await (supabase.from("class_enrollments") as any)
        .select("class_id").in("class_id", classIds).eq("status", "active")
    : { data: [] };

  const countByClass = new Map<string, number>();
  (enrollments ?? []).forEach((e: { class_id: string }) => {
    countByClass.set(e.class_id, (countByClass.get(e.class_id) ?? 0) + 1);
  });

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>My Classes</h2>
        <p style={{ fontSize: 12, color: "#4A5170", marginTop: 4 }}>{classes.length} class{classes.length !== 1 ? "es" : ""} assigned to you</p>
      </div>

      {classes.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "48px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#4A5170" }}>No classes assigned to you yet. Ask your school administrator.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {classes.map((c: { id: string; name: string; subject: string | null; grade_level: string | null }) => (
            <TeacherClassCard key={c.id} c={{ ...c, studentCount: countByClass.get(c.id) ?? 0 }} />
          ))}
        </div>
      )}
    </div>
  );
}
