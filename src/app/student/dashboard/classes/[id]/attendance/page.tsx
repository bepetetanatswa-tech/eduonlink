/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

interface Props { params: Promise<{ id: string }> }

const S = { border: "rgba(28,38,32,0.07)", text: "#1C2620", muted: "#566257", dim: "#6E7A6C" };

const STATUS_COLOR: Record<string, string> = {
  present: "#1F4738", absent: "#A3311E", late: "#A9873F", excused: "#B1502B",
};

export default async function StudentClassAttendancePage({ params }: Props) {
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

  const { data: records } = await (supabase.from("attendance") as any)
    .select("date, status, reason")
    .eq("class_id", classId)
    .eq("student_id", profile.id)
    .order("date", { ascending: false })
    .limit(60);

  const list = records ?? [];
  const presentCount = list.filter((r: any) => r.status === "present" || r.status === "late").length;
  const rate = list.length > 0 ? Math.round((presentCount / list.length) * 100) : null;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      {rate !== null && (
        <div style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "14px 16px" }}>
          <p style={{ fontSize: 12, color: S.dim, margin: 0 }}>Attendance rate</p>
          <p style={{ fontSize: 24, fontWeight: 700, color: rate >= 80 ? "#1F4738" : rate >= 60 ? "#A9873F" : "#A3311E", margin: "2px 0 0" }}>{rate}%</p>
        </div>
      )}

      {list.length === 0 ? (
        <div style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "32px", textAlign: "center" }}>
          <p style={{ color: S.dim, fontSize: 14 }}>No attendance recorded yet for this class.</p>
        </div>
      ) : (
        list.map((r: any) => (
          <div key={r.date} style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "10px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <p style={{ fontSize: 13, color: S.text, margin: 0 }}>{new Date(r.date).toLocaleDateString([], { weekday: "short", month: "short", day: "numeric" })}</p>
            <span style={{ fontSize: 12, fontWeight: 600, textTransform: "capitalize", color: STATUS_COLOR[r.status] ?? S.muted }}>{r.status}</span>
          </div>
        ))
      )}
    </div>
  );
}
