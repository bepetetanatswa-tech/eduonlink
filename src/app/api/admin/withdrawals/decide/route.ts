/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/auditLog";

const VALID_TRANSITIONS: Record<string, string[]> = {
  pending: ["approved", "rejected"],
  approved: ["paid", "rejected"],
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();
  const { data: reviewer } = await (admin.from("profiles") as any)
    .select("id, email, role").eq("user_id", user.id).single();
  if (reviewer?.role !== "super_admin") {
    return NextResponse.json({ error: "Only super admins can decide withdrawal requests" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { withdrawalId, decision, reason } = body ?? {};
  if (!withdrawalId || !["approved", "paid", "rejected"].includes(decision)) {
    return NextResponse.json({ error: "withdrawalId and a valid decision are required" }, { status: 400 });
  }
  if (decision === "rejected" && !reason?.trim()) {
    return NextResponse.json({ error: "A rejection reason is required" }, { status: 400 });
  }

  const { data: current } = await (admin.from("teacher_withdrawal_requests") as any)
    .select("id, status, teacher_id, amount").eq("id", withdrawalId).single();
  if (!current) return NextResponse.json({ error: "Withdrawal request not found" }, { status: 404 });

  const allowed = VALID_TRANSITIONS[current.status] ?? [];
  if (!allowed.includes(decision)) {
    return NextResponse.json({ error: `Cannot move a ${current.status} request to ${decision}` }, { status: 400 });
  }

  const { data: updated, error } = await (admin.from("teacher_withdrawal_requests") as any)
    .update({
      status: decision,
      rejection_reason: decision === "rejected" ? reason.trim() : null,
      processed_at: new Date().toISOString(),
      processed_by: reviewer.id,
    })
    .eq("id", withdrawalId)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAdminAction({
    actorId: reviewer.id,
    actorEmail: reviewer.email,
    action: `withdrawal_${decision}`,
    targetType: "teacher_withdrawal_request",
    targetId: withdrawalId,
    details: { amount: current.amount, reason: decision === "rejected" ? reason.trim() : null },
  });

  await (admin.from("notifications") as any).insert({
    user_id: current.teacher_id,
    title: decision === "paid" ? "Withdrawal paid 💸" : decision === "approved" ? "Withdrawal approved" : "Withdrawal rejected",
    message: decision === "paid"
      ? `Your $${current.amount.toFixed(2)} withdrawal has been sent.`
      : decision === "approved"
      ? `Your $${current.amount.toFixed(2)} withdrawal was approved and will be paid shortly.`
      : `Your $${current.amount.toFixed(2)} withdrawal was rejected: ${reason.trim()}`,
    type: decision === "rejected" ? "warning" : "success",
  });

  return NextResponse.json({ withdrawal: updated });
}
