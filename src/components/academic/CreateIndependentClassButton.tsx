"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const GRADE_LEVELS = [
  "ECD A", "ECD B", "Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6", "Grade 7",
  "Form 1", "Form 2", "Form 3", "Form 4", "Form 5", "Form 6",
];

const S = { border: "rgba(255,255,255,0.07)", accent: "#4D7FFF", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170" };
const inp: React.CSSProperties = { width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`, borderRadius: 9, color: S.text, fontSize: 13, outline: "none", boxSizing: "border-box" };

export function CreateIndependentClassButton() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [gradeLevel, setGradeLevel] = useState(GRADE_LEVELS[2]);
  const [academicYear, setAcademicYear] = useState(new Date().getFullYear().toString());
  const [price, setPrice] = useState("0");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ joinCode: string; price: number } | null>(null);

  const create = async () => {
    if (!name.trim() || !subject.trim() || saving) return;
    const priceNum = Number(price) || 0;
    if (priceNum < 0) { setError("Price can't be negative."); return; }
    setSaving(true);
    setError(null);
    const res = await fetch("/api/classes/create", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        subject: subject.trim(),
        gradeLevel,
        academicYear: academicYear.trim(),
        price: priceNum,
      }),
    });
    const data = await res.json().catch(() => null);
    setSaving(false);
    if (!res.ok) {
      setError(data?.error ?? "Could not create class. Please try again.");
      return;
    }
    setCreated({ joinCode: data.join_code, price: data.price });
    router.refresh();
  };

  const close = () => {
    setOpen(false);
    setName(""); setSubject(""); setGradeLevel(GRADE_LEVELS[2]); setAcademicYear(new Date().getFullYear().toString()); setPrice("0");
    setError(null); setCreated(null);
  };

  return (
    <>
      <button onClick={() => setOpen(true)} style={{ padding: "8px 16px", borderRadius: 10, background: S.accent, border: "none", color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 600 }}>
        + New Class
      </button>
      {open && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#0E1117", border: `1px solid ${S.border}`, borderRadius: 18, padding: 28, width: "100%", maxWidth: 440, display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: 15, fontWeight: 700, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>New Class</h3>
              <button onClick={close} style={{ background: "none", border: "none", color: S.dim, cursor: "pointer", fontSize: 18 }}>✕</button>
            </div>

            {created ? (
              <>
                <p style={{ fontSize: 13, color: "#00E5A3", margin: 0 }}>✓ Class created</p>
                {created.price > 0 ? (
                  <div style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 10, padding: 16, textAlign: "center" }}>
                    <p style={{ fontSize: 11, color: S.muted, margin: "0 0 6px" }}>Price per student</p>
                    <p style={{ fontSize: 24, fontWeight: 700, color: "#F5A623", fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>${created.price.toFixed(2)}</p>
                    <p style={{ fontSize: 11, color: S.dim, margin: "8px 0 0" }}>Students enroll and pay via the Browse Classes page — join codes don&apos;t work for paid classes.</p>
                  </div>
                ) : (
                  <div style={{ background: "rgba(77,127,255,0.08)", border: "1px solid rgba(77,127,255,0.2)", borderRadius: 10, padding: 16, textAlign: "center" }}>
                    <p style={{ fontSize: 11, color: S.muted, margin: "0 0 6px" }}>Student join code</p>
                    <p style={{ fontSize: 24, fontWeight: 700, letterSpacing: "0.15em", color: S.accent, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>{created.joinCode}</p>
                  </div>
                )}
                <p style={{ fontSize: 11, color: S.dim, margin: 0 }}>Students can also find this class from the Browse Classes page.</p>
                <button onClick={close} style={{ padding: "10px", borderRadius: 10, background: S.accent, border: "none", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600 }}>Done</button>
              </>
            ) : (
              <>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Class Name *</label>
                  <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. ZIMSEC Maths Crash Course" style={inp} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Subject *</label>
                  <input value={subject} onChange={e => setSubject(e.target.value)} placeholder="e.g. Mathematics" style={inp} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Grade Level</label>
                    <select value={gradeLevel} onChange={e => setGradeLevel(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                      {GRADE_LEVELS.map(g => <option key={g} value={g} style={{ background: "#0E1117" }}>{g}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Academic Year</label>
                    <input value={academicYear} onChange={e => setAcademicYear(e.target.value)} style={inp} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Price (USD)</label>
                  <input value={price} onChange={e => setPrice(e.target.value)} type="number" min={0} step="0.01" placeholder="0" style={inp} />
                  <p style={{ fontSize: 11, color: S.dim, marginTop: 5 }}>Leave at 0 for a free class with instant join-code enrollment. A price requires students to pay and wait for approval.</p>
                </div>
                {error && <p style={{ fontSize: 12, color: "#FF6B6B", margin: 0 }}>{error}</p>}
                <button onClick={create} disabled={!name.trim() || !subject.trim() || saving}
                  style={{ padding: "10px", borderRadius: 10, background: S.accent, border: "none", color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 600, opacity: (!name.trim() || !subject.trim() || saving) ? 0.5 : 1 }}>
                  {saving ? "Creating…" : "Create Class"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
