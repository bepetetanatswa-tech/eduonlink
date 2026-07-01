import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionPage } from "@/components/subscription/SubscriptionPage";

export default async function ParentSubscriptionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("profiles") as any).select("full_name").eq("user_id", user.id).single();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sub } = await (supabase.from("subscriptions") as any).select("plan_key").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle();

  const username = (profile?.full_name ?? user.email ?? "parent").replace(/\s+/g, "");
  const planKey = sub?.plan_key ?? "free_student";

  return (
    <SubscriptionPage role="student" currentPlanKey={planKey} username={username} />
  );
}
