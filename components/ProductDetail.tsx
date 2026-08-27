"use client";

import Link from "next/link";
import { useState } from "react";
import { defaultTier, imagesFor, slabsFor, type Product } from "@/lib/catalog";
import { formatPoisha, minOrderValue } from "@/lib/pricing";
import { toBanglaDigits } from "@/lib/format";
import ProductGallery from "./ProductGallery";
import TierSelector from "./TierSelector";
import QuantityPricer from "./QuantityPricer";
import SetCurrentProduct from "./SetCurrentProduct";
import { PHONE_BN, waLink } from "@/lib/site";

/**
 * Client shell for the product page — the tier choice drives the gallery,
 * the slab table and the live total together, with no page jump.
 */
export default function ProductDetail({ product }: { product: Product }) {
  const [tierId, setTierId] = useState<string | null>(
    defaultTier(product)?.id ?? null
  );
  const tier = product.tiers.find((t) => t.id === tierId) ?? null;
  const images = imagesFor(product, tierId);
  const fromPrice = formatPoisha(
    minOrderValue(slabsFor(product, tierId), product.moq, product.base_unit_price)
  );

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 pb-14 pt-28">
      <SetCurrentProduct name={product.name_bn} />

      <nav aria-label="ব্রেডক্রাম্ব" className="text-sm text-ink/60">
        <Link href="/collections" className="hover:text-brand-700">
          কালেকশন
        </Link>{" "}
        / <span>{product.name_bn}</span>
      </nav>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className="md:sticky md:top-24 md:self-start">
          <ProductGallery
            images={images}
            name={product.name_bn}
            blur={product.blur_data_url}
          />
        </div>

        <div>
          <h1 className="bangla-safe text-3xl font-bold md:text-4xl">
            {product.name_bn}
          </h1>
          <p className="mt-2 leading-bangla text-ink/70">{product.tagline_bn}</p>
          <p className="mt-4 text-xl font-bold text-brand-700">
            {fromPrice} থেকে{" "}
            <span className="text-base font-normal text-ink/60">
              ({toBanglaDigits(product.moq)} পিস)
            </span>
          </p>

          {product.tiers.length > 1 && (
            <div className="mt-6">
              <TierSelector
                tiers={product.tiers}
                selectedId={tierId}
                onSelect={setTierId}
                baseUnitPrice={product.base_unit_price}
              />
            </div>
          )}

          <div className="mt-6 rounded-2xl border border-ink/10 bg-paper p-5 shadow-sm">
            <QuantityPricer product={product} tier={tier} />
          </div>

          <div className="mt-6 space-y-2 text-sm leading-bangla text-ink/70">
            <p>• ডিজাইন চূড়ান্ত না হলে আমরা করে দেব (ডিজাইন চার্জ প্রযোজ্য)</p>
            <p>• চট্টগ্রাম সিটিতে ও সারা দেশে ডেলিভারি</p>
          </div>

          <a
            href={waLink(`আসসালামু আলাইকুম! আমি "${product.name_bn}" নিয়ে জানতে চাই।`)}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-brand-700 underline underline-offset-4 hover:text-ink"
          >
            প্রশ্ন আছে? হোয়াটসঅ্যাপে জিজ্ঞেস করুন — {PHONE_BN}
          </a>
        </div>
      </div>
    </main>
  );
}
