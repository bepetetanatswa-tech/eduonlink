/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { TimetableGrid } from "@/components/academic/TimetableGrid";

export default async function ParentTimetablePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");
  const { data: profile } = await (supabase.from("profiles") as any).select("id,role").eq("user_id", user.id).single();
  if (!profile || (profile.role !== "parent" && profile.role !== "super_admin")) redirect("/dashboard");

  const { data: links } = await (supabase.from("parent_children") as any)
    .select("child:child_id(id,full_name)").eq("parent_id", profile.id).eq("status", "confirmed");
  const children = (links ?? []).map((l: any) => l.child).filter(Boolean);

  const childSchedules = await Promise.all(
    children.map(async (child: { id: string; full_name: string }) => {
      const { data: member } = await (supabase.from("school_members") as any).select("school_id").eq("user_id", child.id).maybeSingle();
      const { data: enrollment } = await (supabase.from("class_enrollments") as any).select("class_id").eq("student_id", child.id).eq("status", "active").limit(1).maybeSingle();
      return { child, schoolId: member?.school_id ?? undefined, classId: enrollment?.class_id ?? undefined };
    })
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1C2620", fontFamily: "inherit", margin: 0 }}>Timetable</h2>
        <p style={{ fontSize: 12, color: "#6E7A6C", marginTop: 4 }}>Your child&apos;s weekly class schedule</p>
      </div>

      {childSchedules.length === 0 ? (
        <div style={{ background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.06)", borderRadius: 14, padding: "40px", textAlign: "center" }}>
          <p style={{ fontSize: 14, color: "#6E7A6C" }}>No children linked to your account. Contact your school admin.</p>
        </div>
      ) : (
        childSchedules.map(({ child, schoolId, classId }) => (
          <div key={child.id}>
            <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1C2620", fontFamily: "inherit", margin: "0 0 12px" }}>{child.full_name}</h3>
            <TimetableGrid schoolId={schoolId} classId={classId} />
          </div>
        ))
      )}
    </div>
  );
}
