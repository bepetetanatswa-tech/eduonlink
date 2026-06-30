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
    const { data: existing } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", user.id)
      .single();

    if (existing) return;

    const meta = (user.user_metadata ?? {}) as Record<string, string>;
    const email = user.email ?? "";

    const years = meta.years_experience && /^\d+$/.test(meta.years_experience)
      ? parseInt(meta.years_experience, 10)
      : 0;

    const validFormLevels = new Set([
      "ecd","grade1","grade2","grade3","grade4","grade5","grade6","grade7",
      "form1","form2","form3","form4","form5","form6",
    ]);
    const formLevel = validFormLevels.has(meta.form_level) ? meta.form_level : null;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase.from("profiles") as any).insert({
      id: user.id,
      email,
      role: email === SUPER_ADMIN_EMAIL ? "super_admin" : (meta.role ?? "student"),
      first_name: meta.first_name ?? null,
      last_name: meta.last_name ?? null,
      school_name: meta.school_name ?? null,
      province: meta.province ?? null,
      school_type: meta.school_type ?? null,
      form_level: formLevel ?? null,
      qualifications: meta.qualifications ?? null,
      years_experience: years,
    });
  } catch {
    // Must not block the auth redirect
  }
}
