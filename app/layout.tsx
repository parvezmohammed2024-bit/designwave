import type { Metadata, Viewport } from "next";
import { Hind_Siliguri } from "next/font/google";
import "./globals.css";

// Self-hosted by next/font at build time: subset, preloaded, no CDN request.
// Three weights, not four — each Bengali weight is ~39KB.
const hindSiliguri = Hind_Siliguri({
  weight: ["400", "600", "700"],
  subsets: ["bengali", "latin"],
  display: "swap",
  variable: "--font-bangla",
});

export const metadata: Metadata = {
  // Prefer an explicit canonical domain; otherwise fall back to the Vercel
  // deployment URL rather than a domain that may not exist.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_PROJECT_PRODUCTION_URL
        ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
        : "http://localhost:3100")
  ),
  title: "Design Wave — কাস্টম কার্ড ও প্রিন্ট স্টুডিও",
  description:
    "বিয়ে, ঈদ, জন্মদিন কিংবা বিজনেস — আপনার গল্প আমরা ছাপি কাগজে। কাস্টম ডিজাইন, ফয়েল ও ডাই-কাট ফিনিশিং, সারা দেশে ডেলিভারি।",
  openGraph: {
    title: "Design Wave — কাস্টম কার্ড ও প্রিন্ট স্টুডিও",
    description: "কাস্টম ডিজাইন, ফয়েল ও ডাই-কাট ফিনিশিং, সারা দেশে ডেলিভারি।",
    siteName: "Design Wave",
    locale: "bn_BD",
    type: "website",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Design Wave" }],
  },
  icons: {
    icon: [
      { url: "/logo.svg", type: "image/svg+xml" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/favicon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/apple-icon.png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = { themeColor: "#F7F4ED" };

/**
 * Root layout holds only <html>/<body> and the font. The storefront chrome
 * (header, footer, cart, cursor, grain) lives in app/(site)/layout.tsx so
 * that /admin renders without it.
 */
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bn">
      <body className={`${hindSiliguri.className} ${hindSiliguri.variable} font-bangla`}>
        {children}
      </body>
    </html>
  );
}
