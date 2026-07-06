import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EarningsClient } from "./EarningsClient";

export default async function EarningsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id, role").eq("user_id", user.id).single();
  if (!profile || (profile.role !== "teacher" && profile.role !== "super_admin")) redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: courseSales } = await (supabase.from("course_purchases") as any)
    .select("id, amount_paid, platform_fee_pct, platform_fee_amount, teacher_earning_amount, created_at, courses(title)")
    .eq("teacher_id", profile.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: classSales } = await (supabase.from("class_purchases") as any)
    .select("id, amount_paid, platform_fee_pct, platform_fee_amount, teacher_earning_amount, created_at, classes(name)")
    .eq("teacher_id", profile.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false });

  const sales = [
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(courseSales ?? []).map((s: any) => ({ ...s, label: s.courses?.title ?? "Course" })),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ...(classSales ?? []).map((s: any) => ({ ...s, label: s.classes?.name ?? "Class" })),
  ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: withdrawals } = await (supabase.from("teacher_withdrawal_requests") as any)
    .select("id, amount, status, payout_phone, rejection_reason, requested_at, processed_at")
    .eq("teacher_id", profile.id)
    .order("requested_at", { ascending: false });

  const totalEarned = sales.reduce((sum: number, s: { teacher_earning_amount: number }) => sum + s.teacher_earning_amount, 0);
  const totalGross = sales.reduce((sum: number, s: { amount_paid: number }) => sum + s.amount_paid, 0);
  const totalCommission = sales.reduce((sum: number, s: { platform_fee_amount: number }) => sum + (s.platform_fee_amount ?? 0), 0);
  const totalWithdrawn = (withdrawals ?? [])
    .filter((w: { status: string }) => w.status === "paid")
    .reduce((sum: number, w: { amount: number }) => sum + w.amount, 0);
  const pendingWithdrawals = (withdrawals ?? [])
    .filter((w: { status: string }) => w.status === "pending" || w.status === "approved")
    .reduce((sum: number, w: { amount: number }) => sum + w.amount, 0);
  const availableBalance = Math.max(0, totalEarned - totalWithdrawn - pendingWithdrawals);

  return (
    <EarningsClient
      profileId={profile.id}
      totalEarned={totalEarned}
      totalGross={totalGross}
      totalCommission={totalCommission}
      totalWithdrawn={totalWithdrawn}
      availableBalance={availableBalance}
      sales={sales}
      withdrawals={withdrawals ?? []}
    />
  );
}
