import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getObjectSize } from "@/lib/r2";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { key } = await request.json().catch(() => ({}));
  if (!key || typeof key !== "string") return NextResponse.json({ error: "key is required" }, { status: 400 });

  const size = await getObjectSize(key);
  return NextResponse.json({ size });
}
