/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TeacherAIUsageView } from "@/components/ai/TeacherAIUsageView";

export default async function TeacherAIUsagePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id, full_name, role").eq("user_id", user.id).single();
  if (!profile || (profile.role !== "teacher" && profile.role !== "super_admin")) redirect("/dashboard");

  const { data: membership } = await (supabase.from("school_members") as any)
    .select("school_id").eq("user_id", profile.id).eq("role", "teacher").maybeSingle();
  const { data: ownClass } = await (supabase.from("classes") as any)
    .select("id").eq("teacher_id", profile.id).limit(1).maybeSingle();
  // An independent (schoolless) teacher reaches their students through a
  // class, not school_members — RLS grants that access too (migration 071),
  // so gate the empty-state message on either path, not school alone.
  const hasAccess = !!membership?.school_id || !!ownClass;

  // RLS ("Teachers view school ai usage" / "... student conversations") scopes
  // both queries to students who share this teacher's school OR are enrolled
  // in a class this teacher teaches, automatically.
  const today = new Date().toISOString().split("T")[0];
  const { data: usageRows } = hasAccess ? await (supabase.from("ai_usage") as any)
    .select("user_id, questions_used, profiles!user_id(full_name, email)")
    .eq("date", today)
    .order("questions_used", { ascending: false }) : { data: [] };

  const { data: convos } = hasAccess ? await (supabase.from("ai_conversations") as any)
    .select("id, student_id, subject, title, messages, created_at, profiles!student_id(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(30) : { data: [] };

  return (
    <TeacherAIUsageView
      hasSchool={hasAccess}
      usageRows={usageRows ?? []}
      convos={convos ?? []}
    />
  );
}
