/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AttendanceMarker } from "@/components/academic/AttendanceMarker";

interface Props { params: Promise<{ id: string }> }

export default async function TeacherClassAttendancePage({ params }: Props) {
  const { id: classId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id,role").eq("user_id", user.id).single();
  if (!profile || profile.role !== "teacher") redirect("/dashboard");

  const { data: cls } = await (supabase.from("classes") as any)
    .select("teacher_id").eq("id", classId).single();
  if (!cls || cls.teacher_id !== profile.id) redirect("/teacher/dashboard/classes");

  return <AttendanceMarker profileId={profile.id} lockedClassId={classId} />;
}
