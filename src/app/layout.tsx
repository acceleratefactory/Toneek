import type { Metadata } from "next";
import { Jost, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";
import HashAuthHandler from "@/components/HashAuthHandler";

const jost = Jost({
  subsets: ["latin"],
  variable: "--font-jost",
});

const mono = IBM_Plex_Mono({
  weight: ["400", "500", "600"],
  subsets: ["latin"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Toneek — Skin intelligence for melanin-rich skin",
  description: "Personalised skincare formulas for melanin-rich skin, matched to your climate, skin type, and concern.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${jost.variable} ${mono.variable}`}>
      <body className="font-sans antialiased bg-stone-50 text-stone-900 m-0">
        {/* Handles magic links with access_token in URL hash — redirects to /dashboard */}
        <HashAuthHandler />
        {children}
      </body>
    </html>
  );
}
