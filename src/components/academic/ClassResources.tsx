"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadToR2 } from "@/lib/uploadToR2";
import { useConfirm } from "@/components/ui/ConfirmProvider";

interface Resource {
 id: string;
 title: string;
 file_url: string;
 file_name: string | null;
 created_at: string;
 uploaded_by: string;
}

const S = { border: "rgba(28,38,32,0.07)", text: "#1C2620", muted: "#566257", dim: "#6E7A6C", accent: "#B1502B" };

function fileIcon(name: string | null) {
 const ext = (name ?? "").split(".").pop()?.toLowerCase();
 if (ext === "pdf") return "";
 if (ext === "ppt" || ext === "pptx") return "";
 if (ext === "doc" || ext === "docx") return "";
 if (["jpg", "jpeg", "png"].includes(ext ?? "")) return "";
 return "";
}

export function ClassResources({ classId, profileId, isTeacher }: { classId: string; profileId: string; isTeacher: boolean }) {
  const confirmDialog = useConfirm();
 const supabase = createClient();
 const [resources, setResources] = useState<Resource[]>([]);
 const [loading, setLoading] = useState(true);
 const [uploading, setUploading] = useState(false);
 const [uploadPct, setUploadPct] = useState(0);
 const [uploadError, setUploadError] = useState<string | null>(null);
 const [title, setTitle] = useState("");
 const fileInputRef = useRef<HTMLInputElement>(null);

 const load = async () => {
 const { data } = await (supabase.from("class_resources") as any)
 .select("id,title,file_url,file_name,created_at,uploaded_by")
 .eq("class_id", classId)
 .order("created_at", { ascending: false });
 setResources(data ?? []);
 setLoading(false);
 };

 useEffect(() => { load(); }, [classId]); // eslint-disable-line react-hooks/exhaustive-deps

 const handleFile = async (file: File) => {
 setUploading(true);
 setUploadError(null);
 setUploadPct(0);
 try {
 const { fileUrl } = await uploadToR2(file, "class-resource", { classId }, setUploadPct);
 await (supabase.from("class_resources") as any).insert({
 class_id: classId, uploaded_by: profileId, title: title.trim() || file.name,
 file_url: fileUrl, file_name: file.name,
 });
 setTitle("");
 if (fileInputRef.current) fileInputRef.current.value = "";
 load();
 } catch (err) {
 setUploadError(err instanceof Error ? err.message : "Upload failed");
 }
 setUploading(false);
 };

 const deleteResource = async (id: string) => {
 const ok = await confirmDialog({ title: "Delete this resource?", danger: true, confirmLabel: "Delete" });
    if (!ok) return;
 await (supabase.from("class_resources") as any).delete().eq("id", id);
 setResources((prev) => prev.filter((r) => r.id !== id));
 };

 if (loading) return <p style={{ fontSize: 13, color: S.dim }}>Loading…</p>;

 return (
 <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
 {isTeacher && (
 <div style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
 <input
 value={title}
 onChange={(e) => setTitle(e.target.value)}
 placeholder="Title (optional — defaults to file name)"
 style={{ padding: "9px 12px", background: "rgba(28,38,32,0.04)", border: `1px solid ${S.border}`, borderRadius: 9, color: S.text, fontSize: 13, outline: "none" }}
 />
 <input
 ref={fileInputRef}
 type="file"
 onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
 disabled={uploading}
 style={{ fontSize: 12, color: S.muted }}
 />
 {uploading && <p style={{ fontSize: 12, color: S.accent, margin: 0 }}>Uploading… {uploadPct}%</p>}
 {uploadError && <p style={{ fontSize: 12, color: "#A3311E", margin: 0 }}>{uploadError}</p>}
 </div>
 )}

 {resources.length === 0 ? (
 <div style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "32px", textAlign: "center" }}>
 <p style={{ color: S.dim, fontSize: 14 }}>No resources shared yet.</p>
 </div>
 ) : (
 resources.map((r) => (
 <div key={r.id} style={{ background: "rgba(28,38,32,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
 <span style={{ fontSize: 20 }}>{fileIcon(r.file_name)}</span>
 <a href={r.file_url} target="_blank" rel="noopener noreferrer" style={{ flex: 1, minWidth: 0, textDecoration: "none" }}>
 <p style={{ fontSize: 13, fontWeight: 600, color: S.accent, margin: 0 }}>{r.title}</p>
 <p style={{ fontSize: 11, color: S.dim, margin: 0 }}>{new Date(r.created_at).toLocaleDateString()}</p>
 </a>
 {isTeacher && (
 <button onClick={() => deleteResource(r.id)} style={{ background: "none", border: "none", color: S.dim, cursor: "pointer", fontSize: 14 }}>✕</button>
 )}
 </div>
 ))
 )}
 </div>
 );
}
