/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSignedUrl, canAccessFileKey } from "@/lib/r2";

export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id, role, school_id")
    .eq("user_id", user.id)
    .single();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const { key } = await params;
  const objectKey = key.join("/");

  if (!canAccessFileKey(objectKey, profile)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const wantsDownload = request.nextUrl.searchParams.get("download") !== null;
  const filename = objectKey.split("/").pop()?.replace(/^\d+-/, "") ?? "download";
  const signedUrl = await getSignedUrl(objectKey, 3600, wantsDownload ? filename : undefined);
  return NextResponse.redirect(signedUrl);
}
