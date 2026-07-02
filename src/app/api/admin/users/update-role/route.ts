/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/auditLog";

const VALID_ROLES = ["student", "teacher", "parent", "school_admin"];

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();
  const { data: reviewer } = await (admin.from("profiles") as any)
    .select("id, email, role").eq("user_id", user.id).single();
  if (reviewer?.role !== "super_admin") {
    return NextResponse.json({ error: "Only super admins can change roles" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { targetId, newRole } = body ?? {};
  if (!targetId || !VALID_ROLES.includes(newRole)) {
    return NextResponse.json({ error: "targetId and a valid newRole are required" }, { status: 400 });
  }

  const { data: target } = await (admin.from("profiles") as any).select("id, role, full_name").eq("id", targetId).single();
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.role === "super_admin") return NextResponse.json({ error: "Cannot change a super admin's role" }, { status: 400 });

  const { error } = await (admin.from("profiles") as any).update({ role: newRole }).eq("id", targetId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAdminAction({
    actorId: reviewer.id,
    actorEmail: reviewer.email,
    action: "user_role_changed",
    targetType: "profile",
    targetId,
    details: { targetName: target.full_name, from: target.role, to: newRole },
  });

  return NextResponse.json({ ok: true });
}
