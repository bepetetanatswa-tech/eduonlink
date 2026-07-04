"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

interface Session {
  id: string;
  class_id: string;
  teacher_id: string;
  title: string;
  description: string | null;
  scheduled_at: string;
  started_at: string | null;
  ended_at: string | null;
  jitsi_room: string;
  recording_url: string | null;
  status: "scheduled" | "live" | "ended" | "cancelled";
  created_at: string;
  attendees?: number;
}

interface Props {
  classId: string;
  profileId: string;
  isTeacher: boolean;
  className: string;
}

function Countdown({ scheduledAt }: { scheduledAt: string }) {
  const [left, setLeft] = useState("");

  useEffect(() => {
    function update() {
      const diff = new Date(scheduledAt).getTime() - Date.now();
      if (diff <= 0) { setLeft("Starting now"); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (h > 0) setLeft(`${h}h ${m}m ${s}s`);
      else if (m > 0) setLeft(`${m}m ${s}s`);
      else setLeft(`${s}s`);
    }
    update();
    const t = setInterval(update, 1000);
    return () => clearInterval(t);
  }, [scheduledAt]);

  return <span>{left}</span>;
}

const STATUS_COLOR: Record<string, string> = { scheduled: "#F5A623", live: "#00E5A3", ended: "#4A5170", cancelled: "#FF6B6B" };
const STATUS_LABEL: Record<string, string> = { scheduled: "Scheduled", live: "LIVE", ended: "Ended", cancelled: "Cancelled" };

export function LiveClassRoom({ classId, profileId, isTeacher, className }: Props) {
  const supabase = createClient();
  const S = { bg: "#07080C", border: "rgba(255,255,255,0.07)", accent: "#4D7FFF", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170" };

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinedSession, setJoinedSession] = useState<Session | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", scheduled_at: "" });
  const [creating, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await (supabase.from("live_sessions") as any)
      .select("*, attendance:live_session_attendance(count)")
      .eq("class_id", classId)
      .order("scheduled_at", { ascending: false })
      .limit(20);
    if (data) {
      setSessions(data.map((s: any) => ({ ...s, attendees: s.attendance?.length ?? 0 })));
    }
    setLoading(false);
  }, [classId, supabase]);

  useEffect(() => {
    load();
    const ch = supabase.channel(`live:${classId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_sessions", filter: `class_id=eq.${classId}` }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [classId, load, supabase]);

  async function createSession() {
    if (!form.title || !form.scheduled_at || creating) return;
    setSaving(true);
    await (supabase.from("live_sessions") as any).insert({
      class_id: classId,
      teacher_id: profileId,
      title: form.title,
      description: form.description || null,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      status: "scheduled",
    });
    setForm({ title: "", description: "", scheduled_at: "" });
    setShowCreate(false);
    setSaving(false);
    load();
  }

  async function startSession(s: Session) {
    await (supabase.from("live_sessions") as any)
      .update({ status: "live", started_at: new Date().toISOString() })
      .eq("id", s.id);
    // Notify students server-side (SECURITY DEFINER RPC, migration 032) —
    // the notifications RLS insert policy only allows user_id =
    // get_my_profile_id(), so this used to insert rows for other users
    // (students) directly, which RLS silently rejected.
    await supabase.rpc("notify_live_class_started", { p_session_id: s.id } as any);
    load();
  }

  async function endSession(s: Session) {
    await (supabase.from("live_sessions") as any)
      .update({ status: "ended", ended_at: new Date().toISOString() })
      .eq("id", s.id);
    if (joinedSession?.id === s.id) setJoinedSession(null);
    load();
  }

  async function joinSession(s: Session) {
    setJoinedSession(s);
    // Mark attendance
    if (!isTeacher) {
      await (supabase.from("live_session_attendance") as any)
        .upsert({ session_id: s.id, student_id: profileId }, { onConflict: "session_id,student_id" });
      // Also mark attendance in attendance table
      await (supabase.from("attendance") as any)
        .upsert({
          class_id: classId,
          student_id: profileId,
          date: new Date().toISOString().split("T")[0],
          status: "present",
        }, { onConflict: "class_id,student_id,date" });
    }
  }

  const liveSession = sessions.find(s => s.status === "live");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Live session banner */}
      {liveSession && !joinedSession && (
        <div style={{ background: "linear-gradient(135deg,rgba(0,229,163,0.12),rgba(0,229,163,0.06))", border: "1px solid rgba(0,229,163,0.3)", borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#00E5A3", animation: "livePulse 1.5s infinite" }} />
            <div>
              <p style={{ fontSize: 16, fontWeight: 700, color: "#00E5A3", fontFamily: "'Space Grotesk',sans-serif" }}>Class is LIVE now</p>
              <p style={{ fontSize: 13, color: S.muted }}>{liveSession.title}</p>
            </div>
          </div>
          <button onClick={() => joinSession(liveSession)} style={{ padding: "10px 24px", borderRadius: 10, background: "#00E5A3", border: "none", color: "#07080C", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
            Join Now →
          </button>
        </div>
      )}

      {/* Jitsi embed */}
      {joinedSession && (
        <div style={{ background: S.border, borderRadius: 16, overflow: "hidden", border: `1px solid ${S.border}` }}>
          <div style={{ padding: "12px 16px", background: "#0A0B10", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${S.border}` }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#00E5A3" }} />
              <span style={{ fontSize: 14, fontWeight: 600, color: S.text }}>{joinedSession.title}</span>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {isTeacher && <button onClick={() => endSession(joinedSession)} style={{ padding: "6px 14px", borderRadius: 8, background: "#FF6B6B20", border: "1px solid #FF6B6B60", color: "#FF6B6B", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>End Session</button>}
              <button onClick={() => setJoinedSession(null)} style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(255,255,255,0.06)", border: `1px solid ${S.border}`, color: S.muted, cursor: "pointer", fontSize: 12 }}>Leave</button>
            </div>
          </div>
          <iframe
            src={`https://meet.jit.si/${joinedSession.jitsi_room}`}
            allow="camera; microphone; fullscreen; display-capture; autoplay"
            style={{ width: "100%", height: 520, border: "none", display: "block" }}
            title={joinedSession.title}
          />
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h3 style={{ fontSize: 16, fontWeight: 700, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>Live Sessions</h3>
          <p style={{ fontSize: 12, color: S.dim, marginTop: 2 }}>{className}</p>
        </div>
        {isTeacher && (
          <button onClick={() => setShowCreate(true)} style={{ padding: "8px 16px", borderRadius: 10, background: S.accent, border: "none", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
            + Schedule Session
          </button>
        )}
      </div>

      {/* Create session modal */}
      {showCreate && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: "#0E1117", border: `1px solid ${S.border}`, borderRadius: 16, padding: 24, width: 360 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <span style={{ fontSize: 15, fontWeight: 700, color: S.text, fontFamily: "'Space Grotesk',sans-serif" }}>Schedule Live Session</span>
              <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", color: S.dim, cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div>
                <label style={{ fontSize: 12, color: S.muted, display: "block", marginBottom: 6 }}>Session Title *</label>
                <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Chapter 5 Review" style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, color: S.text, outline: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: S.muted, display: "block", marginBottom: 6 }}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What will you cover?" rows={2} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, color: S.text, outline: "none", resize: "none", boxSizing: "border-box" }} />
              </div>
              <div>
                <label style={{ fontSize: 12, color: S.muted, display: "block", marginBottom: 6 }}>Date & Time *</label>
                <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} style={{ width: "100%", background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, color: S.text, outline: "none", colorScheme: "dark", boxSizing: "border-box" }} />
              </div>
              <button onClick={createSession} disabled={!form.title || !form.scheduled_at || creating} style={{ padding: "10px", borderRadius: 10, background: (!form.title || !form.scheduled_at) ? "rgba(77,127,255,0.3)" : S.accent, border: "none", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, marginTop: 4 }}>
                {creating ? "Scheduling…" : "Schedule Session"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Sessions list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading && <p style={{ fontSize: 13, color: S.dim, textAlign: "center", padding: "20px 0" }}>Loading sessions…</p>}
        {!loading && sessions.length === 0 && (
          <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: "32px", textAlign: "center" }}>
            <p style={{ fontSize: 14, color: S.dim }}>{isTeacher ? "No sessions scheduled yet. Click 'Schedule Session' to create one." : "No live sessions yet. Your teacher will schedule one soon."}</p>
          </div>
        )}
        {sessions.map(s => {
          const isLive = s.status === "live";
          const isScheduled = s.status === "scheduled";
          const isEnded = s.status === "ended";
          return (
            <div key={s.id} style={{ background: isLive ? "linear-gradient(135deg,rgba(0,229,163,0.08),rgba(0,229,163,0.03))" : "rgba(255,255,255,0.02)", border: `1px solid ${isLive ? "rgba(0,229,163,0.3)" : S.border}`, borderRadius: 14, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
              <div style={{ flex: 1 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: S.text }}>{s.title}</span>
                  <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${STATUS_COLOR[s.status]}20`, color: STATUS_COLOR[s.status], border: `1px solid ${STATUS_COLOR[s.status]}40`, textTransform: "uppercase" }}>{STATUS_LABEL[s.status]}</span>
                </div>
                {s.description && <p style={{ fontSize: 12, color: S.muted, marginBottom: 6 }}>{s.description}</p>}
                <p style={{ fontSize: 11, color: S.dim }}>
                  {new Date(s.scheduled_at).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                  {isScheduled && <span style={{ color: "#F5A623", marginLeft: 8 }}>Starts in <Countdown scheduledAt={s.scheduled_at} /></span>}
                  {s.attendees !== undefined && isEnded && <span style={{ marginLeft: 8 }}>• {s.attendees} attended</span>}
                </p>
                {s.recording_url && (
                  <a href={s.recording_url} target="_blank" rel="noreferrer" style={{ fontSize: 11, color: S.accent, display: "inline-flex", alignItems: "center", gap: 4, marginTop: 4 }}>
                    <svg width="11" height="11" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    Watch Recording
                  </a>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexShrink: 0 }}>
                {isLive && (
                  <button onClick={() => joinSession(s)} style={{ padding: "8px 20px", borderRadius: 10, background: "#00E5A3", border: "none", color: "#07080C", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                    Join
                  </button>
                )}
                {isTeacher && isScheduled && (
                  <button onClick={() => startSession(s)} style={{ padding: "8px 16px", borderRadius: 10, background: S.accent, border: "none", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                    Start
                  </button>
                )}
                {isTeacher && isLive && (
                  <button onClick={() => endSession(s)} style={{ padding: "8px 16px", borderRadius: 10, background: "rgba(255,107,107,0.15)", border: "1px solid rgba(255,107,107,0.4)", color: "#FF6B6B", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                    End
                  </button>
                )}
                {isTeacher && isEnded && (
                  <button onClick={async () => {
                    const url = prompt("Paste recording URL:");
                    if (url) await (supabase.from("live_sessions") as any).update({ recording_url: url }).eq("id", s.id);
                    load();
                  }} style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(255,255,255,0.05)", border: `1px solid ${S.border}`, color: S.muted, fontSize: 12, cursor: "pointer" }}>
                    + Recording
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <style>{`@keyframes livePulse { 0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(0,229,163,0.4); } 50% { opacity:0.8; box-shadow:0 0 0 8px rgba(0,229,163,0); } }`}</style>
    </div>
  );
}
