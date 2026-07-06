/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EduChatHub } from "@/components/communication/EduChatHub";

export default async function SchoolMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id,full_name,role,avatar_url,school_members(school_id)").eq("user_id", user.id).single();
  if (!profile || (profile.role !== "school_admin" && profile.role !== "super_admin")) redirect("/dashboard");

  return (
    <EduChatHub
      profileId={profile.id}
      userRole={profile.role}
      allowedRoles={["teacher", "parent", "student", "school_admin", "super_admin"]}
      schoolId={profile.school_members?.[0]?.school_id ?? null}
      basePath="/school/dashboard"
    />
  );
}
