import dynamic from "next/dynamic";
import Hero from "@/components/Hero";
import { getCombos } from "@/lib/combos";
import {
  DEFAULT_CATEGORIES,
  getBannerSlides,
  getFeaturedProducts,
  getProducts,
  getSetting,
  type CategoryTile,
  type TrustStat,
} from "@/lib/catalog";

const CollectionsDeck = dynamic(() => import("@/components/CollectionsDeck"));
const ComboBand = dynamic(() => import("@/components/ComboBand"));
const FinishShowcase = dynamic(() => import("@/components/FinishShowcase"));
const GalleryMarquee = dynamic(() => import("@/components/GalleryMarquee"));
const TrustStrip = dynamic(() => import("@/components/TrustStrip"));
const HowItWorks = dynamic(() => import("@/components/HowItWorks"));
const SeasonalBanner = dynamic(() => import("@/components/SeasonalBanner"));
const CraftStrip = dynamic(() => import("@/components/CraftStrip"));

export const revalidate = 60;

export default async function HomePage() {
  const [products, featured, slides, categories, stats, homepage, combos] =
    await Promise.all([
      getProducts(),
      getFeaturedProducts(),
      getBannerSlides(),
      getSetting<CategoryTile[]>("categories", DEFAULT_CATEGORIES),
      getSetting<TrustStat[]>("trust_stats", []),
      getSetting<{ banner_rotation_ms: number }>("homepage", {
        banner_rotation_ms: 6000,
      }),
      getCombos(),
    ]);

  return (
    <main>
      <Hero />
      <CollectionsDeck
        products={products}
        featured={featured}
        categories={categories}
      />
      <ComboBand combos={combos} />
      <FinishShowcase />
      <GalleryMarquee products={products} />
      <TrustStrip stats={stats} />
      <SeasonalBanner
        slides={slides}
        rotationMs={homepage.banner_rotation_ms ?? 6000}
      />
      <HowItWorks />
      <CraftStrip />
    </main>
  );
}
