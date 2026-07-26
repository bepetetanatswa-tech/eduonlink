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
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1C2620", fontFamily: "inherit", marginBottom: 8 }}>Student AI Activity</h2>
        <div style={{ background: "rgba(169,135,63,0.08)", border: "1px solid rgba(169,135,63,0.2)", borderRadius: 12, padding: 16, color: "#A9873F", fontSize: 13 }}>
          You&apos;re not linked to a school and don&apos;t teach any classes yet — join a school or create a class to see your students&apos; AI activity here.
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1C2620", fontFamily: "inherit", margin: 0 }}>Student AI Activity</h2>
        <p style={{ fontSize: 12, color: "#6E7A6C", marginTop: 4 }}>What your students have been asking Sir Taks</p>
      </div>

      <div>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "#566257", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Today&apos;s Usage</h3>
        {usageRows.length === 0 ? (
          <div style={{ background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.06)", borderRadius: 14, padding: "24px", textAlign: "center", color: "#6E7A6C", fontSize: 13 }}>
            No AI questions asked by your students today.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {usageRows.map((r) => (
              <div key={r.user_id} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 14px", background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.05)", borderRadius: 10 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, background: "rgba(177,80,43,0.1)", border: "1px solid rgba(177,80,43,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#B1502B", fontWeight: 700 }}>
                  {r.questions_used}
                </div>
                <p style={{ fontSize: 12, color: "#566257", margin: 0 }}>{r.profiles?.full_name ?? "Unknown student"}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div>
        <h3 style={{ fontSize: 13, fontWeight: 600, color: "#566257", margin: "0 0 10px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Recent Conversations</h3>
        {convos.length === 0 ? (
          <div style={{ background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.06)", borderRadius: 14, padding: "36px", textAlign: "center", color: "#6E7A6C", fontSize: 13 }}>
            No AI conversations from your students yet.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {convos.map((c) => (
              <div key={c.id} style={{ background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.06)", borderRadius: 12, overflow: "hidden" }}>
                <div
                  onClick={() => setExpanded(expanded === c.id ? null : c.id)}
                  style={{ padding: "12px 16px", display: "flex", alignItems: "center", gap: 14, cursor: "pointer" }}
                >
                  <div style={{ width: 36, height: 36, borderRadius: 9, background: "rgba(169,135,63,0.1)", border: "1px solid rgba(169,135,63,0.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, fontWeight: 700, color: "#A9873F", flexShrink: 0, fontFamily: "inherit" }}>
                    {c.profiles?.full_name?.charAt(0).toUpperCase() ?? "?"}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#1C2620", margin: "0 0 2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                      {c.profiles?.full_name ?? "Unknown student"}
                    </p>
                    <p style={{ fontSize: 11, color: "#6E7A6C", margin: 0 }}>{c.subject ?? "General"}{c.title ? ` · ${c.title}` : ""}</p>
                  </div>
                  <p style={{ fontSize: 11, color: "#6E7A6C", margin: 0, flexShrink: 0 }}>{new Date(c.created_at).toLocaleDateString()}</p>
                </div>

                {expanded === c.id && (
                  <div style={{ borderTop: "1px solid rgba(28,38,32,0.05)", padding: "14px 16px", background: "rgba(0,0,0,0.15)", display: "flex", flexDirection: "column", gap: 8, maxHeight: 300, overflowY: "auto" }}>
                    {(c.messages ?? []).map((m, i) => (
                      <div key={i} style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: m.role === "user" ? "#B1502B" : "#1F4738", textTransform: "uppercase" }}>{m.role}</span>
                        <p style={{ fontSize: 12, color: "#566257", margin: 0, whiteSpace: "pre-wrap" }}>{m.content}</p>
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
