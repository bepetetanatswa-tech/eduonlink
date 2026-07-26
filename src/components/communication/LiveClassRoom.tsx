"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { ClassChat } from "./ClassChat";

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
 userName: string;
}

const JOIN_EARLY_MS = 5 * 60000;

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

const STATUS_COLOR: Record<string, string> = { scheduled: "#A9873F", live: "#1F4738", ended: "#6E7A6C", cancelled: "#A3311E" };
const STATUS_LABEL: Record<string, string> = { scheduled: "Scheduled", live: "LIVE", ended: "Ended", cancelled: "Cancelled" };

export function LiveClassRoom({ classId, profileId, isTeacher, className, userName }: Props) {
 const supabase = createClient();
 const S = { bg: "#F2EEE3", border: "rgba(28,38,32,0.07)", accent: "#B1502B", text: "#1C2620", muted: "#566257", dim: "#6E7A6C" };

 const [sessions, setSessions] = useState<Session[]>([]);
 const [loading, setLoading] = useState(true);
 const [joinedSession, setJoinedSession] = useState<Session | null>(null);
 const [showCreate, setShowCreate] = useState(false);
 const [form, setForm] = useState({ title: "", description: "", scheduled_at: "" });
 const [creating, setSaving] = useState(false);
 const [now, setNow] = useState(Date.now());
 const [showChat, setShowChat] = useState(true);
 const [handRaised, setHandRaised] = useState(false);
 const [raisedHands, setRaisedHands] = useState<string[]>([]);
 const handsChannelRef = useRef<any>(null);

 useEffect(() => {
 const t = setInterval(() => setNow(Date.now()), 15000);
 return () => clearInterval(t);
 }, []);

 function canJoinEarly(scheduledAt: string) {
 return now >= new Date(scheduledAt).getTime() - JOIN_EARLY_MS;
 }

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

 // Raised hands — ephemeral presence, not persisted. Each participant
 // tracks their own {name, raised}; the teacher sees whoever currently
 // has a hand up. Students lower their own hand (no "force lower" from
 // the teacher — same as most video tools' basic raise-hand support).
 useEffect(() => {
 if (!joinedSession) {
 if (handsChannelRef.current) { supabase.removeChannel(handsChannelRef.current); handsChannelRef.current = null; }
 setHandRaised(false);
 setRaisedHands([]);
 return;
 }
 const channel = supabase.channel(`live-hands:${joinedSession.id}`, { config: { presence: { key: profileId } } });
 channel
 .on("presence", { event: "sync" }, () => {
 const state = channel.presenceState<{ name: string; raised: boolean }>();
 const names = Object.values(state)
 .flatMap((entries) => entries)
 .filter((u: any) => u.raised)
 .map((u: any) => u.name);
 setRaisedHands(names);
 })
 .subscribe(async (status) => {
 if (status === "SUBSCRIBED") await channel.track({ name: userName.split("")[0], raised: false });
 });
 handsChannelRef.current = channel;
 return () => { supabase.removeChannel(channel); handsChannelRef.current = null; };
 // eslint-disable-next-line react-hooks/exhaustive-deps
 }, [joinedSession?.id]);

 function toggleHand() {
 const next = !handRaised;
 setHandRaised(next);
 handsChannelRef.current?.track({ name: userName.split("")[0], raised: next });
 }

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
 <div style={{ background: "linear-gradient(135deg,rgba(31,71,56,0.12),rgba(31,71,56,0.06))", border: "1px solid rgba(31,71,56,0.3)", borderRadius: 16, padding: "20px 24px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
 <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#1F4738", animation: "livePulse 1.5s infinite" }} />
 <div>
 <p style={{ fontSize: 16, fontWeight: 700, color: "#1F4738", fontFamily: "inherit" }}>Class is LIVE now</p>
 <p style={{ fontSize: 13, color: S.muted }}>{liveSession.title}</p>
 </div>
 </div>
 <button onClick={() => joinSession(liveSession)} style={{ padding: "10px 24px", borderRadius: 10, background: "#1F4738", border: "none", color: "#F2EEE3", fontWeight: 700, fontSize: 14, cursor: "pointer" }}>
 Join Now →
 </button>
 </div>
 )}

 {/* Jitsi embed + raise hand + in-session chat */}
 {joinedSession && (
 <div style={{ display: "flex", gap: 12, alignItems: "flex-start", flexWrap: "wrap" }}>
 <div style={{ flex: "2 1 480px", background: S.border, borderRadius: 16, overflow: "hidden", border: `1px solid ${S.border}` }}>
 <div style={{ padding: "12px 16px", background: "#0A0B10", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: `1px solid ${S.border}`, flexWrap: "wrap", gap: 8 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
 <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1F4738" }} />
 <span style={{ fontSize: 14, fontWeight: 600, color: S.text }}>{joinedSession.title}</span>
 </div>
 <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
 {!isTeacher && (
 <button onClick={toggleHand} title="Raise hand" style={{ padding: "6px 12px", borderRadius: 8, background: handRaised ? "rgba(169,135,63,0.15)" : "rgba(28,38,32,0.06)", border: `1px solid ${handRaised ? "#A9873F" : S.border}`, color: handRaised ? "#A9873F" : S.muted, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
 {handRaised ? "Lower hand" : "Raise hand"}
 </button>
 )}
 <button onClick={() => setShowChat(!showChat)} style={{ padding: "6px 12px", borderRadius: 8, background: showChat ? "rgba(177,80,43,0.15)" : "rgba(28,38,32,0.06)", border: `1px solid ${showChat ? S.accent : S.border}`, color: showChat ? S.accent : S.muted, cursor: "pointer", fontSize: 12, fontWeight: 600 }}>
 Chat
 </button>
 {isTeacher && <button onClick={() => endSession(joinedSession)} style={{ padding: "6px 14px", borderRadius: 8, background: "#A3311E20", border: "1px solid #A3311E60", color: "#A3311E", cursor: "pointer", fontSize: 12, fontWeight: 600 }}>End Session</button>}
 <button onClick={() => setJoinedSession(null)} style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(28,38,32,0.06)", border: `1px solid ${S.border}`, color: S.muted, cursor: "pointer", fontSize: 12 }}>Leave</button>
 </div>
 </div>
 {isTeacher && raisedHands.length > 0 && (
 <div style={{ padding: "8px 16px", background: "rgba(169,135,63,0.08)", borderBottom: "1px solid rgba(169,135,63,0.25)", display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
 <span style={{ fontSize: 12 }}></span>
 <span style={{ fontSize: 12, color: "#A9873F", fontWeight: 600 }}>{raisedHands.join(", ")}</span>
 <span style={{ fontSize: 11, color: S.dim }}>{raisedHands.length === 1 ? "has a hand raised" : "have hands raised"}</span>
 </div>
 )}
 <iframe
 src={`https://meet.jit.si/${joinedSession.jitsi_room}`}
 allow="camera; microphone; fullscreen; display-capture; autoplay"
 style={{ width: "100%", height: 520, border: "none", display: "block" }}
 title={joinedSession.title}
 />
 </div>
 {showChat && (
 <div style={{ flex: "1 1 320px", minWidth: 300, height: 570 }}>
 <ClassChat classId={classId} profileId={profileId} userName={userName} className={className} isTeacher={isTeacher} height="100%" />
 </div>
 )}
 </div>
 )}

 {/* Header */}
 <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
 <div>
 <h3 style={{ fontSize: 16, fontWeight: 700, color: S.text, fontFamily: "inherit", margin: 0 }}>Live Sessions</h3>
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
 <div style={{ background: "#F2EEE3", border: `1px solid ${S.border}`, borderRadius: 16, padding: 24, width: 360 }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
 <span style={{ fontSize: 15, fontWeight: 700, color: S.text, fontFamily: "inherit" }}>Schedule Live Session</span>
 <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", color: S.dim, cursor: "pointer", fontSize: 18 }}>✕</button>
 </div>
 <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
 <div>
 <label style={{ fontSize: 12, color: S.muted, display: "block", marginBottom: 6 }}>Session Title *</label>
 <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="e.g. Chapter 5 Review" style={{ width: "100%", background: "rgba(28,38,32,0.04)", border: `1px solid ${S.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, color: S.text, outline: "none", boxSizing: "border-box" }} />
 </div>
 <div>
 <label style={{ fontSize: 12, color: S.muted, display: "block", marginBottom: 6 }}>Description</label>
 <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="What will you cover?" rows={2} style={{ width: "100%", background: "rgba(28,38,32,0.04)", border: `1px solid ${S.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, color: S.text, outline: "none", resize: "none", boxSizing: "border-box" }} />
 </div>
 <div>
 <label style={{ fontSize: 12, color: S.muted, display: "block", marginBottom: 6 }}>Date & Time *</label>
 <input type="datetime-local" value={form.scheduled_at} onChange={e => setForm(f => ({ ...f, scheduled_at: e.target.value }))} style={{ width: "100%", background: "rgba(28,38,32,0.04)", border: `1px solid ${S.border}`, borderRadius: 8, padding: "9px 12px", fontSize: 13, color: S.text, outline: "none", colorScheme: "dark", boxSizing: "border-box" }} />
 </div>
 <button onClick={createSession} disabled={!form.title || !form.scheduled_at || creating} style={{ padding: "10px", borderRadius: 10, background: (!form.title || !form.scheduled_at) ? "rgba(177,80,43,0.3)" : S.accent, border: "none", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, marginTop: 4 }}>
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
 <div style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: "32px", textAlign: "center" }}>
 <p style={{ fontSize: 14, color: S.dim }}>{isTeacher ? "No sessions scheduled yet. Click 'Schedule Session' to create one." : "No live sessions yet. Your teacher will schedule one soon."}</p>
 </div>
 )}
 {sessions.map(s => {
 const isLive = s.status === "live";
 const isScheduled = s.status === "scheduled";
 const isEnded = s.status === "ended";
 return (
 <div key={s.id} style={{ background: isLive ? "linear-gradient(135deg,rgba(31,71,56,0.08),rgba(31,71,56,0.03))" : "rgba(28,38,32,0.02)", border: `1px solid ${isLive ? "rgba(31,71,56,0.3)" : S.border}`, borderRadius: 14, padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
 <div style={{ flex: 1 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
 <span style={{ fontSize: 14, fontWeight: 600, color: S.text }}>{s.title}</span>
 <span style={{ fontSize: 10, fontWeight: 700, padding: "2px 8px", borderRadius: 20, background: `${STATUS_COLOR[s.status]}20`, color: STATUS_COLOR[s.status], border: `1px solid ${STATUS_COLOR[s.status]}40`, textTransform: "uppercase" }}>{STATUS_LABEL[s.status]}</span>
 </div>
 {s.description && <p style={{ fontSize: 12, color: S.muted, marginBottom: 6 }}>{s.description}</p>}
 <p style={{ fontSize: 11, color: S.dim }}>
 {new Date(s.scheduled_at).toLocaleString([], { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
 {isScheduled && <span style={{ color: "#A9873F", marginLeft: 8 }}>Starts in <Countdown scheduledAt={s.scheduled_at} /></span>}
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
 <button onClick={() => joinSession(s)} style={{ padding: "8px 20px", borderRadius: 10, background: "#1F4738", border: "none", color: "#F2EEE3", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
 Join
 </button>
 )}
 {isScheduled && canJoinEarly(s.scheduled_at) && (
 <button onClick={() => joinSession(s)} style={{ padding: "8px 20px", borderRadius: 10, background: "rgba(31,71,56,0.15)", border: "1px solid rgba(31,71,56,0.4)", color: "#1F4738", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
 Join Class
 </button>
 )}
 {isTeacher && isScheduled && (
 <button onClick={() => startSession(s)} style={{ padding: "8px 16px", borderRadius: 10, background: S.accent, border: "none", color: "#fff", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
 Start
 </button>
 )}
 {isTeacher && isLive && (
 <button onClick={() => endSession(s)} style={{ padding: "8px 16px", borderRadius: 10, background: "rgba(163,49,30,0.15)", border: "1px solid rgba(163,49,30,0.4)", color: "#A3311E", fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
 End
 </button>
 )}
 {isTeacher && isEnded && (
 <button onClick={async () => {
 const url = prompt("Paste recording URL:");
 if (url) await (supabase.from("live_sessions") as any).update({ recording_url: url }).eq("id", s.id);
 load();
 }} style={{ padding: "6px 12px", borderRadius: 8, background: "rgba(28,38,32,0.05)", border: `1px solid ${S.border}`, color: S.muted, fontSize: 12, cursor: "pointer" }}>
 + Recording
 </button>
 )}
 </div>
 </div>
 );
 })}
 </div>
 <style>{`@keyframes livePulse { 0%,100% { opacity:1; box-shadow:0 0 0 0 rgba(31,71,56,0.4); } 50% { opacity:0.8; box-shadow:0 0 0 8px rgba(31,71,56,0); } }`}</style>
 </div>
 );
}
