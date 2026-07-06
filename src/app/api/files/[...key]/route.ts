/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getSignedUrl, canAccessFileKey } from "@/lib/r2";
import { resolveEffectivePlan } from "@/lib/subscription/resolvePlan";

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

  if (wantsDownload && profile.role === "student") {
    const plan = await resolveEffectivePlan(supabase, profile.id, profile.role);
    if (plan.limits.pdfDownload === false) {
      return NextResponse.json({ error: "Downloads require Student Pro.", upgradeRequired: true }, { status: 403 });
    }
  }

  const filename = objectKey.split("/").pop()?.replace(/^\d+-/, "") ?? "download";
  const signedUrl = await getSignedUrl(objectKey, 3600, wantsDownload ? filename : undefined);

  // Download clicks go through fetch() (see FileActions.tsx) so a blocked
  // request can show an upgrade prompt instead of a raw JSON error page —
  // that means the success case must hand back the URL as JSON too, since
  // fetch can't read the Location header off an opaque cross-origin redirect.
  if (wantsDownload) return NextResponse.json({ url: signedUrl });

  return NextResponse.redirect(signedUrl);
}
