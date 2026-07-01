import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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

  if (!profile || profile.role !== "student") redirect("/dashboard");

  const today = new Date().toISOString().split("T")[0];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: usage } = await (supabase.from("ai_usage") as any)
    .select("questions_used").eq("user_id", profile.id).eq("date", today).maybeSingle();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sub } = await (supabase.from("subscriptions") as any)
    .select("plan, status").eq("user_id", profile.id).in("status", ["active", "trial"]).maybeSingle();

  return (
    <SirTaksChat
      profileId={profile.id}
      userName={profile.full_name || "Student"}
      userRole="student"
      initialQuestionsUsed={usage?.questions_used ?? 0}
      plan={sub?.plan ?? "free"}
    />
  );
}
