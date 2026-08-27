"use client";

import { motion } from "framer-motion";
import type { ProductTier } from "@/lib/catalog";
import { formatUnitPoisha, lowestUnitPrice } from "@/lib/pricing";

/**
 * Two side-by-side cards, not a dropdown — the tier choice is a real
 * decision and deserves the space to show what the money buys.
 */
export default function TierSelector({
  tiers,
  selectedId,
  onSelect,
  baseUnitPrice,
  compact = false,
}: {
  tiers: ProductTier[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  baseUnitPrice: number;
  compact?: boolean;
}) {
  if (tiers.length < 2) return null;

  return (
    <div>
      <p className="mb-2 font-semibold">মান বাছাই করুন</p>
      <div className="grid grid-cols-2 gap-2">
        {tiers.map((t) => {
          const on = t.id === selectedId;
          const from = lowestUnitPrice(t.slabs, baseUnitPrice);
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => onSelect(t.id)}
              aria-pressed={on}
              className={`relative rounded-2xl border-2 p-3 text-left transition-colors ${
                on
                  ? "border-brand-700 bg-brand-50"
                  : "border-ink/15 hover:border-brand-700/50"
              }`}
            >
              {on && (
                <span className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-brand-700 text-[11px] font-bold text-paper">
                  ✓
                </span>
              )}
              <span className="bangla-safe block pr-6 font-bold">{t.name_bn}</span>
              {!compact && t.description_bn && (
                <span className="mt-1 block text-xs leading-bangla text-ink/60">
                  {t.description_bn}
                </span>
              )}
              <span className="mt-2 block text-sm font-semibold text-brand-700">
                {formatUnitPoisha(from)} প্রতি পিস থেকে
              </span>
            </button>
          );
        })}
      </div>

      {!compact && (
        <motion.dl
          layout
          className="mt-3 space-y-1 rounded-xl bg-ink/[0.04] p-3 text-xs leading-bangla"
        >
          {tiers.map((t) => (
            <div key={t.id} className="flex gap-2">
              <dt className="shrink-0 font-bold">{t.name_bn}:</dt>
              <dd className="text-ink/70">{t.description_bn ?? "—"}</dd>
            </div>
          ))}
        </motion.dl>
      )}
    </div>
  );
}
