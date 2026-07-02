/* eslint-disable @typescript-eslint/no-explicit-any */
import { createAdminClient } from "@/lib/supabase/admin";
import { SUPER_ADMIN_EMAIL } from "@/types/auth";

/**
 * Backfills/creates the profiles row for a freshly authenticated user.
 *
 * A live DB trigger on auth.users creates a bare profile row (id, role,
 * email, full_name) immediately on signup — before any app code runs. So
 * "existing" is the common case, not the exception, and registration-time
 * fields (school_name, form_level, etc., collected on the register form
 * but not known to that trigger) must be backfilled onto that row rather
 * than skipped, or they're silently lost. Must be called from every path
 * that can be the first authenticated request after signup — currently
 * both /auth/callback (magic-link/OTP) and /api/auth/ensure-profile
 * (password signup with email confirmation disabled, which never hits
 * /auth/callback at all).
 */
export async function ensureProfileExists(
  user: { id: string; email?: string; user_metadata?: Record<string, unknown> }
) {
  try {
    const admin = createAdminClient();

    const { data: existing } = await (admin.from("profiles") as any)
      .select("id, first_name, last_name, form_level, school_name, province, district, school_type, qualifications, years_experience, teaching_subjects")
      .eq("user_id", user.id)
      .maybeSingle();

    const meta = (user.user_metadata ?? {}) as Record<string, unknown>;
    const email = user.email ?? "";

    // Build full_name from first+last (form sends these), fallback to full_name or email prefix
    const firstName = (meta.first_name as string) ?? "";
    const lastName = (meta.last_name as string) ?? "";
    const fullName = (firstName || lastName)
      ? `${firstName} ${lastName}`.trim()
      : (meta.full_name as string) ?? (meta.name as string) ?? email.split("@")[0];

    const role = email === SUPER_ADMIN_EMAIL
      ? "super_admin"
      : ((meta.role as string) ?? "student");

    // These are collected on the registration form today but had no
    // columns to land in until the profile-system migration (004) —
    // persist them now instead of silently dropping them.
    const registrationFields = {
      form_level: meta.form_level ?? null,
      school_name: meta.school_name ?? null,
      province: meta.province ?? null,
      district: meta.district ?? null,
      school_type: meta.school_type ?? null,
      qualifications: meta.qualifications ?? null,
      years_experience: meta.years_experience ?? null,
      teaching_subjects: meta.teaching_subjects ?? null,
    };

    if (existing) {
      // Only fill in fields the trigger-created row left null — never
      // clobber data the user may have already edited via onboarding.
      const patch: Record<string, unknown> = {};
      if (!existing.first_name && firstName) patch.first_name = firstName;
      if (!existing.last_name && lastName) patch.last_name = lastName;
      for (const [key, value] of Object.entries(registrationFields)) {
        if (value !== null && !existing[key as keyof typeof existing]) patch[key] = value;
      }
      if (Object.keys(patch).length === 0) return;

      const { error } = await (admin.from("profiles") as any).update(patch).eq("id", existing.id);
      if (error) {
        console.error("ensureProfileExists backfill error:", { code: error.code, message: error.message, userId: user.id });
      }
      return;
    }

    const { error } = await (admin.from("profiles") as any).insert({
      user_id: user.id,
      email,
      full_name: fullName,
      first_name: firstName || null,
      last_name: lastName || null,
      role,
      avatar_url: meta.avatar_url ?? meta.picture ?? null,
      ...registrationFields,
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
