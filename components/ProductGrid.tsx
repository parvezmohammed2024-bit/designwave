"use client";

import { useState } from "react";
import ProductCard from "./ProductCard";
import QuickAdd from "./QuickAdd";
import type { Product } from "@/lib/catalog";

export default function ProductGrid({ products }: { products: Product[] }) {
  const [quickAdd, setQuickAdd] = useState<Product | null>(null);

  return (
    <>
      <div className="mt-10 grid grid-cols-2 gap-5 md:grid-cols-3 lg:grid-cols-4 lg:gap-8">
        {products.map((p, i) => (
          <ProductCard
            key={p.slug}
            item={p}
            priority={i < 4}
            onOrder={setQuickAdd}
          />
        ))}
        <div className="flex aspect-[5/7] flex-col items-center justify-center rounded-xl border-2 border-dashed border-ink/25 p-6 text-center">
          <p className="bangla-safe text-lg font-bold">নিজের ডিজাইন আছে?</p>
          <p className="mt-2 text-sm leading-bangla text-ink/60">
            আপনার আইডিয়া পাঠান, আমরা ছাপব।
          </p>
          <a
            href="/order?collection=custom"
            className="mt-4 rounded-full bg-brand-700 px-5 py-2.5 text-sm font-semibold text-paper transition-colors hover:bg-ink"
          >
            কথা বলুন
          </a>
        </div>
      </div>
      <QuickAdd product={quickAdd} onClose={() => setQuickAdd(null)} />
    </>
  );
}
