"use client";

import { useState } from "react";

interface Message { ts?: string; role: string; content: string }
interface Conversation {
 id: string; student_id: string; subject: string | null; title: string | null;
 messages: Message[]; created_at: string; flagged: boolean; flag_reason: string | null;
 profiles: { full_name: string; email: string; school_id: string | null; schools: { name: string } | null } | null;
}
interface UsageRow { user_id: string; questions_used: number }

export function AIMonitorClient({
 convos, usageRows, totalConvos, totalQuestionsToday, activeUsersToday,
 estimatedCost30d, dailyLimit, topQuestions, bySchool,
}: {
 convos: Conversation[]; usageRows: UsageRow[];
 totalConvos: number; totalQuestionsToday: number; activeUsersToday: number;
 estimatedCost30d: number; dailyLimit: number;
 topQuestions: { text: string; count: number }[];
 bySchool: [string, number][];
}) {
 const [anonymized, setAnonymized] = useState(true);
 const [expanded, setExpanded] = useState<string | null>(null);
 const [flaggingId, setFlaggingId] = useState<string | null>(null);
 const [flagReason, setFlagReason] = useState("");
 const [localConvos, setLocalConvos] = useState(convos);
 const [notification, setNotification] = useState<string | null>(null);

 const notify = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };

 const setFlag = async (id: string, flagged: boolean, reason?: string) => {
 const res = await fetch("/api/admin/ai/flag", {
 method: "POST",
 headers: { "Content-Type": "application/json" },
 body: JSON.stringify({ conversationId: id, flagged, reason }),
 });
 if (!res.ok) { notify("Could not update flag"); return; }
 setLocalConvos((p) => p.map((c) => c.id === id ? { ...c, flagged, flag_reason: flagged ? (reason ?? null) : null } : c));
 notify(flagged ? "Conversation flagged" : "Flag removed");
 setFlaggingId(null);
 setFlagReason("");
 };

 const displayName = (c: Conversation) => anonymized ? `Student #${c.student_id.slice(0, 6)}` : (c.profiles?.full_name ?? "Unknown Student");

 return (
 <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 24 }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
 <div>
 <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1C2620", fontFamily: "inherit", margin: 0 }}>AI Monitor</h2>
 <p style={{ fontSize: 12, color: "#6E7A6C", marginTop: 4 }}>Sir Taks usage across all users</p>
 </div>
 <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
 {notification && <span style={{ fontSize: 12, color: "#1F4738" }}>{notification}</span>}
 <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, color: "#566257", cursor: "pointer" }}>
 <input type="checkbox" checked={anonymized} onChange={(e) => setAnonymized(e.target.checked)} style={{ accentColor: "#B1502B" }} />
 Anonymize names
 </label>
 </div>
 </div>

 <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))", gap: 12 }}>
 {[
 { label: "Total Conversations", value: totalConvos, color: "#B1502B" },
 { label: "Questions Today", value: totalQuestionsToday, color: "#1F4738" },
 { label: "Active Users Today", value: activeUsersToday, color: "#A9873F" },
 { label: "Est. Gemini Cost (30d)", value: `$${estimatedCost30d.toFixed(3)}`, color: "#A9873F" },
 ].map((s) => (
 <div key={s.label} style={{ background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.06)", borderRadius: 14, padding: "16px 18px" }}>
 <p style={{ fontSize: 22, fontWeight: 700, color: s.color, margin: "0 0 4px", fontFamily: "inherit" }}>{s.value}</p>
 <p style={{ fontSize: 11, color: "#6E7A6C", margin: 0 }}>{s.label}</p>
 </div>
 ))}
 </div>
 <p style={{ fontSize: 11, color: "#6E7A6C", margin: "-14px 0 0" }}>
 Cost is a rough estimate (blended Gemini Flash rate applied to total tokens) — the app has a multi-provider AI fallback, so not every request was necessarily served by Gemini. Free-tier daily limit: {dailyLimit} questions.
 </p>

 {topQuestions.length > 0 && (
 <div>
 <h3 style={{ fontSize: 13, fontWeight: 600, color: "#566257", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Most Common Opening Questions</h3>
 <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
 {topQuestions.map((q, i) => (
 <div key={i} style={{ display: "flex", justifyContent: "space-between", gap: 12, padding: "8px 14px", background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.05)", borderRadius: 10 }}>
 <span style={{ fontSize: 12, color: "#566257", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{q.text}</span>
 <span style={{ fontSize: 11, fontWeight: 700, color: "#B1502B", flexShrink: 0 }}>×{q.count}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {bySchool.length > 0 && (
 <div>
 <h3 style={{ fontSize: 13, fontWeight: 600, color: "#566257", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Conversations by School</h3>
 <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
 {bySchool.map(([name, count]) => (
 <div key={name} style={{ display: "flex", justifyContent: "space-between", padding: "8px 14px", background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.05)", borderRadius: 10 }}>
 <span style={{ fontSize: 12, color: "#566257" }}>{name}</span>
 <span style={{ fontSize: 11, fontWeight: 700, color: "#1F4738" }}>{count}</span>
 </div>
 ))}
 </div>
 </div>
 )}

 {usageRows.length > 0 && (
 <div>
 <h3 style={{ fontSize: 13, fontWeight: 600, color: "#566257", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Today&apos;s Usage</h3>
 <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
 {usageRows.map((r) => (
 <div key={r.user_id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.05)", borderRadius: 10 }}>
 <div style={{ width: 30, height: 30, borderRadius: "8px", background: "rgba(177,80,43,0.1)", border: "1px solid rgba(177,80,43,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#B1502B", fontWeight: 700 }}>
 {r.questions_used}
 </div>
 <p style={{ fontSize: 12, color: "#566257", fontFamily: "monospace", margin: 0 }}>{anonymized ? `user #${r.user_id.slice(0, 6)}` : r.user_id}</p>
 <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 6 }}>
 <div style={{ width: 60, height: 4, background: "rgba(28,38,32,0.06)", borderRadius: 2, overflow: "hidden" }}>
 <div style={{ height: "100%", width: `${Math.min((r.questions_used / dailyLimit) * 100, 100)}%`, background: r.questions_used >= dailyLimit ? "#A9873F" : "#1F4738" }} />
 </div>
 <span style={{ fontSize: 10, color: "#6E7A6C" }}>{r.questions_used}/{dailyLimit}</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 <div>
 <h3 style={{ fontSize: 13, fontWeight: 600, color: "#566257", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Recent Conversations</h3>
 {localConvos.length === 0 ? (
 <div style={{ background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.06)", borderRadius: 14, padding: "36px", textAlign: "center", color: "#6E7A6C", fontSize: 13 }}>
 No AI conversations yet — they&apos;ll appear here once students start using Sir Taks
 </div>
 ) : (
 <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
 {localConvos.map((c) => (
 <div key={c.id} style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${c.flagged ? "rgba(163,49,30,0.3)" : "rgba(28,38,32,0.06)"}`, borderRadius: 12, overflow: "hidden" }}>
 <div
 onClick={() => setExpanded(expanded === c.id ? null : c.id)}
 style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
 >
 <div style={{ width: 36, height: 36, borderRadius: "9px", background: "rgba(169,135,63,0.1)", border: "1px solid rgba(169,135,63,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#A9873F", flexShrink: 0, fontFamily: "inherit" }}>
 {anonymized ? "?" : (c.profiles?.full_name?.charAt(0).toUpperCase() ?? "?")}
 </div>
 <div style={{ flex: 1, minWidth: 0 }}>
 <p style={{ fontSize: 13, fontWeight: 600, color: "#1C2620", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
 {displayName(c)} {c.flagged && <span style={{ color: "#A3311E", fontSize: 10 }}> flagged</span>}
 </p>
 <p style={{ fontSize: 11, color: "#6E7A6C", margin: 0 }}>{c.subject ?? "General"}{c.title ? ` · ${c.title}` : ""}</p>
 </div>
 <div style={{ flexShrink: 0, textAlign: "right" }}>
 <p style={{ fontSize: 11, color: "#6E7A6C", margin: 0 }}>{new Date(c.created_at).toLocaleDateString()}</p>
 </div>
 </div>

 {expanded === c.id && (
 <div style={{ borderTop: "1px solid rgba(28,38,32,0.05)", padding: "14px 16px", background: "rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", gap: 10 }}>
 <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
 {(c.messages ?? []).map((m, i) => (
 <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
 <span style={{ fontSize: 10, fontWeight: 600, color: m.role === "user" ? "#B1502B" : "#1F4738", textTransform: "uppercase" }}>{m.role}</span>
 <p style={{ fontSize: 12, color: "#566257", margin: 0, whiteSpace: "pre-wrap" }}>{m.content}</p>
 </div>
 ))}
 </div>
 {c.flag_reason && <p style={{ fontSize: 11, color: "#A3311E", margin: 0 }}>Flag reason: {c.flag_reason}</p>}
 <div style={{ display: "flex", gap: 8 }}>
 {c.flagged ? (
 <button onClick={() => setFlag(c.id, false)} style={{ padding: "5px 14px", borderRadius: 7, fontSize: 11, fontWeight: 600, background: "rgba(31,71,56,0.1)", border: "1px solid rgba(31,71,56,0.25)", color: "#1F4738", cursor: "pointer" }}>
 Remove flag
 </button>
 ) : (
 <button onClick={() => setFlaggingId(c.id)} style={{ padding: "5px 14px", borderRadius: 7, fontSize: 11, fontWeight: 600, background: "rgba(163,49,30,0.08)", border: "1px solid rgba(163,49,30,0.2)", color: "#A3311E", cursor: "pointer" }}>
 Flag as inappropriate
 </button>
 )}
 </div>
 {flaggingId === c.id && (
 <div style={{ display: "flex", gap: 8 }}>
 <input value={flagReason} onChange={(e) => setFlagReason(e.target.value)} placeholder="Reason for flagging"
 style={{ flex: 1, padding: "6px 10px", background: "rgba(28,38,32,0.04)", border: "1px solid rgba(28,38,32,0.08)", borderRadius: 7, color: "#1C2620", fontSize: 12, outline: "none" }} />
 <button onClick={() => setFlag(c.id, true, flagReason)} disabled={!flagReason.trim()} style={{ padding: "6px 14px", borderRadius: 7, fontSize: 11, fontWeight: 700, background: "rgba(163,49,30,0.9)", border: "none", color: "#fff", cursor: "pointer" }}>Confirm</button>
 </div>
 )}
 </div>
 )}
 </div>
 ))}
 </div>
 )}
 </div>
 </div>
 );
}
