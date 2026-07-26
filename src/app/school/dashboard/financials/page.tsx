/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SchoolFinancialsClient } from "./SchoolFinancialsClient";

export default async function SchoolFinancialsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await (supabase.from("profiles") as any).select("id,role").eq("user_id", user.id).single();
  if (!profile || (profile.role !== "school_admin" && profile.role !== "super_admin")) redirect("/dashboard");

  const { data: member } = await (supabase.from("school_members") as any).select("school_id").eq("user_id", profile.id).maybeSingle();
  const schoolId = member?.school_id ?? null;

  const { data: teacherMembers } = schoolId ? await (supabase.from("school_members") as any)
    .select("teacher:profiles(id,full_name)")
    .eq("school_id", schoolId).eq("role", "teacher") : { data: [] };
  const teachers = (teacherMembers ?? []).map((m: any) => m.teacher).filter(Boolean);
  const teacherIds = teachers.map((t: { id: string }) => t.id);

  const { data: sales } = teacherIds.length ? await (supabase.from("course_purchases") as any)
    .select("id,teacher_id,amount_paid,platform_fee_amount,teacher_earning_amount,created_at,courses(title)")
    .in("teacher_id", teacherIds)
    .eq("status", "completed")
    .order("created_at", { ascending: false }) : { data: [] };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#1C2620", fontFamily: "inherit" }}>Financials</h2>
        <p style={{ fontSize: "12px", color: "#6E7A6C", marginTop: 2 }}>Course sales from your school&apos;s teachers, gross vs. platform commission vs. net paid out</p>
      </div>
      {!schoolId ? (
        <div style={{ background: "rgba(169,135,63,0.08)", border: "1px solid rgba(169,135,63,0.2)", borderRadius: 12, padding: 16, color: "#A9873F", fontSize: 13 }}>
          No school is linked to your account yet.
        </div>
      ) : (
        <SchoolFinancialsClient schoolId={schoolId} teachers={teachers} sales={sales ?? []} />
      )}
    </div>
  );
}
