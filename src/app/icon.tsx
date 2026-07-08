import { ImageResponse } from "next/og";

export const dynamic = "force-dynamic";
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
        {/* Matches the pencil + 3D "E" mark in src/components/logo/VoaLogoMark.tsx */}
        <svg viewBox="0 0 80 80" width="30" height="30">
          <defs>
            <linearGradient id="gl" x1="34" y1="10" x2="70" y2="70" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#0D1E4A" />
              <stop offset="100%" stopColor="#1A3575" />
            </linearGradient>
            <linearGradient id="gr" x1="34" y1="10" x2="70" y2="70" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#5B8EFF" />
              <stop offset="100%" stopColor="#2855D0" />
            </linearGradient>
            <linearGradient id="gsp" x1="10" y1="20" x2="24" y2="20" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#F5A623" />
              <stop offset="100%" stopColor="#CC7D12" />
            </linearGradient>
            <linearGradient id="gst" x1="10" y1="20" x2="24" y2="20" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#FFE08A" />
              <stop offset="100%" stopColor="#F5A623" />
            </linearGradient>
          </defs>
          <g transform="rotate(-28 17 46)">
            <rect x="13" y="18" width="8" height="9" rx="2.5" fill="url(#gst)" />
            <rect x="13" y="26" width="8" height="4" fill="#C7CDDA" />
            <rect x="13" y="29" width="8" height="35" fill="url(#gsp)" />
            <polygon points="13,64 21,64 17,75" fill="#E8C89A" />
            <polygon points="15.3,69 18.7,69 17,75" fill="url(#gl)" />
          </g>
          <g>
            <rect x="38.5" y="14.5" width="11" height="60" rx="2" fill="url(#gl)" />
            <rect x="38.5" y="14.5" width="35" height="11" rx="2" fill="url(#gl)" />
            <rect x="38.5" y="39" width="27" height="11" rx="2" fill="url(#gl)" />
            <rect x="38.5" y="63.5" width="35" height="11" rx="2" fill="url(#gl)" />
            <rect x="34.5" y="10.5" width="11" height="60" rx="2" fill="url(#gr)" />
            <rect x="34.5" y="10.5" width="35" height="11" rx="2" fill="url(#gr)" />
            <rect x="34.5" y="35" width="27" height="11" rx="2" fill="url(#gr)" />
            <rect x="34.5" y="59.5" width="35" height="11" rx="2" fill="url(#gr)" />
          </g>
        </svg>
      </div>
    ),
    { ...size }
  );
}
