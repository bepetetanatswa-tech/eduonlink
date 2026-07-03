/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DirectMessages } from "@/components/communication/DirectMessages";

export default async function ParentMessagesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id,full_name,email,role,avatar_url").eq("user_id", user.id).single();
  if (!profile || profile.role !== "parent") redirect("/dashboard");

  return (
    <DirectMessages
      profileId={profile.id}
      userRole="parent"
      allowedRoles={["teacher", "school_admin"]}
    />
  );
}
