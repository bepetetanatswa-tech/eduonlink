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
  if (!profile.school_name) {
    return NextResponse.json({ error: "School name is missing from your profile" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const { address, phone, email, website, logoUrl, subscriptionPlan } = body ?? {};

  const { data: school, error } = await (admin.from("schools") as any)
    .upsert(
      {
        admin_id: profile.id,
        name: profile.school_name,
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
      },
      { onConflict: "admin_id" }
    )
    .select()
    .single();

  if (error || !school) {
    return NextResponse.json({ error: error?.message ?? "Could not save school" }, { status: 400 });
  }

  await sendEmail({
    to: profile.email,
    subject: "VOA — Registration received",
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
      type: "school_registration",
    });
  }

  return NextResponse.json({ school });
}
