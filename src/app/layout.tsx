import type { Metadata } from "next";
import "./globals.css";

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
    <html lang="en">
      <body style={{ background: '#0f0f0f', color: '#f5f5f5', margin: 0 }}>
        {children}
      </body>
    </html>
  );
}
