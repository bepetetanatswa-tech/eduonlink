/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, teacherApplicationReceivedEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await (admin.from("profiles") as any)
    .select("id, role, email")
    .eq("user_id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  if (profile.role !== "teacher") {
    return NextResponse.json({ error: "Only teacher accounts require verification" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { ztcNumber, qualificationDocKey, idDocKey } = body ?? {};

  if (!ztcNumber?.trim() || !qualificationDocKey || !idDocKey) {
    return NextResponse.json({ error: "ZTC number, proof of qualifications and ID document are all required" }, { status: 400 });
  }

  // Re-submission after a rejection re-enters the review queue: clear the
  // old reason and flip is_approved back to false explicitly (it may
  // already be false, but this also covers the resubmit-after-reject case).
  const { error } = await (admin.from("profiles") as any)
    .update({
      ztc_number: ztcNumber.trim(),
      qualification_doc_key: qualificationDocKey,
      id_doc_key: idDocKey,
      is_approved: false,
      teacher_rejection_reason: null,
    })
    .eq("id", profile.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await sendEmail({
    to: profile.email,
    subject: "Educonnect — Teacher application received",
    html: teacherApplicationReceivedEmail(),
  });

  const { data: superAdmins } = await (admin.from("profiles") as any)
    .select("id")
    .eq("role", "super_admin");
  for (const sa of superAdmins ?? []) {
    await (admin.from("notifications") as any).insert({
      user_id: sa.id,
      title: "New teacher application",
      message: "A teacher application has been submitted for verification.",
      type: "info",
    });
  }

  return NextResponse.json({ ok: true });
}
