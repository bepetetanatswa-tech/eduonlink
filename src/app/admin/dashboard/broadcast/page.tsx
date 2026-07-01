"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/database";

const ROLES: { value: UserRole | "all"; label: string }[] = [
  { value: "all", label: "All Users" },
  { value: "student", label: "Students only" },
  { value: "teacher", label: "Teachers only" },
  { value: "parent", label: "Parents only" },
  { value: "school_admin", label: "School Admins only" },
];

export default function BroadcastPage() {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [target, setTarget] = useState<UserRole | "all">("all");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const supabase = createClient();

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;
    setSending(true);

    // Get target profiles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase.from("profiles") as any).select("id");
    if (target !== "all") query = query.eq("role", target);
    const { data: profiles } = await query;

    if (profiles && profiles.length > 0) {
      const notifications = profiles.map((p: { id: string }) => ({
        user_id: p.id, title, message, type: "announcement", read: false,
      }));
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase.from("notifications") as any).insert(notifications);
    }

    setSending(false);
    setSent(true);
    setTitle("");
    setMessage("");
    setTimeout(() => setSent(false), 3000);
  };

  return (
    <div style={{ maxWidth: 600, display: "flex", flexDirection: "column", gap: "20px" }}>
      <div>
        <h2 style={{ fontSize: "20px", fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif" }}>Broadcast Message</h2>
        <p style={{ fontSize: "12px", color: "#4A5170", marginTop: 2 }}>Send a notification to all users or a specific role</p>
      </div>

      {sent && (
        <div style={{ padding: "12px 16px", borderRadius: "12px", background: "rgba(0,229,163,0.1)", border: "1px solid rgba(0,229,163,0.2)", color: "#00E5A3", fontSize: "13px", fontWeight: 500 }}>
          ✓ Message broadcast successfully!
        </div>
      )}

      <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: "16px", padding: "24px" }}>
        <div>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "#8892B0", display: "block", marginBottom: 6 }}>Target Audience</label>
          <select value={target} onChange={(e) => setTarget(e.target.value as UserRole | "all")} style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#CDD6F4", fontSize: "13px", outline: "none" }}>
            {ROLES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </div>
        <div>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "#8892B0", display: "block", marginBottom: 6 }}>Title</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Notification title..." style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#CDD6F4", fontSize: "13px", outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ fontSize: "12px", fontWeight: 600, color: "#8892B0", display: "block", marginBottom: 6 }}>Message</label>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={4} placeholder="Write your message..." style={{ width: "100%", padding: "10px 12px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "10px", color: "#CDD6F4", fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box", fontFamily: "inherit" }} />
        </div>
        <button type="submit" disabled={sending || !title.trim() || !message.trim()} style={{ padding: "12px", borderRadius: "12px", background: "rgba(77,127,255,0.2)", border: "1px solid rgba(77,127,255,0.4)", color: "#4D7FFF", fontSize: "14px", fontWeight: 700, cursor: "pointer", opacity: sending || !title.trim() || !message.trim() ? 0.5 : 1, fontFamily: "'Space Grotesk', sans-serif" }}>
          {sending ? "Sending…" : "Broadcast Message"}
        </button>
      </form>
    </div>
  );
}
