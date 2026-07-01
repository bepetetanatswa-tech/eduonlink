"use client";

import { useId } from "react";

interface MarkProps {
  size?: number;
  className?: string;
}

export function VoaLogoMark({ size = 40, className }: MarkProps) {
  const uid = useId();
  const l = `${uid}l`;
  const r = `${uid}r`;
  const t = `${uid}t`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 80 80"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="VOA"
    >
      <defs>
        <linearGradient id={l} x1="6" y1="6" x2="32" y2="74" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0D1E4A" />
          <stop offset="100%" stopColor="#1E3D8A" />
        </linearGradient>
        <linearGradient id={r} x1="74" y1="6" x2="48" y2="74" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4D7FFF" />
          <stop offset="100%" stopColor="#80AAFF" />
        </linearGradient>
        <linearGradient id={t} x1="40" y1="64" x2="40" y2="74" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#F5A623" />
          <stop offset="100%" stopColor="#CC7D12" />
        </linearGradient>
      </defs>

      {/* Left arm — shadow face */}
      <polygon points="6,6 26,6 40,64 32,74" fill={`url(#${l})`} />

      {/* Right arm — lit face */}
      <polygon points="54,6 74,6 48,74 40,64" fill={`url(#${r})`} />

      {/* Gold tip */}
      <polygon points="32,74 40,64 48,74" fill={`url(#${t})`} />

      {/* Crystal highlight — inner V crease */}
      <line x1="26" y1="6" x2="40" y2="64" stroke="rgba(255,255,255,0.20)" strokeWidth="0.8" />
      <line x1="40" y1="64" x2="54" y2="6" stroke="rgba(255,255,255,0.10)" strokeWidth="0.8" />
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
          VOA
        </span>
        <span
          className="font-mono uppercase tracking-[0.15em]"
          style={{ fontSize: size * 0.175, color: "#4A5170" }}
        >
          Vavhimi
        </span>
      </span>
    </span>
  );
}
