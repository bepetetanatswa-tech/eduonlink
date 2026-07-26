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
        edu: {
          ink:   "#1C2620",
          paper: "#F2EEE3",
          slate: {
            50:  "#F2EEE3",
            100: "#E3E2D4",
            200: "#CCD0C0",
            300: "#AEB5A6",
            400: "#8D9689",
            500: "#6E7A6C",
            600: "#566257",
            700: "#3E4A41",
            800: "#2B352E",
            900: "#1C2620",
          },
          copper: {
            DEFAULT: "#B1502B",
            dark:    "#8F4022",
            50:  "rgba(177,80,43,0.05)",
            100: "rgba(177,80,43,0.10)",
            200: "rgba(177,80,43,0.18)",
            300: "rgba(177,80,43,0.32)",
          },
          gold: {
            DEFAULT: "#A9873F",
            dark:    "#8A6D2F",
            50:  "rgba(169,135,63,0.05)",
            100: "rgba(169,135,63,0.10)",
            200: "rgba(169,135,63,0.18)",
            300: "rgba(169,135,63,0.32)",
          },
          clay: {
            DEFAULT: "#A3311E",
            dark:    "#821F10",
            100: "rgba(163,49,30,0.08)",
            200: "rgba(163,49,30,0.20)",
          },
          bottle: {
            DEFAULT: "#1F4738",
            dark:    "#153328",
            100: "rgba(31,71,56,0.08)",
            200: "rgba(31,71,56,0.20)",
          },
        },
      },
      fontFamily: {
        sans:    ["var(--font-body)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      borderRadius: {
        sm: "2px",
        DEFAULT: "4px",
        md: "4px",
        lg: "4px",
      },
      animation: {
        "chalk-in": "chalkIn 0.7s cubic-bezier(0.16,1,0.3,1) forwards",
      },
      keyframes: {
        chalkIn: {
          "0%":   { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      boxShadow: {
        elevated: "0 8px 24px rgba(28,38,32,0.14)",
      },
    },
  },
  plugins: [],
};

export default config;
