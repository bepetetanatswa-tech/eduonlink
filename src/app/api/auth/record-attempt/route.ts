/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = body?.email?.toLowerCase()?.trim();
  const success = !!body?.success;
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    ?? request.headers.get("x-real-ip")
    ?? null;

  const admin = createAdminClient();
  await (admin.from("login_attempts") as any).insert({ email, ip, success });

  return NextResponse.json({ ok: true });
}
