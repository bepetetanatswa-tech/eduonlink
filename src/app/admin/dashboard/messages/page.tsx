/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EduChatHub } from "@/components/communication/EduChatHub";

export default async function AdminMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id,full_name,role,avatar_url").eq("user_id", user.id).single();
  if (!profile || profile.role !== "super_admin") redirect("/dashboard");

  return (
    <EduChatHub
      profileId={profile.id}
      userRole={profile.role}
      allowedRoles={["school_admin", "teacher", "parent", "student", "super_admin"]}
      basePath="/admin/dashboard"
    />
  );
}
