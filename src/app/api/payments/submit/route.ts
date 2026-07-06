/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const ZW_PHONE = /^0(71|73|77|78)\d{7}$/;
const PHONE_VELOCITY_LIMIT = 3; // same phone submitting more than this in 24h is suspicious
const IP_VELOCITY_LIMIT = 5; // same IP submitting more than this in 24h is suspicious
const WINDOW_MS = 24 * 60 * 60 * 1000;

function getClientIp(request: NextRequest): string | null {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip");
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id").eq("user_id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const {
    transactionId, phoneNumber, amount, screenshotUrl, purchaseType,
    planKey, creditPackKey, creditType, creditAmount, courseId, classId,
  } = body ?? {};

  const txnId = String(transactionId ?? "").trim();
  const phone = String(phoneNumber ?? "").trim();
  const amountNum = Number(amount);

  if (!txnId) return NextResponse.json({ error: "Transaction ID is required" }, { status: 400 });
  if (!ZW_PHONE.test(phone)) return NextResponse.json({ error: "Enter a valid Zimbabwe mobile number (071/073/077/078...)" }, { status: 400 });
  if (!Number.isFinite(amountNum) || amountNum <= 0) return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
  if (!["subscription", "credits", "course", "class"].includes(purchaseType)) {
    return NextResponse.json({ error: "Invalid purchase type" }, { status: 400 });
  }

  const admin = createAdminClient();

  const { data: blocked } = await admin.from("blacklisted_phones").select("id").eq("phone_number", phone).maybeSingle();
  if (blocked) {
    return NextResponse.json({ error: "This phone number has been blocked from making payments. Contact support." }, { status: 403 });
  }

  const ip = getClientIp(request);
  const since = new Date(Date.now() - WINDOW_MS).toISOString();

  const { count: phoneCount } = await admin.from("payment_verifications")
    .select("id", { count: "exact", head: true }).eq("phone_number", phone).gte("created_at", since);
  if ((phoneCount ?? 0) >= PHONE_VELOCITY_LIMIT) {
    return NextResponse.json({ error: "Too many payment submissions from this phone number recently. Please contact support or try again later." }, { status: 429 });
  }

  if (ip) {
    const { count: ipCount } = await admin.from("payment_verifications")
      .select("id", { count: "exact", head: true }).eq("ip_address", ip).gte("created_at", since);
    if ((ipCount ?? 0) >= IP_VELOCITY_LIMIT) {
      return NextResponse.json({ error: "Too many payment submissions from this connection recently. Please contact support or try again later." }, { status: 429 });
    }
  }

  const payload: Record<string, unknown> = {
    user_id: profile.id,
    profile_id: profile.id,
    transaction_id: txnId,
    phone_number: phone,
    amount: amountNum,
    screenshot_url: screenshotUrl ?? null,
    status: "pending",
    purchase_type: purchaseType,
    ip_address: ip,
  };
  if (planKey) payload.plan_key = planKey;
  if (creditPackKey) { payload.credit_pack_key = creditPackKey; payload.credit_type = creditType; payload.credit_amount = creditAmount; }
  if (courseId) payload.course_id = courseId;
  if (classId) payload.class_id = classId;

  const { error } = await admin.from("payment_verifications").insert(payload);
  if (error) {
    if ((error as any).code === "23505") {
      return NextResponse.json({ error: "This transaction ID has already been used." }, { status: 409 });
    }
    return NextResponse.json({ error: "Submission failed. Please try again." }, { status: 400 });
  }

  await admin.from("notifications").insert({
    user_id: profile.id,
    title: "Payment submitted — awaiting approval",
    message: `Your $${amountNum.toFixed(2)} payment is under review. You will be notified once approved (usually within a few hours).`,
    type: "info",
  });

  return NextResponse.json({ ok: true });
}
