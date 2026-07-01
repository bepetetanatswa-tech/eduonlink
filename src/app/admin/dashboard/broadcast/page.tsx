"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/database";

const ROLES: { value: UserRole | "all"; label: string }[] = [
  { value: "all", label: "All Users" },
  { value: "student", label: "Students only" },
  { value: "teacher", label: "Teachers only" },
  { value: "parent", label: "Parents only" },
  { value: "school_admin", label: "School Admins only" },
];

interface RecentAnn { id: string; title: string; content: string; is_emergency: boolean; target_role: string | null; created_at: string; reads: number }

export default function BroadcastPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<UserRole | "all">("all");
  const [isEmergency, setIsEmergency] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ count: number } | null>(null);
  const [recent, setRecent] = useState<RecentAnn[]>([]);
  const [profileId, setProfileId] = useState<string | null>(null);
  const supabase = createClient();

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) return;
      const { data: p } = await (supabase.from("profiles") as any).select("id").eq("user_id", data.user.id).single();
      if (p) setProfileId(p.id);
    });
    loadRecent();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadRecent() {
    const { data } = await (supabase.from("announcements") as any)
      .select("id,title,content,is_emergency,target_role,created_at,reads:announcement_reads(count)")
      .order("created_at", { ascending: false })
      .limit(10);
    if (data) setRecent(data.map((a: any) => ({ ...a, reads: a.reads?.[0]?.count ?? 0 })));
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim() || !profileId) return;
    setSending(true);

    // Save as announcement
    await (supabase.from("announcements") as any).insert({
      author_id: profileId,
      title: title.trim(),
      content: message.trim(),
      target_role: target === "all" ? null : target,
      is_emergency: isEmergency,
      is_pinned: isEmergency,
    });

    // Send notifications to targets
    let query = (supabase.from("profiles") as any).select("id");
    if (target !== "all") query = query.eq("role", target);
    const { data: profiles } = await query;

    let count = 0;
    if (profiles?.length > 0) {
      count = profiles.length;
      const notifications = profiles.map((p: { id: string }) => ({
        user_id: p.id,
        title: isEmergency ? `🚨 ${title}` : title,
        message: message.slice(0, 120),
        type: isEmergency ? "warning" : "announcement",
        read: false,
        link: "/dashboard",
      }));
      await (supabase.from("notifications") as any).insert(notifications);
    }

    setSending(false);
    setSent({ count });
    setTitle(""); setMessage(""); setIsEmergency(false);
    loadRecent();
    setTimeout(() => setSent(null), 5000);
  };

  const S = { border: "rgba(255,255,255,0.07)", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170", accent: "#4D7FFF" };
  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`, borderRadius: 10, color: S.text, fontSize: 13, outline: "none", boxSizing: "border-box" };

  return (
    <div style={{ maxWidth: 720, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>Broadcast</h2>
        <p style={{ fontSize: 12, color: S.dim, marginTop: 4 }}>Send announcements and notifications to all users or a specific role</p>
      </div>

      {sent && (
        <div style={{ padding: "12px 16px", borderRadius: 12, background: "rgba(0,229,163,0.1)", border: "1px solid rgba(0,229,163,0.25)", color: "#00E5A3", fontSize: 13, fontWeight: 500 }}>
          ✓ Broadcast sent to {sent.count} users
        </div>
      )}

      <form onSubmit={handleSend} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 16, padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Emergency toggle */}
        <div onClick={() => setIsEmergency(!isEmergency)} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: isEmergency ? "rgba(255,107,107,0.1)" : "rgba(255,255,255,0.02)", border: `1px solid ${isEmergency ? "rgba(255,107,107,0.35)" : S.border}`, borderRadius: 12, cursor: "pointer", transition: "all 0.15s" }}>
          <div style={{ width: 40, height: 22, borderRadius: 11, background: isEmergency ? "#FF6B6B" : "rgba(255,255,255,0.1)", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
            <div style={{ width: 16, height: 16, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: isEmergency ? 21 : 3, transition: "left 0.2s" }} />
          </div>
          <div>
            <p style={{ fontSize: 13, fontWeight: 600, color: isEmergency ? "#FF6B6B" : S.muted, margin: 0 }}>Emergency Broadcast</p>
            <p style={{ fontSize: 11, color: S.dim, margin: "2px 0 0" }}>Marks as urgent, pins at top of all feeds, triggers priority notifications</p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: S.muted, display: "block", marginBottom: 6 }}>Target Audience</label>
            <select value={target} onChange={e => setTarget(e.target.value as UserRole | "all")} style={{ ...inputStyle, cursor: "pointer" }}>
              {ROLES.map(r => <option key={r.value} value={r.value} style={{ background: "#0E1117" }}>{r.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: S.muted, display: "block", marginBottom: 6 }}>Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Notification title…" style={inputStyle} />
          </div>
        </div>

        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: S.muted, display: "block", marginBottom: 6 }}>Message *</label>
          <textarea value={message} onChange={e => setMessage(e.target.value)} rows={5} placeholder="Write your broadcast message…" style={{ ...inputStyle, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />
        </div>

        <button type="submit" disabled={sending || !title.trim() || !message.trim()}
          style={{ padding: "12px", borderRadius: 12, background: isEmergency ? "#FF6B6B" : S.accent, border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", opacity: (sending || !title.trim() || !message.trim()) ? 0.5 : 1, fontFamily: "'Space Grotesk',sans-serif" }}>
          {sending ? "Sending…" : isEmergency ? "🚨 Send Emergency Broadcast" : "Send Broadcast"}
        </button>
      </form>

      {/* Recent broadcasts */}
      <div>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: "0 0 12px" }}>Recent Broadcasts</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {recent.length === 0 && <p style={{ fontSize: 13, color: S.dim }}>No broadcasts yet.</p>}
          {recent.map(a => (
            <div key={a.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${a.is_emergency ? "rgba(255,107,107,0.25)" : S.border}`, borderRadius: 12, padding: "14px 16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  {a.is_emergency && <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(255,107,107,0.15)", color: "#FF6B6B", fontWeight: 700 }}>EMERGENCY</span>}
                  <span style={{ fontSize: 13, fontWeight: 600, color: S.text }}>{a.title}</span>
                </div>
                <span style={{ fontSize: 11, color: S.dim, flexShrink: 0, marginLeft: 8 }}>{new Date(a.created_at).toLocaleDateString()}</span>
              </div>
              <p style={{ fontSize: 12, color: S.muted, margin: "0 0 8px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{a.content}</p>
              <div style={{ display: "flex", gap: 10 }}>
                {a.target_role && <span style={{ fontSize: 11, color: S.dim, textTransform: "capitalize" }}>→ {a.target_role.replace("_", " ")}s</span>}
                <span style={{ fontSize: 11, color: S.dim }}>{a.reads} read{Number(a.reads) !== 1 ? "s" : ""}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
