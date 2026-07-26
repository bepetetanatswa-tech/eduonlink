/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, teacherApprovedEmail, teacherRejectedEmail } from "@/lib/email";
import { logAdminAction } from "@/lib/auditLog";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();
  const { data: reviewer } = await (admin.from("profiles") as any)
    .select("id, email, role").eq("user_id", user.id).single();
  if (reviewer?.role !== "super_admin") {
    return NextResponse.json({ error: "Only super admins can decide teacher applications" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { teacherId, decision, reason } = body ?? {};
  if (!teacherId || (decision !== "approved" && decision !== "rejected")) {
    return NextResponse.json({ error: "teacherId and a valid decision are required" }, { status: 400 });
  }
  if (decision === "rejected" && !reason?.trim()) {
    return NextResponse.json({ error: "A rejection reason is required" }, { status: 400 });
  }

  const { data: teacher, error } = await (admin.from("profiles") as any)
    .update({
      is_approved: decision === "approved",
      teacher_rejection_reason: decision === "rejected" ? reason.trim() : null,
    })
    .eq("id", teacherId)
    .eq("role", "teacher")
    .select("id, email, full_name")
    .single();

  if (error || !teacher) return NextResponse.json({ error: error?.message ?? "Teacher not found" }, { status: 400 });

  await logAdminAction({
    actorId: reviewer.id,
    actorEmail: reviewer.email,
    action: decision === "approved" ? "teacher_approved" : "teacher_rejected",
    targetType: "teacher",
    targetId: teacher.id,
    details: decision === "rejected" ? { reason: reason.trim() } : null,
  });

  await sendEmail({
    to: teacher.email,
    subject: decision === "approved" ? "EduOnLink — You're verified!" : "EduOnLink — Teacher application update",
    html: decision === "approved"
      ? teacherApprovedEmail(teacher.full_name)
      : teacherRejectedEmail(teacher.full_name, reason.trim()),
  });

  await (admin.from("notifications") as any).insert({
    user_id: teacher.id,
    title: decision === "approved" ? "You're verified" : "Application update",
    message: decision === "approved"
      ? "Your teacher account has been verified. You now have full access to teaching features."
      : `Your application was not approved: ${reason.trim()}`,
    type: decision === "approved" ? "success" : "warning",
  });

  return NextResponse.json({ teacher });
}
