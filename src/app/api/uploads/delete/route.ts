import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { deleteFromR2 } from "@/lib/r2";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { key } = await request.json().catch(() => ({}));
  if (!key || typeof key !== "string") return NextResponse.json({ error: "key is required" }, { status: 400 });

  await deleteFromR2(key);
  return NextResponse.json({ ok: true });
}
