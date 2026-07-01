import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SubscriptionsClient } from "./SubscriptionsClient";

export default async function SubscriptionsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id, role").eq("user_id", user.id).single();
  if (!profile || profile.role !== "super_admin") redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: subs } = await (supabase.from("subscriptions") as any)
    .select(`
      id, plan, status, amount_paid, currency, payment_method, start_date, end_date, created_at,
      profiles!user_id(id, full_name, email, role)
    `)
    .order("created_at", { ascending: false })
    .limit(100);

  const [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { count: active }, { count: trial }, { count: expired },
  ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("subscriptions") as any).select("*", { count: "exact", head: true }).eq("status", "active"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("subscriptions") as any).select("*", { count: "exact", head: true }).eq("status", "trial"),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("subscriptions") as any).select("*", { count: "exact", head: true }).eq("status", "expired"),
  ]);

  return <SubscriptionsClient subs={subs ?? []} stats={{ active: active ?? 0, trial: trial ?? 0, expired: expired ?? 0 }} />;
}
