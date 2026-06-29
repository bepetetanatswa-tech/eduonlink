import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vavhimi Online Academy | Zimbabwe's Future Learns Here",
  description:
    "VOA — Zimbabwe's first modern digital learning platform built for the ZIMSEC Heritage-Based Curriculum. O-Level, A-Level, Primary & AI-powered tutoring. Learn smarter, achieve more.",
  keywords: [
    "ZIMSEC",
    "Zimbabwe education",
    "Heritage-Based Curriculum",
    "HBC",
    "O-Level",
    "A-Level",
    "online learning Zimbabwe",
    "Vavhimi Online Academy",
    "VOA",
  ],
  openGraph: {
    title: "Vavhimi Online Academy | Zimbabwe's Future Learns Here",
    description:
      "The ZIMSEC Heritage-Based Curriculum, reimagined for the digital age. Personalized learning, live classes, and AI tutoring — built for Zimbabwean students.",
    type: "website",
    locale: "en_ZW",
  },
  themeColor: "#0A0F1E",
  viewport: "width=device-width, initial-scale=1",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Sora:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased bg-voa-navy text-white min-h-screen">
        {children}
      </body>
    </html>
  );
}
