/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { LiveClassRoom } from "@/components/communication/LiveClassRoom";
import { resolveEffectivePlan } from "@/lib/subscription/resolvePlan";

interface Props { params: Promise<{ id: string }> }

export default async function StudentLivePage({ params }: Props) {
 const { id: classId } = await params;
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) redirect("/auth/login");

 const { data: profile } = await (supabase.from("profiles") as any)
 .select("id,full_name,role").eq("user_id", user.id).single();
 if (!profile || (profile.role !== "student" && profile.role !== "super_admin")) redirect("/dashboard");

 const { data: enrollment } = await (supabase.from("class_enrollments") as any)
 .select("id").eq("class_id", classId).eq("student_id", profile.id).eq("status", "active").maybeSingle();
 if (!enrollment) redirect("/student/dashboard/classes");

 if (profile.role === "student") {
 const plan = await resolveEffectivePlan(supabase, profile.id, profile.role);
 if (plan.limits.liveClasses === false) {
 return (
 <div style={{ maxWidth: 480, margin: "60px auto", textAlign: "center", background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.06)", borderRadius: 16, padding: 40 }}>
 <div style={{ fontSize: 36, marginBottom: 10 }}></div>
 <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1C2620", fontFamily: "inherit", margin: "0 0 8px" }}>Live classes are a Student Pro feature</h2>
 <p style={{ fontSize: 13, color: "#566257", margin: "0 0 20px" }}>Upgrade to join live sessions with your teacher in real time.</p>
 <Link href="/student/dashboard/subscription" style={{ display: "inline-block", padding: "10px 24px", borderRadius: 10, background: "#B1502B", color: "#fff", fontSize: 13, fontWeight: 600, textDecoration: "none" }}>
 Upgrade Now
 </Link>
 </div>
 );
 }
 }

 const { data: cls } = await (supabase.from("classes") as any)
 .select("name,subject").eq("id", classId).single();

 return (
 <div style={{ maxWidth: 900 }}>
 <LiveClassRoom
 classId={classId}
 profileId={profile.id}
 isTeacher={false}
 className={cls?.name ?? "Class"}
 userName={profile.full_name}
 />
 </div>
 );
}
