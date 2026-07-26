/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AnnouncementForm } from "@/components/communication/AnnouncementForm";
import { AnnouncementFeed } from "@/components/communication/AnnouncementFeed";

export default async function TeacherAnnouncementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id,full_name,role,school_members(school_id)").eq("user_id", user.id).single();
  if (!profile || (profile.role !== "teacher" && profile.role !== "super_admin")) redirect("/dashboard");

  const schoolId = profile.school_members?.[0]?.school_id ?? null;

  const { data: classesRaw } = await (supabase.from("classes") as any)
    .select("id,name,subject").eq("teacher_id", profile.id).order("name");
  const classes = classesRaw ?? [];

  return (
    <div style={{ maxWidth: 800, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1C2620", fontFamily: "inherit", margin: 0 }}>Announcements</h2>
        <p style={{ fontSize: 12, color: "#6E7A6C", marginTop: 4 }}>Post class or school announcements</p>
      </div>

      <AnnouncementForm
        profileId={profile.id}
        userRole="teacher"
        schoolId={schoolId}
        classes={classes}
      />

      <div>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#1C2620", fontFamily: "inherit", margin: "0 0 12px" }}>Posted Announcements</h3>
        <AnnouncementFeed
          profileId={profile.id}
          userRole="teacher"
          schoolId={schoolId ?? undefined}
          showAuthorControls={true}
        />
      </div>
    </div>
  );
}
