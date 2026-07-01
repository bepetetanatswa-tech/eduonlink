/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TimetableGrid } from "@/components/academic/TimetableGrid";

export default async function TeacherTimetablePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await (supabase.from("profiles") as any).select("id,role").eq("user_id", user.id).single();
  if (!profile || profile.role !== "teacher") redirect("/dashboard");
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>My Timetable</h2>
        <p style={{ fontSize: 12, color: "#4A5170", marginTop: 4 }}>Your weekly teaching schedule</p>
      </div>
      <TimetableGrid teacherId={profile.id} />
    </div>
  );
}
