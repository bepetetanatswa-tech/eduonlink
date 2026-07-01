"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface Announcement {
  id: string;
  school_id: string | null;
  class_id: string | null;
  author_id: string;
  title: string;
  content: string;
  target_role: string | null;
  is_pinned: boolean;
  file_url: string | null;
  is_emergency: boolean;
  scheduled_at: string | null;
  created_at: string;
  author: { full_name: string; avatar_url: string | null; role: string };
  reads?: number;
  is_read?: boolean;
}

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
  const S = { bg: "#07080C", border: "rgba(255,255,255,0.07)", accent: "#4D7FFF", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170" };

  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

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

  if (loading) return <p style={{ fontSize: 13, color: S.dim, textAlign: "center", padding: "30px 0" }}>Loading announcements…</p>;

  if (announcements.length === 0) {
    return (
      <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: "40px", textAlign: "center" }}>
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
                ? "linear-gradient(135deg,rgba(255,107,107,0.1),rgba(255,107,107,0.04))"
                : isRead ? "rgba(255,255,255,0.01)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${a.is_emergency ? "rgba(255,107,107,0.35)" : a.is_pinned ? `${S.accent}30` : S.border}`,
              borderRadius: 14,
              padding: "16px 20px",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            {/* Badges */}
            <div style={{ display: "flex", gap: 6, marginBottom: 8, flexWrap: "wrap", alignItems: "center" }}>
              {a.is_emergency && (
                <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 10px", borderRadius: 20, background: "rgba(255,107,107,0.2)", color: "#FF6B6B", border: "1px solid rgba(255,107,107,0.4)", textTransform: "uppercase" }}>🚨 Emergency</span>
              )}
              {a.is_pinned && !a.is_emergency && (
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: `${S.accent}15`, color: S.accent }}>📌 Pinned</span>
              )}
              {a.target_role && (
                <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 20, background: "rgba(255,255,255,0.06)", color: S.muted, textTransform: "capitalize" }}>
                  {a.target_role.replace("_", " ")}s only
                </span>
              )}
              {!isRead && <span style={{ width: 7, height: 7, borderRadius: "50%", background: S.accent, flexShrink: 0 }} />}
            </div>

            <h4 style={{ fontSize: 14, fontWeight: 700, color: a.is_emergency ? "#FF6B6B" : S.text, fontFamily: "'Space Grotesk',sans-serif", margin: "0 0 8px" }}>{a.title}</h4>
            <p style={{ fontSize: 13, color: S.muted, lineHeight: 1.6, margin: "0 0 12px", whiteSpace: "pre-wrap" }}>{a.content}</p>

            {a.file_url && (
              <a href={a.file_url} target="_blank" rel="noreferrer" onClick={e => e.stopPropagation()} style={{ display: "inline-flex", gap: 6, alignItems: "center", fontSize: 12, color: S.accent, marginBottom: 12, textDecoration: "none" }}>
                <svg width="12" height="12" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" /></svg>
                View Attachment
              </a>
            )}

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#4D7FFF,#2D5BDF)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 9, fontWeight: 700, color: "#fff" }}>
                  {a.author?.full_name.split(" ").map(w => w[0]).slice(0, 2).join("").toUpperCase()}
                </div>
                <span style={{ fontSize: 11, color: S.dim }}>{a.author?.full_name} · {timeAgo(a.created_at)}</span>
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
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
