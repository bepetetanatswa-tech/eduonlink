"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const btnBase: React.CSSProperties = {
 display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8,
 fontSize: 11, fontWeight: 600, textDecoration: "none", cursor: "pointer", flexShrink: 0, border: "none", background: "none",
};

export function FileActions({ fileUrl, accentColor = "#B1502B", onView }: { fileUrl: string; accentColor?: string; onView?: () => void }) {
 const router = useRouter();
 const [blocked, setBlocked] = useState<string | null>(null);
 const [downloading, setDownloading] = useState(false);

 const handleDownload = async () => {
 onView?.();
 setDownloading(true);
 setBlocked(null);
 try {
 const res = await fetch(`${fileUrl}?download=1`);
 const data = await res.json().catch(() => null);
 if (!res.ok) {
 setBlocked(data?.error ?? "Could not download this file.");
 return;
 }
 if (data?.url) window.open(data.url, "_blank", "noopener,noreferrer");
 } catch {
 setBlocked("Could not download this file. Please try again.");
 } finally {
 setDownloading(false);
 }
 };

 return (
 <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
 <div style={{ display: "flex", gap: 6 }}>
 <a href={fileUrl} target="_blank" rel="noopener noreferrer" onClick={onView}
 style={{ ...btnBase, background: `${accentColor}10`, border: `1px solid ${accentColor}20`, color: accentColor }}>
 View
 </a>
 <button onClick={handleDownload} disabled={downloading}
 style={{ ...btnBase, background: "rgba(31,71,56,0.08)", border: "1px solid rgba(31,71,56,0.2)", color: "#1F4738", opacity: downloading ? 0.6 : 1 }}>
 {downloading ? "…" : "Download"}
 </button>
 </div>
 {blocked && (
 <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 11, color: "#A9873F" }}>
 <span>{blocked}</span>
 <button onClick={() => router.push("/student/dashboard/subscription")}
 style={{ background: "none", border: "none", color: "#A9873F", textDecoration: "underline", cursor: "pointer", fontSize: 11, padding: 0 }}>
 Upgrade
 </button>
 </div>
 )}
 </div>
 );
}
