/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const UPDATABLE_FIELDS = [
  "first_name", "last_name", "date_of_birth", "gender", "phone",
  "province", "district", "town", "bio", "avatar_url",
  "school_id", "school_name",
  "form_level", "enrolled_subjects",
  "guardian_name", "guardian_phone",
  "emergency_contact_name", "emergency_contact_phone",
  "occupation", "preferred_contact_method",
  "onboarding_step", "onboarding_completed",
] as const;

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile, error } = await (admin.from("profiles") as any)
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (error || !profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  let children: unknown[] = [];
  let availableSchools: unknown[] = [];

  if (profile.role === "parent") {
    const { data } = await (admin.from("parent_children") as any)
      .select("id, relationship, status, child:child_id(id, full_name, email)")
      .eq("parent_id", profile.id);
    children = data ?? [];
  }

  if (["student", "teacher", "school_admin"].includes(profile.role)) {
    const { data } = await (admin.from("schools") as any)
      .select("id, name")
      .order("name")
      .limit(500);
    availableSchools = data ?? [];
  }

  return NextResponse.json({ profile, children, availableSchools });
}

export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const update: Record<string, unknown> = {};
  for (const key of UPDATABLE_FIELDS) {
    if (key in body) update[key] = body[key];
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No updatable fields provided" }, { status: 400 });
  }

  if ("first_name" in update || "last_name" in update) {
    const admin = createAdminClient();
    const { data: current } = await (admin.from("profiles") as any)
      .select("first_name, last_name")
      .eq("user_id", user.id)
      .single();
    const firstName = (update.first_name as string) ?? current?.first_name ?? "";
    const lastName = (update.last_name as string) ?? current?.last_name ?? "";
    update.full_name = `${firstName} ${lastName}`.trim() || undefined;
    if (!update.full_name) delete update.full_name;
  }

  const admin = createAdminClient();
  const { data: updated, error } = await (admin.from("profiles") as any)
    .update(update)
    .eq("user_id", user.id)
    .select("*")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ profile: updated });
}
