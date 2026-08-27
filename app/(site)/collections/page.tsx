import type { Metadata } from "next";
import ProductGrid from "@/components/ProductGrid";
import { getProducts } from "@/lib/catalog";
import { getCombos } from "@/lib/combos";

export const metadata: Metadata = {
  title: "কালেকশন — Design Wave",
  description:
    "বিয়ে, ঈদ, জন্মদিন, বিজনেস — সব ঘরানার কাস্টম কার্ড এক জায়গায়।",
};

/** Admin edits appear within a minute without a redeploy. */
export const revalidate = 60;

export default async function CollectionsPage() {
  const [products, combos] = await Promise.all([getProducts(), getCombos()]);

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-5 pb-14 pt-28">
      <h1 className="bangla-safe text-4xl font-bold md:text-5xl">কালেকশন</h1>
      <p className="mt-3 max-w-lg leading-bangla text-ink/70">
        কার্ডের উপর কার্সর রাখুন (বা ট্যাপ করুন) — উল্টে দেখুন পেছনের গল্প।
        প্রতিটি ডিজাইনই আপনার মতো করে বদলে নেওয়া যায়।
      </p>
      <ProductGrid products={products} combos={combos} />
    </main>
  );
}
