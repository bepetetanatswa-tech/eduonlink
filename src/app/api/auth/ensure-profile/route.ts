import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ensureProfileExists } from "@/lib/ensureProfile";

// Called by the client right after a password signUp() that returns an
// immediate session (email confirmation disabled) — that path never hits
// /auth/callback, so this is the only place ensureProfileExists runs for it.
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await ensureProfileExists(user);
  return NextResponse.json({ ok: true });
}
