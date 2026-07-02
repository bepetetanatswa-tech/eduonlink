import { cookies } from "next/headers";
import { createAdminClient } from "@/lib/supabase/admin";
import type { User } from "@supabase/supabase-js";
import type { Profile } from "@/types/database";

export const IMPERSONATE_COOKIE = "voa_impersonate";

interface EffectiveProfileResult {
  profile: Profile | null;
  isImpersonating: boolean;
  realProfile: Profile | null;
}

/**
 * Resolves which profile a page should act as. The impersonation cookie is
 * never trusted on its own — it's just a pointer. It's only honored once
 * we've independently confirmed, via the caller's real (unforgeable)
 * Supabase session, that they are actually super_admin. A non-admin
 * forging this cookie gets nothing: their own real role fails the check
 * below and the cookie is ignored entirely.
 */
export async function getEffectiveProfile(realUser: User): Promise<EffectiveProfileResult> {
  const admin = createAdminClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: realProfile } = await (admin.from("profiles") as any)
    .select("*").eq("user_id", realUser.id).single();

  const cookieStore = await cookies();
  const raw = cookieStore.get(IMPERSONATE_COOKIE)?.value;

  if (!raw || realProfile?.role !== "super_admin") {
    return { profile: realProfile ?? null, isImpersonating: false, realProfile: null };
  }

  let targetProfileId: string | undefined;
  try {
    targetProfileId = JSON.parse(raw).targetProfileId;
  } catch {
    targetProfileId = undefined;
  }
  if (!targetProfileId) {
    return { profile: realProfile, isImpersonating: false, realProfile: null };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: targetProfile } = await (admin.from("profiles") as any)
    .select("*").eq("id", targetProfileId).single();

  if (!targetProfile) {
    return { profile: realProfile, isImpersonating: false, realProfile: null };
  }

  return { profile: targetProfile, isImpersonating: true, realProfile };
}
