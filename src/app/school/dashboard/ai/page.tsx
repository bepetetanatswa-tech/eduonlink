import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SirTaksChat } from "@/components/ai/SirTaksChat";

export default async function SchoolAIPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id, full_name, role").eq("user_id", user.id).single();

  if (!profile || profile.role !== "school_admin") redirect("/dashboard");

  return (
    <SirTaksChat
      profileId={profile.id}
      userName={profile.full_name || "Administrator"}
      userRole="school_admin"
      plan="unlimited"
    />
  );
}
