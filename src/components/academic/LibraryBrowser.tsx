"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { uploadToR2 } from "@/lib/uploadToR2";
import { FileActions } from "@/components/academic/FileActions";

interface Resource {
  id: string; title: string; description: string | null; subject: string; level: string; topic: string | null;
  resource_type: string; file_url: string; file_name: string | null; download_count: number; created_at: string;
}

const LEVELS = [{ v: "primary", l: "Primary" }, { v: "o_level", l: "O-Level" }, { v: "a_level", l: "A-Level" }];
const TYPES = [{ v: "textbook", l: "Textbook" }, { v: "notes", l: "Notes" }, { v: "video", l: "Video" }, { v: "reference", l: "Reference" }];
const S = { border: "rgba(255,255,255,0.07)", text: "#CDD6F4", muted: "#8892B0", dim: "#4A5170", accent: "#4D7FFF" };
const inp: React.CSSProperties = { padding: "9px 12px", background: "rgba(255,255,255,0.04)", border: `1px solid ${S.border}`, borderRadius: 9, color: S.text, fontSize: 13, outline: "none" };

const NEW_WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

export function LibraryBrowser({ profileId, canUpload }: { profileId: string; canUpload: boolean }) {
  const supabase = createClient();
  const [resources, setResources] = useState<Resource[]>([]);
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [level, setLevel] = useState("");
  const [type, setType] = useState("");
  const [showBookmarksOnly, setShowBookmarksOnly] = useState(false);
  const [showUpload, setShowUpload] = useState(false);

  const [fTitle, setFTitle] = useState("");
  const [fDesc, setFDesc] = useState("");
  const [fSubject, setFSubject] = useState("");
  const [fLevel, setFLevel] = useState("o_level");
  const [fTopic, setFTopic] = useState("");
  const [fType, setFType] = useState("notes");
  const [fFile, setFFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadPct, setUploadPct] = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: res }, { data: bm }] = await Promise.all([
      (supabase.from("library_resources") as any).select("*").order("created_at", { ascending: false }),
      (supabase.from("library_bookmarks") as any).select("resource_id").eq("profile_id", profileId),
    ]);
    setResources(res ?? []);
    setBookmarks(new Set((bm ?? []).map((b: any) => b.resource_id)));
    setLoading(false);
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleBookmark = async (resourceId: string) => {
    if (bookmarks.has(resourceId)) {
      await (supabase.from("library_bookmarks") as any).delete().eq("profile_id", profileId).eq("resource_id", resourceId);
      setBookmarks((prev) => { const n = new Set(prev); n.delete(resourceId); return n; });
    } else {
      await (supabase.from("library_bookmarks") as any).insert({ profile_id: profileId, resource_id: resourceId });
      setBookmarks((prev) => new Set(prev).add(resourceId));
    }
  };

  const trackDownload = (r: Resource) => {
    supabase.rpc("increment_library_download", { p_resource_id: r.id } as any);
    setResources((prev) => prev.map((x) => x.id === r.id ? { ...x, download_count: x.download_count + 1 } : x));
  };

  const upload = async () => {
    if (!fTitle.trim() || !fSubject.trim() || !fFile) return;
    setUploading(true);
    setUploadError(null);
    setUploadPct(0);
    try {
      const { fileUrl } = await uploadToR2(fFile, "library-resource", { level: fLevel, subject: fSubject.trim() }, setUploadPct);
      await (supabase.from("library_resources") as any).insert({
        title: fTitle.trim(), description: fDesc.trim() || null, subject: fSubject.trim(),
        level: fLevel, topic: fTopic.trim() || null, resource_type: fType,
        file_url: fileUrl, file_name: fFile.name, uploaded_by: profileId,
      });
      setFTitle(""); setFDesc(""); setFSubject(""); setFTopic(""); setFFile(null);
      setShowUpload(false);
      load();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    }
    setUploading(false);
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return resources.filter((r) => {
      if (level && r.level !== level) return false;
      if (type && r.resource_type !== type) return false;
      if (showBookmarksOnly && !bookmarks.has(r.id)) return false;
      if (q && !`${r.title} ${r.subject} ${r.topic ?? ""}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [resources, query, level, type, showBookmarksOnly, bookmarks]);

  const mostDownloaded = useMemo(() => resources.length > 0 ? Math.max(...resources.map(r => r.download_count)) : 0, [resources]);

  if (loading) return <p style={{ fontSize: 13, color: S.dim }}>Loading library…</p>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap", alignItems: "center" }}>
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by title, subject, topic…" style={{ ...inp, flex: 1, minWidth: 200 }} />
        <select value={level} onChange={(e) => setLevel(e.target.value)} style={inp}>
          <option value="" style={{ background: "#0E1117" }}>All levels</option>
          {LEVELS.map(l => <option key={l.v} value={l.v} style={{ background: "#0E1117" }}>{l.l}</option>)}
        </select>
        <select value={type} onChange={(e) => setType(e.target.value)} style={inp}>
          <option value="" style={{ background: "#0E1117" }}>All types</option>
          {TYPES.map(t => <option key={t.v} value={t.v} style={{ background: "#0E1117" }}>{t.l}</option>)}
        </select>
        <button onClick={() => setShowBookmarksOnly((p) => !p)}
          style={{ padding: "9px 14px", borderRadius: 9, background: showBookmarksOnly ? "rgba(245,166,35,0.15)" : "rgba(255,255,255,0.04)", border: `1px solid ${showBookmarksOnly ? "rgba(245,166,35,0.4)" : S.border}`, color: showBookmarksOnly ? "#F5A623" : S.muted, fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
          ★ Bookmarked
        </button>
        {canUpload && (
          <button onClick={() => setShowUpload((p) => !p)}
            style={{ padding: "9px 16px", borderRadius: 9, background: S.accent, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer" }}>
            + Add Resource
          </button>
        )}
      </div>

      {showUpload && (
        <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: 18, display: "flex", flexDirection: "column", gap: 10 }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <input value={fTitle} onChange={(e) => setFTitle(e.target.value)} placeholder="Title *" style={inp} />
            <input value={fSubject} onChange={(e) => setFSubject(e.target.value)} placeholder="Subject *" style={inp} />
          </div>
          <input value={fDesc} onChange={(e) => setFDesc(e.target.value)} placeholder="Description (optional)" style={inp} />
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <select value={fLevel} onChange={(e) => setFLevel(e.target.value)} style={inp}>
              {LEVELS.map(l => <option key={l.v} value={l.v} style={{ background: "#0E1117" }}>{l.l}</option>)}
            </select>
            <select value={fType} onChange={(e) => setFType(e.target.value)} style={inp}>
              {TYPES.map(t => <option key={t.v} value={t.v} style={{ background: "#0E1117" }}>{t.l}</option>)}
            </select>
            <input value={fTopic} onChange={(e) => setFTopic(e.target.value)} placeholder="Topic (optional)" style={inp} />
          </div>
          <input type="file" onChange={(e) => setFFile(e.target.files?.[0] ?? null)} style={{ fontSize: 12, color: S.muted }} />
          {uploading && <p style={{ fontSize: 12, color: S.accent, margin: 0 }}>Uploading… {uploadPct}%</p>}
          {uploadError && <p style={{ fontSize: 12, color: "#FF6B6B", margin: 0 }}>{uploadError}</p>}
          <button onClick={upload} disabled={uploading || !fTitle.trim() || !fSubject.trim() || !fFile}
            style={{ padding: "9px 16px", borderRadius: 9, background: S.accent, border: "none", color: "#fff", fontSize: 12, fontWeight: 600, cursor: "pointer", alignSelf: "flex-start", opacity: (uploading || !fTitle.trim() || !fSubject.trim() || !fFile) ? 0.5 : 1 }}>
            {uploading ? "Uploading…" : "Upload"}
          </button>
        </div>
      )}

      {filtered.length === 0 ? (
        <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: "40px", textAlign: "center" }}>
          <p style={{ color: S.dim, fontSize: 14 }}>{resources.length === 0 ? "No resources in the library yet." : "No resources match your filters."}</p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: 12 }}>
          {filtered.map((r) => {
            const isNew = Date.now() - new Date(r.created_at).getTime() < NEW_WINDOW_MS;
            const isTop = mostDownloaded > 0 && r.download_count === mostDownloaded;
            return (
              <div key={r.id} style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 14, padding: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span style={{ fontSize: 10, color: S.accent, background: "rgba(77,127,255,0.1)", padding: "2px 8px", borderRadius: 20 }}>{TYPES.find(t => t.v === r.resource_type)?.l}</span>
                    <span style={{ fontSize: 10, color: S.muted, background: "rgba(255,255,255,0.05)", padding: "2px 8px", borderRadius: 20 }}>{LEVELS.find(l => l.v === r.level)?.l}</span>
                    {isNew && <span style={{ fontSize: 10, color: "#00E5A3", background: "rgba(0,229,163,0.1)", padding: "2px 8px", borderRadius: 20 }}>New</span>}
                    {isTop && <span style={{ fontSize: 10, color: "#F5A623", background: "rgba(245,166,35,0.1)", padding: "2px 8px", borderRadius: 20 }}>🔥 Popular</span>}
                  </div>
                  <button onClick={() => toggleBookmark(r.id)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 16, color: bookmarks.has(r.id) ? "#F5A623" : S.dim, flexShrink: 0 }}>
                    {bookmarks.has(r.id) ? "★" : "☆"}
                  </button>
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: S.text, margin: 0 }}>{r.title}</p>
                <p style={{ fontSize: 11, color: S.dim, margin: 0 }}>{r.subject}{r.topic ? ` · ${r.topic}` : ""}</p>
                {r.description && <p style={{ fontSize: 12, color: S.muted, margin: 0, lineHeight: 1.4 }}>{r.description}</p>}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 4 }}>
                  <span style={{ fontSize: 10, color: S.dim }}>{r.download_count} download{r.download_count !== 1 ? "s" : ""}</span>
                  <FileActions fileUrl={r.file_url} onView={() => trackDownload(r)} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
