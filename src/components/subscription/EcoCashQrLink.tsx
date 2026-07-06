"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";

const S = { border: "rgba(255,255,255,0.07)", muted: "#8892B0", dim: "#4A5170" };

export function EcoCashQrLink({ ussdLink }: { ussdLink: string }) {
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(ussdLink, { width: 160, margin: 1, color: { dark: "#0E1117", light: "#FFFFFF" } })
      .then((url) => { if (!cancelled) setQrDataUrl(url); })
      .catch(() => { if (!cancelled) setQrDataUrl(null); });
    return () => { cancelled = true; };
  }, [ussdLink]);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 14, background: "rgba(255,255,255,0.02)", border: `1px solid ${S.border}`, borderRadius: 12, padding: 14 }}>
      {qrDataUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qrDataUrl} alt="Scan to pay via EcoCash" width={72} height={72} style={{ borderRadius: 8, flexShrink: 0 }} />
      ) : (
        <div style={{ width: 72, height: 72, borderRadius: 8, background: "rgba(255,255,255,0.04)", flexShrink: 0 }} />
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, color: S.muted, margin: "0 0 6px" }}>On this phone? Tap to open EcoCash with the number and amount pre-filled.</p>
        <a href={ussdLink} style={{ display: "inline-block", padding: "7px 14px", borderRadius: 8, background: "rgba(0,229,163,0.1)", border: "1px solid rgba(0,229,163,0.25)", color: "#00E5A3", fontSize: 12, fontWeight: 600, textDecoration: "none" }}>
          📞 Dial EcoCash
        </a>
        <p style={{ fontSize: 10, color: S.dim, margin: "6px 0 0" }}>Or scan the code from another phone. You&apos;ll still confirm and enter your PIN inside EcoCash itself.</p>
      </div>
    </div>
  );
}
