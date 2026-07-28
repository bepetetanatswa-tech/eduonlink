import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { getEffectiveProfile } from "@/lib/impersonation";
import { IconMessage } from "@/components/icons";

export default async function ParentDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { profile } = await getEffectiveProfile(user);

  if (!profile) redirect("/auth/login");

  // Get school memberships (parent may be linked to a school)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: memberships } = await (supabase.from("school_members") as any)
    .select("school_id, schools(id, name, province)")
    .eq("user_id", profile.id)
    .eq("role", "parent");

  const schoolIds = (memberships ?? []).map((m: { school_id: string }) => m.school_id);

  // Get announcements from linked schools
  const { data: announcements } = schoolIds.length
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ? await (supabase.from("announcements") as any)
        .select("id, title, content, created_at, school_id")
        .in("school_id", schoolIds)
        .order("created_at", { ascending: false })
        .limit(8)
    : { data: [] };

  const linkedSchools = (memberships ?? []).map((m: { schools: { id: string; name: string; province: string | null } | null }) => m.schools).filter(Boolean);

  return (
    <div className="max-w-[1000px] flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-3">
        <div>
          <h2 className="font-display font-semibold text-xl text-edu-ink">Family overview</h2>
          <p className="text-[13px] text-edu-slate-500 mt-0.5">
            Welcome back, {profile.full_name.split(" ")[0]}. Stay informed about your child&apos;s education.
          </p>
        </div>
      </div>

      {/* Linked schools */}
      {linkedSchools.length > 0 && (
        <div className="flex gap-2.5 flex-wrap">
          {linkedSchools.map((s: { id: string; name: string; province: string | null }) => (
            <div key={s.id} className="px-4 py-2.5 rounded border border-edu-copper-200 bg-edu-copper-50">
              <p className="text-[13px] font-semibold text-edu-ink">{s.name}</p>
              {s.province && <p className="text-[11px] text-edu-slate-500">{s.province}</p>}
            </div>
          ))}
        </div>
      )}

      {linkedSchools.length === 0 && (
        <div className="px-5 py-4 rounded border border-edu-gold-300 bg-edu-gold-50 text-edu-gold-dark text-[13px]">
          Your account isn&apos;t linked to a school yet. Contact your child&apos;s school admin to get connected.
        </div>
      )}

      <div className="border border-edu-slate-200 rounded overflow-hidden">
        <div className="px-4 py-3 border-b border-edu-slate-200 flex justify-between items-center">
          <h3 className="font-display font-semibold text-sm text-edu-ink">School news</h3>
          <Link href="/parent/dashboard/announcements" className="text-[11px] text-edu-copper">View all</Link>
        </div>
        <div className="p-2">
          {(announcements ?? []).length === 0 ? (
            <EmptyState
              icon={<IconMessage size={20} />}
              title="No announcements"
              description="School announcements will appear here once you're linked to a school."
            />
          ) : (announcements ?? []).map((a: { id: string; title: string; content: string; created_at: string }) => (
            <div key={a.id} className="px-3 py-2.5 rounded mb-0.5">
              <p className="text-[13px] font-semibold text-edu-ink">{a.title}</p>
              <p className="text-[11px] text-edu-slate-600 mt-0.5">{a.content.slice(0, 90)}{a.content.length > 90 ? "…" : ""}</p>
              <p className="text-[10px] text-edu-slate-500 mt-1">{new Date(a.created_at).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Info note */}
      <div className="px-5 py-4 rounded border border-edu-copper-200 bg-edu-copper-50">
        <p className="text-xs leading-relaxed text-edu-slate-600">
          <strong className="text-edu-copper-dark">Parent portal:</strong> view your child&apos;s grades, attendance, and school news here. Child-linking (linking your account directly to your child&apos;s student account) is coming in the next update. Contact your school admin for direct progress reports in the meantime.
        </p>
      </div>
    </div>
  );
}
