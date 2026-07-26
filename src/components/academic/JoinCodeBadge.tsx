"use client";

import { useState } from "react";

export function JoinCodeBadge({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  const S = { border: "rgba(28,38,32,0.07)", accent: "#B1502B" };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard permission denied — code is still visible to copy manually
    }
  };

  return (
    <button
      onClick={copy}
      title="Copy join code"
      style={{
        display: "flex", alignItems: "center", gap: 8, padding: "6px 12px", borderRadius: 8,
        background: `${S.accent}10`, border: `1px solid ${S.accent}30`, color: S.accent,
        cursor: "pointer", fontSize: 12, fontWeight: 600,
      }}
    >
      <span style={{ letterSpacing: "0.1em" }}>{code}</span>
      <span style={{ fontSize: 11, opacity: 0.8 }}>{copied ? "Copied ✓" : "Copy"}</span>
    </button>
  );
}
