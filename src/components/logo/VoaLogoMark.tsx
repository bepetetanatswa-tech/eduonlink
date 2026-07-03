"use client";

import { useId } from "react";

interface MarkProps {
  size?: number;
  className?: string;
}

export function VoaLogoMark({ size = 40, className }: MarkProps) {
  const uid = useId();
  const gL  = `${uid}gl`;
  const gR  = `${uid}gr`;
  const gSp = `${uid}gsp`;
  const gSt = `${uid}gst`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Educonnect"
    >
      <defs>
        {/* Navy — extrusion shadow face of the E */}
        <linearGradient id={gL} x1="34" y1="10" x2="70" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#0D1E4A" />
          <stop offset="100%" stopColor="#1A3575" />
        </linearGradient>
        {/* Cobalt — front lit face of the E */}
        <linearGradient id={gR} x1="34" y1="10" x2="70" y2="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#5B8EFF" />
          <stop offset="100%" stopColor="#2855D0" />
        </linearGradient>
        {/* Gold — pencil body */}
        <linearGradient id={gSp} x1="10" y1="20" x2="24" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#F5A623" />
          <stop offset="100%" stopColor="#CC7D12" />
        </linearGradient>
        {/* Light gold — pencil eraser */}
        <linearGradient id={gSt} x1="10" y1="20" x2="24" y2="20" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#FFE08A" />
          <stop offset="100%" stopColor="#F5A623" />
        </linearGradient>
      </defs>

      {/* Left side: school materials — a tilted pencil */}
      <g transform="rotate(-28 17 46)">
        <rect x="13" y="18" width="8" height="9" rx="2.5" fill={`url(#${gSt})`} />
        <rect x="13" y="26" width="8" height="4" fill="#C7CDDA" />
        <rect x="13" y="29" width="8" height="35" fill={`url(#${gSp})`} />
        <polygon points="13,64 21,64 17,75" fill="#E8C89A" />
        <polygon points="15.3,69 18.7,69 17,75" fill={`url(#${gL})`} />
      </g>

      {/* Big block "E" — extruded 3D look via offset shadow + lit front face */}
      <g>
        {/* shadow layer, offset down-right */}
        <rect x="38.5" y="14.5" width="11" height="60" rx="2" fill={`url(#${gL})`} />
        <rect x="38.5" y="14.5" width="35" height="11" rx="2" fill={`url(#${gL})`} />
        <rect x="38.5" y="39"   width="27" height="11" rx="2" fill={`url(#${gL})`} />
        <rect x="38.5" y="63.5" width="35" height="11" rx="2" fill={`url(#${gL})`} />

        {/* front lit face */}
        <rect x="34.5" y="10.5" width="11" height="60" rx="2" fill={`url(#${gR})`} />
        <rect x="34.5" y="10.5" width="35" height="11" rx="2" fill={`url(#${gR})`} />
        <rect x="34.5" y="35"   width="27" height="11" rx="2" fill={`url(#${gR})`} />
        <rect x="34.5" y="59.5" width="35" height="11" rx="2" fill={`url(#${gR})`} />

        {/* highlight edge along the top-left of the front face */}
        <line x1="35.5" y1="11.5" x2="68.5" y2="11.5" stroke="rgba(255,255,255,0.35)" strokeWidth="1" strokeLinecap="round" />
        <line x1="35.5" y1="11.5" x2="35.5" y2="69.5" stroke="rgba(255,255,255,0.25)" strokeWidth="1" strokeLinecap="round" />
      </g>
    </svg>
  );
}

export function VoaLogoFull({ size = 40, className }: MarkProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className ?? ""}`}>
      <VoaLogoMark size={size} />
      <span className="flex flex-col leading-none">
        <span
          className="font-display font-bold tracking-tight text-white"
          style={{ fontSize: size * 0.4 }}
        >
          Educonnect
        </span>
        <span
          className="font-mono uppercase tracking-[0.15em]"
          style={{ fontSize: size * 0.175, color: "#4A5170" }}
        >
          Vavhimi Threads
        </span>
      </span>
    </span>
  );
}
