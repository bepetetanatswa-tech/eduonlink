import { type NextRequest, NextResponse } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import type { Profile } from "@/types/database";

// Routes that never need auth
const PUBLIC_ROUTES = ["/", "/auth/login", "/auth/register", "/auth/forgot-password", "/auth/verify-email", "/auth/callback"];

// Role → allowed path prefixes
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

  // Always allow public assets / Next internals
  if (pathname.startsWith("/_next") || pathname.startsWith("/api") || pathname.includes(".")) {
    return NextResponse.next();
  }

  const { supabaseResponse, user, supabase } = await updateSession(request);

  // ── Not logged in ─────────────────────────────────────────────
  if (!user) {
    if (isPublic(pathname)) return supabaseResponse;
    const url = request.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("redirectTo", pathname);
    return NextResponse.redirect(url);
  }

  // ── Logged in, on auth page → redirect to dashboard ──────────
  // Exception: /auth/callback and /auth/reset-password must stay accessible
  // even with an active session (callback creates session; reset-password needs recovery session)
  const AUTH_PASSTHROUGH = ["/auth/callback", "/auth/reset-password"];
  if (pathname.startsWith("/auth/") && !AUTH_PASSTHROUGH.some((p) => pathname.startsWith(p))) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  // ── Onboarding guard ─────────────────────────────────────────
  if (pathname !== "/onboarding") {
    const profileResult = await supabase
      .from("profiles")
      .select("onboarding_completed, role")
      .eq("id", user.id)
      .single();
    const profile = profileResult.data as Pick<Profile, "onboarding_completed" | "role"> | null;

    if (profile && !profile.onboarding_completed) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }

    // ── Role-based route guard ────────────────────────────────
    if (profile && !isPublic(pathname) && !roleAllowed(profile.role, pathname)) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)"],
};
