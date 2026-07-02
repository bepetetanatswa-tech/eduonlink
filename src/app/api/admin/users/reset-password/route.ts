/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/auditLog";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();
  const { data: reviewer } = await (admin.from("profiles") as any)
    .select("id, email, role").eq("user_id", user.id).single();
  if (reviewer?.role !== "super_admin") {
    return NextResponse.json({ error: "Only super admins can trigger a password reset" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const targetId = body?.targetId;
  if (!targetId) return NextResponse.json({ error: "targetId is required" }, { status: 400 });

  const { data: target } = await (admin.from("profiles") as any).select("id, full_name, email").eq("id", targetId).single();
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });

  const { error } = await admin.auth.resetPasswordForEmail(target.email, {
    redirectTo: `${process.env.NEXT_PUBLIC_APP_URL || "https://voa-production.vercel.app"}/auth/callback?type=recovery&next=/auth/reset-password`,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAdminAction({
    actorId: reviewer.id,
    actorEmail: reviewer.email,
    action: "password_reset_triggered",
    targetType: "profile",
    targetId,
    details: { targetName: target.full_name, targetEmail: target.email },
  });

  return NextResponse.json({ ok: true });
}
