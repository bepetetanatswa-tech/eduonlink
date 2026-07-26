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

const CATEGORIES = [
 { value: "general", label: "General" },
 { value: "academic", label: "Academic" },
 { value: "event", label: "Event" },
 { value: "urgent", label: "Urgent" },
];

export function AnnouncementForm({ profileId, schoolId, classes = [], onPosted, allowEmergency = false }: Props) {
 const supabase = createClient();
 const S = { bg: "#F2EEE3", border: "rgba(28,38,32,0.07)", accent: "#B1502B", text: "#1C2620", muted: "#566257", dim: "#6E7A6C" };

 const [title, setTitle] = useState("");
 const [content, setContent] = useState("");
 const [targetRole, setTargetRole] = useState("");
 const [category, setCategory] = useState("general");
 const [classId, setClassId] = useState("");
 const [isEmergency, setIsEmergency] = useState(false);
 const [scheduledAt, setScheduledAt] = useState("");
 const [fileUrl, setFileUrl] = useState<string | null>(null);
 const [fileName, setFileName] = useState<string | null>(null);
 const [uploading, setUploading] = useState(false);
 const [saving, setSaving] = useState(false);
 const [success, setSuccess] = useState(false);
 const fileRef = useRef<HTMLInputElement>(null);
 const contentRef = useRef<HTMLTextAreaElement>(null);

 // Wraps the current selection (or inserts a placeholder) with markdown
 // syntax — kept deliberately minimal (bold/italic/list/link) rather than
 // pulling in a full rich-text editor library.
 function applyFormat(before: string, after: string, placeholder: string) {
 const el = contentRef.current;
 if (!el) return;
 const start = el.selectionStart, end = el.selectionEnd;
 const selected = content.slice(start, end) || placeholder;
 const next = content.slice(0, start) + before + selected + after + content.slice(end);
 setContent(next);
 requestAnimationFrame(() => {
 el.focus();
 el.setSelectionRange(start + before.length, start + before.length + selected.length);
 });
 }

 function insertListLine() {
 const el = contentRef.current;
 if (!el) return;
 const start = el.selectionStart;
 const needsNewline = start > 0 && content[start - 1] !== "\n";
 const insert = `${needsNewline ? "\n" : ""}- `;
 const next = content.slice(0, start) + insert + content.slice(start);
 setContent(next);
 requestAnimationFrame(() => {
 el.focus();
 el.setSelectionRange(start + insert.length, start + insert.length);
 });
 }

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
 category,
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

 setTitle(""); setContent(""); setTargetRole(""); setCategory("general"); setClassId(""); setIsEmergency(false); setScheduledAt(""); setFileUrl(null); setFileName(null);
 setSuccess(true);
 setSaving(false);
 setTimeout(() => setSuccess(false), 3000);
 onPosted?.();
 }

 const inputStyle: React.CSSProperties = { width: "100%", background: "rgba(28,38,32,0.04)", border: `1px solid ${S.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, color: S.text, outline: "none", boxSizing: "border-box" };
 const labelStyle: React.CSSProperties = { fontSize: 12, color: S.muted, display: "block", marginBottom: 6 };

 return (
 <div style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 16, padding: "20px 24px" }}>
 <h3 style={{ fontSize: 15, fontWeight: 700, color: S.text, fontFamily: "inherit", margin: "0 0 18px" }}>Post Announcement</h3>

 {success && (
 <div style={{ background: "rgba(31,71,56,0.12)", border: "1px solid rgba(31,71,56,0.3)", borderRadius: 10, padding: "10px 14px", marginBottom: 16, fontSize: 13, color: "#1F4738" }}>
 Announcement posted successfully!
 </div>
 )}

 <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
 {/* Emergency toggle */}
 {allowEmergency && (
 <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", background: isEmergency ? "rgba(163,49,30,0.1)" : "rgba(28,38,32,0.02)", border: `1px solid ${isEmergency ? "rgba(163,49,30,0.3)" : S.border}`, borderRadius: 10, cursor: "pointer" }} onClick={() => setIsEmergency(!isEmergency)}>
 <div style={{ width: 36, height: 20, borderRadius: 10, background: isEmergency ? "#A3311E" : "rgba(28,38,32,0.1)", position: "relative", transition: "background 0.2s", flexShrink: 0 }}>
 <div style={{ width: 14, height: 14, borderRadius: "50%", background: "#fff", position: "absolute", top: 3, left: isEmergency ? 19 : 3, transition: "left 0.2s" }} />
 </div>
 <span style={{ fontSize: 13, color: isEmergency ? "#A3311E" : S.muted, fontWeight: isEmergency ? 600 : 400 }}>Emergency Broadcast {isEmergency ? "(will notify all users immediately)" : ""}</span>
 </div>
 )}

 <div>
 <label style={labelStyle}>Title *</label>
 <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Announcement title" style={inputStyle} />
 </div>

 <div>
 <label style={labelStyle}>Message *</label>
 <div style={{ display: "flex", gap: 4, marginBottom: 6 }}>
 <button type="button" onClick={() => applyFormat("**", "**", "bold text")} title="Bold" style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(28,38,32,0.04)", border: `1px solid ${S.border}`, color: S.muted, cursor: "pointer", fontSize: 12, fontWeight: 700 }}>B</button>
 <button type="button" onClick={() => applyFormat("*", "*", "italic text")} title="Italic" style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(28,38,32,0.04)", border: `1px solid ${S.border}`, color: S.muted, cursor: "pointer", fontSize: 12, fontStyle: "italic" }}>I</button>
 <button type="button" onClick={insertListLine} title="List item" style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(28,38,32,0.04)", border: `1px solid ${S.border}`, color: S.muted, cursor: "pointer", fontSize: 12 }}>•≡</button>
 <button type="button" onClick={() => applyFormat("[", "](https://)", "link text")} title="Link" style={{ width: 28, height: 28, borderRadius: 6, background: "rgba(28,38,32,0.04)", border: `1px solid ${S.border}`, color: S.muted, cursor: "pointer", fontSize: 12 }}></button>
 </div>
 <textarea ref={contentRef} value={content} onChange={e => setContent(e.target.value)} placeholder="Write your announcement..." rows={4} style={{ ...inputStyle, resize: "vertical", lineHeight: 1.6 }} />
 </div>

 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12 }}>
 <div>
 <label style={labelStyle}>Target Audience</label>
 <select value={targetRole} onChange={e => setTargetRole(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
 {ROLES.map(r => <option key={r.value} value={r.value} style={{ background: "#F2EEE3" }}>{r.label}</option>)}
 </select>
 </div>

 <div>
 <label style={labelStyle}>Category</label>
 <select value={category} onChange={e => setCategory(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
 {CATEGORIES.map(c => <option key={c.value} value={c.value} style={{ background: "#F2EEE3" }}>{c.label}</option>)}
 </select>
 </div>

 {classes.length > 0 && (
 <div>
 <label style={labelStyle}>Class (optional)</label>
 <select value={classId} onChange={e => setClassId(e.target.value)} style={{ ...inputStyle, cursor: "pointer" }}>
 <option value="" style={{ background: "#F2EEE3" }}>All classes</option>
 {classes.map(c => <option key={c.id} value={c.id} style={{ background: "#F2EEE3" }}>{c.name}{c.subject ? ` — ${c.subject}` : ""}</option>)}
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
 <div style={{ display: "flex", alignItems: "center", gap: 8, padding: "8px 12px", background: "rgba(28,38,32,0.04)", border: `1px solid ${S.border}`, borderRadius: 8 }}>
 <span style={{ fontSize: 13, color: S.muted, flex: 1 }}>{fileName}</span>
 <button onClick={() => { setFileUrl(null); setFileName(null); }} style={{ background: "none", border: "none", color: "#A3311E", cursor: "pointer", fontSize: 14 }}>✕</button>
 </div>
 ) : (
 <button onClick={() => fileRef.current?.click()} disabled={uploading} style={{ padding: "8px 16px", borderRadius: 8, background: "rgba(28,38,32,0.04)", border: `1px solid ${S.border}`, color: S.muted, cursor: "pointer", fontSize: 13, display: "flex", gap: 6, alignItems: "center" }}>
 <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
 {uploading ? "Uploading…" : "Attach file"}
 </button>
 )}
 </div>

 <button onClick={post} disabled={!title.trim() || !content.trim() || saving}
 style={{ padding: "11px", borderRadius: 10, background: (!title.trim() || !content.trim()) ? "rgba(177,80,43,0.3)" : (isEmergency ? "#A3311E" : S.accent), border: "none", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700, marginTop: 4 }}>
 {saving ? "Posting…" : isEmergency ? " Send Emergency Broadcast" : scheduledAt ? "Schedule Announcement" : "Post Announcement"}
 </button>
 </div>
 </div>
 );
}
