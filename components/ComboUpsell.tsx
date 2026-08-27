"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Combo } from "@/lib/combos";
import { matchingCombos } from "@/lib/combos";
import { formatPoisha } from "@/lib/pricing";
import { toBanglaDigits } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useToast } from "@/lib/toast";

/**
 * Highlighted band (never a popup) offering the combo upgrade.
 * Shown only when the shopper's quantity AND tier equal the combo's
 * component — otherwise the saving quoted would not be like-for-like.
 */
export default function ComboUpsell({
  combos,
  productSlug,
  quantity,
  tierId,
  /** replaces the matching product line in the cart instead of just linking */
  swapFromCart = false,
}: {
  combos: Combo[];
  productSlug: string;
  quantity: number;
  tierId: string | null;
  swapFromCart?: boolean;
}) {
  const matches = matchingCombos(combos, productSlug, quantity, tierId);
  const add = useCart((s) => s.add);
  const remove = useCart((s) => s.remove);
  const lines = useCart((s) => s.lines);
  const show = useToast((s) => s.show);
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  if (!matches.length) return null;
  const { combo, others } = matches[0];

  const extras = others
    .map((o) => `${toBanglaDigits(o.quantity)} পিস ${o.name_bn}`)
    .join(" ও ");

  const upgrade = async () => {
    setBusy(true);
    // drop the standalone line this combo replaces
    const victim = lines.find(
      (l) => l.kind === "product" && l.slug === productSlug && l.quantity === quantity
    );
    if (victim) remove(victim.key);
    add({
      kind: "combo",
      slug: combo.slug,
      name: combo.name_bn,
      image: combo.items.find((i) => i.image)?.image ?? null,
      tierId: null,
      tierName: null,
      quantity: 1,
      unitPrice: combo.combo_price,
      regularValue: combo.regularValue,
      components: combo.items.map((i) => ({
        name: i.name_bn,
        tierName: i.tierName,
        quantity: i.quantity,
        value: i.value,
        spec: i.spec_bn,
      })),
      moq: 1,
      step: 1,
      slabs: [],
      addons: [],
    });
    setBusy(false);
    show(`${combo.name_bn}-তে আপগ্রেড হয়েছে`);
    router.refresh();
  };

  return (
    <motion.aside
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="mt-4 rounded-2xl border-2 border-brand-700/40 bg-brand-50 p-4"
    >
      <p className="bangla-safe font-bold leading-bangla text-brand-700">
        আর {extras} যোগ করে {formatPoisha(combo.savings)} বাঁচান
      </p>
      <p className="mt-1 text-sm leading-bangla text-ink/70">
        {combo.name_bn} — <s className="text-ink/45">{formatPoisha(combo.regularValue)}</s>{" "}
        <strong className="text-brand-700">{formatPoisha(combo.combo_price)}</strong>
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {swapFromCart ? (
          <button
            type="button"
            onClick={upgrade}
            disabled={busy}
            className="min-h-[44px] rounded-full bg-ink px-5 text-sm font-bold text-paper hover:bg-brand-700 disabled:opacity-60"
          >
            {busy ? "আপগ্রেড হচ্ছে…" : "কম্বোতে আপগ্রেড করুন"}
          </button>
        ) : (
          <Link
            href={`/combos/${combo.slug}`}
            className="inline-flex min-h-[44px] items-center rounded-full bg-ink px-5 text-sm font-bold text-paper hover:bg-brand-700"
          >
            কম্বো দেখুন
          </Link>
        )}
      </div>
    </motion.aside>
  );
}
