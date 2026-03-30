import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Muistiapuri",
  description: "Henkilökohtainen muistiinpano- ja muistutussovellus",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fi">
      <body>{children}</body>
    </html>
  );
}
