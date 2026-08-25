import dynamic from "next/dynamic";
import Hero from "@/components/Hero";

// Below-the-fold sections are lazy-loaded; the hero owns the LCP budget.
const CollectionsDeck = dynamic(() => import("@/components/CollectionsDeck"));
const FinishShowcase = dynamic(() => import("@/components/FinishShowcase"));
const GalleryMarquee = dynamic(() => import("@/components/GalleryMarquee"));
const TrustStrip = dynamic(() => import("@/components/TrustStrip"));
const HowItWorks = dynamic(() => import("@/components/HowItWorks"));
const SeasonalBanner = dynamic(() => import("@/components/SeasonalBanner"));
const CraftStrip = dynamic(() => import("@/components/CraftStrip"));

export default function HomePage() {
  return (
    <main>
      <Hero />
      <CollectionsDeck />
      <FinishShowcase />
      <GalleryMarquee />
      <TrustStrip />
      <SeasonalBanner />
      <HowItWorks />
      <CraftStrip />
    </main>
  );
}
