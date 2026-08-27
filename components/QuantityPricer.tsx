"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import type { Product, ProductTier } from "@/lib/catalog";
import { slabsFor } from "@/lib/catalog";
import {
  formatPoisha,
  formatUnitPoisha,
  nextSlabNudge,
  normaliseQty,
  priceFor,
  slabLabel,
  type Addon,
} from "@/lib/pricing";
import { toBanglaDigits } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useToast } from "@/lib/toast";

/**
 * Quantity stepper + live slab pricing for the selected tier.
 * Used full-size on the product page and compact inside the quick-order modal.
 */
export default function QuantityPricer({
  product,
  tier,
  compact = false,
  onAdded,
}: {
  product: Product;
  /** null when the product has no tiers */
  tier: ProductTier | null;
  compact?: boolean;
  onAdded?: () => void;
}) {
  const reduced = useReducedMotion();
  const [qty, setQty] = useState(product.moq);
  const [raw, setRaw] = useState(String(product.moq));
  const [chosen, setChosen] = useState<Addon[]>([]);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const add = useCart((s) => s.add);
  const openDrawer = useCart((s) => s.openDrawer);
  const show = useToast((s) => s.show);

  const slabs = useMemo(
    () => slabsFor(product, tier?.id ?? null),
    [product, tier?.id]
  );

  const breakdown = useMemo(
    () => priceFor(slabs, qty, chosen, product.base_unit_price),
    [slabs, product.base_unit_price, qty, chosen]
  );
  const nudge = useMemo(
    () => nextSlabNudge(slabs, qty, 10, product.step_quantity),
    [slabs, qty, product.step_quantity]
  );

  useEffect(() => setRaw(String(qty)), [qty]);

  // functional update so rapid clicks don't compute from a stale value
  const bump = (dir: 1 | -1) => {
    setQty((q) => {
      const next = q + dir * product.step_quantity;
      if (next < product.moq) {
        setError(`সর্বনিম্ন ${toBanglaDigits(product.moq)} পিস অর্ডার করতে হবে`);
        return q;
      }
      setError("");
      return next;
    });
  };

  const commitRaw = () => {
    const parsed = parseInt(raw.replace(/[^\d]/g, ""), 10);
    if (!Number.isFinite(parsed) || parsed < product.moq) {
      setError(`সর্বনিম্ন ${toBanglaDigits(product.moq)} পিস অর্ডার করতে হবে`);
      setQty(product.moq);
      return;
    }
    setError("");
    setQty(normaliseQty(parsed, product.moq, product.step_quantity));
  };

  const toggleAddon = (a: Addon) =>
    setChosen((c) =>
      c.some((x) => x.name_bn === a.name_bn)
        ? c.filter((x) => x.name_bn !== a.name_bn)
        : [...c, a]
    );

  const submit = async () => {
    if (qty < product.moq) {
      setError(`সর্বনিম্ন ${toBanglaDigits(product.moq)} পিস অর্ডার করতে হবে`);
      return;
    }
    // a tiered product must have a tier picked before it can be added
    if (product.tiers.length > 0 && !tier) {
      setError("প্রথমে মান (নরমাল / প্রিমিয়াম) বাছাই করুন");
      return;
    }
    setBusy(true);
    await new Promise((r) => setTimeout(r, 260));
    add({
      slug: product.slug,
      name: product.name_bn,
      image: product.images[0]?.url ?? product.image,
      tierId: tier?.id ?? null,
      tierName: tier?.name_bn ?? null,
      quantity: qty,
      moq: product.moq,
      step: product.step_quantity,
      slabs,
      addons: chosen,
    });
    setBusy(false);
    show(
      `${product.name_bn}${tier ? ` (${tier.name_bn})` : ""} — ${toBanglaDigits(qty)} পিস কার্টে যোগ হয়েছে`
    );
    openDrawer();
    onAdded?.();
  };

  return (
    <div>
      <label htmlFor={`qty-${product.slug}`} className="mb-1.5 block font-semibold">
        পরিমাণ (পিস)
      </label>
      <div className="flex items-center gap-2">
        <div className="flex items-center rounded-full border border-ink/20">
          <button
            type="button"
            onClick={() => bump(-1)}
            aria-label="পরিমাণ কমান"
            className="h-12 w-12 rounded-l-full text-lg hover:bg-ink/5"
          >
            −
          </button>
          <input
            id={`qty-${product.slug}`}
            type="text"
            inputMode="numeric"
            dir="ltr"
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            onBlur={commitRaw}
            onKeyDown={(e) => e.key === "Enter" && commitRaw()}
            className="w-20 border-x border-ink/15 bg-transparent py-3 text-center text-base font-semibold outline-none"
            aria-describedby={`slab-${product.slug}`}
          />
          <button
            type="button"
            onClick={() => bump(1)}
            aria-label="পরিমাণ বাড়ান"
            className="h-12 w-12 rounded-r-full text-lg hover:bg-ink/5"
          >
            +
          </button>
        </div>
        <p className="text-sm text-ink/55">
          সর্বনিম্ন {toBanglaDigits(product.moq)} · ধাপ{" "}
          {toBanglaDigits(product.step_quantity)}
        </p>
      </div>
      {error && <p className="mt-2 text-sm text-[#B3261E]">{error}</p>}

      {/* live rate + total */}
      <div className="mt-4 rounded-2xl bg-ink/[0.04] p-4">
        <div className="flex items-baseline justify-between">
          <span id={`slab-${product.slug}`} className="text-sm text-ink/70">
            প্রতি পিস{" "}
            <strong className="text-ink">
              {formatUnitPoisha(breakdown.unitPrice)}
            </strong>
            {breakdown.slab && (
              <span className="ml-1 text-ink/50">({slabLabel(breakdown.slab)})</span>
            )}
          </span>
          {tier && (
            <span className="rounded-full bg-brand-700/10 px-2 py-0.5 text-xs font-bold text-brand-700">
              {tier.name_bn}
            </span>
          )}
        </div>
        <motion.p
          key={`${tier?.id ?? "none"}-${breakdown.total}`}
          initial={reduced ? false : { opacity: 0.4, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="mt-1 text-3xl font-bold text-brand-700"
        >
          {formatPoisha(breakdown.total)}
        </motion.p>
        {breakdown.addonTotal > 0 && (
          <p className="mt-1 text-xs text-ink/55">
            কার্ড {formatPoisha(breakdown.baseTotal)} + অ্যাড-অন{" "}
            {formatPoisha(breakdown.addonTotal)}
          </p>
        )}

        {nudge && (
          <motion.button
            type="button"
            onClick={() => setQty(nudge.targetQty)}
            initial={reduced ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 block w-full rounded-xl border border-wave-600/40 bg-wave-50 px-3 py-2 text-left text-sm font-semibold text-wave-700 hover:border-wave-600"
          >
            আরও {toBanglaDigits(nudge.qtyNeeded)} পিস নিলে{" "}
            {formatPoisha(nudge.saving)} বাঁচান →{" "}
            <span className="font-normal">
              {toBanglaDigits(nudge.targetQty)} পিস করুন
            </span>
          </motion.button>
        )}
      </div>

      {/* add-ons */}
      {product.addons.length > 0 && (
        <fieldset className="mt-4">
          <legend className="mb-2 font-semibold">অ্যাড-অন</legend>
          <div className="flex flex-wrap gap-2">
            {product.addons.map((a) => {
              const on = chosen.some((x) => x.name_bn === a.name_bn);
              return (
                <button
                  key={a.name_bn}
                  type="button"
                  onClick={() => toggleAddon(a)}
                  aria-pressed={on}
                  className={`min-h-[44px] rounded-full border px-4 text-sm font-semibold transition-colors ${
                    on
                      ? "border-brand-700 bg-brand-700 text-paper"
                      : "border-ink/20 hover:border-brand-700"
                  }`}
                >
                  {a.name_bn} +{formatPoisha(a.price)}
                  {a.type === "per_unit" && "/পিস"}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* slab table for the active tier */}
      {!compact && slabs.length > 0 && (
        <div className="mt-5">
          <p className="mb-2 font-semibold">
            দামের স্ল্যাব{tier ? ` — ${tier.name_bn}` : ""}
          </p>
          <motion.div
            key={tier?.id ?? "none"}
            initial={reduced ? false : { opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden rounded-xl border border-ink/10"
          >
            <table className="w-full text-sm">
              <thead className="bg-ink/[0.04] text-left">
                <tr>
                  <th className="px-4 py-2 font-semibold">পরিমাণ</th>
                  <th className="px-4 py-2 text-right font-semibold">প্রতি পিস</th>
                </tr>
              </thead>
              <tbody>
                {slabs.map((s) => {
                  const active = breakdown.slab?.min_qty === s.min_qty;
                  return (
                    <tr
                      key={s.min_qty}
                      className={`border-t border-ink/10 ${
                        active ? "bg-brand-50 font-bold text-brand-700" : ""
                      }`}
                    >
                      <td className="px-4 py-2">{slabLabel(s)}</td>
                      <td className="px-4 py-2 text-right">
                        {formatUnitPoisha(s.unit_price)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </motion.div>
        </div>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={busy}
        className="mt-5 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-ink text-lg font-semibold text-paper transition-colors hover:bg-brand-700 disabled:opacity-70"
      >
        {busy ? (
          <>
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper" />
            যোগ হচ্ছে…
          </>
        ) : (
          <>কার্টে যোগ করুন · {formatPoisha(breakdown.total)}</>
        )}
      </button>
    </div>
  );
}
