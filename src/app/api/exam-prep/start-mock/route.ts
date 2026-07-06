/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveEffectivePlan } from "@/lib/subscription/resolvePlan";
import { tryConsumeCredit } from "@/lib/subscription/credits";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id, role").eq("user_id", user.id).single();
  if (!profile || profile.role !== "student") {
    return NextResponse.json({ error: "Only students can take mock exams" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { subject, questions } = body ?? {};
  if (!subject || !Array.isArray(questions) || questions.length === 0) {
    return NextResponse.json({ error: "subject and questions are required" }, { status: 400 });
  }

  const plan = await resolveEffectivePlan(supabase, profile.id, profile.role);
  const monthlyLimit = plan.limits.mockExams;
  const admin = createAdminClient();

  if (typeof monthlyLimit === "number" && monthlyLimit !== -1) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const { count } = await admin.from("exam_sessions")
      .select("id", { count: "exact", head: true })
      .eq("student_id", profile.id)
      .gte("created_at", startOfMonth.toISOString());

    if ((count ?? 0) >= monthlyLimit) {
      const usedCredit = await tryConsumeCredit(admin, user.id, "mock_exams");
      if (!usedCredit) {
        return NextResponse.json({
          error: `You've used all ${monthlyLimit} mock exam${monthlyLimit === 1 ? "" : "s"} for this month. Upgrade to Student Pro or buy a Mock Exam Pack for more.`,
          upgradeRequired: true,
        }, { status: 403 });
      }
    }
  }

  const { data, error } = await admin.from("exam_sessions").insert({
    student_id: profile.id,
    subject,
    questions_json: questions,
    answers_json: {},
    total: questions.length,
  }).select("id").single();

  if (error) return NextResponse.json({ error: "Could not start mock exam" }, { status: 400 });
  return NextResponse.json({ ok: true, sessionId: data.id });
}
