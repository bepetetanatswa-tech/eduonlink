/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlan } from "@/lib/subscription/plans";

const CREDIT_COLUMNS = ["ai_questions", "mock_exams", "pdf_downloads", "certificates", "school_seats"];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: adminProfile } = await (supabase.from("profiles") as any)
    .select("id, role").eq("user_id", user.id).single();
  if (!adminProfile || adminProfile.role !== "super_admin") {
    return NextResponse.json({ error: "Only super admins can decide payments" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { paymentId, decision, rejectionReason } = body ?? {};
  if (!paymentId || (decision !== "approved" && decision !== "rejected")) {
    return NextResponse.json({ error: "paymentId and a valid decision are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: pv } = await admin.from("payment_verifications")
    .select("*, profile:profiles!payment_verifications_profile_id_fkey(id,user_id,full_name,email,role), course:courses(title), class:classes(name)")
    .eq("id", paymentId).eq("status", "pending").maybeSingle();

  if (!pv) return NextResponse.json({ error: "Payment not found or already decided" }, { status: 404 });

  if (decision === "rejected") {
    const reason = rejectionReason || "Rejected by admin";
    const { error } = await admin.from("payment_verifications")
      .update({ status: "rejected", rejection_reason: reason }).eq("id", paymentId);
    if (error) return NextResponse.json({ error: "Could not reject payment" }, { status: 400 });

    await admin.from("notifications").insert({
      user_id: pv.user_id,
      title: "Payment verification failed",
      message: `Your payment of $${pv.amount} was not approved. Reason: ${reason}. Please contact support if you believe this is an error.`,
      type: "payment",
    });
    return NextResponse.json({ ok: true });
  }

  const { error: statusErr } = await admin.from("payment_verifications").update({
    status: "approved",
    verified_by: adminProfile.id,
    verified_at: new Date().toISOString(),
  }).eq("id", paymentId);
  if (statusErr) return NextResponse.json({ error: "Could not mark payment approved" }, { status: 400 });

  if (pv.purchase_type === "credits" && pv.credit_type && pv.credit_amount && CREDIT_COLUMNS.includes(pv.credit_type)) {
    // user_credits.user_id references auth.users(id), unlike payment_verifications.user_id (profiles.id).
    const authUserId = pv.profile?.user_id;
    const col = pv.credit_type as string;
    const { data: existing } = await admin.from("user_credits").select(col).eq("user_id", authUserId).maybeSingle();
    const current = (existing as any)?.[col] ?? 0;
    const { error: creditErr } = await admin.from("user_credits")
      .upsert({ user_id: authUserId, [col]: current + pv.credit_amount }, { onConflict: "user_id" });

    if (creditErr) {
      return NextResponse.json({ error: `Payment marked approved, but crediting the account failed: ${creditErr.message}. Fix manually.` }, { status: 200 });
    }

    await admin.from("notifications").insert({
      user_id: pv.user_id,
      title: "Credits added to your account! 🎉",
      message: `${pv.credit_amount} ${pv.credit_type.replace(/_/g, " ")} credits have been added to your account.`,
      type: "payment",
    });
  } else if (pv.purchase_type === "course") {
    // course_purchases is created automatically by the activate_course_purchase
    // DB trigger the moment status flips to 'approved' above (which also
    // notifies the teacher) — nothing else to activate here.
    await admin.from("notifications").insert({
      user_id: pv.user_id,
      title: "Purchase confirmed! 🎉",
      message: `Your payment for "${pv.course?.title ?? "the course"}" was approved. You now have full access.`,
      type: "payment",
    });
  } else if (pv.purchase_type === "class") {
    // Same as course — activate_class_purchase trigger does the enrollment
    // + sale record + teacher notification. This branch used to be missing
    // entirely, which meant class payments fell through to the subscription
    // branch below and created a bogus subscription row.
    await admin.from("notifications").insert({
      user_id: pv.user_id,
      title: "Enrollment confirmed! 🎉",
      message: `Your payment for "${pv.class?.name ?? "the class"}" was approved. You're now enrolled.`,
      type: "payment",
    });
  } else {
    // Activate subscription.
    const now = new Date();
    const end = new Date(now);
    end.setMonth(end.getMonth() + 1);
    const planName = getPlan(pv.plan_key ?? "free_student").name;

    // Expire any prior active/trial subscription for this user first —
    // otherwise queries using .maybeSingle() against multiple active rows
    // would start erroring after a second renewal.
    await admin.from("subscriptions")
      .update({ status: "expired" })
      .eq("user_id", pv.user_id)
      .in("status", ["active", "trial"]);

    const { error: subErr } = await admin.from("subscriptions").insert({
      user_id: pv.user_id,
      plan_key: pv.plan_key,
      plan_price: pv.amount,
      status: "active",
      start_date: now.toISOString(),
      end_date: end.toISOString(),
      amount_paid: pv.amount,
      payment_id: pv.id,
    });

    if (subErr) {
      return NextResponse.json({ error: `Payment marked approved, but activating the subscription failed: ${subErr.message}. Fix manually.` }, { status: 200 });
    }

    await admin.from("notifications").insert({
      user_id: pv.user_id,
      title: `Payment approved! Your ${planName} is now active 🎉`,
      message: `Welcome to EduOnLink Pro! Your subscription runs until ${end.toLocaleDateString()}. Enjoy full access!`,
      type: "payment",
    });
  }

  return NextResponse.json({ ok: true });
}
