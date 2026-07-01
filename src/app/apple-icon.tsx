import { ImageResponse } from "next/og";

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
          <polygon points="6,6 26,6 40,64 32,74" fill="#1E3D8A" />
          <polygon points="54,6 74,6 48,74 40,64" fill="#4D7FFF" />
          <polygon points="32,74 40,64 48,74" fill="#F5A623" />
          <line x1="26" y1="6" x2="40" y2="64" stroke="rgba(255,255,255,0.18)" strokeWidth="0.8" />
          <line x1="40" y1="64" x2="54" y2="6" stroke="rgba(255,255,255,0.10)" strokeWidth="0.8" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
