import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Attuned.today",
  description: "A classical piece worth discovering, every day.",
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
