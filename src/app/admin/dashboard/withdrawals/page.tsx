import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { WithdrawalsClient } from "./WithdrawalsClient";

export default async function WithdrawalsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id, role").eq("user_id", user.id).single();
  if (!profile || profile.role !== "super_admin") redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: withdrawals } = await (supabase.from("teacher_withdrawal_requests") as any)
    .select("id, teacher_id, amount, payout_phone, status, rejection_reason, requested_at, processed_at, profiles!teacher_id(full_name, email)")
    .order("requested_at", { ascending: false });

  return <WithdrawalsClient initialWithdrawals={withdrawals ?? []} />;
}
