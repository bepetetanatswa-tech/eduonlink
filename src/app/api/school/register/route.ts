/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendEmail, schoolSubmittedEmail } from "@/lib/email";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await (admin.from("profiles") as any)
    .select("id, role, email, school_name, school_type, province, district")
    .eq("user_id", user.id)
    .single();

  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  if (profile.role !== "school_admin") {
    return NextResponse.json({ error: "Only school admins can register a school" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const { name, address, phone, email, website, logoUrl, subscriptionPlan } = body ?? {};

  const schoolName = (name && String(name).trim()) || profile.school_name;
  if (!schoolName) {
    return NextResponse.json({ error: "School name is required" }, { status: 400 });
  }

  const schoolFields = {
    admin_id: profile.id,
    name: schoolName,
    type: profile.school_type,
    province: profile.province,
    district: profile.district,
    address: address || null,
    phone: phone || null,
    email: email || profile.email,
    website: website || null,
    logo_url: logoUrl || null,
    subscription_plan: subscriptionPlan || "free_school",
    status: "pending",
    is_verified: false,
  };

  // Avoid relying on a DB-level unique constraint for upsert — explicit
  // select-then-write is resilient regardless of whether that constraint
  // actually made it onto the live table.
  const { data: existingSchool } = await (admin.from("schools") as any)
    .select("id").eq("admin_id", profile.id).maybeSingle();

  const { data: school, error } = existingSchool
    ? await (admin.from("schools") as any).update(schoolFields).eq("id", existingSchool.id).select().single()
    : await (admin.from("schools") as any).insert(schoolFields).select().single();

  if (error || !school) {
    return NextResponse.json({ error: error?.message ?? "Could not save school" }, { status: 400 });
  }

  await sendEmail({
    to: profile.email,
    subject: "EduOnLink — Registration received",
    html: schoolSubmittedEmail(school.name),
  });

  const { data: superAdmins } = await (admin.from("profiles") as any)
    .select("id")
    .eq("role", "super_admin");
  for (const sa of superAdmins ?? []) {
    await (admin.from("notifications") as any).insert({
      user_id: sa.id,
      title: "New school registration",
      message: `${school.name} has submitted for verification.`,
      type: "info",
    });
  }

  return NextResponse.json({ school });
}
