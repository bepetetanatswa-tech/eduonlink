import type { Metadata } from "next";
import "./globals.css";
import { IdleLogout } from "@/components/auth/IdleLogout";

export const metadata: Metadata = {
  title: "EduOnLink — The Intelligence Behind Zimbabwe's Education",
  description:
    "EduOnLink: AI-powered learning for every ZIMSEC level. Sir Taks AI tutor, HBC project blueprints, live classes and exam prep — built from the ground up for Zimbabwe.",
  keywords: ["ZIMSEC", "Zimbabwe education", "Heritage-Based Curriculum", "HBC", "AI tutor", "Sir Taks", "EduOnLink", "O-Level", "A-Level"],
  openGraph: {
    title: "EduOnLink — The Intelligence Behind Zimbabwe's Education",
    description: "Sir Taks AI tutor + ZIMSEC curriculum + live classes. Premium. Global. Built for Zimbabwe.",
    type: "website",
    locale: "en_ZW",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;500;600;700&family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#4D7FFF" />
      </head>
      <body className="antialiased">
        <IdleLogout />
        {children}
      </body>
    </html>
  );
}
