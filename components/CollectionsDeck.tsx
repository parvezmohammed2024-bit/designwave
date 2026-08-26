"use client";

import { motion, useScroll, useTransform, MotionValue } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import CardFace from "./CardFace";
import type { CategoryTile, Product } from "@/lib/catalog";
import { toBanglaDigits } from "@/lib/format";
import { useMotionPrefs } from "@/lib/useMotionPrefs";
import { RevealWords, Rise } from "./Reveal";

/**
 * Pinned deck-fan on desktop, then the category grid on every breakpoint.
 * Teaser copy is benefit-led — prices live in the shop grid and cart.
 */
export default function CollectionsDeck({
  products,
  featured,
  categories,
}: {
  products: Product[];
  featured: Product[];
  categories: CategoryTile[];
}) {
  const { full } = useMotionPrefs();
  const deck = featured.length ? featured : products.slice(0, 5);

  return (
    <section className="bg-paper py-12 md:py-0" aria-labelledby="collections-title">
      {full && deck.length > 0 && <DesktopDeck deck={deck} />}

      <div className="mx-auto max-w-6xl px-5 md:py-14">
        <div className="md:hidden">
          <RevealWords
            as="h2"
            id="collections-title"
            text="আমাদের কালেকশন"
            className="bangla-safe text-3xl font-bold"
          />
          <p className="mt-2 leading-bangla text-ink/70">
            ছয়টি ঘরানা, প্রতিটিতে অগুনতি কাস্টম সম্ভাবনা।
          </p>
        </div>
        <div className="hidden md:block">
          <h2 className="bangla-safe text-4xl font-bold">
            {full ? "ছয়টি ঘরানা, এক স্টুডিও" : "আমাদের কালেকশন"}
          </h2>
          <p className="mt-2 leading-bangla text-ink/70">
            যে উপলক্ষই হোক — ডিজাইন থেকে ডেলিভারি, সব এক জায়গায়।
          </p>
        </div>

        <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-3 md:gap-6">
          {categories.map((cat, i) => {
            const inCat = products.filter((p) => p.category_slug === cat.slug);
            const cover = inCat[0];
            if (!cover) return null;
            return (
              <Rise key={cat.slug} delay={i * 0.06}>
                <Link
                  href="/collections"
                  className="group block overflow-hidden rounded-2xl border border-ink/10 bg-paper shadow-sm transition-shadow hover:shadow-xl"
                >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <CardFace
                      image={cover.image}
                      blur={cover.blur_data_url}
                      hue={cover.hue}
                      name={cover.name_bn}
                      sizes="(max-width: 768px) 50vw, 33vw"
                      className="h-full w-full transition-transform duration-500 ease-paper group-hover:scale-105"
                    />
                    <span className="absolute right-2 top-2 rounded-full bg-paper/90 px-2.5 py-1 text-xs font-bold text-ink">
                      {toBanglaDigits(inCat.length)}টি ডিজাইন
                    </span>
                  </div>
                  <div className="p-4">
                    <h3 className="bangla-safe font-bold group-hover:text-brand-700">
                      {cat.name_bn}
                    </h3>
                    <p className="mt-1 text-sm leading-bangla text-ink/60">
                      {cat.detail_bn}
                    </p>
                  </div>
                </Link>
              </Rise>
            );
          })}
        </div>

        <Rise className="mt-8 text-center" delay={0.1}>
          <Link
            href="/collections"
            className="inline-block rounded-full bg-ink px-7 py-3 font-semibold text-paper transition-colors hover:bg-brand-700"
          >
            সব {toBanglaDigits(products.length)}টি ডিজাইন দেখুন
          </Link>
        </Rise>
      </div>
    </section>
  );
}

function DesktopDeck({ deck }: { deck: Product[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.9", "end 0.35"],
  });

  return (
    <div ref={ref} className="relative hidden h-[150vh] md:block">
      <div className="sticky top-0 flex h-[85vh] flex-col items-center justify-center overflow-hidden">
        <h2 className="bangla-safe pointer-events-none text-4xl font-bold lg:text-5xl">
          আমাদের কালেকশন
        </h2>
        <p className="mt-2 leading-bangla text-ink/70">
          স্ক্রল করুন — তাস মেলার মতো খুলে যাবে ডেক।
        </p>
        <div className="relative mt-10 h-[320px] w-full max-w-4xl">
          {deck.map((c, i) => (
            <DealtCard
              key={c.slug}
              index={i}
              count={deck.length}
              progress={scrollYProgress}
              item={c}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function DealtCard({
  index,
  count,
  progress,
  item,
}: {
  index: number;
  count: number;
  progress: MotionValue<number>;
  item: Product;
}) {
  const mid = (count - 1) / 2;
  const offset = index - mid;
  const end = Math.min(0.9, 0.35 + index * 0.12);

  const x = useTransform(progress, [0.05, end], [0, offset * 168]);
  const y = useTransform(progress, [0.05, end], [0, Math.abs(offset) * 26]);
  const rotate = useTransform(progress, [0.05, end], [offset * 1.5, offset * 11]);

  return (
    <motion.div
      className="absolute left-1/2 top-0 w-[190px]"
      style={{ x, y, rotate, zIndex: index, transformOrigin: "50% 120%" }}
    >
      <Link href={`/collections/${item.slug}`} className="group block">
        <div className="-ml-[95px] transition-transform duration-300 ease-paper group-hover:-translate-y-3">
          <CardFace
            image={item.image}
            blur={item.blur_data_url}
            hue={item.hue}
            name={item.name_bn}
            sizes="190px"
            className="aspect-[5/7] w-[190px] rounded-xl shadow-[0_24px_50px_-28px_rgba(17,17,17,0.6)]"
          />
          <p className="bangla-safe mt-2 text-center text-sm font-semibold">
            {item.name_bn}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
