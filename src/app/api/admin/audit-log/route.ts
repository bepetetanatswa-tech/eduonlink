/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAdminAction } from "@/lib/auditLog";

// Used by admin pages that mutate data directly via the browser client
// (SchoolsClient, PaymentsClient, SubscriptionsClient, broadcast) — they
// call this right after a successful mutation to record it. The DB grants
// no INSERT on admin_audit_log to `authenticated` at all, so this route
// (running with the service-role key, after re-verifying super_admin
// server-side) is the only way those actions get logged.
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await (admin.from("profiles") as any)
    .select("id, role, email").eq("user_id", user.id).single();
  if (!profile || profile.role !== "super_admin") {
    return NextResponse.json({ error: "Only super admins can be logged as actors" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { action, targetType, targetId, details } = body ?? {};
  if (!action || !targetType) {
    return NextResponse.json({ error: "action and targetType are required" }, { status: 400 });
  }

  await logAdminAction({
    actorId: profile.id,
    actorEmail: profile.email,
    action,
    targetType,
    targetId: targetId ?? null,
    details: details ?? null,
  });

  return NextResponse.json({ ok: true });
}
