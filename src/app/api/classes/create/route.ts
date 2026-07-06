/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveEffectivePlan } from "@/lib/subscription/resolvePlan";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id, role, is_approved").eq("user_id", user.id).single();
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const body = await request.json().catch(() => null);
  const { schoolId, name, subject, gradeLevel, teacherId, academicYear, price } = body ?? {};
  if (!name?.trim() || !subject?.trim()) {
    return NextResponse.json({ error: "Name and subject are required" }, { status: 400 });
  }

  const admin = createAdminClient();
  let targetTeacherId: string | null = null;
  let targetSchoolId: string | null = null;

  if (schoolId) {
    // School-admin (or super_admin) creating a class within their school.
    if (profile.role !== "super_admin") {
      const { data: membership } = await admin.from("school_members")
        .select("role").eq("school_id", schoolId).eq("user_id", profile.id).maybeSingle();
      if (membership?.role !== "admin") {
        return NextResponse.json({ error: "Not an admin of this school" }, { status: 403 });
      }
    }
    targetSchoolId = schoolId;
    targetTeacherId = teacherId || null;
  } else {
    // Independent teacher creating their own class — no school link.
    if (profile.role !== "teacher" || !profile.is_approved) {
      return NextResponse.json({ error: "Only approved teachers can create independent classes" }, { status: 403 });
    }
    targetTeacherId = profile.id;
  }

  if (targetTeacherId) {
    const { data: teacherProfile } = await admin.from("profiles").select("role").eq("id", targetTeacherId).single();
    const teacherPlan = await resolveEffectivePlan(admin, targetTeacherId, teacherProfile?.role ?? "teacher");
    const maxClasses = teacherPlan.limits.maxClasses;
    if (typeof maxClasses === "number" && maxClasses !== -1) {
      const { count } = await admin.from("classes").select("id", { count: "exact", head: true }).eq("teacher_id", targetTeacherId);
      if ((count ?? 0) >= maxClasses) {
        return NextResponse.json({
          error: `This teacher has reached their plan's limit of ${maxClasses} class${maxClasses === 1 ? "" : "es"}. Upgrade to Teacher Pro for unlimited classes.`,
          upgradeRequired: true,
        }, { status: 403 });
      }
    }
  }

  const { data, error } = await admin.from("classes").insert({
    school_id: targetSchoolId,
    name: name.trim(),
    subject: subject.trim(),
    grade_level: gradeLevel ?? null,
    teacher_id: targetTeacherId,
    academic_year: academicYear ?? new Date().getFullYear().toString(),
    price: price ? Number(price) : 0,
  }).select("id,join_code,price").single();

  if (error) return NextResponse.json({ error: "Could not create class" }, { status: 400 });
  return NextResponse.json(data);
}
