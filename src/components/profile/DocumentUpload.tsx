"use client";

import { useRef, useState } from "react";
import { uploadToR2 } from "@/lib/uploadToR2";

interface DocumentUploadProps {
  category: string; // FILE_CATEGORIES key in src/lib/r2.ts
  ids: Record<string, string>;
  label: string;
  hint?: string;
  currentKey: string | null;
  onUploaded: (key: string) => void;
}

// Private-document upload (qualification proof, national ID) via the R2
// presign flow — unlike SchoolLogoUpload, these aren't public
// Supabase Storage buckets: the file never gets a public URL, only an R2
// object key, which /api/files/[...key] later resolves to a freshly-signed
// URL after an ownership check (see canAccessFileKey in src/lib/r2.ts).
export function DocumentUpload({ category, ids, label, hint, currentKey, onUploaded }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(currentKey ? currentKey.split("/").pop() ?? null : null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setUploading(true);
    try {
      const { key } = await uploadToR2(file, category, ids);
      setFileName(file.name);
      onUploaded(key);
    } catch (err) {
      console.error("DocumentUpload failed:", err instanceof Error ? err.message : err);
      setError(err instanceof Error ? err.message : "Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm font-medium" style={{ color: "#566257" }}>{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        className="flex items-center justify-between gap-3 px-4 py-3 rounded-xl cursor-pointer transition-colors"
        style={{
          background: "rgba(28,38,32,0.04)",
          border: `1px solid ${fileName ? "rgba(31,71,56,0.3)" : "rgba(28,38,32,0.08)"}`,
        }}
      >
        <span className="text-sm truncate" style={{ color: fileName ? "#1F4738" : "#6E7A6C" }}>
          {uploading ? "Uploading…" : fileName ? `✓ ${fileName}` : "Click to upload a file"}
        </span>
        <span className="text-xs font-semibold flex-shrink-0" style={{ color: "#B1502B" }}>
          {fileName ? "Replace" : "Choose file"}
        </span>
      </div>
      {hint && <p className="text-xs" style={{ color: "#6E7A6C" }}>{hint}</p>}
      {error && <p className="text-xs" style={{ color: "#A3311E" }}>{error}</p>}
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
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
