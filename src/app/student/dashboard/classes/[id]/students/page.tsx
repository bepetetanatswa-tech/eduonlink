/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface Props { params: Promise<{ id: string }> }

const S = { border: "rgba(28,38,32,0.07)", text: "#1C2620", muted: "#566257", dim: "#6E7A6C", accent: "#B1502B" };

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export default async function StudentClassStudentsPage({ params }: Props) {
  const { id: classId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id,role").eq("user_id", user.id).single();
  if (!profile || (profile.role !== "student" && profile.role !== "super_admin")) redirect("/dashboard");

  const { data: enrollment } = await (supabase.from("class_enrollments") as any)
    .select("id").eq("class_id", classId).eq("student_id", profile.id).eq("status", "active").maybeSingle();
  if (!enrollment) redirect("/student/dashboard/classes");

  const { data: cls } = await (supabase.from("classes") as any)
    .select("teacher:profiles!classes_teacher_id_fkey(id,full_name)")
    .eq("id", classId).single();

  const { data: enrollments } = await (supabase.from("class_enrollments") as any)
    .select("student:profiles!class_enrollments_student_id_fkey(id,full_name)")
    .eq("class_id", classId)
    .eq("status", "active");

  const classmates = (enrollments ?? []).map((e: any) => e.student).filter(Boolean);
  const teacher = (cls as any)?.teacher;

  const Row = ({ name, badge }: { name: string; badge?: string }) => (
    <div style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#B1502B,#8F4022)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
        {initials(name)}
      </div>
      <p style={{ flex: 1, fontSize: 13, fontWeight: 600, color: S.text, margin: 0 }}>{name}</p>
      {badge && <span style={{ fontSize: 10, fontWeight: 700, color: S.accent, background: `${S.accent}15`, padding: "3px 8px", borderRadius: 20, textTransform: "uppercase" }}>{badge}</span>}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {teacher && <Row name={teacher.full_name} badge="Teacher" />}
      <p style={{ fontSize: 12, color: S.dim, margin: "4px 0 0" }}>{classmates.length} classmate{classmates.length !== 1 ? "s" : ""}</p>
      {classmates.length === 0 ? (
        <div style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "32px", textAlign: "center" }}>
          <p style={{ color: S.dim, fontSize: 14 }}>No other students enrolled yet.</p>
        </div>
      ) : (
        classmates.map((s: any) => <Row key={s.id} name={s.full_name} />)
      )}
    </div>
  );
}
