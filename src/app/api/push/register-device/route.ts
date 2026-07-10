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

  const body = await req.json().catch(() => null);
  const token: string | undefined = body?.token;
  const platform: string = body?.platform === "ios" ? "ios" : "android";
  if (!token) return Response.json({ error: "token required" }, { status: 400 });

  const { error } = await (admin.from("user_device_tokens") as any)
    .upsert({ user_id: profile.id, token, platform }, { onConflict: "token" });
  if (error) return Response.json({ error: error.message }, { status: 500 });

  return Response.json({ ok: true });
}

export async function DELETE(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return Response.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const token: string | undefined = body?.token;
  if (!token) return Response.json({ error: "token required" }, { status: 400 });

  const admin = createAdminClient();
  await (admin.from("user_device_tokens") as any).delete().eq("token", token);
  return Response.json({ ok: true });
}
