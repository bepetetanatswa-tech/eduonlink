import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#07080C",
          borderRadius: "38px",
        }}
      >
        <svg viewBox="0 0 80 80" width="130" height="130">
          {/* Left page */}
          <polygon points="5,8 33,14 38,68 7,62"   fill="#1A3575" />
          {/* Right page */}
          <polygon points="47,14 75,8 73,62 42,68"  fill="#4D7FFF" />
          {/* Gold spine tip */}
          <polygon points="38,68 40,74 42,68 40,63" fill="#F5A623" />
          {/* Ruled lines — left */}
          <line x1="10" y1="24" x2="30" y2="27" stroke="rgba(255,255,255,0.20)" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="9"  y1="33" x2="30" y2="36" stroke="rgba(255,255,255,0.15)" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="9"  y1="42" x2="29" y2="45" stroke="rgba(255,255,255,0.11)" strokeWidth="1.4" strokeLinecap="round" />
          {/* Ruled lines — right */}
          <line x1="50" y1="27" x2="70" y2="24" stroke="rgba(255,255,255,0.26)" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="50" y1="36" x2="71" y2="33" stroke="rgba(255,255,255,0.20)" strokeWidth="1.4" strokeLinecap="round" />
          <line x1="51" y1="45" x2="71" y2="42" stroke="rgba(255,255,255,0.15)" strokeWidth="1.4" strokeLinecap="round" />
          {/* Gold star */}
          <polygon
            points="40,2.5 41.5,6.9 46.2,7.0 42.5,9.8 43.8,14.3 40,11.6 36.2,14.3 37.5,9.8 33.8,7.0 38.5,6.9"
            fill="#FFD166"
          />
        </svg>
      </div>
    ),
    { ...size }
  );
}
