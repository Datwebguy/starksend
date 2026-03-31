// src/app/layout.tsx
// ============================================================
// StarkSend – Root Layout
// ============================================================

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "StarkSend — 1-Click Crypto Tipping on Starknet",
  description:
    "Accept crypto tips anywhere, gasless. STRK, ETH, USDC — zero gas fees, zero commissions. Built on Starknet.",
  icons: {
    icon: "/favicon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "StarkSend — 1-Click Crypto Tipping on Starknet",
    description:
      "Accept crypto tips anywhere, gasless. STRK, ETH, USDC — zero gas fees, zero commissions. Built on Starknet.",
    images: [{ url: "/api/og", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "StarkSend — 1-Click Crypto Tipping on Starknet",
    description:
      "Accept crypto tips anywhere, gasless. Zero fees, zero commissions.",
    images: ["/api/og"],
    creator: "@Datweb3guy",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
