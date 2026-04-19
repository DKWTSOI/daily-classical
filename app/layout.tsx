import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Goldberg Variations",
  description: "Bach's Goldberg Variations, BWV 988",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
