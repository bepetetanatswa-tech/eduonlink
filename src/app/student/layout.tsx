import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { ImpersonationBanner } from "@/components/dashboard/ImpersonationBanner";
import { getEffectiveProfile } from "@/lib/impersonation";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { profile, isImpersonating } = await getEffectiveProfile(user);

  if (!profile || profile.role !== "student") redirect("/dashboard");

  return (
    <DashboardShell profile={profile}>
      {isImpersonating && <ImpersonationBanner name={profile.full_name} role={profile.role} />}
      {children}
    </DashboardShell>
  );
}
