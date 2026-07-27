/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPlan, CREDIT_PACKS, PLANS } from "@/lib/subscription/plans";

// Cents-fingerprinting (generate_payment_fingerprint_amount) nudges the
// displayed amount by up to 4 cents from the canonical price so pending
// payments can be matched by exact amount alone — so the server-side
// price check below allows a small tolerance rather than an exact match.
const PRICE_TOLERANCE = 0.06;

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
    planKey, creditPackKey, courseId, classId,
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

  // Never trust the client's amount — verify it actually matches the real
  // price of whatever is being purchased. Without this, a direct API call
  // could submit any low amount for a high-value item and, if an admin
  // approved without manually cross-checking the item's price, get full
  // access for a fraction of the real cost.
  let expectedPrice: number | null = null;
  let creditPack: (typeof CREDIT_PACKS)[number] | null = null;
  if (purchaseType === "subscription") {
    if (!PLANS.some((p) => p.key === planKey)) return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
    expectedPrice = getPlan(planKey).price;
  } else if (purchaseType === "credits") {
    creditPack = CREDIT_PACKS.find((p) => p.key === creditPackKey) ?? null;
    if (!creditPack) return NextResponse.json({ error: "Invalid credit pack" }, { status: 400 });
    expectedPrice = creditPack.price;
  } else if (purchaseType === "course") {
    if (!courseId) return NextResponse.json({ error: "courseId is required" }, { status: 400 });
    const { data: course } = await admin.from("courses").select("price").eq("id", courseId).maybeSingle();
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 });
    expectedPrice = course.price;
  } else if (purchaseType === "class") {
    if (!classId) return NextResponse.json({ error: "classId is required" }, { status: 400 });
    const { data: klass } = await admin.from("classes").select("price").eq("id", classId).maybeSingle();
    if (!klass) return NextResponse.json({ error: "Class not found" }, { status: 404 });
    expectedPrice = klass.price;
  }

  if (expectedPrice !== null && Math.abs(amountNum - expectedPrice) > PRICE_TOLERANCE) {
    return NextResponse.json({ error: `Amount must match the price of $${expectedPrice.toFixed(2)}` }, { status: 400 });
  }

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
  // credit_type/credit_amount are derived from the matched pack, never from
  // the client body — otherwise a request could pass a cheap pack's price
  // (which passes the check above) while claiming a different, more
  // valuable credit_type/credit_amount, and get over-credited on approval.
  if (creditPack) { payload.credit_pack_key = creditPack.key; payload.credit_type = creditPack.creditType; payload.credit_amount = creditPack.amount; }
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
