/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await (supabase.from("profiles") as any)
    .select("role").eq("user_id", user.id).single();
  if (!profile || profile.role !== "super_admin") {
    return NextResponse.json({ error: "Only super admins can blacklist phone numbers" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const phoneNumber = String(body?.phoneNumber ?? "").trim();
  if (!phoneNumber) return NextResponse.json({ error: "phoneNumber is required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("blacklisted_phones")
    .upsert({ phone_number: phoneNumber, reason: body?.reason ?? "Blacklisted by admin" }, { onConflict: "phone_number" });

  if (error) return NextResponse.json({ error: "Could not blacklist number" }, { status: 400 });
  return NextResponse.json({ ok: true });
}
