import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionPage } from "@/components/subscription/SubscriptionPage";

export default async function SchoolSubscriptionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: member } = await (supabase.from("school_members") as any)
    .select("school:schools(id,name)")
    .eq("user_id", user.id).eq("role", "school_admin").maybeSingle();

  const schoolId = (member?.school as { id: string; name: string } | null)?.id;
  const schoolName = (member?.school as { id: string; name: string } | null)?.name ?? "School";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: sub } = await (supabase.from("subscriptions") as any).select("plan_key")
    .eq("school_id", schoolId ?? "").order("created_at", { ascending: false }).limit(1).maybeSingle();

  const planKey = sub?.plan_key ?? "free_school";

  return (
    <SubscriptionPage role="school" currentPlanKey={planKey} username={schoolName} />
  );
}
