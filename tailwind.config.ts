import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        voa: {
          // Obsidian backgrounds
          void:    "#07080C",
          black:   "#0B0C13",
          surface: "#0F1018",
          raised:  "#14151F",
          // Borders
          line:    "#1C1D2A",
          "line-bright": "#282939",
          // Primary — electric cobalt (NEW — not standard blue)
          cobalt:  "#4D7FFF",
          "cobalt-dim":  "#3560D4",
          "cobalt-glow": "rgba(77,127,255,0.18)",
          "cobalt-soft": "rgba(77,127,255,0.08)",
          // Secondary — warm amber (NEW — not yellow gold)
          amber:   "#F5A623",
          "amber-dim":  "#C47D0E",
          "amber-glow": "rgba(245,166,35,0.18)",
          "amber-soft": "rgba(245,166,35,0.08)",
          // AI accent — electric mint (for Gemini/Sir Taks)
          mint:    "#00E5A3",
          "mint-dim":   "#00B882",
          "mint-glow":  "rgba(0,229,163,0.18)",
          "mint-soft":  "rgba(0,229,163,0.08)",
          // Text
          "text-1": "#FFFFFF",
          "text-2": "#8892B0",
          "text-3": "#4A5170",
        },
      },
      fontFamily: {
        sans:    ["DM Sans",      "system-ui", "sans-serif"],
        display: ["Space Grotesk","DM Sans",   "system-ui", "sans-serif"],
        mono:    ["JetBrains Mono","Fira Code", "monospace"],
      },
      animation: {
        "mesh-drift":   "meshDrift 20s ease-in-out infinite",
        "text-in":      "textIn 0.8s cubic-bezier(0.16,1,0.3,1) forwards",
        "fade-up":      "fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) forwards",
        "marquee":      "marquee 40s linear infinite",
        "marquee-rev":  "marqueeReverse 40s linear infinite",
        "border-spin":  "borderSpin 4s linear infinite",
        "glow-pulse":   "glowPulse 3s ease-in-out infinite",
        "float-a":      "floatA 7s ease-in-out infinite",
        "float-b":      "floatB 9s ease-in-out infinite",
        "shimmer":      "shimmer 2.5s linear infinite",
        "cursor-ring":  "cursorRing 0.3s ease-out forwards",
        "expand":       "expand 0.6s cubic-bezier(0.16,1,0.3,1) forwards",
      },
      keyframes: {
        meshDrift: {
          "0%,100%": { backgroundPosition: "0% 0%, 100% 100%, 50% 50%" },
          "33%":     { backgroundPosition: "100% 0%, 0% 100%, 50% 0%" },
          "66%":     { backgroundPosition: "50% 100%, 50% 0%, 100% 50%" },
        },
        textIn: {
          "0%": { opacity:"0", transform:"translateY(24px) skewY(2deg)" },
          "100%": { opacity:"1", transform:"translateY(0) skewY(0deg)" },
        },
        fadeUp: {
          "0%": { opacity:"0", transform:"translateY(20px)" },
          "100%": { opacity:"1", transform:"translateY(0)" },
        },
        marquee: {
          "0%":   { transform:"translateX(0)" },
          "100%": { transform:"translateX(-50%)" },
        },
        marqueeReverse: {
          "0%":   { transform:"translateX(-50%)" },
          "100%": { transform:"translateX(0)" },
        },
        borderSpin: {
          "0%":   { backgroundPosition:"0% 50%" },
          "50%":  { backgroundPosition:"100% 50%" },
          "100%": { backgroundPosition:"0% 50%" },
        },
        glowPulse: {
          "0%,100%": { opacity:"0.5", transform:"scale(1)" },
          "50%":     { opacity:"1",   transform:"scale(1.06)" },
        },
        floatA: {
          "0%,100%": { transform:"translateY(0) rotate(0deg)" },
          "50%":     { transform:"translateY(-18px) rotate(3deg)" },
        },
        floatB: {
          "0%,100%": { transform:"translateY(0) rotate(0deg)" },
          "50%":     { transform:"translateY(-12px) rotate(-4deg)" },
        },
        shimmer: {
          "0%":   { backgroundPosition:"-200% center" },
          "100%": { backgroundPosition:"200% center" },
        },
        cursorRing: {
          "0%":   { transform:"scale(0)", opacity:"1" },
          "100%": { transform:"scale(2.5)", opacity:"0" },
        },
        expand: {
          "0%":   { opacity:"0", transform:"scale(0.92)" },
          "100%": { opacity:"1", transform:"scale(1)" },
        },
      },
      backgroundImage: {
        "mesh-gradient": `
          radial-gradient(at 15% 40%, rgba(77,127,255,0.12) 0%, transparent 55%),
          radial-gradient(at 85% 15%, rgba(245,166,35,0.07) 0%, transparent 50%),
          radial-gradient(at 60% 85%, rgba(0,229,163,0.06) 0%, transparent 50%)
        `,
        "cobalt-shimmer": "linear-gradient(90deg, #3560D4, #4D7FFF, #90ABFF, #4D7FFF, #3560D4)",
        "amber-shimmer":  "linear-gradient(90deg, #C47D0E, #F5A623, #FFD689, #F5A623, #C47D0E)",
        "bento-shine":    "linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.01) 100%)",
        "card-border":    "linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))",
        "cta-gradient":   "linear-gradient(135deg, #0F1018, #14151F)",
      },
      boxShadow: {
        "cobalt": "0 0 40px rgba(77,127,255,0.25), 0 0 80px rgba(77,127,255,0.1)",
        "amber":  "0 0 40px rgba(245,166,35,0.25), 0 0 80px rgba(245,166,35,0.1)",
        "mint":   "0 0 40px rgba(0,229,163,0.25), 0 0 80px rgba(0,229,163,0.1)",
        "bento":  "0 1px 0 rgba(255,255,255,0.06) inset, 0 20px 60px rgba(0,0,0,0.5)",
        "card":   "0 0 0 1px rgba(255,255,255,0.06), 0 16px 48px rgba(0,0,0,0.4)",
      },
    },
  },
  plugins: [],
};

export default config;
