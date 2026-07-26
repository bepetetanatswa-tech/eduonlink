import type { Metadata } from "next";
import { Fraunces, Public_Sans } from "next/font/google";
import "./globals.css";
import { IdleLogout } from "@/components/auth/IdleLogout";
import { NativeBridge } from "@/components/capacitor/NativeBridge";
import { ToastProvider } from "@/components/ui/ToastProvider";
import { ConfirmProvider } from "@/components/ui/ConfirmProvider";

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700", "900"],
  style: ["normal", "italic"],
  display: "swap",
});

const publicSans = Public_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EduOnLink — ZIMSEC learning for every Zimbabwean student",
  description:
    "EduOnLink is a ZIMSEC-aligned learning platform built for Zimbabwean students, from ECD through A-Level. Sir Taks marks your work, guides your HBC project, and gets you exam-ready.",
  keywords: ["ZIMSEC", "Zimbabwe education", "Heritage-Based Curriculum", "HBC", "AI tutor", "Sir Taks", "EduOnLink", "O-Level", "A-Level"],
  openGraph: {
    title: "EduOnLink — ZIMSEC learning for every Zimbabwean student",
    description: "Sir Taks AI tutor, the full ZIMSEC curriculum, live classes and HBC project support — built for Zimbabwe.",
    type: "website",
    locale: "en_ZW",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${publicSans.variable}`}>
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#F2EEE3" />
      </head>
      <body className="antialiased font-sans">
        <NativeBridge />
        <IdleLogout />
        <ConfirmProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </ConfirmProvider>
      </body>
    </html>
  );
}
