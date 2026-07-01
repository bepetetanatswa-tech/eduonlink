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
          {/* Left page */}
          <polygon points="5,8 33,14 38,68 7,62"   fill="#1A3575" />
          {/* Right page */}
          <polygon points="47,14 75,8 73,62 42,68"  fill="#4D7FFF" />
          {/* Gold spine tip */}
          <polygon points="38,68 40,74 42,68 40,63" fill="#F5A623" />
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
