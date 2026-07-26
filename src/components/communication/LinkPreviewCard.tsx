"use client";

import { useEffect, useState } from "react";

const previewCache = new Map<string, { title: string; image: string | null; description: string | null; url: string } | null>();

export function extractFirstUrl(text: string): string | null {
  const match = text.match(/https?:\/\/[^\s]+/i);
  return match ? match[0] : null;
}

export function LinkPreviewCard({ url }: { url: string }) {
  const [data, setData] = useState<{ title: string; image: string | null; description: string | null; url: string } | null | undefined>(
    previewCache.get(url)
  );

  useEffect(() => {
    if (previewCache.has(url)) return;
    let cancelled = false;
    fetch(`/api/link-preview?url=${encodeURIComponent(url)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (cancelled) return;
        previewCache.set(url, d);
        setData(d);
      })
      .catch(() => { if (!cancelled) { previewCache.set(url, null); setData(null); } });
    return () => { cancelled = true; };
  }, [url]);

  if (data === null) return null;
  if (!data) return null; // still loading — don't show a placeholder that pushes layout around

  return (
    <a href={data.url} target="_blank" rel="noreferrer" style={{ display: "block", marginTop: 6, borderRadius: 10, overflow: "hidden", border: "1px solid rgba(28,38,32,0.1)", textDecoration: "none", background: "rgba(28,38,32,0.03)", maxWidth: 260 }}>
      {data.image && <img src={data.image} alt="" style={{ width: "100%", maxHeight: 130, objectFit: "cover", display: "block" }} />}
      <div style={{ padding: "8px 10px" }}>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#1C2620", margin: "0 0 2px", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>{data.title}</p>
        <p style={{ fontSize: 10, color: "#6E7A6C", margin: 0 }}>{new URL(data.url).hostname}</p>
      </div>
    </a>
  );
}
