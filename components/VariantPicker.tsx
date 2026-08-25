"use client";

import { useState } from "react";
import { LAMINATION_OPTIONS, type Collection } from "@/lib/products";
import { formatTaka, toBanglaDigits } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useToast } from "@/lib/toast";

/**
 * Variant selection (required before add): quantity tier + lamination
 * where offered. Used inline on the product page and inside QuickAdd.
 */
export default function VariantPicker({
  product,
  onAdded,
}: {
  product: Collection;
  onAdded?: () => void;
}) {
  const [tierIdx, setTierIdx] = useState<number | null>(null);
  const [lam, setLam] = useState<string | null>(null);
  const [error, setError] = useState("");
  const add = useCart((s) => s.add);
  const openDrawer = useCart((s) => s.openDrawer);
  const show = useToast((s) => s.show);

  const needsLam = !!product.lamination;
  const tier = tierIdx === null ? null : product.quantityTiers[tierIdx];

  const submit = () => {
    if (tierIdx === null) return setError("পরিমাণ বাছাই করুন");
    if (needsLam && !lam) return setError("ল্যামিনেশন বাছাই করুন");
    setError("");
    add({
      slug: product.slug,
      tierQty: product.quantityTiers[tierIdx].qty,
      unitPrice: product.quantityTiers[tierIdx].price,
      lamination: needsLam ? lam! : undefined,
    });
    show(`${product.name} কার্টে যোগ হয়েছে`);
    openDrawer();
    onAdded?.();
  };

  const chip = (active: boolean) =>
    `rounded-full border px-4 py-2 text-sm font-semibold transition-colors min-h-[44px] ${
      active
        ? "border-brand-700 bg-brand-700 text-paper"
        : "border-ink/20 bg-paper text-ink hover:border-brand-700"
    }`;

  return (
    <div>
      <p className="font-semibold">পরিমাণ</p>
      <div className="mt-2 flex flex-wrap gap-2">
        {product.quantityTiers.map((t, i) => (
          <button
            key={t.qty}
            type="button"
            className={chip(tierIdx === i)}
            onClick={() => setTierIdx(i)}
            aria-pressed={tierIdx === i}
          >
            {toBanglaDigits(t.qty)} পিস · {formatTaka(t.price)}
          </button>
        ))}
      </div>

      {needsLam && (
        <>
          <p className="mt-4 font-semibold">ল্যামিনেশন</p>
          <div className="mt-2 flex gap-2">
            {LAMINATION_OPTIONS.map((o) => (
              <button
                key={o}
                type="button"
                className={chip(lam === o)}
                onClick={() => setLam(o)}
                aria-pressed={lam === o}
              >
                {o}
              </button>
            ))}
          </div>
        </>
      )}

      {error && <p className="mt-3 text-sm text-[#B3261E]">{error}</p>}

      <div className="mt-5 flex items-center justify-between gap-4">
        <p className="text-lg font-bold text-brand-700">
          {tier ? formatTaka(tier.price) : `${formatTaka(product.priceFrom)} থেকে`}
        </p>
        <button
          type="button"
          onClick={submit}
          className="min-h-[48px] rounded-full bg-ink px-6 py-2.5 font-semibold text-paper transition-colors hover:bg-brand-700"
        >
          কার্টে যোগ করুন
        </button>
      </div>
    </div>
  );
}
