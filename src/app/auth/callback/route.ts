import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
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
      await ensureProfileExists(supabase, data.session.user);
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  if (token_hash && type) {
    const { error, data } = await supabase.auth.verifyOtp({
      token_hash,
      type: type as "email" | "recovery" | "magiclink",
    });
    if (!error) {
      if (data.session) {
        await ensureProfileExists(supabase, data.session.user);
      }
      const destination = type === "recovery"
        ? `${origin}/auth/reset-password`
        : `${origin}${next}`;
      return NextResponse.redirect(destination);
    }
  }

  return NextResponse.redirect(`${origin}/auth/login?error=auth_callback_failed`);
}

async function ensureProfileExists(
  supabase: SupabaseClient<Database>,
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> }
) {
  try {
    // New schema: profiles.user_id = auth.users.id
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("user_id" as never, user.id)
      .maybeSingle();

    if (existing) return;

    const meta = (user.user_metadata ?? {}) as Record<string, string>;
    const email = user.email ?? "";
    const fullName = meta.full_name ?? meta.name ?? email.split("@")[0];

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("profiles") as any).insert({
      user_id: user.id,
      email,
      full_name: fullName,
      role: email === SUPER_ADMIN_EMAIL ? "super_admin" : (meta.role ?? "student"),
      avatar_url: meta.avatar_url ?? meta.picture ?? null,
    });
  } catch {
    // Must not block the auth redirect — DB trigger handles creation anyway
  }
}
