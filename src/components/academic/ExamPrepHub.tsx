"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadToR2 } from "@/lib/uploadToR2";
import { FileActions } from "@/components/academic/FileActions";

interface Paper { id: string; title: string; subject: string; year: number | null; level: string | null; description: string | null; file_url: string | null }
interface Question { question: string; options: string[]; answer: string; explanation: string; type: "mcq" | "essay" }
interface MockSession { questions: Question[]; answers: Record<number, string>; submitted: boolean; timeLeft: number; score?: number }

const S = { border: "rgba(255,255,255,0.07)", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170", accent: "#4D7FFF" };
const inp: React.CSSProperties = { width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`, borderRadius: 9, color: S.text, fontSize: 13, outline: "none", boxSizing: "border-box" };

const SUBJECTS = ["Mathematics","English Language","Chemistry","Physics","Biology","History","Geography","Computer Science"];
const LEVELS = ["Primary", "O-Level", "A-Level"];

export function ExamPrepHub({ profileId, isStaff }: { profileId: string; isStaff?: boolean }) {
  const supabase = createClient();
  const [tab, setTab] = useState<"papers"|"practice"|"mock">("papers");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [filterSubject, setFilterSubject] = useState("All");
  const [showUpload, setShowUpload] = useState(false);
  const [fTitle, setFTitle] = useState("");
  const [fSubject, setFSubject] = useState(SUBJECTS[0]);
  const [fLevel, setFLevel] = useState(LEVELS[1]);
  const [fYear, setFYear] = useState(new Date().getFullYear().toString());
  const [fDesc, setFDesc] = useState("");
  const [fFile, setFFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [practiceSubject, setPracticeSubject] = useState("Mathematics");
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [practiceLoading, setPracticeLoading] = useState(false);
  const [practiceAnswers, setPracticeAnswers] = useState<Record<number, string>>({});
  const [practiceChecked, setPracticeChecked] = useState(false);
  const [mockSubject, setMockSubject] = useState("Mathematics");
  const [mockSession, setMockSession] = useState<MockSession | null>(null);
  const [mockLoading, setMockLoading] = useState(false);
  const [mockError, setMockError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { loadPapers(); loadSessions(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadPapers = async () => {
    const { data } = await (supabase.from("exam_papers") as any)
      .select("*").order("year", { ascending: false });
    setPapers(data ?? []);
  };

  const uploadPaper = async () => {
    if (!fTitle.trim() || !fFile) return;
    setUploading(true);
    setUploadError(null);
    setUploadPct(0);
    try {
      const { fileUrl } = await uploadToR2(fFile, "past-paper", { level: fLevel, subject: fSubject, year: fYear }, setUploadPct);
      await (supabase.from("exam_papers") as any).insert({
        title: fTitle.trim(), subject: fSubject, level: fLevel,
        year: parseInt(fYear, 10) || null, description: fDesc.trim() || null,
        file_url: fileUrl, uploaded_by: profileId,
      });
      setFTitle(""); setFDesc(""); setFFile(null);
      setShowUpload(false);
      loadPapers();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    }
    setUploading(false);
  };

  const loadSessions = async () => {
    const { data } = await (supabase.from("exam_sessions") as any)
      .select("id,subject,score,total,time_taken,created_at,completed_at")
      .eq("student_id", profileId).order("created_at", { ascending: false }).limit(10);
    setSessions(data ?? []);
  };

  const generatePractice = async () => {
    setPracticeLoading(true);
    setPracticeChecked(false);
    setPracticeAnswers({});
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Generate 5 ZIMSEC ${practiceSubject} practice questions. Mix MCQ and short-answer. Return ONLY valid JSON array, no markdown:
[{"question":"...","options":["A...","B...","C...","D..."],"answer":"A","explanation":"...","type":"mcq"},
{"question":"...","options":[],"answer":"...","explanation":"...","type":"essay"}]`
          }],
          topic: `${practiceSubject} ZIMSEC practice questions`,
        }),
      });
      const text = await res.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const qs = JSON.parse(jsonMatch[0]);
        setPracticeQuestions(qs);
      }
    } catch {
      setPracticeQuestions([]);
    }
    setPracticeLoading(false);
  };

  const startMock = async () => {
    setMockLoading(true);
    setMockError(null);
    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{
            role: "user",
            content: `Generate 10 ZIMSEC ${mockSubject} MCQ exam questions. Return ONLY valid JSON:
[{"question":"...","options":["A...","B...","C...","D..."],"answer":"A","explanation":"...","type":"mcq"}]`
          }],
          topic: `${mockSubject} ZIMSEC mock exam`,
        }),
      });
      const text = await res.text();
      const jsonMatch = text.match(/\[[\s\S]*\]/);
      if (!jsonMatch) { setMockSession(null); setMockLoading(false); return; }
      const qs = JSON.parse(jsonMatch[0]);

      // The monthly mock-exam cap is checked and the session row is created
      // server-side (exam_sessions INSERT is revoked from authenticated) —
      // this is the only place a new mock attempt can be recorded.
      const startRes = await fetch("/api/exam-prep/start-mock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: mockSubject, questions: qs }),
      });
      const startData = await startRes.json().catch(() => null);
      if (!startRes.ok) {
        setMockError(startData?.error ?? "Could not start mock exam.");
        setMockSession(null);
        setMockLoading(false);
        return;
      }

      const session: MockSession = { questions: qs, answers: {}, submitted: false, timeLeft: 30 * 60 };
      setMockSession(session);
      timerRef.current = setInterval(() => {
        setMockSession(prev => {
          if (!prev || prev.submitted) { clearInterval(timerRef.current!); return prev; }
          if (prev.timeLeft <= 1) { clearInterval(timerRef.current!); submitMock(prev); return prev; }
          return { ...prev, timeLeft: prev.timeLeft - 1 };
        });
      }, 1000);
    } catch {
      setMockSession(null);
    }
    setMockLoading(false);
  };

  const submitMock = async (session?: MockSession) => {
    const s = session ?? mockSession;
    if (!s) return;
    clearInterval(timerRef.current!);
    const score = s.questions.filter((q, i) => s.answers[i] === q.answer).length;
    const timeTaken = 30 * 60 - s.timeLeft;
    await (supabase.from("exam_sessions") as any)
      .update({ answers_json: s.answers, score, completed_at: new Date().toISOString(), time_taken: timeTaken })
      .eq("student_id", profileId).is("completed_at", null);
    setMockSession(prev => prev ? { ...prev, submitted: true, score } : null);
    loadSessions();
  };

  const formatTime = (secs: number) => `${Math.floor(secs / 60).toString().padStart(2, "0")}:${(secs % 60).toString().padStart(2, "0")}`;

  const filteredPapers = filterSubject === "All" ? papers : papers.filter(p => p.subject === filterSubject);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Tabs */}
      <div style={{ display: "flex", borderRadius: 12, overflow: "hidden", border: `1px solid ${S.border}`, width: "fit-content" }}>
        {(["papers", "practice", "mock"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding: "10px 20px", background: tab === t ? "rgba(77,127,255,0.15)" : "rgba(255,255,255,0.02)", border: "none", color: tab === t ? "#4D7FFF" : S.muted, fontSize: 13, fontWeight: tab === t ? 600 : 400, cursor: "pointer", textTransform: "capitalize" }}>
            {t === "papers" ? "📄 Past Papers" : t === "practice" ? "✏️ AI Practice" : "⏱ Mock Exam"}
          </button>
        ))}
      </div>

      {/* PAST PAPERS */}
      {tab === "papers" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
            <select value={filterSubject} onChange={e => setFilterSubject(e.target.value)} style={{ ...inp, width: "auto" }}>
              <option value="All">All Subjects</option>
              {SUBJECTS.map(s => <option key={s} value={s} style={{ background: "#0E1117" }}>{s}</option>)}
            </select>
            {isStaff && (
              <button onClick={() => setShowUpload(p => !p)}
                style={{ padding: "9px 16px", borderRadius: 9, background: S.accent, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                + Upload Paper
              </button>
            )}
          </div>

          {isStaff && showUpload && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
              <input value={fTitle} onChange={e => setFTitle(e.target.value)} placeholder="Title * (e.g. 2023 Paper 1)" style={inp} />
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
                <select value={fSubject} onChange={e => setFSubject(e.target.value)} style={inp}>
                  {SUBJECTS.map(s => <option key={s} value={s} style={{ background: "#0E1117" }}>{s}</option>)}
                </select>
                <select value={fLevel} onChange={e => setFLevel(e.target.value)} style={inp}>
                  {LEVELS.map(l => <option key={l} value={l} style={{ background: "#0E1117" }}>{l}</option>)}
                </select>
                <input value={fYear} onChange={e => setFYear(e.target.value)} placeholder="Year" style={inp} />
              </div>
              <input value={fDesc} onChange={e => setFDesc(e.target.value)} placeholder="Description (optional, e.g. Paper 2 with mark scheme)" style={inp} />
              <input type="file" accept="application/pdf" onChange={e => setFFile(e.target.files?.[0] ?? null)} style={{ fontSize: 12, color: S.muted }} />
              {uploading && <p style={{ fontSize: 12, color: S.accent, margin: 0 }}>Uploading… {uploadPct}%</p>}
              {uploadError && <p style={{ fontSize: 12, color: "#FF6B6B", margin: 0 }}>{uploadError}</p>}
              <button onClick={uploadPaper} disabled={uploading || !fTitle.trim() || !fFile}
                style={{ padding: "9px 16px", borderRadius: 9, background: S.accent, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", alignSelf: "flex-start", opacity: (uploading || !fTitle.trim() || !fFile) ? 0.5 : 1 }}>
                {uploading ? "Uploading…" : "Upload"}
              </button>
            </div>
          )}

          {filteredPapers.length === 0 && (
            <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: "40px", textAlign: "center" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📚</div>
              <p style={{ fontSize: 14, color: S.dim }}>No past papers uploaded yet. Your teacher or admin will upload ZIMSEC papers here.</p>
            </div>
          )}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 10 }}>
            {filteredPapers.map(p => (
              <div key={p.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                  <div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: S.text, margin: "0 0 3px" }}>{p.title}</p>
                    <p style={{ fontSize: 11, color: S.dim, margin: 0 }}>{p.subject}{p.year ? ` · ${p.year}` : ""}{p.level ? ` · ${p.level}` : ""}</p>
                  </div>
                </div>
                {p.description && <p style={{ fontSize: 12, color: S.muted, margin: "0 0 10px", lineHeight: 1.4 }}>{p.description}</p>}
                {p.file_url ? (
                  <FileActions fileUrl={p.file_url} />
                ) : (
                  <span style={{ fontSize: 11, color: S.dim }}>No file attached</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI PRACTICE */}
      {tab === "practice" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <select value={practiceSubject} onChange={e => setPracticeSubject(e.target.value)} style={{ ...inp, width: "auto" }}>
              {SUBJECTS.map(s => <option key={s} value={s} style={{ background: "#0E1117" }}>{s}</option>)}
            </select>
            <button onClick={generatePractice} disabled={practiceLoading}
              style={{ padding: "9px 18px", borderRadius: 9, background: S.accent, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: practiceLoading ? 0.6 : 1, whiteSpace: "nowrap" }}>
              {practiceLoading ? "Generating…" : "Generate Questions"}
            </button>
          </div>
          {practiceLoading && (
            <div style={{ background: "rgba(77,127,255,0.05)", border: `1px solid rgba(77,127,255,0.15)`, borderRadius: 12, padding: "20px", textAlign: "center" }}>
              <p style={{ fontSize: 13, color: "#4D7FFF" }}>Sir Taks AI is generating your practice questions…</p>
            </div>
          )}
          {practiceQuestions.map((q, i) => {
            const answered = practiceAnswers[i] !== undefined;
            const correct = practiceChecked && practiceAnswers[i] === q.answer;
            const wrong = practiceChecked && answered && !correct;
            return (
              <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${practiceChecked ? (correct ? "rgba(0,229,163,0.25)" : wrong ? "rgba(255,107,107,0.25)" : S.border) : S.border}`, borderRadius: 14, padding: "18px 20px" }}>
                <p style={{ fontSize: 14, fontWeight: 600, color: S.text, margin: "0 0 12px", lineHeight: 1.5 }}><span style={{ color: "#4D7FFF" }}>Q{i + 1}.</span> {q.question}</p>
                {q.type === "mcq" && q.options.length > 0 ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {q.options.map((opt, oi) => {
                      const letter = ["A", "B", "C", "D"][oi];
                      const isSelected = practiceAnswers[i] === letter;
                      const isCorrect = practiceChecked && letter === q.answer;
                      const isWrong = practiceChecked && isSelected && !isCorrect;
                      return (
                        <button key={oi} disabled={practiceChecked}
                          onClick={() => setPracticeAnswers(prev => ({ ...prev, [i]: letter }))}
                          style={{ padding: "10px 14px", borderRadius: 9, textAlign: "left", cursor: practiceChecked ? "default" : "pointer",
                            background: isCorrect ? "rgba(0,229,163,0.1)" : isWrong ? "rgba(255,107,107,0.1)" : isSelected ? "rgba(77,127,255,0.1)" : "rgba(255,255,255,0.03)",
                            border: `1px solid ${isCorrect ? "rgba(0,229,163,0.3)" : isWrong ? "rgba(255,107,107,0.3)" : isSelected ? "rgba(77,127,255,0.3)" : S.border}`,
                            color: isCorrect ? "#00E5A3" : isWrong ? "#FF6B6B" : isSelected ? "#4D7FFF" : S.muted,
                            fontSize: 13 }}>
                          <span style={{ fontWeight: 700, marginRight: 8 }}>{letter}.</span>{opt}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <textarea value={practiceAnswers[i] ?? ""} onChange={e => setPracticeAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                    disabled={practiceChecked} rows={3} placeholder="Write your answer…"
                    style={{ ...inp, resize: "vertical", fontFamily: "inherit", lineHeight: 1.5 }} />
                )}
                {practiceChecked && (
                  <div style={{ marginTop: 12, padding: "10px 14px", background: "rgba(77,127,255,0.06)", border: `1px solid rgba(77,127,255,0.15)`, borderRadius: 9 }}>
                    <p style={{ fontSize: 11, fontWeight: 600, color: "#4D7FFF", margin: "0 0 3px" }}>Explanation</p>
                    <p style={{ fontSize: 12, color: S.muted, margin: 0, lineHeight: 1.5 }}>{q.explanation}</p>
                    {q.type === "mcq" && <p style={{ fontSize: 12, color: "#00E5A3", margin: "4px 0 0", fontWeight: 600 }}>Correct answer: {q.answer}</p>}
                  </div>
                )}
              </div>
            );
          })}
          {practiceQuestions.length > 0 && !practiceChecked && (
            <button onClick={() => setPracticeChecked(true)}
              style={{ padding: "11px 24px", borderRadius: 10, background: S.accent, border: "none", color: "#fff", fontSize: 14, fontWeight: 700, cursor: "pointer", alignSelf: "flex-start", fontFamily: "'Space Grotesk',sans-serif" }}>
              Check Answers
            </button>
          )}
          {practiceChecked && (
            <div style={{ padding: "14px 20px", borderRadius: 12, background: "rgba(0,229,163,0.08)", border: "1px solid rgba(0,229,163,0.2)" }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: "#00E5A3", margin: 0 }}>
                Score: {practiceQuestions.filter((q, i) => q.type === "mcq" && practiceAnswers[i] === q.answer).length} / {practiceQuestions.filter(q => q.type === "mcq").length} MCQ correct
              </p>
            </div>
          )}
        </div>
      )}

      {/* MOCK EXAM */}
      {tab === "mock" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {!mockSession ? (
            <>
              <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: "24px" }}>
                <h3 style={{ fontSize: 15, fontWeight: 700, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: "0 0 16px" }}>Start Mock Exam</h3>
                <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Subject</label>
                    <select value={mockSubject} onChange={e => setMockSubject(e.target.value)} style={inp}>
                      {SUBJECTS.map(s => <option key={s} value={s} style={{ background: "#0E1117" }}>{s}</option>)}
                    </select>
                  </div>
                  <button onClick={startMock} disabled={mockLoading}
                    style={{ padding: "10px 20px", borderRadius: 9, background: S.accent, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: mockLoading ? 0.6 : 1, whiteSpace: "nowrap" }}>
                    {mockLoading ? "Loading…" : "Start Exam (30 min)"}
                  </button>
                </div>
                <p style={{ fontSize: 12, color: S.dim, margin: "12px 0 0" }}>10 ZIMSEC-style MCQ questions · 30 minute timer · Auto-graded</p>
                {mockError && <p style={{ fontSize: 12, color: "#FF6B6B", margin: "10px 0 0" }}>{mockError}</p>}
              </div>

              {sessions.length > 0 && (
                <div>
                  <h3 style={{ fontSize: 14, fontWeight: 600, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: "0 0 12px" }}>Past Results</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {sessions.map(s => {
                      const pct = s.total > 0 ? Math.round((s.score / s.total) * 100) : 0;
                      const color = pct >= 80 ? "#00E5A3" : pct >= 60 ? "#F5A623" : "#FF6B6B";
                      return (
                        <div key={s.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 16 }}>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontSize: 13, fontWeight: 600, color: S.text, margin: "0 0 2px" }}>{s.subject}</p>
                            <p style={{ fontSize: 11, color: S.dim, margin: 0 }}>{new Date(s.created_at).toLocaleDateString("en-GB")} · {s.time_taken ? `${Math.round(s.time_taken / 60)} min` : "—"}</p>
                          </div>
                          {s.score !== null && (
                            <div style={{ textAlign: "center" }}>
                              <p style={{ fontSize: 20, fontWeight: 700, color, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>{pct}%</p>
                              <p style={{ fontSize: 10, color: S.dim, margin: 0 }}>{s.score}/{s.total}</p>
                            </div>
                          )}
                          {!s.completed_at && <span style={{ fontSize: 11, color: "#F5A623" }}>Incomplete</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Timer bar */}
              {!mockSession.submitted && (
                <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "12px 20px", background: mockSession.timeLeft < 300 ? "rgba(255,107,107,0.08)" : "rgba(77,127,255,0.06)", border: `1px solid ${mockSession.timeLeft < 300 ? "rgba(255,107,107,0.2)" : "rgba(77,127,255,0.15)"}`, borderRadius: 12 }}>
                  <span style={{ fontSize: 24 }}>⏱</span>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 13, fontWeight: 600, color: S.text, margin: 0 }}>{mockSubject} Mock Exam</p>
                    <p style={{ fontSize: 11, color: S.dim, margin: 0 }}>{Object.keys(mockSession.answers).length} / {mockSession.questions.length} answered</p>
                  </div>
                  <span style={{ fontSize: 22, fontWeight: 700, fontFamily: "monospace", color: mockSession.timeLeft < 300 ? "#FF6B6B" : "#00E5A3" }}>
                    {formatTime(mockSession.timeLeft)}
                  </span>
                  <button onClick={() => submitMock()}
                    style={{ padding: "9px 16px", borderRadius: 9, background: "#00E5A3", border: "none", color: "#000", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>
                    Submit
                  </button>
                </div>
              )}

              {mockSession.submitted && mockSession.score !== undefined && (
                <div style={{ padding: "24px", background: "rgba(0,229,163,0.06)", border: "1px solid rgba(0,229,163,0.2)", borderRadius: 14, textAlign: "center" }}>
                  <div style={{ fontSize: 44, marginBottom: 8 }}>{mockSession.score >= 8 ? "🏆" : mockSession.score >= 5 ? "👍" : "📚"}</div>
                  <p style={{ fontSize: 28, fontWeight: 700, color: "#00E5A3", fontFamily: "'Space Grotesk',sans-serif", margin: "0 0 4px" }}>
                    {mockSession.score} / {mockSession.questions.length}
                  </p>
                  <p style={{ fontSize: 14, color: S.muted, margin: "0 0 16px" }}>
                    {Math.round((mockSession.score / mockSession.questions.length) * 100)}% — {mockSession.score >= 8 ? "Excellent!" : mockSession.score >= 5 ? "Good effort" : "Keep studying!"}
                  </p>
                  <button onClick={() => { setMockSession(null); loadSessions(); }}
                    style={{ padding: "9px 20px", borderRadius: 9, background: S.accent, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>
                    Try Again
                  </button>
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {mockSession.questions.map((q, i) => {
                  const selected = mockSession.answers[i];
                  const isCorrect = mockSession.submitted && selected === q.answer;
                  const isWrong = mockSession.submitted && selected && !isCorrect;
                  return (
                    <div key={i} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${mockSession.submitted ? (isCorrect ? "rgba(0,229,163,0.25)" : isWrong ? "rgba(255,107,107,0.25)" : S.border) : S.border}`, borderRadius: 14, padding: "16px 18px" }}>
                      <p style={{ fontSize: 14, fontWeight: 600, color: S.text, margin: "0 0 10px" }}><span style={{ color: "#4D7FFF" }}>Q{i + 1}.</span> {q.question}</p>
                      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                        {q.options.map((opt, oi) => {
                          const letter = ["A", "B", "C", "D"][oi];
                          const isSel = mockSession.answers[i] === letter;
                          const showCorrect = mockSession.submitted && letter === q.answer;
                          const showWrong = mockSession.submitted && isSel && !showCorrect;
                          return (
                            <button key={oi} disabled={mockSession.submitted}
                              onClick={() => setMockSession(prev => prev ? { ...prev, answers: { ...prev.answers, [i]: letter } } : null)}
                              style={{ padding: "9px 14px", borderRadius: 9, textAlign: "left", cursor: mockSession.submitted ? "default" : "pointer",
                                background: showCorrect ? "rgba(0,229,163,0.1)" : showWrong ? "rgba(255,107,107,0.1)" : isSel ? "rgba(77,127,255,0.1)" : "rgba(255,255,255,0.02)",
                                border: `1px solid ${showCorrect ? "rgba(0,229,163,0.3)" : showWrong ? "rgba(255,107,107,0.3)" : isSel ? "rgba(77,127,255,0.3)" : S.border}`,
                                color: showCorrect ? "#00E5A3" : showWrong ? "#FF6B6B" : isSel ? "#4D7FFF" : S.muted, fontSize: 13 }}>
                              <span style={{ fontWeight: 700, marginRight: 8 }}>{letter}.</span>{opt}
                            </button>
                          );
                        })}
                      </div>
                      {mockSession.submitted && (
                        <p style={{ fontSize: 11, color: S.dim, margin: "10px 0 0", lineHeight: 1.5 }}>{q.explanation}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
