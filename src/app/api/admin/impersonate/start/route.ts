/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/auditLog";
import { IMPERSONATE_COOKIE } from "@/lib/impersonation";

const ROLE_HOME: Record<string, string> = {
  student: "/student/dashboard",
  teacher: "/teacher/dashboard",
  parent: "/parent/dashboard",
  school_admin: "/school/dashboard",
};

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();
  const { data: reviewer } = await (admin.from("profiles") as any)
    .select("id, email, role").eq("user_id", user.id).single();
  if (reviewer?.role !== "super_admin") {
    return NextResponse.json({ error: "Only super admins can impersonate other users" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const targetProfileId = body?.targetProfileId;
  if (!targetProfileId) return NextResponse.json({ error: "targetProfileId is required" }, { status: 400 });

  const { data: target } = await (admin.from("profiles") as any)
    .select("id, role, full_name, email").eq("id", targetProfileId).single();
  if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
  if (target.role === "super_admin") {
    return NextResponse.json({ error: "Cannot impersonate another super admin" }, { status: 400 });
  }

  await logAdminAction({
    actorId: reviewer.id,
    actorEmail: reviewer.email,
    action: "impersonation_started",
    targetType: "profile",
    targetId: target.id,
    details: { targetName: target.full_name, targetRole: target.role },
  });

  const res = NextResponse.json({ ok: true, redirectTo: ROLE_HOME[target.role] ?? "/dashboard", target });
  res.cookies.set(IMPERSONATE_COOKIE, JSON.stringify({ targetProfileId: target.id }), {
    httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 60 * 60 * 4,
  });
  return res;
}
