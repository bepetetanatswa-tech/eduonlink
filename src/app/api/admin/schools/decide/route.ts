/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, schoolApprovedEmail, schoolRejectedEmail } from "@/lib/email";
import { logAdminAction } from "@/lib/auditLog";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await (admin.from("profiles") as any)
    .select("id, email, role").eq("user_id", user.id).single();
  if (profile?.role !== "super_admin") {
    return NextResponse.json({ error: "Only super admins can decide school registrations" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { schoolId, decision, reason } = body ?? {};
  if (!schoolId || (decision !== "approved" && decision !== "rejected")) {
    return NextResponse.json({ error: "schoolId and a valid decision are required" }, { status: 400 });
  }
  if (decision === "rejected" && !reason?.trim()) {
    return NextResponse.json({ error: "A rejection reason is required" }, { status: 400 });
  }

  const { data: school, error } = await (admin.from("schools") as any)
    .update({
      status: decision,
      is_verified: decision === "approved",
      rejection_reason: decision === "rejected" ? reason.trim() : null,
    })
    .eq("id", schoolId)
    .select("id, name, admin_id")
    .single();

  if (error || !school) return NextResponse.json({ error: error?.message ?? "School not found" }, { status: 400 });

  await logAdminAction({
    actorId: profile.id,
    actorEmail: profile.email,
    action: decision === "approved" ? "school_approved" : "school_rejected",
    targetType: "school",
    targetId: school.id,
    details: decision === "rejected" ? { reason: reason.trim() } : null,
  });

  const { data: adminProfile } = await (admin.from("profiles") as any)
    .select("email").eq("id", school.admin_id).single();

  if (adminProfile?.email) {
    const origin = process.env.NEXT_PUBLIC_APP_URL || "https://voa-production.vercel.app";
    await sendEmail({
      to: adminProfile.email,
      subject: decision === "approved" ? "EduOnLink — Your school is approved!" : "EduOnLink — Registration update",
      html: decision === "approved"
        ? schoolApprovedEmail(school.name, `${origin}/school/dashboard`)
        : schoolRejectedEmail(school.name, reason.trim()),
    });
  }

  await (admin.from("notifications") as any).insert({
    user_id: school.admin_id,
    title: decision === "approved" ? "School approved" : "School registration update",
    message: decision === "approved"
      ? `${school.name} has been verified. Your dashboard is unlocked.`
      : `${school.name} was not approved: ${reason.trim()}`,
    type: decision === "approved" ? "success" : "warning",
  });

  return NextResponse.json({ school });
}
