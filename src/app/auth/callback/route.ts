/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUPER_ADMIN_EMAIL } from "@/types/auth";
import type { Database } from "@/types/database";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type");
  const next = searchParams.get("next") ?? "/dashboard";

  const cookieStore = await cookies();

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    }
  );

  if (code) {
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.session) {
      await ensureProfileExists(data.session.user);
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error("exchangeCodeForSession error:", error);
  }

  if (token_hash && type) {
    const { error, data } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "email" | "recovery" | "magiclink",
    });
    if (!error) {
      if (data.session) {
        await ensureProfileExists(data.session.user);
      }
      const destination = type === "recovery"
        ? `${origin}/auth/reset-password`
        : `${origin}${next}`;
      return NextResponse.redirect(destination);
    }
    console.error("verifyOtp error:", error);
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}

async function ensureProfileExists(
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> }
) {
  try {
    const admin = createAdminClient();

    const { data: existing } = await (admin.from("profiles") as any)
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existing) return;

    const meta = (user.user_metadata ?? {}) as Record<string, string>;
    const email = user.email ?? "";

    // Build full_name from first+last (form sends these), fallback to full_name or email prefix
    const firstName = meta.first_name ?? "";
    const lastName = meta.last_name ?? "";
    const fullName = (firstName || lastName)
      ? `${firstName} ${lastName}`.trim()
      : meta.full_name ?? meta.name ?? email.split("@")[0];

    const role = email === SUPER_ADMIN_EMAIL
      ? "super_admin"
      : (meta.role ?? "student");

    const { error } = await (admin.from("profiles") as any).insert({
      user_id: user.id,
      email,
      full_name: fullName,
      role,
      avatar_url: meta.avatar_url ?? meta.picture ?? null,
    });

    if (error) {
      console.error("ensureProfileExists insert error:", {
        code: error.code,
        message: error.message,
        details: error.details,
        userId: user.id,
        email,
        role,
      });
    }
  } catch (err) {
    console.error("ensureProfileExists unexpected error:", err);
  }
}
