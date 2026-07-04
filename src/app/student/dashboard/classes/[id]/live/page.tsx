/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LiveClassRoom } from "@/components/communication/LiveClassRoom";

interface Props { params: Promise<{ id: string }> }

export default async function StudentLivePage({ params }: Props) {
  const { id: classId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id,full_name,role").eq("user_id", user.id).single();
  if (!profile || (profile.role !== "student" && profile.role !== "super_admin")) redirect("/dashboard");

  const { data: enrollment } = await (supabase.from("class_enrollments") as any)
    .select("id").eq("class_id", classId).eq("student_id", profile.id).eq("status", "active").maybeSingle();
  if (!enrollment) redirect("/student/dashboard/classes");

  const { data: cls } = await (supabase.from("classes") as any)
    .select("name,subject").eq("id", classId).single();

  return (
    <div style={{ maxWidth: 900 }}>
      <LiveClassRoom
        classId={classId}
        profileId={profile.id}
        isTeacher={false}
        className={cls?.name ?? "Class"}
        userName={profile.full_name}
      />
    </div>
  );
}
