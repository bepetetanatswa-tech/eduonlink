"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { renderSimpleMarkdown } from "@/lib/simpleMarkdown";

interface Announcement {
 id: string;
 school_id: string | null;
 class_id: string | null;
 author_id: string;
 title: string;
 content: string;
 target_role: string | null;
 category: string;
 is_pinned: boolean;
 file_url: string | null;
 is_emergency: boolean;
 scheduled_at: string | null;
 created_at: string;
 edited_at: string | null;
 author: { full_name: string; avatar_url: string | null; role: string };
 reads?: number;
 is_read?: boolean;
}

const EDIT_WINDOW_MS = 24 * 60 * 60 * 1000;

const CATEGORY_COLOR: Record<string, string> = {
 academic: "#B1502B", event: "#00B4D8", urgent: "#A3311E", general: "#566257",
};
const CATEGORY_LABEL: Record<string, string> = {
 academic: "Academic", event: "Event", urgent: "Urgent", general: "General",
};

interface Props {
 profileId: string;
 userRole?: string;
 schoolId?: string | null;
 classId?: string | null;
 showAuthorControls?: boolean;
}

function timeAgo(iso: string) {
 const diff = Date.now() - new Date(iso).getTime();
 const m = Math.floor(diff / 60000);
 if (m < 1) return "just now";
 if (m < 60) return `${m}m ago`;
 const h = Math.floor(m / 60);
 if (h < 24) return `${h}h ago`;
 return `${Math.floor(h / 24)}d ago`;
}

export function AnnouncementFeed({ profileId, schoolId, classId, showAuthorControls = false }: Props) {
 const supabase = createClient();
 const S = { bg: "#F2EEE3", border: "rgba(28,38,32,0.07)", accent: "#B1502B", text: "#1C2620", muted: "#566257", dim: "#6E7A6C" };

 const [announcements, setAnnouncements] = useState<Announcement[]>([]);
 const [loading, setLoading] = useState(true);
 const [readIds, setReadIds] = useState<Set<string>>(new Set());
 const [editingId, setEditingId] = useState<string | null>(null);
 const [editTitle, setEditTitle] = useState("");
 const [editContent, setEditContent] = useState("");
 const [editCategory, setEditCategory] = useState("general");
 const [savingEdit, setSavingEdit] = useState(false);

 const load = useCallback(async () => {
 setLoading(true);
 let q = (supabase.from("announcements") as any)
 .select("*, author:profiles!announcements_author_id_fkey(full_name,avatar_url,role), reads:announcement_reads(count)")
 .order("is_pinned", { ascending: false })
 .order("is_emergency", { ascending: false })
 .order("created_at", { ascending: false })
 .limit(30);

 if (classId) {
 q = q.eq("class_id", classId);
 } else if (schoolId) {
 q = q.eq("school_id", schoolId).is("class_id", null);
 }

 const { data } = await q;

 if (data) {
 const now = new Date();
 const visible = data.filter((a: Announcement) => !a.scheduled_at || new Date(a.scheduled_at) <= now);
 const mapped = visible.map((a: any) => ({
 ...a,
 reads: a.reads?.[0]?.count ?? 0,
 }));
 setAnnouncements(mapped);
 }

 // Load which ones current user has read
 if (data?.length) {
 const ids = data.map((a: any) => a.id);
 const { data: myReads } = await (supabase.from("announcement_reads") as any)
 .select("announcement_id")
 .eq("user_id", profileId)
 .in("announcement_id", ids);
 if (myReads) setReadIds(new Set(myReads.map((r: any) => r.announcement_id)));
 }

 setLoading(false);
 }, [classId, schoolId, profileId, supabase]);

 useEffect(() => {
 load();
 const ch = supabase.channel(`announcements:${classId ?? schoolId ?? "global"}`)
 .on("postgres_changes", { event: "INSERT", schema: "public", table: "announcements" }, load)
 .on("postgres_changes", { event: "UPDATE", schema: "public", table: "announcements" }, load)
 .subscribe();
 return () => { supabase.removeChannel(ch); };
 }, [load, classId, schoolId, supabase]);

 async function markRead(id: string) {
 if (readIds.has(id)) return;
 await (supabase.from("announcement_reads") as any).insert({ announcement_id: id, user_id: profileId });
 setReadIds(prev => new Set(Array.from(prev).concat(id)));
 }

 async function pinAnnouncement(id: string, pinned: boolean) {
 await (supabase.from("announcements") as any).update({ is_pinned: !pinned }).eq("id", id);
 load();
 }

 function canEdit(a: Announcement) {
 return a.author_id === profileId && Date.now() - new Date(a.created_at).getTime() < EDIT_WINDOW_MS;
 }

 function startEdit(a: Announcement) {
 setEditingId(a.id);
 setEditTitle(a.title);
 setEditContent(a.content);
 setEditCategory(a.category ?? "general");
 }

 async function saveEdit(id: string) {
 if (!editTitle.trim() || !editContent.trim() || savingEdit) return;
 setSavingEdit(true);
 await (supabase.from("announcements") as any)
 .update({ title: editTitle.trim(), content: editContent.trim(), category: editCategory, edited_at: new Date().toISOString() })
 .eq("id", id);
 setSavingEdit(false);
 setEditingId(null);
 load();
 }

 if (loading) return <p style={{ fontSize: 13, color: S.dim, textAlign: "center", padding: "30px 0" }}>Loading announcements…</p>;

 if (announcements.length === 0) {
 return (
 <div style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: "40px", textAlign: "center" }}>
 <p style={{ fontSize: 14, color: S.dim }}>No announcements yet.</p>
 </div>
 );
 }

 return (
 <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
 {announcements.map(a => {
 const isRead = readIds.has(a.id);
 return (
 <div
 key={a.id}
 onClick={() => markRead(a.id)}
 style={{
 background: a.is_emergency
 ? "linear-gradient(135deg,rgba(163,49,30,0.1),rgba(163,49,30,0.04))"
 : isRead ? "rgba(28,38,32,0.01)" : "rgba(28,38,32,0.03)",
 border: `1px solid ${a.is_emergency ? "rgba(163,49,30,0.35)" : a.is_pinned ? `${S.accent}30` : S.border}`,
 borderRadius: 14,
 padding: "16px 20px",
 cursor: "pointer",
 transition: "background 0.15s",
 }}
 >
 {/* Badges */}
 <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
 {a.is_emergency && (
 <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: "rgba(163,49,30,0.2)", color: "#A3311E", border: "1px solid rgba(163,49,30,0.4)", textTransform: "uppercase" }}> Emergency</span>
 )}
 {a.is_pinned && !a.is_emergency && (
 <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: `${S.accent}15`, color: S.accent }}> Pinned</span>
 )}
 <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: `${CATEGORY_COLOR[a.category] ?? S.muted}15`, color: CATEGORY_COLOR[a.category] ?? S.muted }}>
 {CATEGORY_LABEL[a.category] ?? "General"}
 </span>
 {a.target_role && (
 <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(28,38,32,0.06)", color: S.muted, textTransform: "capitalize" }}>
 {a.target_role.replace("_", "")}s only
 </span>
 )}
 {!isRead && <span style={{ width: 7, height: 7, borderRadius: "50%", background: S.accent, flexShrink: 0 }} />}
 </div>

 {editingId === a.id ? (
 <div onClick={e => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", gap: 8, marginBottom: 12 }}>
 <input value={editTitle} onChange={e => setEditTitle(e.target.value)} style={{ background: "rgba(28,38,32,0.04)", border: `1px solid ${S.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, color: S.text, outline: "none" }} />
 <textarea value={editContent} onChange={e => setEditContent(e.target.value)} rows={3} style={{ background: "rgba(28,38,32,0.04)", border: `1px solid ${S.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, color: S.text, outline: "none", resize: "vertical" }} />
 <select value={editCategory} onChange={e => setEditCategory(e.target.value)} style={{ background: "rgba(28,38,32,0.04)", border: `1px solid ${S.border}`, borderRadius: 8, padding: "8px 10px", fontSize: 13, color: S.text, outline: "none", cursor: "pointer" }}>
 {Object.entries(CATEGORY_LABEL).map(([v, l]) => <option key={v} value={v} style={{ background: "#F2EEE3" }}>{l}</option>)}
 </select>
 <div style={{ display: "flex", gap: 8 }}>
 <button onClick={() => saveEdit(a.id)} disabled={savingEdit} style={{ padding: "6px 14px", borderRadius: 8, background: S.accent, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
 {savingEdit ? "Saving…" : "Save"}
 </button>
 <button onClick={() => setEditingId(null)} style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(28,38,32,0.06)", border: `1px solid ${S.border}`, color: S.muted, fontSize: 12, cursor: "pointer" }}>Cancel</button>
 </div>
 </div>
 ) : (
 <>
 <h4 style={{ fontSize: 14, fontWeight: 700, color: a.is_emergency ? "#A3311E" : S.text, fontFamily: "inherit", margin: "0 0 8px" }}>{a.title}</h4>
 <p style={{ fontSize: 13, color: S.muted, lineHeight: 1.6, margin: "0 0 12px" }}>
 {renderSimpleMarkdown(a.content)}
 {a.edited_at && <span style={{ fontSize: 11, color: S.dim, fontStyle: "italic" }}> (edited)</span>}
 </p>
 </>
 )}

 {a.file_url && (
 <a href={a.file_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ display: "inline-flex", gap: 6, alignItems: "center", fontSize: 12, color: S.accent, marginBottom: 12, textDecoration: "none" }}>
 <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
 View Attachment
 </a>
 )}

 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#B1502B,#8F4022)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>
 {a.author?.full_name.split("").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
 </div>
 <span style={{ fontSize: 11, color: S.dim }}>{a.author?.full_name} · {timeAgo(a.created_at)}</span>
 </div>
 <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
 {canEdit(a) && editingId !== a.id && (
 <button onClick={(e) => { e.stopPropagation(); startEdit(a); }}
 style={{ fontSize: 11, color: S.dim, background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}>
 Edit
 </button>
 )}
 {showAuthorControls && (
 <button onClick={(e) => { e.stopPropagation(); pinAnnouncement(a.id, a.is_pinned); }}
 style={{ fontSize: 11, color: S.dim, background: "none", border: "none", cursor: "pointer", padding: "2px 6px" }}>
 {a.is_pinned ? "Unpin" : "Pin"}
 </button>
 )}
 <span style={{ fontSize: 11, color: S.dim }}>
 {a.reads ?? 0} read{Number(a.reads) !== 1 ? "s" : ""}
 </span>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 );
}
