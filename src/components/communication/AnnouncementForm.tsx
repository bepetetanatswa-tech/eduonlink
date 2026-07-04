"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface ClassOption { id: string; name: string; subject: string | null }

interface Props {
  profileId: string;
  userRole: string;
  schoolId?: string | null;
  classes?: ClassOption[];
  onPosted?: () => void;
  allowEmergency?: boolean;
}

const ROLES = [
  { value: "", label: "Everyone" },
  { value: "student", label: "Students only" },
  { value: "teacher", label: "Teachers only" },
  { value: "parent", label: "Parents only" },
  { value: "school_admin", label: "School admins only" },
];

export function AnnouncementForm({ profileId, schoolId, classes = [], onPosted, allowEmergency = false }: Props) {
  const supabase = createClient();
  const S = { bg: "#07080C", border: "rgba(255,255,255,0.07)", accent: "#4D7FFF", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170" };

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [classId, setClassId] = useState("");
  const [isEmergency, setIsEmergency] = useState(false);
  const [scheduledAt, setScheduledAt] = useState("");
  const [fileUrl, setFileUrl] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  async function uploadFile(file: File) {
    setUploading(true);
    try {
      const presignRes = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          category: "announcement-attachment",
          filename: file.name,
          contentType: file.type,
          fileSize: file.size,
          ids: { authorId: profileId },
        }),
      });
      if (!presignRes.ok) throw new Error("presign failed");
      const { uploadUrl, fileUrl: key } = await presignRes.json();

      const putRes = await fetch(uploadUrl, { method: "PUT", headers: { "Content-Type": file.type }, body: file });
      if (!putRes.ok) throw new Error("upload failed");

      setFileUrl(key);
      setFileName(file.name);
    } catch {
      // best-effort — button just goes back to "Attach file" on failure
    }
    setUploading(false);
  }

  async function post() {
    if (!title.trim() || !content.trim() || saving) return;
    setSaving(true);

    const payload: any = {
      author_id: profileId,
      title: title.trim(),
      content: content.trim(),
      target_role: targetRole || null,
      is_emergency: isEmergency,
      is_pinned: isEmergency,
      file_url: fileUrl,
      scheduled_at: scheduledAt ? new Date(scheduledAt).toISOString() : null,
    };

    if (classId) {
      payload.class_id = classId;
    } else if (schoolId) {
      payload.school_id = schoolId;
    }

    const { data: ann } = await (supabase.from("announcements") as any).insert(payload).select("id").single();

    // Notify targeted users server-side (SECURITY DEFINER RPC, migration
    // 032) — the notifications RLS insert policy only allows user_id =
    // get_my_profile_id(), so a direct insert targeting every other user
    // was silently rejected unless the poster was a super_admin. The RPC
    // also builds a proper "…"-terminated preview instead of a hard cut.
    if (ann) {
      await supabase.rpc("notify_announcement", { p_announcement_id: ann.id } as any);
    }

    setTitle(""); setContent(""); setTargetRole(""); setClassId(""); setIsEmergency(false); setScheduledAt(""); setFileUrl(null); setFileName(null);
    setSuccess(true);
    setSaving(false);
    setTimeout(() => setSuccess(false), 3000);
    onPosted?.();
  }

  const inputStyle: React.CSSProperties = { width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, color: S.text, outline: "none", boxSizing: "border-box" };
  const labelStyle: React.CSSProperties = { fontSize: 12, color: S.muted, display: "block", marginBottom: 6 };

  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 16, padding: "20px 24px" }}>
      <h3 style={{ fontSize: 15, fontWeight: 700, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: "0 0 18px" }}>Post Announcement</h3>

      {success && (
        <div style={{ background: "rgba(0,229,163,0.12)", border: "1px solid rgba(0,229,163,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#00E5A3" }}>
          Announcement posted successfully!
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        {/* Emergency toggle */}
        {allowEmergency && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: isEmergency ? "rgba(255,107,107,0.1)" : "rgba(255,255,255,0.02)", border: `1px solid ${isEmergency ? "rgba(255,107,107,0.3)" : S.border}`, borderRadius: 10, cursor: "pointer" }} onClick={() => setIsEmergency(!isEmergency)}>
            <div style={{ width: 36, height: 20, borderRadius: 10, background: isEmergency ? "#FF6B6B" : "rgba(255,255,255,0.1)", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
              <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: isEmergency ? 19 : 3, transition: "left 0.2s" }} />
            </div>
            <span style={{ fontSize: 13, color: isEmergency ? "#FF6B6B" : S.muted, fontWeight: isEmergency ? 600 : 400 }}>Emergency Broadcast {isEmergency ? "(will notify all users immediately)" : ""}</span>
          </div>
        )}

        <div>
          <label style={labelStyle}>Title *</label>
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title" style={inputStyle} />
        </div>

        <div>
          <label style={labelStyle}>Message *</label>
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Write your announcement..." rows={4} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Target Audience</label>
            <select value={targetRole} onChange={e => setTargetRole(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
              {ROLES.map(r => <option key={r.value} value={r.value} style={{ background: "#0E1117" }}>{r.label}</option>)}
            </select>
          </div>

          {classes.length > 0 && (
            <div>
              <label style={labelStyle}>Class (optional)</label>
              <select value={classId} onChange={e => setClassId(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
                <option value="" style={{ background: "#0E1117" }}>All classes</option>
                {classes.map(c => <option key={c.id} value={c.id} style={{ background: "#0E1117" }}>{c.name}{c.subject ? ` — ${c.subject}` : ""}</option>)}
              </select>
            </div>
          )}
        </div>

        <div>
          <label style={labelStyle}>Schedule (optional — leave blank to post now)</label>
          <input type="datetime-local" value={scheduledAt} onChange={e => setScheduledAt(e.target.value)} style={{ ...inputStyle, colorScheme: "dark" }} />
        </div>

        {/* File attach */}
        <div>
          <label style={labelStyle}>Attachment (optional)</label>
          <input type="file" ref={fileRef} style={{ display: "none" }} onChange={e => { if (e.target.files?.[0]) uploadFile(e.target.files[0]); }} />
          {fileName ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`, borderRadius: 8 }}>
              <span style={{ fontSize: 13, color: S.muted, flex: 1 }}>{fileName}</span>
              <button onClick={() => { setFileUrl(null); setFileName(null); }} style={{ background: "none", border: "none", color: "#FF6B6B", cursor: "pointer", fontSize: 14 }}>✕</button>
            </div>
          ) : (
            <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`, color: S.muted, cursor: "pointer", fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
              <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
              {uploading ? "Uploading…" : "Attach file"}
            </button>
          )}
        </div>

        <button onClick={post} disabled={!title.trim() || !content.trim() || saving}
          style={{ padding: "11px", borderRadius: 10, background: (!title.trim() || !content.trim()) ? "rgba(77,127,255,0.3)" : (isEmergency ? "#FF6B6B" : S.accent), border: "none", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, marginTop: 4 }}>
          {saving ? "Posting…" : isEmergency ? "🚨 Send Emergency Broadcast" : scheduledAt ? "Schedule Announcement" : "Post Announcement"}
        </button>
      </div>
    </div>
  );
}
