"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface SchoolLogoUploadProps {
 userId: string;
 currentUrl: string | null;
 schoolName: string;
 onUploaded: (url: string) => void;
}

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function SchoolLogoUpload({ userId, currentUrl, schoolName, onUploaded }: SchoolLogoUploadProps) {
 const [preview, setPreview] = useState<string | null>(currentUrl);
 const [uploading, setUploading] = useState(false);
 const [error, setError] = useState<string | null>(null);
 const inputRef = useRef<HTMLInputElement>(null);
 const supabase = createClient();

 const initials = schoolName.split("").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();

 const handleFile = async (file: File) => {
 setError(null);
 if (!ALLOWED_TYPES.includes(file.type)) {
 setError("Please upload a JPG, PNG, or WEBP image.");
 return;
 }
 if (file.size > MAX_BYTES) {
 setError("Logo must be under 5MB.");
 return;
 }

 setUploading(true);
 try {
 const ext = file.name.split(".").pop();
 const path = `${userId}/logo-${Date.now()}.${ext}`;

 const { error: uploadError } = await supabase.storage
 .from("school-logos")
 .upload(path, file, { upsert: true });

 if (uploadError) {
 setError(uploadError.message);
 return;
 }

 const { data } = supabase.storage.from("school-logos").getPublicUrl(path);
 setPreview(data.publicUrl);
 onUploaded(data.publicUrl);
 } catch {
 setError("Upload failed. Please try again.");
 } finally {
 setUploading(false);
 }
 };

 return (
 <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
 <div
 onClick={() => inputRef.current?.click()}
 style={{
 width: 72, height: 72, borderRadius: 20, cursor: "pointer", position: "relative",
 background: preview ? "transparent" : "linear-gradient(135deg, #A9873F, #8A6D2F)",
 border: "1px solid rgba(28,38,32,0.1)", overflow: "hidden",
 display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
 }}
 >
 {preview ? (
 // eslint-disable-next-line @next/next/no-img-element
 <img src={preview} alt={schoolName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
 ) : (
 <span style={{ fontSize: 22, fontWeight: 700, color: "#fff" }}>{initials || ""}</span>
 )}
 {uploading && (
 <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
 <span style={{ fontSize: 10, color: "#fff" }}>...</span>
 </div>
 )}
 </div>

 <div>
 <button
 type="button"
 onClick={() => inputRef.current?.click()}
 disabled={uploading}
 style={{
 fontSize: 13, fontWeight: 600, color: "#A9873F", background: "rgba(169,135,63,0.1)",
 border: "1px solid rgba(169,135,63,0.25)", borderRadius: 10, padding: "8px 14px", cursor: "pointer",
 }}
 >
 {uploading ? "Uploading…" : "Upload school logo"}
 </button>
 <p style={{ fontSize: 11, color: "#6E7A6C", marginTop: 6 }}>JPG, PNG or WEBP. Max 5MB.</p>
 {error && <p style={{ fontSize: 11, color: "#A3311E", marginTop: 4 }}>{error}</p>}
 </div>

 <input
 ref={inputRef}
 type="file"
 accept="image/jpeg,image/png,image/webp"
 style={{ display: "none" }}
 onChange={(e) => {
 const file = e.target.files?.[0];
 if (file) handleFile(file);
 e.target.value = "";
 }}
 />
 </div>
 );
}
