import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

const PUBLIC_ROUTES = [
  "/",
  "/about",
  "/privacy",
  "/terms",
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/verify-email",
  "/auth/callback",
  "/maintenance",
];

const ROLE_ROUTES: Record<string, string[]> = {
  student:      ["/student", "/dashboard"],
  teacher:      ["/teacher", "/dashboard"],
  parent:       ["/parent", "/dashboard"],
  school_admin: ["/school", "/dashboard"],
  super_admin:  ["/admin", "/student", "/teacher", "/parent", "/school", "/dashboard"],
};

function isPublic(pathname: string) {
  return PUBLIC_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"));
}

function roleAllowed(role: string, pathname: string): boolean {
  if (role === "super_admin") return true;
  const allowed = ROLE_ROUTES[role] ?? [];
  return allowed.some((prefix) => pathname.startsWith(prefix));
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const { supabaseResponse, user, supabase } = await updateSession(request);

  if (!user) {
    if (isPublic(pathname)) return supabaseResponse;
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // Maintenance mode — check for non-admin users
  if (!pathname.startsWith("/admin") && pathname !== "/maintenance") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: setting } = await (supabase.from("platform_settings") as any)
      .select("value").eq("key", "maintenance_mode").maybeSingle();
    if (setting?.value === true) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const profileRes = await (supabase.from("profiles") as any)
        .select("role").eq("user_id", user.id).single();
      if (profileRes.data?.role !== "super_admin") {
        return NextResponse.redirect(new URL("/maintenance", request.url));
      }
    }
  }

  const AUTH_PASSTHROUGH = ["/auth/callback", "/auth/reset-password"];
  if (pathname.startsWith("/auth/") && !AUTH_PASSTHROUGH.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (!isPublic(pathname)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profileResult = await (supabase.from("profiles") as any)
      .select("role")
      .eq("user_id", user.id)
      .single();
    const profile = profileResult.data as { role: string } | null;

    if (profile && !roleAllowed(profile.role, pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
