import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
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
        }}
      >
        <svg viewBox="0 0 80 80" width="28" height="28">
          <polygon points="6,6 26,6 40,64 32,74" fill="#1E3D8A" />
          <polygon points="54,6 74,6 48,74 40,64" fill="#4D7FFF" />
          <polygon points="32,74 40,64 48,74" fill="#F5A623" />
        </svg>
      </div>
    ),
    { ...size }
  );
}
