import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StatCard } from "@/components/dashboard/StatCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { getEffectiveProfile } from "@/lib/impersonation";
import { IconBook, IconFileText, IconChip, IconChevronRight } from "@/components/icons";

export default async function StudentDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { profile } = await getEffectiveProfile(user);

  if (!profile) redirect("/auth/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: enrollments } = await (supabase.from("class_enrollments") as any)
    .select("id, class_id, status, classes(id, name, grade_level, subject)")
    .eq("student_id", profile.id)
    .eq("status", "active");

  const classIds = (enrollments ?? []).map((e: { class_id: string }) => e.class_id);

  const [
    { count: aiCount },
    { data: upcomingAssignments },
    { data: recentGrades },
  ] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("ai_conversations") as any).select("*", { count: "exact", head: true }).eq("student_id", profile.id),
    classIds.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase.from("assignments") as any)
          .select("id, title, due_date, class_id")
          .in("class_id", classIds)
          .gte("due_date", new Date().toISOString())
          .order("due_date")
          .limit(5)
      : Promise.resolve({ data: [] }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("grades") as any)
      .select("id, score, grade, academic_year, term, class_id")
      .eq("student_id", profile.id)
      .order("academic_year", { ascending: false })
      .limit(5),
  ]);

  const now = new Date();
  const dueSoon = (upcomingAssignments ?? []).filter((a: { due_date: string | null }) => {
    if (!a.due_date) return false;
    return (new Date(a.due_date).getTime() - now.getTime()) < 3 * 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="max-w-[1100px] flex flex-col gap-6">
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="font-display font-semibold text-xl text-edu-ink">
            Welcome, {profile.full_name.split(" ")[0]}
          </h2>
          <p className="text-[13px] text-edu-slate-500 mt-0.5">Keep learning — every lesson counts.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/student/dashboard/ai-tutor" className="btn-ghost py-2 px-4 text-xs">
            Ask Sir Taks
          </Link>
          <Link href="/student/dashboard/assignments" className="btn-primary py-2 px-4 text-xs">
            View assignments
          </Link>
        </div>
      </div>

      <div className="grid gap-3.5" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(170px, 1fr))" }}>
        <StatCard label="Enrolled classes" value={(enrollments ?? []).length} accentColor="#B1502B" icon={<IconBook size={18} />} href="/student/dashboard/classes" />
        <StatCard label="Due assignments" value={(upcomingAssignments ?? []).length} subtitle={dueSoon > 0 ? `${dueSoon} due within 3 days` : undefined} accentColor={dueSoon > 0 ? "#A9873F" : "#1F4738"} icon={<IconFileText size={18} />} href="/student/dashboard/assignments" />
        <StatCard label="AI sessions" value={aiCount ?? 0} subtitle="with Sir Taks" accentColor="#A9873F" icon={<IconChip size={18} />} href="/student/dashboard/ai-tutor" />
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {/* My classes */}
        <div className="border border-edu-slate-200 rounded overflow-hidden">
          <div className="px-4 py-3 border-b border-edu-slate-200 flex justify-between items-center">
            <h3 className="font-display font-semibold text-sm text-edu-ink">My classes</h3>
            <Link href="/student/dashboard/classes" className="text-[11px] text-edu-copper flex items-center gap-0.5">
              View all <IconChevronRight size={11} />
            </Link>
          </div>
          <div className="p-2">
            {(enrollments ?? []).length === 0 ? (
              <EmptyState icon={<IconBook size={20} />} title="No classes yet" description="Your teacher will enroll you in classes once you join a school." />
            ) : (enrollments ?? []).map((e: { id: string; classes: { id: string; name: string; grade_level: string | null; subject: string | null } | null }) => {
              const cls = e.classes;
              if (!cls) return null;
              return (
                <div key={e.id} className="px-3 py-2.5 rounded mb-1 bg-edu-copper-50 border border-edu-copper-200">
                  <p className="text-[13px] font-semibold text-edu-ink">{cls.name}</p>
                  <p className="text-[11px] text-edu-slate-500">{[cls.grade_level, cls.subject].filter(Boolean).join(" · ") || "Active class"}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Upcoming assignments + recent grades */}
        <div className="flex flex-col gap-3">
          <div className="border border-edu-slate-200 rounded overflow-hidden flex-1">
            <div className="px-4 py-3 border-b border-edu-slate-200 flex justify-between items-center">
              <h3 className="font-display font-semibold text-sm text-edu-ink">Upcoming</h3>
              <Link href="/student/dashboard/assignments" className="text-[11px] text-edu-copper flex items-center gap-0.5">
                View all <IconChevronRight size={11} />
              </Link>
            </div>
            <div className="p-2">
              {(upcomingAssignments ?? []).length === 0 ? (
                <p className="p-4 text-xs text-edu-slate-500 text-center">Nothing due — you&apos;re caught up.</p>
              ) : (upcomingAssignments ?? []).map((a: { id: string; title: string; due_date: string | null }) => {
                const isUrgent = a.due_date && (new Date(a.due_date).getTime() - now.getTime()) < 3 * 24 * 60 * 60 * 1000;
                return (
                  <div key={a.id} className="px-3 py-2 rounded mb-0.5 flex justify-between items-center">
                    <p className="text-xs font-medium text-edu-ink">{a.title}</p>
                    <span className={`text-[10px] font-semibold ${isUrgent ? "text-edu-gold-dark" : "text-edu-slate-500"}`}>
                      {a.due_date ? new Date(a.due_date).toLocaleDateString("en-ZW", { day: "numeric", month: "short" }) : "No date"}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="border border-edu-slate-200 rounded overflow-hidden flex-1">
            <div className="px-4 py-3 border-b border-edu-slate-200 flex justify-between items-center">
              <h3 className="font-display font-semibold text-sm text-edu-ink">My grades</h3>
              <Link href="/student/dashboard/grades" className="text-[11px] text-edu-copper flex items-center gap-0.5">
                View all <IconChevronRight size={11} />
              </Link>
            </div>
            <div className="p-2">
              {(recentGrades ?? []).length === 0 ? (
                <p className="p-4 text-xs text-edu-slate-500 text-center">No grades recorded yet.</p>
              ) : (recentGrades ?? []).map((g: { id: string; score: number | null; grade: string | null; academic_year: string; term: number }) => (
                <div key={g.id} className="px-3 py-2 rounded mb-0.5 flex justify-between items-center">
                  <p className="text-[11px] text-edu-slate-600">Term {g.term} · {g.academic_year}</p>
                  <div className="flex gap-2 items-center">
                    {g.score !== null && <span className={`text-xs font-bold ${g.score >= 50 ? "text-edu-bottle" : "text-edu-clay"}`}>{g.score}%</span>}
                    {g.grade && <span className="text-[10px] font-bold text-edu-gold-dark">{g.grade}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Sir Taks AI promo */}
      <div className="border border-edu-gold-300 bg-edu-gold-50 rounded px-6 py-5 flex items-center justify-between flex-wrap gap-4">
        <div>
          <p className="font-display font-bold text-[15px] text-edu-ink">Sir Taks AI tutor</p>
          <p className="text-xs text-edu-slate-600 mt-1">Get instant ZIMSEC-aligned explanations for any topic. Available any time, day or night.</p>
        </div>
        <Link href="/student/dashboard/ai-tutor" className="btn-gold py-2.5 px-5 text-[13px] whitespace-nowrap">
          Start a session
          <IconChevronRight size={14} />
        </Link>
      </div>
    </div>
  );
}
