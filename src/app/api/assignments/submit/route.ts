/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveEffectivePlan } from "@/lib/subscription/resolvePlan";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id, role").eq("user_id", user.id).single();
  if (!profile || profile.role !== "student") {
    return NextResponse.json({ error: "Only students can submit assignments" }, { status: 403 });
  }

  const plan = await resolveEffectivePlan(supabase, profile.id, profile.role);
  if (plan.limits.assignments === false) {
    return NextResponse.json({ error: "Submitting assignments requires Student Pro.", upgradeRequired: true }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { assignmentId, content, fileUrl, isLate } = body ?? {};
  if (!assignmentId) return NextResponse.json({ error: "assignmentId is required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: existing } = await admin.from("submissions")
    .select("id").eq("assignment_id", assignmentId).eq("student_id", profile.id).maybeSingle();

  const payload = {
    assignment_id: assignmentId,
    student_id: profile.id,
    content: content?.trim() || null,
    file_url: fileUrl ?? null,
    is_late: !!isLate,
    status: "submitted",
    submitted_at: new Date().toISOString(),
  };

  const { error } = existing
    ? await admin.from("submissions").update(payload).eq("id", existing.id)
    : await admin.from("submissions").insert(payload);

  if (error) return NextResponse.json({ error: "Could not submit assignment" }, { status: 400 });

  await supabase.rpc("notify_assignment_submitted", { p_assignment_id: assignmentId } as any);

  return NextResponse.json({ ok: true });
}
