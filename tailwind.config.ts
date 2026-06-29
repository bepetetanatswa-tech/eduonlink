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
        background: "var(--background)",
        foreground: "var(--foreground)",
        voa: {
          navy: "#0A0F1E",
          "navy-dark": "#060B14",
          "navy-mid": "#0D1526",
          "navy-light": "#1A2744",
          "navy-border": "#1E2D50",
          blue: "#00D4FF",
          "blue-dim": "#0099CC",
          "blue-glow": "#00D4FF33",
          gold: "#FFD700",
          "gold-dim": "#B8960C",
          "gold-glow": "#FFD70033",
          "gold-light": "#FFF3A0",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["Sora", "Inter", "system-ui", "sans-serif"],
      },
      animation: {
        "float-slow": "floatSlow 8s ease-in-out infinite",
        "float-med": "floatMed 6s ease-in-out infinite",
        "float-fast": "floatFast 4s ease-in-out infinite",
        "pulse-glow": "pulseGlow 3s ease-in-out infinite",
        "spin-slow": "spin 20s linear infinite",
        "text-shimmer": "textShimmer 3s linear infinite",
        "gradient-shift": "gradientShift 8s ease infinite",
        "slide-up": "slideUp 0.6s ease forwards",
        "fade-in": "fadeIn 0.8s ease forwards",
        "scale-in": "scaleIn 0.5s ease forwards",
        "border-dance": "borderDance 4s linear infinite",
      },
      keyframes: {
        floatSlow: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-20px) rotate(5deg)" },
        },
        floatMed: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-14px) rotate(-5deg)" },
        },
        floatFast: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
        pulseGlow: {
          "0%, 100%": { opacity: "0.4", transform: "scale(1)" },
          "50%": { opacity: "1", transform: "scale(1.05)" },
        },
        textShimmer: {
          "0%": { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition: "200% center" },
        },
        gradientShift: {
          "0%, 100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(30px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        scaleIn: {
          "0%": { opacity: "0", transform: "scale(0.9)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        borderDance: {
          "0%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
          "100%": { backgroundPosition: "0% 50%" },
        },
      },
      backgroundImage: {
        "voa-gradient": "linear-gradient(135deg, #0A0F1E 0%, #0D1526 50%, #1A2744 100%)",
        "hero-radial": "radial-gradient(ellipse at 50% 0%, rgba(0,212,255,0.15) 0%, transparent 60%)",
        "gold-shimmer": "linear-gradient(90deg, #B8960C, #FFD700, #FFF3A0, #FFD700, #B8960C)",
        "blue-shimmer": "linear-gradient(90deg, #0099CC, #00D4FF, #66E5FF, #00D4FF, #0099CC)",
        "glass-fill": "linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)",
        "card-shine": "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)",
      },
      boxShadow: {
        "blue-glow": "0 0 30px rgba(0, 212, 255, 0.3), 0 0 60px rgba(0, 212, 255, 0.1)",
        "gold-glow": "0 0 30px rgba(255, 215, 0, 0.3), 0 0 60px rgba(255, 215, 0, 0.1)",
        "glass": "0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.1)",
        "card": "0 20px 60px rgba(0, 0, 0, 0.4)",
        "inner-blue": "inset 0 1px 0 rgba(0, 212, 255, 0.2)",
      },
    },
  },
  plugins: [],
};

export default config;
