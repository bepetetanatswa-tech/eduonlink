"use client";

import { useState } from "react";

interface Teacher {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  ztc_number: string | null;
  qualifications: string | null;
  years_experience: number | null;
  teaching_subjects: string[] | null;
  is_approved: boolean;
  teacher_rejection_reason: string | null;
  qualification_doc_key: string | null;
  id_doc_key: string | null;
  created_at: string;
}

export function TeachersClient({ initialTeachers }: { initialTeachers: Teacher[] }) {
  const [teachers, setTeachers] = useState(initialTeachers);
  const [notification, setNotification] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [rejecting, setRejecting] = useState<Teacher | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [deciding, setDeciding] = useState(false);

  const notify = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };

  const decide = async (teacherId: string, decision: "approved" | "rejected", reason?: string) => {
    setDeciding(true);
    try {
      const res = await fetch("/api/admin/teachers/decide", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ teacherId, decision, reason }),
      });
      const data = await res.json();
      if (!res.ok) { notify(data.error ?? "Could not save decision"); return; }
      setTeachers((p) => p.map((t) => t.id === teacherId
        ? { ...t, is_approved: decision === "approved", teacher_rejection_reason: decision === "rejected" ? (reason ?? null) : null }
        : t));
      notify(decision === "approved" ? "Teacher approved ✓ Email sent." : "Teacher rejected. Email sent.");
      setRejecting(null);
      setRejectReason("");
    } finally {
      setDeciding(false);
    }
  };

  const filtered = teachers.filter((t) =>
    !search ||
    t.full_name.toLowerCase().includes(search.toLowerCase()) ||
    t.email.toLowerCase().includes(search.toLowerCase()) ||
    (t.ztc_number ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const pendingCount = teachers.filter((t) => !t.is_approved && !t.teacher_rejection_reason).length;

  return (
    <div style={{ maxWidth: 1000, display: "flex", flexDirection: "column", gap: 20 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "#CDD6F4", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>Teacher Verification</h2>
          <p style={{ fontSize: 12, color: "#4A5170", marginTop: 4 }}>{teachers.length} teachers · {teachers.filter((t) => t.is_approved).length} approved · {pendingCount} pending review</p>
        </div>
        {notification && <span style={{ fontSize: 12, color: "#00E5A3" }}>{notification}</span>}
      </div>

      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search by name, email or ZTC number…"
        style={{ padding: "9px 16px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, fontSize: 13, color: "#CDD6F4", outline: "none" }}
      />

      {/* Reject modal */}
      {rejecting && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
          <div style={{ width: "100%", maxWidth: 420, background: "#0D1021", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: "#CDD6F4", margin: 0 }}>Reject {rejecting.full_name}</h3>
              <button onClick={() => { setRejecting(null); setRejectReason(""); }} style={{ background: "none", border: "none", color: "#6B7290", fontSize: 18, cursor: "pointer" }}>✕</button>
            </div>
            <div>
              <label style={{ fontSize: 10, color: "#4A5170", display: "block", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.06em" }}>Reason (sent to the teacher)</label>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} rows={3} placeholder="e.g. Could not verify ZTC number against the register" style={{ width: "100%", padding: "8px 12px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, fontSize: 13, color: "#CDD6F4", outline: "none", resize: "vertical", boxSizing: "border-box" }} />
            </div>
            <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
              <button onClick={() => { setRejecting(null); setRejectReason(""); }} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, background: "none", border: "1px solid rgba(255,255,255,0.08)", color: "#6B7290", cursor: "pointer" }}>Cancel</button>
              <button onClick={() => decide(rejecting.id, "rejected", rejectReason)} disabled={deciding || !rejectReason.trim()} style={{ padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, background: "rgba(255,107,107,0.9)", border: "none", color: "#fff", cursor: (deciding || !rejectReason.trim()) ? "not-allowed" : "pointer" }}>{deciding ? "Sending…" : "Reject & notify"}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
        {filtered.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#4A5170", fontSize: 13, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16 }}>No teachers found</div>
        ) : filtered.map((t) => (
          <div key={t.id} style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 8 }}>
              <div>
                <p style={{ fontSize: 14, fontWeight: 600, color: "#CDD6F4", margin: 0 }}>{t.full_name}</p>
                <p style={{ fontSize: 11, color: "#4A5170", margin: "2px 0 0" }}>{t.email}{t.phone ? ` · ${t.phone}` : ""}</p>
              </div>
              <span style={{
                fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 6, textTransform: "capitalize",
                color: t.is_approved ? "#00E5A3" : t.teacher_rejection_reason ? "#FF6B6B" : "#F5A623",
                background: t.is_approved ? "rgba(0,229,163,0.1)" : t.teacher_rejection_reason ? "rgba(255,107,107,0.08)" : "rgba(245,166,35,0.08)",
                border: `1px solid ${t.is_approved ? "rgba(0,229,163,0.2)" : t.teacher_rejection_reason ? "rgba(255,107,107,0.2)" : "rgba(245,166,35,0.2)"}`,
              }}>
                {t.is_approved ? "✓ Approved" : t.teacher_rejection_reason ? "Rejected" : "Pending"}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, fontSize: 12, color: "#8892B0" }}>
              <p style={{ margin: 0 }}><span style={{ color: "#4A5170" }}>ZTC number:</span> {t.ztc_number ?? "—"}</p>
              <p style={{ margin: 0 }}><span style={{ color: "#4A5170" }}>Experience:</span> {t.years_experience ?? 0} years</p>
              <p style={{ margin: 0, gridColumn: "1 / -1" }}><span style={{ color: "#4A5170" }}>Qualifications:</span> {t.qualifications ?? "—"}</p>
              <p style={{ margin: 0, gridColumn: "1 / -1" }}><span style={{ color: "#4A5170" }}>Subjects:</span> {(t.teaching_subjects ?? []).join(", ") || "—"}</p>
            </div>

            {t.teacher_rejection_reason && (
              <p style={{ fontSize: 11, color: "#FF6B6B", margin: 0 }}>Rejected: {t.teacher_rejection_reason}</p>
            )}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
              {t.qualification_doc_key ? (
                <a href={`/api/files/${t.qualification_doc_key}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 600, color: "#4D7FFF", padding: "4px 10px", borderRadius: 7, background: "rgba(77,127,255,0.08)", border: "1px solid rgba(77,127,255,0.2)", textDecoration: "none" }}>📄 Qualification proof</a>
              ) : <span style={{ fontSize: 11, color: "#4A5170" }}>No qualification doc uploaded</span>}
              {t.id_doc_key ? (
                <a href={`/api/files/${t.id_doc_key}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: 11, fontWeight: 600, color: "#4D7FFF", padding: "4px 10px", borderRadius: 7, background: "rgba(77,127,255,0.08)", border: "1px solid rgba(77,127,255,0.2)", textDecoration: "none" }}>🪪 ID / passport</a>
              ) : <span style={{ fontSize: 11, color: "#4A5170" }}>No ID uploaded</span>}
            </div>

            <div style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              {!t.is_approved && (
                <button onClick={() => decide(t.id, "approved")} disabled={deciding} style={{ padding: "5px 14px", borderRadius: 7, fontSize: 11, fontWeight: 600, background: "rgba(0,229,163,0.1)", border: "1px solid rgba(0,229,163,0.25)", color: "#00E5A3", cursor: deciding ? "not-allowed" : "pointer" }}>Approve</button>
              )}
              {!t.teacher_rejection_reason && (
                <button onClick={() => setRejecting(t)} disabled={deciding} style={{ padding: "5px 14px", borderRadius: 7, fontSize: 11, fontWeight: 600, background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", color: "#F5A623", cursor: deciding ? "not-allowed" : "pointer" }}>Reject</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
