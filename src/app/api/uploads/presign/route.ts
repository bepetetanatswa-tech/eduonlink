import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buildR2Key, fileUrlForKey, getUploadUrl, FILE_CATEGORIES } from "@/lib/r2";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const { category, filename, contentType, fileSize, ids } = body ?? {};

  const spec = FILE_CATEGORIES[category];
  if (!spec) return NextResponse.json({ error: "Unknown upload category" }, { status: 400 });
  if (!filename || !contentType || typeof fileSize !== "number") {
    return NextResponse.json({ error: "filename, contentType and fileSize are required" }, { status: 400 });
  }
  if (!spec.allowedTypes.includes(contentType)) {
    return NextResponse.json({ error: `File type ${contentType} not allowed for ${category}` }, { status: 400 });
  }
  if (fileSize > spec.maxBytes) {
    return NextResponse.json({ error: `File exceeds ${Math.round(spec.maxBytes / (1024 * 1024))}MB limit` }, { status: 400 });
  }

  let folder: string;
  try {
    folder = spec.folder(ids ?? {});
  } catch {
    return NextResponse.json({ error: "Missing required ids for this upload category" }, { status: 400 });
  }

  const key = buildR2Key(folder, filename);
  const uploadUrl = await getUploadUrl(key, contentType);

  return NextResponse.json({ uploadUrl, key, fileUrl: fileUrlForKey(key) });
}
