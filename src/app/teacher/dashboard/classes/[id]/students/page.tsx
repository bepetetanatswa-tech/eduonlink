/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface Props { params: Promise<{ id: string }> }

const S = { border: "rgba(255,255,255,0.07)", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170" };

const ATTENDANCE_COLOR: Record<string, string> = {
  present: "#00E5A3", absent: "#FF6B6B", late: "#F5A623", excused: "#4D7FFF",
};

function initials(name: string) {
  return name.split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
}

export default async function TeacherClassStudentsPage({ params }: Props) {
  const { id: classId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id,role").eq("user_id", user.id).single();
  if (!profile || (profile.role !== "teacher" && profile.role !== "super_admin")) redirect("/dashboard");

  const { data: cls } = await (supabase.from("classes") as any)
    .select("teacher_id").eq("id", classId).single();
  if (!cls || cls.teacher_id !== profile.id) redirect("/teacher/dashboard/classes");

  const { data: enrollments } = await (supabase.from("class_enrollments") as any)
    .select("student:profiles!class_enrollments_student_id_fkey(id,full_name,avatar_url,email)")
    .eq("class_id", classId)
    .eq("status", "active");

  const students = (enrollments ?? []).map((e: any) => e.student).filter(Boolean);
  const studentIds = students.map((s: any) => s.id);

  const today = new Date().toISOString().slice(0, 10);
  const { data: attendanceToday } = studentIds.length
    ? await (supabase.from("attendance") as any)
        .select("student_id, status")
        .eq("class_id", classId)
        .eq("date", today)
        .in("student_id", studentIds)
    : { data: [] };

  const attendanceByStudent = new Map<string, string>();
  (attendanceToday ?? []).forEach((a: { student_id: string; status: string }) => attendanceByStudent.set(a.student_id, a.status));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <p style={{ fontSize: 12, color: S.dim, margin: 0 }}>{students.length} student{students.length !== 1 ? "s" : ""} enrolled</p>

      {students.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "32px", textAlign: "center" }}>
          <p style={{ color: S.dim, fontSize: 14 }}>No enrolled students.</p>
        </div>
      ) : (
        students.map((s: any) => {
          const status = attendanceByStudent.get(s.id);
          return (
            <div key={s.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
              {s.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={s.avatar_url} alt={s.full_name} style={{ width: 36, height: 36, borderRadius: 10, objectFit: "cover", flexShrink: 0 }} />
              ) : (
                <div style={{ width: 36, height: 36, borderRadius: 10, background: "linear-gradient(135deg,#4D7FFF,#2D5BDF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 700, color: "#fff", flexShrink: 0 }}>
                  {initials(s.full_name)}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: S.text, margin: 0 }}>{s.full_name}</p>
                <p style={{ fontSize: 11, color: S.dim, margin: 0 }}>{s.email}</p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, textTransform: "capitalize", color: status ? ATTENDANCE_COLOR[status] ?? S.muted : S.dim }}>
                {status ?? "Not marked"}
              </span>
            </div>
          );
        })
      )}
    </div>
  );
}
