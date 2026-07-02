import { NextResponse } from "next/server";
import { IMPERSONATE_COOKIE } from "@/lib/impersonation";

export async function POST() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(IMPERSONATE_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: true, path: "/", maxAge: 0 });
  return res;
}
