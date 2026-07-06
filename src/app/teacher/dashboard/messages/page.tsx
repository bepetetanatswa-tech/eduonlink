/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EduChatHub } from "@/components/communication/EduChatHub";

export default async function TeacherMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id,full_name,email,role,avatar_url,school_members(school_id)").eq("user_id", user.id).single();
  if (!profile || (profile.role !== "teacher" && profile.role !== "super_admin")) redirect("/dashboard");

  return (
    <EduChatHub
      profileId={profile.id}
      userRole="teacher"
      allowedRoles={["student", "parent", "school_admin"]}
      schoolId={profile.school_members?.[0]?.school_id ?? null}
      basePath="/teacher/dashboard"
    />
  );
}
