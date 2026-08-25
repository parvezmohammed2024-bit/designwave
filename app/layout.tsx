import type { Metadata, Viewport } from "next";
import { Hind_Siliguri } from "next/font/google";
import "./globals.css";
import SmoothScroll from "@/components/SmoothScroll";
import CustomCursor from "@/components/CustomCursor";
import GrainShift from "@/components/GrainShift";
import CartDrawer from "@/components/CartDrawer";
import Toaster from "@/components/Toaster";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

// Self-hosted by next/font at build time: subset, preloaded, no CDN request.
// Three weights, not four — each Bengali weight is ~39KB and the 500
// weight isn't worth its bytes on a 4G budget.
const hindSiliguri = Hind_Siliguri({
  weight: ["400", "600", "700"],
  subsets: ["bengali", "latin"],
  display: "swap",
  variable: "--font-bangla",
});

export const metadata: Metadata = {
  // Set NEXT_PUBLIC_SITE_URL in the deploy env so OG images resolve absolutely.
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://designwave.com"
  ),
  title: "Design Wave — কাস্টম কার্ড ও প্রিন্ট স্টুডিও",
  description:
    "বিয়ে, ঈদ, জন্মদিন কিংবা বিজনেস — আপনার গল্প আমরা ছাপি কাগজে। কাস্টম ডিজাইন, ফয়েল ও ডাই-কাট ফিনিশিং, সারা দেশে ডেলিভারি।",
  openGraph: {
    title: "Design Wave — কাস্টম কার্ড ও প্রিন্ট স্টুডিও",
    description:
      "কাস্টম ডিজাইন, ফয়েল ও ডাই-কাট ফিনিশিং, সারা দেশে ডেলিভারি।",
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

export const viewport: Viewport = {
  themeColor: "#F7F4ED",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="bn" className="grain">
      {/* className (not just variable) so next/font emits the preload links */}
      <body className={`${hindSiliguri.className} ${hindSiliguri.variable} font-bangla`}>
        <SmoothScroll>
          <CustomCursor />
          <GrainShift />
          <Header />
          {children}
          <Footer />
          <CartDrawer />
          <Toaster />
          <WhatsAppFloat />
        </SmoothScroll>
      </body>
    </html>
  );
}
