/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await (admin.from("profiles") as any)
    .select("id").eq("user_id", user.id).single();
  if (!profile) return Response.json({ error: "Profile not found" }, { status: 404 });

  const sub = await req.json().catch(() => null);
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return Response.json({ error: "Invalid subscription" }, { status: 400 });
  }

  const { error } = await (admin.from("user_push_subscriptions") as any)
    .upsert(
      { user_id: profile.id, endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
      { onConflict: "endpoint" }
    );
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}
