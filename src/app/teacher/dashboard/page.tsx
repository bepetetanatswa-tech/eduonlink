import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { getEffectiveProfile } from "@/lib/impersonation";
import { IconBook, IconFamily, IconFileText, IconChevronRight } from "@/components/icons";

export default async function TeacherDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { profile } = await getEffectiveProfile(user);

  if (!profile) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: classes } = await (supabase.from("classes") as any)
    .select("id, name, grade_level, subject, academic_year")
    .eq("teacher_id", profile.id)
    .order("created_at", { ascending: false });

  const classIds = (classes ?? []).map((c: { id: string }) => c.id);

  const [
    { count: totalStudents },
    { count: pendingGrades },
    { data: recentAssignments },
    { data: platformStudentCount },
  ] = await Promise.all([
    classIds.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase.from("class_enrollments") as any).select("*", { count: "exact", head: true }).in("class_id", classIds).eq("status", "active")
      : Promise.resolve({ count: 0 }),
    classIds.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase.from("submissions") as any).select("*", { count: "exact", head: true }).in("assignment_id",
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (await (supabase.from("assignments") as any).select("id").in("class_id", classIds)).data?.map((a: { id: string }) => a.id) ?? []
        ).is("graded_at", null)
      : Promise.resolve({ count: 0 }),
    classIds.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase.from("assignments") as any).select("id, title, due_date, class_id").in("class_id", classIds).order("created_at", { ascending: false }).limit(5)
      : Promise.resolve({ data: [] }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase.rpc("get_platform_student_count" as any),
  ]);

  return (
    <div className="max-w-[1100px] flex flex-col gap-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="font-display font-semibold text-xl text-edu-ink">
            Welcome back, {profile.full_name.split(" ")[0]}
          </h2>
          <p className="text-[13px] text-edu-slate-500 mt-0.5">Here&apos;s your teaching overview.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/teacher/dashboard/attendance" className="btn-ghost py-2 px-4 text-xs">Mark attendance</Link>
          <Link href="/teacher/dashboard/assignments" className="btn-primary py-2 px-4 text-xs">New assignment</Link>
        </div>
      </div>

      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
        <StatCard label="My classes" value={(classes ?? []).length} accentColor="#B1502B" icon={<IconBook size={18} />} href="/teacher/dashboard/classes" />
        <StatCard label="Total students" value={totalStudents ?? 0} accentColor="#A9873F" icon={<IconFamily size={18} />} href="/teacher/dashboard/classes" />
        <StatCard label="Pending grades" value={pendingGrades ?? 0} subtitle="Submissions to mark" accentColor="#A9873F" icon={<IconFileText size={18} />} href="/teacher/dashboard/grades" />
        <StatCard label="Students on EduOnLink" value={Number(platformStudentCount ?? 0)} subtitle="Grow your reach — create more classes" accentColor="#1F4738" icon={<IconFamily size={18} />} />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* My classes */}
        <div className="border border-edu-slate-200 rounded overflow-hidden">
          <div className="px-4 py-3 border-b border-edu-slate-200 flex justify-between items-center">
            <h3 className="font-display font-semibold text-sm text-edu-ink">My classes</h3>
            <Link href="/teacher/dashboard/classes" className="text-[11px] text-edu-copper flex items-center gap-0.5">
              View all <IconChevronRight size={11} />
            </Link>
          </div>
          <div className="p-2">
            {(classes ?? []).length === 0 ? (
              <EmptyState icon={<IconBook size={20} />} title="No classes yet" description="Your school admin will assign classes to you." />
            ) : (classes ?? []).map((c: { id: string; name: string; grade_level: string | null; subject: string | null; academic_year: string }) => (
              <div key={c.id} className="px-3 py-2.5 rounded mb-1 flex justify-between items-center hover:bg-edu-slate-100 transition-colors duration-150">
                <div>
                  <p className="text-[13px] font-semibold text-edu-ink">{c.name}</p>
                  <p className="text-[11px] text-edu-slate-500">{[c.grade_level, c.subject].filter(Boolean).join(" · ") || c.academic_year}</p>
                </div>
                <Link href="/teacher/dashboard/classes" className="text-[11px] text-edu-copper flex items-center gap-0.5">
                  Open <IconChevronRight size={11} />
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Recent assignments */}
        <div className="border border-edu-slate-200 rounded overflow-hidden">
          <div className="px-4 py-3 border-b border-edu-slate-200 flex justify-between items-center">
            <h3 className="font-display font-semibold text-sm text-edu-ink">Recent assignments</h3>
            <Link href="/teacher/dashboard/assignments" className="text-[11px] text-edu-copper flex items-center gap-0.5">
              View all <IconChevronRight size={11} />
            </Link>
          </div>
          <div className="p-2">
            {(recentAssignments ?? []).length === 0 ? (
              <EmptyState icon={<IconFileText size={20} />} title="No assignments yet" description="Create your first assignment for your classes." />
            ) : (recentAssignments ?? []).map((a: { id: string; title: string; due_date: string | null }) => (
              <div key={a.id} className="px-3 py-2.5 rounded mb-1 flex justify-between items-center">
                <p className="text-[13px] font-medium text-edu-ink">{a.title}</p>
                {a.due_date && (
                  <span className={`text-[10px] font-semibold ${new Date(a.due_date) < new Date() ? "text-edu-clay" : "text-edu-slate-500"}`}>
                    {new Date(a.due_date) < new Date() ? "Overdue" : new Date(a.due_date).toLocaleDateString()}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
