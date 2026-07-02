/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();
  const { data: logins } = await (admin.from("login_attempts") as any)
    .select("ip, user_agent, created_at")
    .eq("email", user.email.toLowerCase())
    .eq("success", true)
    .order("created_at", { ascending: false })
    .limit(10);

  return NextResponse.json({ logins: logins ?? [] });
}
