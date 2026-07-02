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
    return NextResponse.json({ error: "Only super admins can suspend users" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { targetId, suspend, reason } = body ?? {};
  if (!targetId) return NextResponse.json({ error: "targetId is required" }, { status: 400 });

  const { data: target } = await (admin.from("profiles") as any).select("id, role, full_name").eq("id", targetId).single();
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.role === "super_admin") return NextResponse.json({ error: "Cannot suspend a super admin" }, { status: 400 });

  const { error } = await (admin.from("profiles") as any)
    .update({
      suspended_at: suspend ? new Date().toISOString() : null,
      suspension_reason: suspend ? (reason?.trim() || "No reason given") : null,
    })
    .eq("id", targetId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAdminAction({
    actorId: reviewer.id,
    actorEmail: reviewer.email,
    action: suspend ? "user_suspended" : "user_unsuspended",
    targetType: "profile",
    targetId,
    details: { targetName: target.full_name, reason: reason ?? null },
  });

  return NextResponse.json({ ok: true });
}
