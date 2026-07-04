/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { SchoolAttendanceDashboard } from "@/components/academic/SchoolAttendanceDashboard";

export default async function SchoolAttendancePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await (supabase.from("profiles") as any).select("id,role").eq("user_id", user.id).single();
  if (!profile || (profile.role !== "school_admin" && profile.role !== "super_admin")) redirect("/dashboard");
  const { data: member } = await (supabase.from("school_members") as any).select("school_id").eq("user_id", profile.id).maybeSingle();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>Attendance Reports</h2>
        <p style={{ fontSize: "12px", color: "#4A5170", marginTop: 2 }}>Review attendance records across all classes</p>
      </div>
      {!member?.school_id ? (
        <div style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 12, padding: 16, color: "#F5A623", fontSize: 13 }}>
          No school is linked to your account yet.
        </div>
      ) : (
        <SchoolAttendanceDashboard schoolId={member.school_id} />
      )}
    </div>
  );
}
