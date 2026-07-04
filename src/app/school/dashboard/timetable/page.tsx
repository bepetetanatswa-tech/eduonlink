/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TimetableEditor } from "@/components/academic/TimetableEditor";

export default async function SchoolTimetablePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await (supabase.from("profiles") as any).select("id,role").eq("user_id", user.id).single();
  if (!profile || (profile.role !== "school_admin" && profile.role !== "super_admin")) redirect("/dashboard");
  const { data: member } = await (supabase.from("school_members") as any).select("school_id").eq("user_id", profile.id).maybeSingle();
  if (!member?.school_id) return <p style={{ color: "#4A5170", padding: 24 }}>No school linked to your account.</p>;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>Timetable</h2>
        <p style={{ fontSize: 12, color: "#4A5170", marginTop: 4 }}>Build and manage the school timetable — click any slot to assign a lesson</p>
      </div>
      <TimetableEditor schoolId={member.school_id} profileId={profile.id} />
    </div>
  );
}
