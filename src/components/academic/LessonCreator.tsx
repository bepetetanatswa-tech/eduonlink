"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadToR2 } from "@/lib/uploadToR2";
import { LessonQA } from "@/components/academic/LessonQA";
import { FileActions } from "@/components/academic/FileActions";

interface Course {
  id: string; title: string; description: string | null; subject: string;
  grade_level: string | null; thumbnail_emoji: string; is_published: boolean;
  price: number;
  materials: Material[];
}
interface Material {
  id: string; title: string; type: string; content: string | null;
  file_url: string | null; embed_url: string | null; order_index: number;
  duration_minutes: number | null; is_published: boolean;
}

const S = {
  border: "rgba(255,255,255,0.07)", text: "#CDD6F4", muted: "#8892B0",
  dim: "#4A5170", accent: "#4D7FFF",
};
const inp: React.CSSProperties = {
  width: "100%", padding: "9px 12px", background: "rgba(255,255,255,0.04)",
  border: `1px solid ${S.border}`, borderRadius: 9, color: S.text, fontSize: 13,
  outline: "none", boxSizing: "border-box",
};

export function LessonCreator({ profileId }: { profileId: string }) {
  const supabase = createClient();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selected, setSelected] = useState<Course | null>(null);
  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showMaterialModal, setShowMaterialModal] = useState(false);
  const [editMaterial, setEditMaterial] = useState<Material | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [qaOpen, setQaOpen] = useState<string | null>(null);

  // Course form
  const [cTitle, setCTitle] = useState("");
  const [cDesc, setCDesc] = useState("");
  const [cSubject, setCSubject] = useState("Mathematics");
  const [cLevel, setCLevel] = useState("Form 1");
  const [cEmoji, setCEmoji] = useState("📚");
  const [cPrice, setCPrice] = useState("");

  // Material form
  const [mTitle, setMTitle] = useState("");
  const [mType, setMType] = useState<"text"|"video"|"pdf"|"embed">("text");
  const [mContent, setMContent] = useState("");
  const [mEmbedUrl, setMEmbedUrl] = useState("");
  const [mDuration, setMDuration] = useState("");
  const [mFile, setMFile] = useState<File | null>(null);

  const load = async () => {
    const { data } = await (supabase.from("courses") as any)
      .select(`id,title,description,subject,grade_level,thumbnail_emoji,is_published,price,
        course_materials(id,title,type,content,file_url,embed_url,order_index,duration_minutes,is_published)`)
      .eq("created_by", profileId)
      .order("created_at", { ascending: false });
    const list = (data ?? []).map((c: any) => ({
      ...c,
      materials: (c.course_materials ?? []).sort((a: any, b: any) => a.order_index - b.order_index),
    }));
    setCourses(list);
    if (selected) {
      const updated = list.find((c: Course) => c.id === selected.id);
      if (updated) setSelected(updated);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openNewCourse = () => {
    setCTitle(""); setCDesc(""); setCSubject("Mathematics"); setCLevel("Form 1"); setCEmoji("📚"); setCPrice("");
    setShowCourseModal(true);
  };

  const saveCourse = async () => {
    if (!cTitle.trim()) return;
    setSaving(true);
    await (supabase.from("courses") as any).insert({
      title: cTitle.trim(), description: cDesc.trim() || null,
      subject: cSubject, grade_level: cLevel, thumbnail_emoji: cEmoji,
      price: cPrice ? Math.max(0, parseFloat(cPrice)) : 0,
      created_by: profileId, is_published: false,
    });
    setSaving(false);
    setShowCourseModal(false);
    load();
  };

  const toggleCoursePublish = async (c: Course) => {
    await (supabase.from("courses") as any).update({ is_published: !c.is_published }).eq("id", c.id);
    load();
  };

  const updateCoursePrice = async (c: Course, price: number) => {
    await (supabase.from("courses") as any).update({ price: Math.max(0, price) }).eq("id", c.id);
    load();
  };

  const openNewMaterial = () => {
    setEditMaterial(null);
    setMTitle(""); setMType("text"); setMContent(""); setMEmbedUrl(""); setMDuration(""); setMFile(null);
    setShowMaterialModal(true);
  };

  const openEditMaterial = (m: Material) => {
    setEditMaterial(m);
    setMTitle(m.title); setMType(m.type as any);
    setMContent(m.content ?? ""); setMEmbedUrl(m.embed_url ?? "");
    setMDuration(m.duration_minutes?.toString() ?? ""); setMFile(null);
    setShowMaterialModal(true);
  };

  const saveMaterial = async () => {
    if (!mTitle.trim() || !selected) return;
    setSaving(true);

    let fileUrl = editMaterial?.file_url ?? null;
    if (mFile) {
      setUploading(true);
      setUploadError(null);
      setUploadPct(0);
      try {
        const category = mType === "video" ? "lesson-video" : "lesson-material";
        const { fileUrl: uploadedUrl } = await uploadToR2(
          mFile, category, { teacherId: profileId, lessonId: selected.id }, setUploadPct
        );
        fileUrl = uploadedUrl;
      } catch (err) {
        setUploadError(err instanceof Error ? err.message : "Upload failed");
        setUploading(false);
        setSaving(false);
        return;
      }
      setUploading(false);
    }

    const payload: any = {
      course_id: selected.id, title: mTitle.trim(), type: mType,
      content: mContent.trim() || null,
      embed_url: mEmbedUrl.trim() || null,
      file_url: fileUrl,
      duration_minutes: mDuration ? parseInt(mDuration) : null,
      order_index: editMaterial ? editMaterial.order_index : (selected.materials.length),
      is_published: true,
    };

    if (editMaterial) {
      await (supabase.from("course_materials") as any).update(payload).eq("id", editMaterial.id);
    } else {
      await (supabase.from("course_materials") as any).insert(payload);
    }

    setSaving(false);
    setShowMaterialModal(false);
    load();
  };

  const deleteMaterial = async (id: string) => {
    if (!confirm("Delete this lesson material?")) return;
    await (supabase.from("course_materials") as any).delete().eq("id", id);
    load();
  };

  const moveOrder = async (m: Material, dir: -1 | 1) => {
    const sibling = selected?.materials.find(x => x.order_index === m.order_index + dir);
    if (!sibling) return;
    await (supabase.from("course_materials") as any).update({ order_index: m.order_index + dir }).eq("id", m.id);
    await (supabase.from("course_materials") as any).update({ order_index: m.order_index }).eq("id", sibling.id);
    load();
  };

  const typeIcon: Record<string, string> = { text: "📝", video: "🎬", pdf: "📄", embed: "🎥" };
  const SUBJECTS = ["Mathematics","English Language","Chemistry","Physics","Biology","History","Geography","Computer Science","Agriculture","Commerce","Accounts","Combined Science"];
  const LEVELS = ["Form 1","Form 2","Form 3","Form 4","Form 5","Form 6","Lower 6","Upper 6"];
  const EMOJIS = ["📚","🧮","🔬","⚗️","📐","🌍","💻","📖","✍️","🎨","🏃","🎵"];

  return (
    <div style={{ display: "flex", gap: 20, height: "calc(100vh - 120px)", minHeight: 500 }}>
      {/* Course list */}
      <div style={{ width: 260, flexShrink: 0, display: "flex", flexDirection: "column", gap: 10 }}>
        <button onClick={openNewCourse} style={{ padding: "10px", borderRadius: 10, background: S.accent, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", fontFamily: "'Space Grotesk',sans-serif" }}>
          + New Course
        </button>
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 8 }}>
          {courses.length === 0 && (
            <div style={{ textAlign: "center", padding: "32px 16px" }}>
              <div style={{ fontSize: 36, marginBottom: 10 }}>📚</div>
              <p style={{ fontSize: 13, color: S.dim }}>No courses yet. Create your first course.</p>
            </div>
          )}
          {courses.map(c => (
            <div key={c.id} onClick={() => setSelected(c)}
              style={{ padding: "12px 14px", borderRadius: 12, cursor: "pointer",
                background: selected?.id === c.id ? "rgba(77,127,255,0.12)" : "rgba(255,255,255,0.02)",
                border: `1px solid ${selected?.id === c.id ? "rgba(77,127,255,0.3)" : S.border}`,
                transition: "all 0.15s" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 20 }}>{c.thumbnail_emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: S.text, margin: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</p>
                  <p style={{ fontSize: 11, color: S.dim, margin: 0 }}>{c.subject} · {c.grade_level}</p>
                </div>
                <span style={{ fontSize: 10, padding: "2px 7px", borderRadius: 20,
                  background: c.is_published ? "rgba(0,229,163,0.15)" : "rgba(255,255,255,0.06)",
                  color: c.is_published ? "#00E5A3" : S.dim, flexShrink: 0 }}>
                  {c.is_published ? "Live" : "Draft"}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                <p style={{ fontSize: 11, color: S.dim, margin: 0 }}>{c.materials.length} material{c.materials.length !== 1 ? "s" : ""}</p>
                <p style={{ fontSize: 11, fontWeight: 700, color: c.price > 0 ? "#F5A623" : S.dim, margin: 0 }}>{c.price > 0 ? `$${c.price.toFixed(2)}` : "Free"}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Material editor */}
      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 16 }}>
        {!selected ? (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 16 }}>
            <p style={{ fontSize: 14, color: S.dim }}>Select a course to manage its lessons</p>
          </div>
        ) : (
          <>
            {/* Course header */}
            <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 28 }}>{selected.thumbnail_emoji}</span>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>{selected.title}</h3>
                    <p style={{ fontSize: 12, color: S.dim, margin: "2px 0 0" }}>{selected.subject} · {selected.grade_level}</p>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button onClick={openNewMaterial}
                    style={{ padding: "8px 14px", borderRadius: 9, background: S.accent, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    + Add Lesson
                  </button>
                  <button onClick={() => toggleCoursePublish(selected)}
                    style={{ padding: "8px 14px", borderRadius: 9, border: `1px solid ${S.border}`,
                      background: selected.is_published ? "rgba(255,107,107,0.1)" : "rgba(0,229,163,0.1)",
                      color: selected.is_published ? "#FF6B6B" : "#00E5A3", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
                    {selected.is_published ? "Unpublish" : "Publish"}
                  </button>
                </div>
              </div>
              {selected.description && <p style={{ fontSize: 12, color: S.muted, margin: "10px 0 0", lineHeight: 1.5 }}>{selected.description}</p>}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 12 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: S.muted }}>Price (USD)</label>
                <input
                  type="number" min="0" step="0.01"
                  defaultValue={selected.price}
                  key={selected.id}
                  onBlur={(e) => {
                    const v = e.target.value ? parseFloat(e.target.value) : 0;
                    if (v !== selected.price) updateCoursePrice(selected, v);
                  }}
                  style={{ ...inp, width: 100, padding: "6px 10px" }}
                />
                <span style={{ fontSize: 11, color: S.dim }}>Leave at 0 for free</span>
              </div>
            </div>

            {/* Materials list */}
            {selected.materials.length === 0 ? (
              <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: "40px", textAlign: "center" }}>
                <p style={{ fontSize: 14, color: S.dim }}>No lessons yet &mdash; click &quot;+ Add Lesson&quot; to start</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {selected.materials.map((m, i) => (
                  <div key={m.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "14px 16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
                        <button onClick={() => moveOrder(m, -1)} disabled={i === 0}
                          style={{ fontSize: 10, background: "none", border: "none", color: i === 0 ? S.dim : S.muted, cursor: i === 0 ? "default" : "pointer", padding: 0 }}>▲</button>
                        <button onClick={() => moveOrder(m, 1)} disabled={i === selected.materials.length - 1}
                          style={{ fontSize: 10, background: "none", border: "none", color: i === selected.materials.length - 1 ? S.dim : S.muted, cursor: i === selected.materials.length - 1 ? "default" : "pointer", padding: 0 }}>▼</button>
                      </div>
                      <span style={{ fontSize: 18 }}>{typeIcon[m.type] ?? "📄"}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 600, color: S.text, margin: 0 }}>{m.title}</p>
                        <p style={{ fontSize: 11, color: S.dim, margin: "2px 0 0", textTransform: "capitalize" }}>
                          {m.type}{m.duration_minutes ? ` · ${m.duration_minutes} min` : ""}
                          {m.content ? ` · ${m.content.slice(0, 40)}…` : ""}
                          {m.embed_url ? ` · embed` : ""}
                          {m.file_url ? ` · file attached` : ""}
                        </p>
                      </div>
                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        {m.file_url && <FileActions fileUrl={m.file_url} />}
                        <button onClick={() => setQaOpen(qaOpen === m.id ? null : m.id)}
                          style={{ fontSize: 11, padding: "5px 10px", borderRadius: 7, background: "rgba(0,229,163,0.08)", border: `1px solid rgba(0,229,163,0.2)`, color: "#00E5A3", cursor: "pointer" }}>💬 Q&amp;A</button>
                        <button onClick={() => openEditMaterial(m)}
                          style={{ fontSize: 11, padding: "5px 10px", borderRadius: 7, background: "rgba(77,127,255,0.1)", border: `1px solid rgba(77,127,255,0.2)`, color: "#4D7FFF", cursor: "pointer" }}>Edit</button>
                        <button onClick={() => deleteMaterial(m.id)}
                          style={{ fontSize: 11, padding: "5px 10px", borderRadius: 7, background: "rgba(255,107,107,0.08)", border: `1px solid rgba(255,107,107,0.2)`, color: "#FF6B6B", cursor: "pointer" }}>Delete</button>
                      </div>
                    </div>
                    {qaOpen === m.id && (
                      <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${S.border}` }}>
                        <LessonQA materialId={m.id} profileId={profileId} isTeacher />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* New Course Modal */}
      {showCourseModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#0E1117", border: `1px solid ${S.border}`, borderRadius: 18, padding: 28, width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 16 }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>New Course</h3>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Course Title *</label>
              <input value={cTitle} onChange={e => setCTitle(e.target.value)} placeholder="e.g. ZIMSEC Form 4 Mathematics" style={inp} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Subject</label>
                <select value={cSubject} onChange={e => setCSubject(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                  {SUBJECTS.map(s => <option key={s} value={s} style={{ background: "#0E1117" }}>{s}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Grade Level</label>
                <select value={cLevel} onChange={e => setCLevel(e.target.value)} style={{ ...inp, cursor: "pointer" }}>
                  {LEVELS.map(l => <option key={l} value={l} style={{ background: "#0E1117" }}>{l}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Icon</label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                {EMOJIS.map(e => (
                  <button key={e} onClick={() => setCEmoji(e)}
                    style={{ width: 36, height: 36, borderRadius: 9, fontSize: 18, cursor: "pointer", border: `1px solid ${cEmoji === e ? S.accent : S.border}`, background: cEmoji === e ? "rgba(77,127,255,0.12)" : "rgba(255,255,255,0.03)" }}>
                    {e}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Price (USD, optional)</label>
              <input type="number" min="0" step="0.01" value={cPrice} onChange={e => setCPrice(e.target.value)} placeholder="0.00 — leave blank for free" style={inp} />
              <p style={{ fontSize: 11, color: S.dim, marginTop: 5 }}>Students see this price on the course. Payment collection isn&apos;t wired up yet — this just sets what to charge.</p>
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Description (optional)</label>
              <textarea value={cDesc} onChange={e => setCDesc(e.target.value)} rows={2} placeholder="What students will learn…" style={{ ...inp, resize: "vertical", fontFamily: "inherit" }} />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowCourseModal(false)} style={{ padding: "9px 18px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: `1px solid ${S.border}`, color: S.muted, fontSize: 13, cursor: "pointer" }}>Cancel</button>
              <button onClick={saveCourse} disabled={saving || !cTitle.trim()}
                style={{ padding: "9px 18px", borderRadius: 9, background: S.accent, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: (saving || !cTitle.trim()) ? 0.5 : 1 }}>
                {saving ? "Creating…" : "Create Course"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Material Modal */}
      {showMaterialModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
          <div style={{ background: "#0E1117", border: `1px solid ${S.border}`, borderRadius: 18, padding: 28, width: "100%", maxWidth: 540, display: "flex", flexDirection: "column", gap: 16, maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ fontSize: 16, fontWeight: 700, color: S.text, fontFamily: "'Space Grotesk',sans-serif", margin: 0 }}>
              {editMaterial ? "Edit Lesson" : "Add Lesson"}
            </h3>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Title *</label>
              <input value={mTitle} onChange={e => setMTitle(e.target.value)} placeholder="Lesson title…" style={inp} />
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Type</label>
                <select value={mType} onChange={e => setMType(e.target.value as any)} style={{ ...inp, cursor: "pointer" }}>
                  <option value="text" style={{ background: "#0E1117" }}>📝 Text / Notes</option>
                  <option value="video" style={{ background: "#0E1117" }}>🎬 Video Upload</option>
                  <option value="embed" style={{ background: "#0E1117" }}>🎥 YouTube / Vimeo</option>
                  <option value="pdf" style={{ background: "#0E1117" }}>📄 PDF / Document</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Duration (minutes)</label>
                <input type="number" value={mDuration} onChange={e => setMDuration(e.target.value)} placeholder="e.g. 15" style={inp} />
              </div>
            </div>

            {mType === "text" && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Content / Notes</label>
                <textarea value={mContent} onChange={e => setMContent(e.target.value)} rows={8}
                  placeholder="Write your lesson content here. Supports plain text. Use clear headings, examples, and explanations."
                  style={{ ...inp, resize: "vertical", fontFamily: "inherit", lineHeight: 1.6 }} />
              </div>
            )}

            {mType === "embed" && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>YouTube / Vimeo URL</label>
                <input value={mEmbedUrl} onChange={e => setMEmbedUrl(e.target.value)}
                  placeholder="https://www.youtube.com/watch?v=..." style={inp} />
                <p style={{ fontSize: 11, color: S.dim, marginTop: 5 }}>Paste a YouTube or Vimeo URL — it will be embedded for students.</p>
              </div>
            )}

            {(mType === "video" || mType === "pdf") && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>
                  {mType === "video" ? "Upload Video (MP4/WebM)" : "Upload PDF / Document"}
                </label>
                {editMaterial?.file_url && (
                  <p style={{ fontSize: 11, color: "#00E5A3", marginBottom: 6 }}>
                    Current file: <a href={editMaterial.file_url} target="_blank" rel="noreferrer" style={{ color: "#00E5A3" }}>view</a>
                  </p>
                )}
                <input type="file"
                  accept={mType === "video" ? "video/mp4,video/webm" : ".pdf,.doc,.docx,.ppt,.pptx"}
                  onChange={e => setMFile(e.target.files?.[0] ?? null)}
                  style={{ ...inp, padding: "7px 12px" }} />
                {mType === "video" && <p style={{ fontSize: 11, color: S.dim, marginTop: 5 }}>Max 500MB. Large videos may take a moment to upload.</p>}
                {uploading && (
                  <div style={{ height: 4, borderRadius: 4, background: "rgba(255,255,255,0.06)", overflow: "hidden", marginTop: 8 }}>
                    <div style={{ height: "100%", width: `${uploadPct}%`, background: S.accent, transition: "width 0.2s" }} />
                  </div>
                )}
                {uploadError && <p style={{ fontSize: 11, color: "#FF6B6B", marginTop: 5 }}>{uploadError}</p>}
              </div>
            )}

            {mType !== "text" && (
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: S.muted, display: "block", marginBottom: 5 }}>Notes / Description (optional)</label>
                <textarea value={mContent} onChange={e => setMContent(e.target.value)} rows={3}
                  placeholder="Add any notes or context for students…"
                  style={{ ...inp, resize: "vertical", fontFamily: "inherit" }} />
              </div>
            )}

            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
              <button onClick={() => setShowMaterialModal(false)}
                style={{ padding: "9px 18px", borderRadius: 9, background: "rgba(255,255,255,0.05)", border: `1px solid ${S.border}`, color: S.muted, fontSize: 13, cursor: "pointer" }}>
                Cancel
              </button>
              <button onClick={saveMaterial} disabled={saving || uploading || !mTitle.trim()}
                style={{ padding: "9px 18px", borderRadius: 9, background: S.accent, border: "none", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: (saving || uploading || !mTitle.trim()) ? 0.5 : 1 }}>
                {uploading ? "Uploading…" : saving ? "Saving…" : editMaterial ? "Save Changes" : "Add Lesson"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
