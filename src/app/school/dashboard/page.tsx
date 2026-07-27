import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { getEffectiveProfile } from "@/lib/impersonation";
import { IconFamily, IconChalkboard, IconBook, IconMessage, IconAlertTriangle } from "@/components/icons";

export default async function SchoolDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { profile } = await getEffectiveProfile(user);

  if (!profile) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: school } = await (supabase.from("schools") as any)
    .select("id, name, province, subscription_plan, is_verified, status, rejection_reason")
    .eq("admin_id", profile.id)
    .single();

  if (school && school.status !== "approved") {
    const rejected = school.status === "rejected";
    return (
      <div className="max-w-[520px] mx-auto mt-16 text-center">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4 border ${rejected ? "bg-edu-clay-100 border-edu-clay-200 text-edu-clay" : "bg-edu-gold-100 border-edu-gold-300 text-edu-gold-dark"}`}>
          <IconAlertTriangle size={20} />
        </div>
        <h2 className="font-display font-semibold text-xl text-edu-ink mb-2">
          {rejected ? "Registration not approved" : "Verification pending"}
        </h2>
        <p className="text-sm leading-relaxed text-edu-slate-600">
          {rejected
            ? `${school.name} wasn't approved. Reason: ${school.rejection_reason ?? "No reason given."}`
            : `${school.name} is awaiting review by the EduOnLink team. We'll email you once a decision is made — usually within 1-2 business days.`}
        </p>
      </div>
    );
  }

  const schoolId = school?.id ?? null;

  const [
    { count: studentCount },
    { count: teacherCount },
    { count: classCount },
    { data: announcements },
    { data: recentTeachers },
    { data: platformStudentCount },
  ] = await Promise.all([
    schoolId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase.from("school_members") as any).select("*", { count: "exact", head: true }).eq("school_id", schoolId).eq("role", "student")
      : Promise.resolve({ count: 0 }),
    schoolId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase.from("school_members") as any).select("*", { count: "exact", head: true }).eq("school_id", schoolId).eq("role", "teacher")
      : Promise.resolve({ count: 0 }),
    schoolId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase.from("classes") as any).select("*", { count: "exact", head: true }).eq("school_id", schoolId)
      : Promise.resolve({ count: 0 }),
    schoolId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase.from("announcements") as any).select("id, title, content, created_at").eq("school_id", schoolId).order("created_at", { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),
    schoolId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase.from("school_members") as any).select("id, user_id, joined_at, profiles(full_name, email)").eq("school_id", schoolId).eq("role", "teacher").order("joined_at", { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.rpc("get_platform_student_count" as any),
  ]);

  return (
    <div className="max-w-[1100px] flex flex-col gap-6">
      <div className="flex justify-between items-start flex-wrap gap-3">
        <div>
          <h2 className="font-display font-semibold text-xl text-edu-ink">
            {school ? school.name : "School overview"}
          </h2>
          <div className="flex gap-2 mt-1.5 flex-wrap items-center">
            {school?.province && <span className="text-xs text-edu-slate-500">{school.province}</span>}
            {school && (
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${school.is_verified ? "text-edu-bottle bg-edu-bottle-100 border-edu-bottle-200" : "text-edu-gold-dark bg-edu-gold-100 border-edu-gold-300"}`}>
                {school.is_verified ? "Verified" : "Pending verification"}
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/school/dashboard/teachers" className="btn-ghost py-2 px-4 text-xs">Invite teacher</Link>
          <Link href="/school/dashboard/announcements" className="btn-primary py-2 px-4 text-xs">Post announcement</Link>
        </div>
      </div>

      {!school && (
        <div className="px-5 py-4 rounded border border-edu-gold-300 bg-edu-gold-50 text-edu-gold-dark text-[13px]">
          No school is linked to your account yet. Contact the EduOnLink super admin to set up your school profile.
        </div>
      )}

      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
        <StatCard label="Students" value={studentCount ?? 0} accentColor="#B1502B" icon={<IconFamily size={18} />} href="/school/dashboard/students" />
        <StatCard label="Teachers" value={teacherCount ?? 0} accentColor="#1F4738" icon={<IconChalkboard size={18} />} href="/school/dashboard/teachers" />
        <StatCard label="Classes" value={classCount ?? 0} accentColor="#A9873F" icon={<IconBook size={18} />} href="/school/dashboard/classes" />
        <StatCard label="Students on EduOnLink" value={Number(platformStudentCount ?? 0)} subtitle="Platform-wide — grow your school's reach" accentColor="#1F4738" icon={<IconFamily size={18} />} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="border border-edu-slate-200 rounded overflow-hidden">
          <div className="px-4 py-3 border-b border-edu-slate-200 flex justify-between items-center">
            <h3 className="font-display font-semibold text-sm text-edu-ink">Announcements</h3>
            <Link href="/school/dashboard/announcements" className="text-[11px] text-edu-copper">View all</Link>
          </div>
          <div className="p-2">
            {(announcements ?? []).length === 0 ? (
              <EmptyState icon={<IconMessage size={20} />} title="No announcements" description="Post an announcement to inform your school community." />
            ) : (announcements ?? []).map((a: { id: string; title: string; content: string; created_at: string }) => (
              <div key={a.id} className="px-2.5 py-2.5 rounded mb-0.5">
                <p className="text-[13px] font-semibold text-edu-ink">{a.title}</p>
                <p className="text-[11px] text-edu-slate-600 mt-0.5">{a.content.slice(0, 80)}{a.content.length > 80 ? "…" : ""}</p>
                <p className="text-[10px] text-edu-slate-500 mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="border border-edu-slate-200 rounded overflow-hidden">
          <div className="px-4 py-3 border-b border-edu-slate-200 flex justify-between items-center">
            <h3 className="font-display font-semibold text-sm text-edu-ink">Recent teachers</h3>
            <Link href="/school/dashboard/teachers" className="text-[11px] text-edu-copper">View all</Link>
          </div>
          <div className="p-2">
            {(recentTeachers ?? []).length === 0 ? (
              <EmptyState icon={<IconChalkboard size={20} />} title="No teachers yet" description="Invite teachers to join your school." />
            ) : (recentTeachers ?? []).map((t: { id: string; joined_at: string; profiles: { full_name: string; email: string } | null }) => (
              <div key={t.id} className="px-2.5 py-2.5 rounded mb-0.5 flex items-center gap-2.5">
                <div className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0 text-[10px] font-bold bg-edu-bottle-100 border border-edu-bottle-200 text-edu-bottle">
                  {t.profiles?.full_name?.charAt(0).toUpperCase() ?? "?"}
                </div>
                <div>
                  <p className="text-xs font-semibold text-edu-ink">{t.profiles?.full_name ?? "Unknown"}</p>
                  <p className="text-[10px] text-edu-slate-500">Joined {new Date(t.joined_at).toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
