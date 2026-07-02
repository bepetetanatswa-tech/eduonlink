import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { getEffectiveProfile } from "@/lib/impersonation";

export default async function ParentDashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const { profile } = await getEffectiveProfile(user);

  if (!profile) redirect("/auth/login");

  // Get school memberships (parent may be linked to a school)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: memberships } = await (supabase.from("school_members") as any)
    .select("school_id, schools(id, name, province)")
    .eq("user_id", profile.id)
    .eq("role", "parent");

  const schoolIds = (memberships ?? []).map((m: { school_id: string }) => m.school_id);

  // Get announcements from linked schools
  const [{ data: announcements }, { data: messages }] = await Promise.all([
    schoolIds.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? (supabase.from("announcements") as any)
          .select("id, title, content, created_at, school_id")
          .in("school_id", schoolIds)
          .order("created_at", { ascending: false })
          .limit(8)
      : Promise.resolve({ data: [] }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase.from("messages") as any)
      .select("id, content, created_at, sender_id")
      .eq("receiver_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(5)
      .then((r: unknown) => r)
      .catch(() => ({ data: [] })),
  ]);

  const linkedSchools = (memberships ?? []).map((m: { schools: { id: string; name: string; province: string | null } | null }) => m.schools).filter(Boolean);

  return (
    <div style={{ maxWidth: 1000, display: "flex", flexDirection: "column", gap: "24px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>
            Family Overview
          </h2>
          <p style={{ fontSize: "13px", color: "#4A5170", marginTop: 2 }}>
            Welcome back, {profile.full_name.split(" ")[0]}. Stay informed about your child&apos;s education.
          </p>
        </div>
        <Link href="/parent/dashboard/messages" style={{ padding: "8px 16px", borderRadius: "10px", fontSize: "12px", fontWeight: 600, background: "rgba(77,127,255,0.12)", border: "1px solid rgba(77,127,255,0.25)", color: "#4D7FFF", textDecoration: "none" }}>
          Messages
        </Link>
      </div>

      {/* Linked schools */}
      {linkedSchools.length > 0 && (
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          {linkedSchools.map((s: { id: string; name: string; province: string | null }) => (
            <div key={s.id} style={{ padding: "10px 16px", borderRadius: "12px", background: "rgba(77,127,255,0.06)", border: "1px solid rgba(77,127,255,0.15)" }}>
              <p style={{ fontSize: "13px", fontWeight: 600, color: "#CDD6F4" }}>{s.name}</p>
              {s.province && <p style={{ fontSize: "11px", color: "#4A5170" }}>{s.province}</p>}
            </div>
          ))}
        </div>
      )}

      {linkedSchools.length === 0 && (
        <div style={{ padding: "16px 20px", background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: "12px", color: "#F5A623", fontSize: "13px" }}>
          Your account is not linked to a school yet. Contact your child&apos;s school admin to get connected.
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
        {/* School announcements */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>School News</h3>
            <Link href="/parent/dashboard/announcements" style={{ fontSize: "11px", color: "#4D7FFF", textDecoration: "none" }}>View all →</Link>
          </div>
          <div style={{ padding: "8px" }}>
            {(announcements ?? []).length === 0 ? (
              <EmptyState
                icon={<svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" /></svg>}
                title="No announcements"
                description="School announcements will appear here once you are linked to a school."
              />
            ) : (announcements ?? []).map((a: { id: string; title: string; content: string; created_at: string }) => (
              <div key={a.id} style={{ padding: "10px 12px", borderRadius: "10px", marginBottom: 4 }}>
                <p style={{ fontSize: "13px", fontWeight: 600, color: "#CDD6F4" }}>{a.title}</p>
                <p style={{ fontSize: "11px", color: "#6B7290", marginTop: 2 }}>{a.content.slice(0, 90)}{a.content.length > 90 ? "…" : ""}</p>
                <p style={{ fontSize: "10px", color: "#4A5170", marginTop: 4 }}>{new Date(a.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Messages */}
        <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", overflow: "hidden" }}>
          <div style={{ padding: "14px 18px", borderBottom: "1px solid rgba(255,255,255,0.05)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "14px", fontWeight: 600, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>Messages</h3>
            <Link href="/parent/dashboard/messages" style={{ fontSize: "11px", color: "#4D7FFF", textDecoration: "none" }}>View all →</Link>
          </div>
          <div style={{ padding: "8px" }}>
            {(messages ?? []).length === 0 ? (
              <EmptyState
                icon={<svg width="22" height="22" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" /></svg>}
                title="No messages yet"
                description="Messages from teachers will appear here."
              />
            ) : (messages ?? []).map((m: { id: string; content: string; created_at: string }) => (
              <div key={m.id} style={{ padding: "10px 12px", borderRadius: "10px", marginBottom: 4 }}>
                <p style={{ fontSize: "12px", color: "#8892B0" }}>{m.content.slice(0, 100)}{m.content.length > 100 ? "…" : ""}</p>
                <p style={{ fontSize: "10px", color: "#4A5170", marginTop: 4 }}>{new Date(m.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Info note */}
      <div style={{ padding: "16px 20px", background: "rgba(77,127,255,0.05)", border: "1px solid rgba(77,127,255,0.12)", borderRadius: "12px" }}>
        <p style={{ fontSize: "12px", color: "#6B7290", lineHeight: 1.6 }}>
          <strong style={{ color: "#4D7FFF" }}>Parent Portal:</strong> View your child&apos;s grades, attendance, and school news here. Child-linking (linking your account directly to your child&apos;s student account) will be available in the next update. Contact your school admin for direct progress reports.
        </p>
      </div>
    </div>
  );
}
