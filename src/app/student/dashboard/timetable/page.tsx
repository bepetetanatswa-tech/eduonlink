/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TimetableGrid } from "@/components/academic/TimetableGrid";

export default async function StudentTimetablePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await (supabase.from("profiles") as any).select("id,role,school_id").eq("user_id", user.id).single();
  if (!profile || (profile.role !== "student" && profile.role !== "super_admin")) redirect("/dashboard");
  const { data: member } = await (supabase.from("school_members") as any).select("school_id").eq("user_id", profile.id).maybeSingle();
  const { data: enrollment } = await (supabase.from("class_enrollments") as any).select("class_id").eq("student_id", profile.id).eq("status", "active").limit(1).maybeSingle();
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>My Timetable</h2>
        <p style={{ fontSize: 12, color: "#4A5170", marginTop: 4 }}>Your weekly class schedule</p>
      </div>
      <TimetableGrid schoolId={member?.school_id ?? undefined} classId={enrollment?.class_id ?? undefined} />
    </div>
  );
}
