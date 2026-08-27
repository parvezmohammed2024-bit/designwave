"use client";

import { animate, motion, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Combo } from "@/lib/combos";
import { timeRemaining } from "@/lib/combos";
import { formatPoisha } from "@/lib/pricing";
import { toBanglaDigits } from "@/lib/format";
import { useCart } from "@/lib/cart";
import { useToast } from "@/lib/toast";
import { waLink } from "@/lib/site";
import ProductGallery from "./ProductGallery";
import SetCurrentProduct from "./SetCurrentProduct";

const EASE = [0.22, 1, 0.36, 1] as const;

/** Counts up to a poisha figure — makes the components visibly add up. */
function CountUp({ to, className }: { to: number; className?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, {
      duration: 1,
      ease: EASE,
      onUpdate: (x) => setV(Math.round(x)),
    });
    return () => c.stop();
  }, [inView, to]);
  return (
    <span ref={ref} className={className}>
      {formatPoisha(v)}
    </span>
  );
}

export default function ComboDetail({
  combo,
  related,
  deliveryInside,
  deliveryOutside,
  designCharge,
  whatsapp,
}: {
  combo: Combo;
  related: Combo[];
  deliveryInside: number;
  deliveryOutside: number;
  designCharge: number;
  whatsapp: string;
}) {
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const add = useCart((s) => s.add);
  const openDrawer = useCart((s) => s.openDrawer);
  const show = useToast((s) => s.show);

  const countdown = timeRemaining(combo.valid_until);
  const hasSaving = combo.savings > 0;
  // The client advertises a headline "regular value" from the poster that is
  // higher than what the live slab prices add up to. When that override is in
  // play the per-component figures would visibly fail to sum to the headline,
  // so we show what is included without pricing each piece.
  const valueIsOverridden =
    combo.overrideValue !== null && combo.overrideValue !== combo.derivedValue;

  const galleryImages = combo.images.length
    ? combo.images.map((im, i) => ({
        id: `combo-${i}`,
        url: im.url,
        alt_bn: im.alt_bn ?? combo.name_bn,
        sort_order: i,
        is_primary: i === 0,
        tier_id: null,
      }))
    : combo.items
        .filter((i) => i.image)
        .map((i, idx) => ({
          id: i.id,
          url: i.image!,
          alt_bn: i.name_bn,
          sort_order: idx,
          is_primary: idx === 0,
          tier_id: null,
        }));

  const addCombo = async () => {
    setBusy(true);
    await new Promise((r) => setTimeout(r, 260));
    add({
      kind: "combo",
      slug: combo.slug,
      name: combo.name_bn,
      image: galleryImages[0]?.url ?? null,
      tierId: null,
      tierName: null,
      quantity: qty,
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
    show(`${combo.name_bn} কার্টে যোগ হয়েছে`);
    openDrawer();
  };

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-5 pb-14 pt-28">
      <SetCurrentProduct name={combo.name_bn} />

      <nav aria-label="ব্রেডক্রাম্ব" className="text-sm text-ink/60">
        <Link href="/collections" className="hover:text-brand-700">
          কালেকশন
        </Link>{" "}
        / <span>{combo.name_bn}</span>
      </nav>

      <div className="mt-6 grid gap-10 md:grid-cols-2">
        <div className="md:sticky md:top-24 md:self-start">
          <ProductGallery images={galleryImages} name={combo.name_bn} />
        </div>

        <div>
          {combo.badge_text_bn && (
            <span className="inline-block rounded-full bg-brand-700 px-3 py-1 text-xs font-bold text-paper">
              {combo.badge_text_bn}
            </span>
          )}
          <h1 className="bangla-safe mt-3 text-3xl font-bold md:text-4xl">
            {combo.name_bn}
          </h1>
          {combo.tagline_bn && (
            <p className="mt-2 leading-bangla text-ink/70">{combo.tagline_bn}</p>
          )}

          {/* price block — the discount is the product */}
          <div className="mt-5 rounded-2xl border-2 border-brand-700 bg-brand-50 p-5">
            {hasSaving && (
              <p className="text-lg text-ink/50">
                <s>{formatPoisha(combo.regularValue)}</s>
              </p>
            )}
            <p className="text-4xl font-bold text-brand-700">
              {formatPoisha(combo.combo_price)}
            </p>
            {hasSaving && (
              <motion.p
                initial={{ opacity: 0, scale: 0.9, y: 6 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: 0.15, type: "spring", stiffness: 260, damping: 18 }}
                className="mt-2 inline-block rounded-full bg-ink px-3 py-1 text-sm font-bold text-paper"
              >
                {formatPoisha(combo.savings)} সাশ্রয় ({toBanglaDigits(combo.savingsPct)}% ছাড়)
              </motion.p>
            )}
            {countdown && (
              <p className="mt-3 text-sm font-semibold text-[#B3261E]">
                অফার শেষ হবে {countdown} পরে
              </p>
            )}
          </div>

          {/* quantity — combos are fixed price */}
          <div className="mt-5 flex items-center gap-3">
            <span className="font-semibold">কতটি প্যাকেজ?</span>
            <div className="flex items-center rounded-full border border-ink/20">
              <button
                type="button"
                aria-label="কমান"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="h-11 w-11 rounded-l-full text-lg hover:bg-ink/5"
              >
                −
              </button>
              <span className="w-12 text-center font-semibold">
                {toBanglaDigits(qty)}
              </span>
              <button
                type="button"
                aria-label="বাড়ান"
                onClick={() => setQty((q) => q + 1)}
                className="h-11 w-11 rounded-r-full text-lg hover:bg-ink/5"
              >
                +
              </button>
            </div>
            <span className="ml-auto text-xl font-bold text-brand-700">
              {formatPoisha(combo.combo_price * qty)}
            </span>
          </div>

          <button
            type="button"
            onClick={addCombo}
            disabled={busy}
            className="mt-4 flex min-h-[52px] w-full items-center justify-center gap-2 rounded-full bg-ink text-lg font-semibold text-paper transition-colors hover:bg-brand-700 disabled:opacity-70"
          >
            {busy ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-paper/40 border-t-paper" />
                যোগ হচ্ছে…
              </>
            ) : (
              <>কার্টে যোগ করুন · {formatPoisha(combo.combo_price * qty)}</>
            )}
          </button>

          <a
            href={waLink(
              `আসসালামু আলাইকুম! আমি "${combo.name_bn}" (${formatPoisha(combo.combo_price)}) অর্ডার করতে চাই।`,
              whatsapp
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 block rounded-full bg-[#25D366] py-3 text-center font-bold text-white hover:brightness-95"
          >
            হোয়াটসঅ্যাপে অর্ডার করুন
          </a>

          <div className="mt-5 space-y-1.5 text-sm leading-bangla text-ink/70">
            <p>
              • ডেলিভারি: চট্টগ্রাম সিটিতে {formatPoisha(deliveryInside)}, সারা দেশে{" "}
              {formatPoisha(deliveryOutside)}
            </p>
            <p>
              • {formatPoisha(designCharge)} ডিজাইন চার্জে কম্বোর সব আইটেমের ডিজাইন
              হয়ে যাবে
            </p>
            <p>• ডিজাইন অনুমোদনের পর ৫০% অ্যাডভান্স, বাকিটা ডেলিভারিতে</p>
          </div>
        </div>
      </div>

      {/* what's inside */}
      <section className="mt-12">
        <h2 className="bangla-safe text-2xl font-bold">প্যাকেজে যা যা থাকছে</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          {combo.items.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.45, delay: i * 0.08, ease: EASE }}
              className="flex gap-4 rounded-2xl border border-ink/10 bg-paper p-4"
            >
              <div className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-ink/5">
                {item.image && (
                  <Image
                    src={item.image}
                    alt={item.name_bn}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="bangla-safe font-bold">{item.name_bn}</p>
                {item.tierName && (
                  <span className="mt-0.5 inline-block rounded-full bg-brand-700/10 px-2 py-0.5 text-[11px] font-bold text-brand-700">
                    {item.tierName}
                  </span>
                )}
                {item.spec_bn && (
                  <p className="mt-1 text-sm leading-bangla text-ink/60">
                    {item.spec_bn}
                  </p>
                )}
                <p className="mt-1 font-semibold">
                  {toBanglaDigits(item.quantity)} পিস
                </p>
                {item.value > 0 && !valueIsOverridden && (
                  <p className="text-sm text-ink/60">
                    আলাদা কিনলে {formatPoisha(item.value)}
                  </p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* the sum — this is what makes the deal credible */}
        <div className="mt-5 rounded-2xl bg-ink/[0.04] p-5">
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <span className="font-semibold">আলাদা আলাদা কিনলে মোট</span>
            <CountUp
              to={combo.regularValue}
              className="text-xl font-bold text-ink/70 line-through"
            />
          </div>
          <div className="mt-2 flex flex-wrap items-baseline justify-between gap-2 border-t border-ink/10 pt-2">
            <span className="font-bold">কম্বো মূল্য</span>
            <span className="text-2xl font-bold text-brand-700">
              {formatPoisha(combo.combo_price)}
            </span>
          </div>
          {hasSaving && (
            <p className="mt-2 text-right font-bold text-brand-700">
              আপনি বাঁচাচ্ছেন {formatPoisha(combo.savings)}
            </p>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="bangla-safe text-2xl font-bold">আরও কম্বো</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((c) => (
              <Link
                key={c.id}
                href={`/combos/${c.slug}`}
                className="rounded-2xl border border-ink/10 p-4 transition-shadow hover:shadow-lg"
              >
                <p className="bangla-safe font-bold">{c.name_bn}</p>
                <p className="mt-1">
                  {c.savings > 0 && (
                    <s className="mr-2 text-ink/40">{formatPoisha(c.regularValue)}</s>
                  )}
                  <span className="text-lg font-bold text-brand-700">
                    {formatPoisha(c.combo_price)}
                  </span>
                </p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
