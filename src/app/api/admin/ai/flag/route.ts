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
    return NextResponse.json({ error: "Only super admins can flag conversations" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { conversationId, flagged, reason } = body ?? {};
  if (!conversationId) return NextResponse.json({ error: "conversationId is required" }, { status: 400 });

  const { error } = await (admin.from("ai_conversations") as any)
    .update({ flagged: !!flagged, flag_reason: flagged ? (reason?.trim() || null) : null })
    .eq("id", conversationId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await logAdminAction({
    actorId: reviewer.id,
    actorEmail: reviewer.email,
    action: flagged ? "ai_conversation_flagged" : "ai_conversation_unflagged",
    targetType: "ai_conversation",
    targetId: conversationId,
    details: { reason: reason ?? null },
  });

  return NextResponse.json({ ok: true });
}
