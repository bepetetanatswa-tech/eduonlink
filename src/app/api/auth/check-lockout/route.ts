/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_ATTEMPTS = 5;
const LOCKOUT_MINUTES = 15;

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const email = body?.email?.toLowerCase()?.trim();
  if (!email) return NextResponse.json({ error: "email is required" }, { status: 400 });

  const admin = createAdminClient();
  const since = new Date(Date.now() - LOCKOUT_MINUTES * 60 * 1000).toISOString();

  // Self-cleaning: nothing outside the lockout window matters, so drop it
  // rather than letting the table grow forever.
  await (admin.from("login_attempts") as any).delete().lt("created_at", since);

  const { data: attempts } = await (admin.from("login_attempts") as any)
    .select("success, created_at")
    .eq("email", email)
    .gte("created_at", since)
    .order("created_at", { ascending: false });

  const recentFailures: { created_at: string }[] = [];
  for (const a of attempts ?? []) {
    if (a.success) break; // a successful login resets the streak
    recentFailures.push(a);
  }

  if (recentFailures.length >= MAX_ATTEMPTS) {
    const oldestOfStreak = recentFailures[recentFailures.length - 1];
    const unlockAt = new Date(new Date(oldestOfStreak.created_at).getTime() + LOCKOUT_MINUTES * 60 * 1000);
    const retryAfterSeconds = Math.max(0, Math.ceil((unlockAt.getTime() - Date.now()) / 1000));
    if (retryAfterSeconds > 0) {
      return NextResponse.json({ locked: true, retryAfterSeconds });
    }
  }

  return NextResponse.json({ locked: false });
}
