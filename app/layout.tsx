import type { Metadata } from "next";
import { Inter, Inter_Tight, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const interTight = Inter_Tight({
  subsets: ["latin"],
  variable: "--font-inter-tight",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Attuned.today",
  description: "One piece of classical music, every day. AI-curated with bilingual context (EN / 繁中).",
  metadataBase: new URL("https://attuned.today"),
  openGraph: {
    title: "Attuned.today",
    description: "One piece of classical music, every day. AI-curated with bilingual context (EN / 繁中).",
    url: "https://attuned.today",
    siteName: "Attuned.today",
    images: [{ url: "https://attuned.today/opengraph-image", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Attuned.today",
    description: "One piece of classical music, every day. AI-curated with bilingual context (EN / 繁中).",
    images: ["https://attuned.today/opengraph-image"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${interTight.variable} ${jetbrainsMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
