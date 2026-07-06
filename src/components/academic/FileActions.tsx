const btnBase: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: 5, padding: "6px 12px", borderRadius: 8,
  fontSize: 11, fontWeight: 600, textDecoration: "none", cursor: "pointer", flexShrink: 0,
};

export function FileActions({ fileUrl, accentColor = "#4D7FFF", onView }: { fileUrl: string; accentColor?: string; onView?: () => void }) {
  return (
    <div style={{ display: "flex", gap: 6 }}>
      <a href={fileUrl} target="_blank" rel="noopener noreferrer" onClick={onView}
        style={{ ...btnBase, background: `${accentColor}10`, border: `1px solid ${accentColor}20`, color: accentColor }}>
        👁 View
      </a>
      <a href={`${fileUrl}?download=1`} onClick={onView}
        style={{ ...btnBase, background: "rgba(0,229,163,0.08)", border: "1px solid rgba(0,229,163,0.2)", color: "#00E5A3" }}>
        ⬇ Download
      </a>
    </div>
  );
}
