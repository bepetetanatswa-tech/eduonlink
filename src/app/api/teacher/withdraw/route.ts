/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await (admin.from("profiles") as any)
    .select("id, role").eq("user_id", user.id).single();
  if (!profile || profile.role !== "teacher") {
    return NextResponse.json({ error: "Only teachers can request withdrawals" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const amount = Number(body?.amount);
  const payoutPhone = body?.payoutPhone?.trim();
  if (!amount || amount <= 0) return NextResponse.json({ error: "Enter a valid amount" }, { status: 400 });
  if (!payoutPhone) return NextResponse.json({ error: "EcoCash phone number is required" }, { status: 400 });

  // Recompute the available balance server-side — never trust the client's
  // number, since this determines how much real money gets paid out.
  const [{ data: sales }, { data: withdrawals }] = await Promise.all([
    (admin.from("course_purchases") as any).select("teacher_earning_amount").eq("teacher_id", profile.id).eq("status", "completed"),
    (admin.from("teacher_withdrawal_requests") as any).select("amount, status").eq("teacher_id", profile.id),
  ]);

  const totalEarned = (sales ?? []).reduce((sum: number, s: { teacher_earning_amount: number }) => sum + s.teacher_earning_amount, 0);
  const reserved = (withdrawals ?? [])
    .filter((w: { status: string }) => w.status !== "rejected")
    .reduce((sum: number, w: { amount: number }) => sum + w.amount, 0);
  const available = totalEarned - reserved;

  if (amount > available) {
    return NextResponse.json({ error: `You can withdraw at most $${available.toFixed(2)}` }, { status: 400 });
  }

  const { data: withdrawal, error } = await (admin.from("teacher_withdrawal_requests") as any)
    .insert({ teacher_id: profile.id, amount, payout_phone: payoutPhone, payout_method: "ecocash" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const { data: superAdmins } = await (admin.from("profiles") as any).select("id").eq("role", "super_admin");
  for (const sa of superAdmins ?? []) {
    await (admin.from("notifications") as any).insert({
      user_id: sa.id,
      title: "New withdrawal request",
      message: `A teacher requested a $${amount.toFixed(2)} withdrawal.`,
      type: "info",
    });
  }

  return NextResponse.json({ withdrawal });
}
