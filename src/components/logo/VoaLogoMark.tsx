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
      aria-label="VOA"
    >
      <defs>
        {/* Left page — deep navy shadow */}
        <linearGradient id={gL} x1="5" y1="8" x2="38" y2="68" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#0D1E4A" />
          <stop offset="100%" stopColor="#1A3575" />
        </linearGradient>
        {/* Right page — cobalt lit face */}
        <linearGradient id={gR} x1="75" y1="8" x2="42" y2="68" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#5B8EFF" />
          <stop offset="100%" stopColor="#2855D0" />
        </linearGradient>
        {/* Gold spine */}
        <linearGradient id={gSp} x1="40" y1="64" x2="40" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#F5A623" />
          <stop offset="100%" stopColor="#CC7D12" />
        </linearGradient>
        {/* Gold star */}
        <linearGradient id={gSt} x1="40" y1="2" x2="40" y2="15" gradientUnits="userSpaceOnUse">
          <stop offset="0%"   stopColor="#FFE08A" />
          <stop offset="100%" stopColor="#F5A623" />
        </linearGradient>
      </defs>

      {/* Left page of open book */}
      <polygon points="5,8 33,14 38,68 7,62" fill={`url(#${gL})`} />

      {/* Right page of open book */}
      <polygon points="47,14 75,8 73,62 42,68" fill={`url(#${gR})`} />

      {/* Gold spine tip — book binding point */}
      <polygon points="38,68 40,74 42,68 40,63" fill={`url(#${gSp})`} />

      {/* Ruled lines — left page (knowledge/text) */}
      <line x1="10" y1="24" x2="30" y2="27" stroke="rgba(255,255,255,0.22)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="9"  y1="33" x2="30" y2="36" stroke="rgba(255,255,255,0.17)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="9"  y1="42" x2="29" y2="45" stroke="rgba(255,255,255,0.13)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="8"  y1="51" x2="28" y2="54" stroke="rgba(255,255,255,0.09)" strokeWidth="1.4" strokeLinecap="round" />

      {/* Ruled lines — right page */}
      <line x1="50" y1="27" x2="70" y2="24" stroke="rgba(255,255,255,0.28)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="50" y1="36" x2="71" y2="33" stroke="rgba(255,255,255,0.22)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="51" y1="45" x2="71" y2="42" stroke="rgba(255,255,255,0.17)" strokeWidth="1.4" strokeLinecap="round" />
      <line x1="52" y1="54" x2="72" y2="51" stroke="rgba(255,255,255,0.12)" strokeWidth="1.4" strokeLinecap="round" />

      {/* Inner crease — spine shadow line */}
      <line x1="33" y1="14" x2="38" y2="68" stroke="rgba(255,255,255,0.13)" strokeWidth="0.8" />
      <line x1="47" y1="14" x2="42" y2="68" stroke="rgba(255,255,255,0.08)" strokeWidth="0.8" />

      {/* Gold academic star — sits in the gap above the book spine */}
      <polygon
        points="40,2.5 41.5,6.9 46.2,7.0 42.5,9.8 43.8,14.3 40,11.6 36.2,14.3 37.5,9.8 33.8,7.0 38.5,6.9"
        fill={`url(#${gSt})`}
      />
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
