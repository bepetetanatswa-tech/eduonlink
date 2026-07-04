/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SchoolClassCard } from "./SchoolClassCard";

export default async function SchoolClassesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id,role").eq("user_id", user.id).single();
  if (!profile || (profile.role !== "school_admin" && profile.role !== "super_admin")) redirect("/dashboard");

  const { data: member } = await (supabase.from("school_members") as any)
    .select("school_id").eq("user_id", profile.id).maybeSingle();
  const schoolId = member?.school_id ?? null;

  const { data: classesRaw } = schoolId ? await (supabase.from("classes") as any)
    .select("id,name,subject,grade_level,teacher_id,profiles!classes_teacher_id_fkey(full_name)")
    .eq("school_id", schoolId)
    .order("name") : { data: [] };
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
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>Classes</h2>
        <p style={{ fontSize: 12, color: "#4A5170", marginTop: 4 }}>{classes.length} class{classes.length !== 1 ? "es" : ""} at your school</p>
      </div>

      {!schoolId ? (
        <div style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 12, padding: 16, color: "#F5A623", fontSize: 13 }}>
          No school is linked to your account yet.
        </div>
      ) : classes.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "48px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#4A5170" }}>No classes created yet.</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 14 }}>
          {classes.map((c: any) => (
            <SchoolClassCard key={c.id} c={{
              id: c.id, name: c.name, subject: c.subject, grade_level: c.grade_level,
              teacherName: c.profiles?.full_name, studentCount: countByClass.get(c.id) ?? 0,
            }} />
          ))}
        </div>
      )}
    </div>
  );
}
