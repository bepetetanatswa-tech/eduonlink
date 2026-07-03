"use client";

import { useState } from "react";

interface Message { role: string; content: string }
interface UsageRow { user_id: string; questions_used: number; profiles: { full_name: string; email: string } | null }
interface Conversation {
  id: string; student_id: string; subject: string | null; title: string | null;
  messages: Message[]; created_at: string;
  profiles: { full_name: string; email: string } | null;
}

export function TeacherAIUsageView({ hasSchool, usageRows, convos }: {
  hasSchool: boolean; usageRows: UsageRow[]; convos: Conversation[];
}) {
  const [expanded, setExpanded] = useState<string | null>(null);

  if (!hasSchool) {
    return (
      <div style={{ maxWidth: 700 }}>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", marginBottom: 8 }}>Student AI Activity</h2>
        <div style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 12, padding: 16, color: "#F5A623", fontSize: 13 }}>
          You are not linked to a school yet. Contact your school admin to be added as a teacher.
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>Student AI Activity</h2>
        <p style={{ fontSize: 12, color: "#4A5170", marginTop: 4 }}>What your students have been asking Sir Taks</p>
      </div>

      <div>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "#6B7290", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Today&apos;s Usage</h3>
        {usageRows.length === 0 ? (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "24px", textAlign: "center", color: "#4A5170", fontSize: 13 }}>
            No AI questions asked by your students today.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {usageRows.map((r) => (
              <div key={r.user_id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)", borderRadius: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(77,127,255,0.1)", border: "1px solid rgba(77,127,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#4D7FFF", fontWeight: 700 }}>
                  {r.questions_used}
                </div>
                <p style={{ fontSize: 12, color: "#8892B0", margin: 0 }}>{r.profiles?.full_name ?? "Unknown student"}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "#6B7290", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Recent Conversations</h3>
        {convos.length === 0 ? (
          <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 14, padding: "36px", textAlign: "center", color: "#4A5170", fontSize: 13 }}>
            No AI conversations from your students yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {convos.map((c) => (
              <div key={c.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 12, overflow: "hidden" }}>
                <div
                  onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                  style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(189,147,249,0.1)", border: "1px solid rgba(189,147,249,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#BD93F9", flexShrink: 0, fontFamily: "'Space Grotesk', sans-serif" }}>
                    {c.profiles?.full_name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#CDD6F4", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.profiles?.full_name ?? "Unknown student"}
                    </p>
                    <p style={{ fontSize: 11, color: "#4A5170", margin: 0 }}>{c.subject ?? "General"}{c.title ? ` · ${c.title}` : ""}</p>
                  </div>
                  <p style={{ fontSize: 11, color: "#4A5170", margin: 0, flexShrink: 0 }}>{new Date(c.created_at).toLocaleDateString()}</p>
                </div>

                {expanded === c.id && (
                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.05)", padding: "14px 16px", background: "rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
                    {(c.messages ?? []).map((m, i) => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: m.role === "user" ? "#4D7FFF" : "#00E5A3", textTransform: "uppercase" }}>{m.role}</span>
                        <p style={{ fontSize: 12, color: "#8892B0", margin: 0, whiteSpace: "pre-wrap" }}>{m.content}</p>
                      </div>
                    ))}
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
