/* eslint-disable @typescript-eslint/no-explicit-any */
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AnnouncementForm } from "@/components/communication/AnnouncementForm";
import { AnnouncementFeed } from "@/components/communication/AnnouncementFeed";

export default async function SchoolAnnouncementsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { data: profile } = await (supabase.from("profiles") as any)
    .select("id,role").eq("user_id", user.id).single();
  if (!profile || (profile.role !== "school_admin" && profile.role !== "super_admin")) redirect("/dashboard");

  const { data: member } = await (supabase.from("school_members") as any)
    .select("school_id,schools(id,name)").eq("user_id", profile.id).maybeSingle();
  const schoolId = member?.school_id ?? null;

  const { data: classesRaw } = await (supabase.from("classes") as any)
    .select("id,name,subject").eq("school_id", schoolId).order("name");
  const classes = classesRaw ?? [];

  return (
    <div style={{ maxWidth: 800, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>Announcements</h2>
        <p style={{ fontSize: 12, color: "#4A5170", marginTop: 4 }}>Post and manage school announcements</p>
      </div>

      <AnnouncementForm
        profileId={profile.id}
        userRole="school_admin"
        schoolId={schoolId}
        classes={classes}
        allowEmergency={true}
      />

      <div>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#CDD6F4", fontFamily: "'Space Grotesk',sans-serif", margin: "0 0 12px" }}>Posted Announcements</h3>
        <AnnouncementFeed
          profileId={profile.id}
          userRole="school_admin"
          schoolId={schoolId ?? undefined}
          showAuthorControls={true}
        />
      </div>
    </div>
  );
}
