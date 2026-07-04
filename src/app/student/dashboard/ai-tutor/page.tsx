import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveAiQuota } from "@/lib/ai/usageLimit";
import { SirTaksChat } from "@/components/ai/SirTaksChat";

export default async function AITutorPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id, full_name, role")
    .eq("user_id", user.id)
    .single();

  if (!profile || (profile.role !== "student" && profile.role !== "super_admin")) redirect("/dashboard");

  const quota = await resolveAiQuota(createAdminClient(), profile.id, "student");

  return (
    <SirTaksChat
      profileId={profile.id}
      userName={profile.full_name || "Student"}
      userRole="student"
      initialQuestionsUsed={quota.used}
      dailyLimit={quota.limit}
    />
  );
}
