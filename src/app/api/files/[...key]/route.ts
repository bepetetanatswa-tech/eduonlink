import { NextResponse, type NextRequest } from "next/server";
import { getSignedUrl } from "@/lib/r2";

export async function GET(request: NextRequest, { params }: { params: Promise<{ key: string[] }> }) {
  const { key } = await params;
  const objectKey = key.join("/");
  const signedUrl = await getSignedUrl(objectKey, 3600);
  return NextResponse.redirect(signedUrl);
}
