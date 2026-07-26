/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadToR2, deleteR2File } from "@/lib/uploadToR2";
import { IconFileText, IconBook } from "@/components/icons";
import { FileActions } from "@/components/academic/FileActions";
import { useConfirm } from "@/components/ui/ConfirmProvider";

interface Material {
 id: string;
 title: string;
 type: string;
 file_url: string | null;
 content: string | null;
 order_index: number;
 duration_minutes: number | null;
}

interface Course {
 id: string;
 title: string;
 description: string | null;
 subject: string;
 grade_level: string | null;
 is_published: boolean;
 order_index: number;
 thumbnail_emoji: string;
 price: number;
 created_at: string;
 materials?: Material[];
}

const SUBJECTS = ["Mathematics","English Language","English Literature","Shona","Ndebele","History","Geography","Biology","Chemistry","Physics","Combined Science","Agriculture","Business Studies","Accounting","Computer Science","Art & Design","R.M.E","HBC / Heritage","Commerce","General"];
const GRADES = ["Form 1","Form 2","Form 3","Form 4","Form 5","Form 6","ECD","Grade 1","Grade 2","Grade 3","Grade 4","Grade 5","Grade 6","Grade 7","All Grades"];
const EMOJIS = ["📚","📐","🔬","⚗","🌍","📖","🏛","🧬","⚡","💡","🎨","🏺","💼","📊","💻","🌾","✝","🎓","📝","🔭"];

export function CourseManager({ initialCourses, adminId }: { initialCourses: Course[]; adminId: string }) {
  const confirmDialog = useConfirm();
 const [courses, setCourses] = useState<Course[]>(initialCourses);
 const [view, setView] = useState<"list" | "create" | "edit">("list");
 const [editTarget, setEditTarget] = useState<Course | null>(null);
 const [materialsOpen, setMaterialsOpen] = useState<string | null>(null);
 const [coursesMaterials, setCoursesMaterials] = useState<Record<string, Material[]>>({});
 const [notification, setNotification] = useState<string | null>(null);

 // Form state
 const [form, setForm] = useState({ title: "", description: "", subject: SUBJECTS[0], grade_level: GRADES[14], thumbnail_emoji: EMOJIS[0], is_published: false, price: 0 });
 const [saving, setSaving] = useState(false);
 const [formErr, setFormErr] = useState<string | null>(null);

 // Material upload
 const [uploadTarget, setUploadTarget] = useState<string | null>(null);
 const [matTitle, setMatTitle] = useState("");
 const [matFile, setMatFile] = useState<File | null>(null);
 const [matContent, setMatContent] = useState("");
 const [matType, setMatType] = useState<"pdf" | "text">("pdf");
 const [uploading, setUploading] = useState(false);
 const [uploadPct, setUploadPct] = useState(0);
 const fileRef = useRef<HTMLInputElement>(null);

 const supabase = createClient();

 const notify = (msg: string) => { setNotification(msg); setTimeout(() => setNotification(null), 3000); };

 const openCreate = () => { setForm({ title: "", description: "", subject: SUBJECTS[0], grade_level: GRADES[14], thumbnail_emoji: EMOJIS[0], is_published: false, price: 0 }); setFormErr(null); setView("create"); };
 const openEdit = (c: Course) => { setEditTarget(c); setForm({ title: c.title, description: c.description ?? "", subject: c.subject, grade_level: c.grade_level ?? GRADES[14], thumbnail_emoji: c.thumbnail_emoji ?? EMOJIS[0], is_published: c.is_published, price: c.price ?? 0 }); setFormErr(null); setView("edit"); };

 const saveCourse = async () => {
 if (!form.title.trim()) { setFormErr("Title is required"); return; }
 setSaving(true); setFormErr(null);
 if (view === "create") {
 const { data, error } = await (supabase.from("courses") as any)
 .insert({ ...form, title: form.title.trim(), description: form.description.trim() || null, created_by: adminId })
 .select().single();
 if (error || !data) { setFormErr("Failed to create. Try again."); setSaving(false); return; }
 setCourses((p) => [data, ...p]);
 notify("Course created ✓");
 } else if (editTarget) {
 const { data, error } = await (supabase.from("courses") as any)
 .update({ ...form, title: form.title.trim(), description: form.description.trim() || null, updated_at: new Date().toISOString() })
 .eq("id", editTarget.id).select().single();
 if (error || !data) { setFormErr("Failed to save. Try again."); setSaving(false); return; }
 setCourses((p) => p.map((c) => c.id === editTarget.id ? data : c));
 notify("Course updated ✓");
 }
 setSaving(false);
 setView("list");
 };

 const togglePublish = async (c: Course) => {
 const { data, error } = await (supabase.from("courses") as any)
 .update({ is_published: !c.is_published }).eq("id", c.id).select().single();
 if (error || !data) { notify(`Could not update course: ${error?.message ?? "unknown error"}`); return; }
 setCourses((p) => p.map((x) => x.id === c.id ? data : x));
 notify(data.is_published ? "Published ✓" : "Unpublished");
 };

 const deleteCourse = async (id: string) => {
 const ok = await confirmDialog({ title: "Delete this course?", message: "All its materials will be deleted too. This can't be undone.", danger: true, confirmLabel: "Delete" });
    if (!ok) return;
 const { error } = await (supabase.from("courses") as any).delete().eq("id", id);
 if (error) { notify(`Could not delete course: ${error.message}`); return; }
 setCourses((p) => p.filter((c) => c.id !== id));
 notify("Course deleted");
 };

 const loadMaterials = async (courseId: string) => {
 if (materialsOpen === courseId) { setMaterialsOpen(null); return; }
 setMaterialsOpen(courseId);
 if (coursesMaterials[courseId]) return;
 const { data } = await (supabase.from("course_materials") as any)
 .select("*").eq("course_id", courseId).order("order_index");
 setCoursesMaterials((p) => ({ ...p, [courseId]: data ?? [] }));
 };

 const uploadMaterial = async (courseId: string) => {
 if (!matTitle.trim()) return;
 setUploading(true);
 let fileUrl: string | null = null;

 if (matType === "pdf" && matFile) {
 setUploadPct(0);
 try {
 const { fileUrl: uploadedUrl } = await uploadToR2(matFile, "course-material", { courseId }, setUploadPct);
 fileUrl = uploadedUrl;
 } catch (err) {
 notify("Upload failed: " + (err instanceof Error ? err.message : "unknown error"));
 setUploading(false);
 return;
 }
 }

 const { data: mat } = await (supabase.from("course_materials") as any)
 .insert({
 course_id: courseId,
 title: matTitle.trim(),
 type: matType,
 file_url: fileUrl,
 content: matType === "text" ? matContent : null,
 order_index: (coursesMaterials[courseId]?.length ?? 0),
 }).select().single();

 if (mat) {
 setCoursesMaterials((p) => ({ ...p, [courseId]: [...(p[courseId] ?? []), mat] }));
 setMatTitle(""); setMatFile(null); setMatContent(""); setUploadTarget(null);
 if (fileRef.current) fileRef.current.value = "";
 notify("Material added ✓");
 }
 setUploading(false);
 };

 const deleteMaterial = async (courseId: string, matId: string, fileUrl: string | null) => {
 if (fileUrl) await deleteR2File(fileUrl);
 const { error } = await (supabase.from("course_materials") as any).delete().eq("id", matId);
 if (error) { notify(`Could not remove material: ${error.message}`); return; }
 setCoursesMaterials((p) => ({ ...p, [courseId]: (p[courseId] ?? []).filter((m) => m.id !== matId) }));
 notify("Material removed");
 };

 // ── FORM VIEW ──────────────────────────────────────────────────────────────
 if (view === "create" || view === "edit") {
 return (
 <div style={{ maxWidth: 680 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
 <button onClick={() => setView("list")} style={{ background: "none", border: "1px solid rgba(28,38,32,0.08)", borderRadius: 8, padding: "6px 12px", fontSize: 12, color: "#566257", cursor: "pointer" }}>← Back</button>
 <h2 style={{ fontSize: 18, fontWeight: 700, color: "#1C2620", fontFamily: "inherit", margin: 0 }}>{view === "create" ? "New Course" : "Edit Course"}</h2>
 </div>

 <div style={{ background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.06)", borderRadius: 18, padding: 24, display: "flex", flexDirection: "column", gap: 16 }}>
 {/* Emoji picker */}
 <div>
 <label style={{ fontSize: 11, fontWeight: 600, color: "#566257", display: "block", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>Course Icon</label>
 <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
 {EMOJIS.map((e) => (
 <button key={e} onClick={() => setForm((p) => ({ ...p, thumbnail_emoji: e }))} style={{ width: 40, height: 40, borderRadius: 10, fontSize: 20, background: form.thumbnail_emoji === e ? "rgba(177,80,43,0.2)" : "rgba(28,38,32,0.04)", border: `1px solid ${form.thumbnail_emoji === e ? "rgba(177,80,43,0.5)" : "rgba(28,38,32,0.08)"}`, cursor: "pointer" }}>
 {e}
 </button>
 ))}
 </div>
 </div>

 {[
 { label: "Course Title *", key: "title", placeholder: "e.g. ZIMSEC Mathematics Form 4" },
 { label: "Description", key: "description", placeholder: "Brief overview of what students will learn" },
 ].map((f) => (
 <div key={f.key}>
 <label style={{ fontSize: 11, fontWeight: 600, color: "#566257", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.label}</label>
 {f.key === "description" ? (
 <textarea value={(form as any)[f.key]} onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} rows={3} style={{ width: "100%", padding: "10px 14px", background: "rgba(28,38,32,0.04)", border: "1px solid rgba(28,38,32,0.1)", borderRadius: 10, fontSize: 13, color: "#1C2620", fontFamily: "inherit", resize: "none", outline: "none", boxSizing: "border-box" }} />
 ) : (
 <input value={(form as any)[f.key]} onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))} placeholder={f.placeholder} style={{ width: "100%", padding: "10px 14px", background: "rgba(28,38,32,0.04)", border: "1px solid rgba(28,38,32,0.1)", borderRadius: 10, fontSize: 13, color: "#1C2620", outline: "none", boxSizing: "border-box" }} />
 )}
 </div>
 ))}

 <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
 {[
 { label: "Subject", key: "subject", opts: SUBJECTS },
 { label: "Grade Level", key: "grade_level", opts: GRADES },
 ].map((f) => (
 <div key={f.key}>
 <label style={{ fontSize: 11, fontWeight: 600, color: "#566257", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>{f.label}</label>
 <select value={(form as any)[f.key]} onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))} style={{ width: "100%", padding: "10px 14px", background: "rgba(10,12,20,0.95)", border: "1px solid rgba(28,38,32,0.1)", borderRadius: 10, fontSize: 13, color: "#1C2620", outline: "none" }}>
 {f.opts.map((o) => <option key={o} value={o}>{o}</option>)}
 </select>
 </div>
 ))}
 </div>

 <div>
 <label style={{ fontSize: 11, fontWeight: 600, color: "#566257", display: "block", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.06em" }}>Price (USD)</label>
 <input type="number" min="0" step="0.01" value={form.price} onChange={(e) => setForm((p) => ({ ...p, price: e.target.value ? parseFloat(e.target.value) : 0 }))} placeholder="0.00" style={{ width: 160, padding: "10px 14px", background: "rgba(28,38,32,0.04)", border: "1px solid rgba(28,38,32,0.1)", borderRadius: 10, fontSize: 13, color: "#1C2620", outline: "none", boxSizing: "border-box" }} />
 </div>

 <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer" }}>
 <input type="checkbox" checked={form.is_published} onChange={(e) => setForm((p) => ({ ...p, is_published: e.target.checked }))} style={{ width: 16, height: 16, accentColor: "#1F4738" }} />
 <span style={{ fontSize: 13, color: "#1C2620" }}>Publish immediately (visible to students)</span>
 </label>

 {formErr && <p style={{ fontSize: 12, color: "#A3311E", margin: 0 }}>⚠ {formErr}</p>}

 <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", paddingTop: 4 }}>
 <button onClick={() => setView("list")} style={{ padding: "10px 20px", borderRadius: 10, fontSize: 13, background: "none", border: "1px solid rgba(28,38,32,0.08)", color: "#566257", cursor: "pointer" }}>Cancel</button>
 <button onClick={saveCourse} disabled={saving} style={{ padding: "10px 24px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: saving ? "rgba(177,80,43,0.2)" : "rgba(177,80,43,0.9)", border: "1px solid rgba(177,80,43,0.4)", color: "#fff", cursor: saving ? "not-allowed" : "pointer" }}>
 {saving ? "Saving…" : view === "create" ? "Create Course" : "Save Changes"}
 </button>
 </div>
 </div>
 </div>
 );
 }

 // ── LIST VIEW ──────────────────────────────────────────────────────────────
 return (
 <div style={{ maxWidth: 900, display: "flex", flexDirection: "column", gap: 20 }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
 <div>
 <h2 style={{ fontSize: 20, fontWeight: 700, color: "#1C2620", fontFamily: "inherit", margin: 0 }}>Courses</h2>
 <p style={{ fontSize: 12, color: "#6E7A6C", marginTop: 4 }}>{courses.length} total · {courses.filter((c) => c.is_published).length} published</p>
 </div>
 <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
 {notification && <span style={{ fontSize: 12, color: "#1F4738", padding: "4px 12px", borderRadius: 8, background: "rgba(31,71,56,0.08)", border: "1px solid rgba(31,71,56,0.2)" }}>{notification}</span>}
 <button onClick={openCreate} style={{ padding: "9px 20px", borderRadius: 10, fontSize: 13, fontWeight: 700, background: "rgba(177,80,43,0.9)", border: "1px solid rgba(177,80,43,0.4)", color: "#fff", cursor: "pointer" }}>+ New Course</button>
 </div>
 </div>

 {courses.length === 0 ? (
 <div style={{ background: "rgba(28,38,32,0.02)", border: "1px dashed rgba(28,38,32,0.1)", borderRadius: 16, padding: "52px 24px", textAlign: "center" }}>
 <div style={{ fontSize: 44, marginBottom: 14 }}></div>
 <p style={{ fontSize: 15, fontWeight: 600, color: "#566257", marginBottom: 8 }}>No courses yet</p>
 <button onClick={openCreate} style={{ padding: "9px 22px", borderRadius: 10, fontSize: 13, fontWeight: 600, background: "rgba(177,80,43,0.1)", border: "1px solid rgba(177,80,43,0.25)", color: "#B1502B", cursor: "pointer" }}>Create your first course</button>
 </div>
 ) : (
 <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
 {courses.map((c) => {
 const mats = coursesMaterials[c.id] ?? [];
 const isOpen = materialsOpen === c.id;
 return (
 <div key={c.id} style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${isOpen ? "rgba(177,80,43,0.2)" : "rgba(28,38,32,0.06)"}`, borderRadius: 16, overflow: "hidden", transition: "border-color 0.15s" }}>
 {/* Course row */}
 <div style={{ display: "flex", alignItems: "center", gap: 14, padding: "14px 18px" }}>
 <div style={{ width: 44, height: 44, borderRadius: 12, background: "rgba(177,80,43,0.08)", border: "1px solid rgba(177,80,43,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
 {c.thumbnail_emoji}
 </div>
 <div style={{ flex: 1, minWidth: 0 }}>
 <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
 <p style={{ fontSize: 14, fontWeight: 700, color: "#1C2620", fontFamily: "inherit", margin: 0 }}>{c.title}</p>
 <span style={{ fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 20, color: c.is_published ? "#1F4738" : "#6E7A6C", background: c.is_published ? "rgba(31,71,56,0.1)" : "rgba(28,38,32,0.04)", border: `1px solid ${c.is_published ? "rgba(31,71,56,0.2)" : "rgba(28,38,32,0.08)"}` }}>
 {c.is_published ? "Published" : "Draft"}
 </span>
 <span style={{ fontSize: 10, fontWeight: 700, color: c.price > 0 ? "#A9873F" : "#6E7A6C" }}>{c.price > 0 ? `$${c.price.toFixed(2)}` : "Free"}</span>
 </div>
 <p style={{ fontSize: 11, color: "#566257", margin: "3px 0 0" }}>{c.subject} · {c.grade_level}</p>
 </div>
 <div style={{ display: "flex", gap: 6, flexShrink: 0, flexWrap: "wrap" }}>
 <button onClick={() => loadMaterials(c.id)} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: "rgba(177,80,43,0.08)", border: "1px solid rgba(177,80,43,0.2)", color: "#B1502B", cursor: "pointer" }}>
 {isOpen ? "Close" : "Materials"}
 </button>
 <button onClick={() => togglePublish(c)} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, background: c.is_published ? "rgba(169,135,63,0.08)" : "rgba(31,71,56,0.08)", border: `1px solid ${c.is_published ? "rgba(169,135,63,0.2)" : "rgba(31,71,56,0.2)"}`, color: c.is_published ? "#A9873F" : "#1F4738", cursor: "pointer" }}>
 {c.is_published ? "Unpublish" : "Publish"}
 </button>
 <button onClick={() => openEdit(c)} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11, background: "rgba(28,38,32,0.04)", border: "1px solid rgba(28,38,32,0.08)", color: "#566257", cursor: "pointer" }}>Edit</button>
 <button onClick={() => deleteCourse(c.id)} style={{ padding: "5px 12px", borderRadius: 8, fontSize: 11, background: "rgba(163,49,30,0.06)", border: "1px solid rgba(163,49,30,0.15)", color: "#A3311E", cursor: "pointer" }}>Delete</button>
 </div>
 </div>

 {/* Materials panel */}
 {isOpen && (
 <div style={{ borderTop: "1px solid rgba(28,38,32,0.05)", padding: "16px 18px", display: "flex", flexDirection: "column", gap: 10, background: "rgba(0,0,0,0.15)" }}>
 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
 <p style={{ fontSize: 12, fontWeight: 600, color: "#566257", margin: 0, textTransform: "uppercase", letterSpacing: "0.06em" }}>Course Materials ({mats.length})</p>
 <button onClick={() => { setUploadTarget(uploadTarget === c.id ? null : c.id); setMatTitle(""); setMatFile(null); setMatContent(""); setMatType("pdf"); }} style={{ padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: "rgba(169,135,63,0.1)", border: "1px solid rgba(169,135,63,0.25)", color: "#A9873F", cursor: "pointer" }}>
 {uploadTarget === c.id ? "Cancel" : "+ Add Material"}
 </button>
 </div>

 {/* Add material form */}
 {uploadTarget === c.id && (
 <div style={{ background: "rgba(169,135,63,0.05)", border: "1px solid rgba(169,135,63,0.15)", borderRadius: 12, padding: 14, display: "flex", flexDirection: "column", gap: 10 }}>
 <div style={{ display: "flex", gap: 8 }}>
 {(["pdf", "text"] as const).map((t) => (
 <button key={t} onClick={() => setMatType(t)} style={{ padding: "5px 14px", borderRadius: 8, fontSize: 12, fontWeight: 600, background: matType === t ? "rgba(169,135,63,0.2)" : "rgba(28,38,32,0.04)", border: `1px solid ${matType === t ? "rgba(169,135,63,0.4)" : "rgba(28,38,32,0.08)"}`, color: matType === t ? "#A9873F" : "#566257", cursor: "pointer" }}>
 {t === "pdf" ? " PDF Upload" : " Text Lesson"}
 </button>
 ))}
 </div>
 <input value={matTitle} onChange={(e) => setMatTitle(e.target.value)} placeholder="Material title *" style={{ padding: "8px 12px", background: "rgba(28,38,32,0.04)", border: "1px solid rgba(28,38,32,0.1)", borderRadius: 8, fontSize: 13, color: "#1C2620", outline: "none" }} />
 {matType === "pdf" ? (
 <div>
 <input ref={fileRef} type="file" accept=".pdf" onChange={(e) => setMatFile(e.target.files?.[0] ?? null)} style={{ display: "none" }} />
 <button onClick={() => fileRef.current?.click()} style={{ padding: "8px 16px", borderRadius: 8, fontSize: 12, background: "rgba(28,38,32,0.04)", border: "1px dashed rgba(28,38,32,0.15)", color: "#566257", cursor: "pointer", width: "100%" }}>
 {matFile ? ` ${matFile.name} (${(matFile.size / 1024 / 1024).toFixed(1)} MB)` : "Click to select PDF file"}
 </button>
 {uploading && matType === "pdf" && (
 <div style={{ height: 4, borderRadius: 4, background: "rgba(28,38,32,0.06)", overflow: "hidden", marginTop: 6 }}>
 <div style={{ height: "100%", width: `${uploadPct}%`, background: "#A9873F", transition: "width 0.2s" }} />
 </div>
 )}
 </div>
 ) : (
 <textarea value={matContent} onChange={(e) => setMatContent(e.target.value)} placeholder="Write lesson content here..." rows={4} style={{ padding: "8px 12px", background: "rgba(28,38,32,0.04)", border: "1px solid rgba(28,38,32,0.1)", borderRadius: 8, fontSize: 13, color: "#1C2620", fontFamily: "inherit", resize: "vertical", outline: "none" }} />
 )}
 <button onClick={() => uploadMaterial(c.id)} disabled={uploading || !matTitle.trim() || (matType === "pdf" && !matFile)} style={{ padding: "9px 20px", borderRadius: 9, fontSize: 13, fontWeight: 600, background: uploading ? "rgba(169,135,63,0.15)" : "rgba(169,135,63,0.25)", border: "1px solid rgba(169,135,63,0.4)", color: "#A9873F", cursor: (uploading || !matTitle.trim()) ? "not-allowed" : "pointer", alignSelf: "flex-end" }}>
 {uploading ? "Uploading…" : "Add Material →"}
 </button>
 </div>
 )}

 {/* Materials list */}
 {mats.length === 0 && uploadTarget !== c.id && (
 <p style={{ fontSize: 12, color: "#6E7A6C", fontStyle: "italic" }}>No materials yet. Add a PDF or text lesson above.</p>
 )}
 {mats.map((m, idx) => (
 <div key={m.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 12px", background: "rgba(28,38,32,0.02)", border: "1px solid rgba(28,38,32,0.05)", borderRadius: 10, flexWrap: "wrap" }}>
 <span style={{ flexShrink: 0, display: "flex" }}>{m.type === "pdf" ? <IconFileText size={16} /> : <IconBook size={16} />}</span>
 <div style={{ flex: 1, minWidth: 0 }}>
 <p style={{ fontSize: 13, color: "#1C2620", margin: 0, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{idx + 1}. {m.title}</p>
 <p style={{ fontSize: 10, color: "#6E7A6C", margin: "2px 0 0" }}>{m.type.toUpperCase()}</p>
 </div>
 {m.file_url && <FileActions fileUrl={m.file_url} />}
 <button onClick={() => deleteMaterial(c.id, m.id, m.file_url)} style={{ padding: "4px 10px", borderRadius: 7, fontSize: 11, background: "rgba(163,49,30,0.06)", border: "1px solid rgba(163,49,30,0.15)", color: "#A3311E", cursor: "pointer", flexShrink: 0 }}>Remove</button>
 </div>
 ))}
 </div>
 )}
 </div>
 );
 })}
 </div>
 )}
 </div>
 );
}
