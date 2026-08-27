"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import CardArt from "./CardArt";
import { formatPoisha } from "@/lib/pricing";
import { lowestEntryPrice, type Product } from "@/lib/catalog";
import { toBanglaDigits } from "@/lib/format";
import { useMotionPrefs } from "@/lib/useMotionPrefs";
import { useCart } from "@/lib/cart";
import { useToast } from "@/lib/toast";

const CYCLE_MS = 700;

/**
 * Grid tile. Three independent layers, deliberately kept apart:
 *   1. the flip/tilt transforms (unchanged)
 *   2. the image cycler, which lives INSIDE the front face
 *   3. the order buttons + dots, siblings ABOVE the transforms so they
 *      never rotate with the card
 */
export default function ProductCard({
  item,
  priority = false,
  onOrder,
}: {
  item: Product;
  priority?: boolean;
  onOrder?: (item: Product) => void;
}) {
  const { full, reduced } = useMotionPrefs();
  const ref = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState(false);
  const [adding, setAdding] = useState(false);
  const [imgIndex, setImgIndex] = useState(0);
  const [hovering, setHovering] = useState(false);
  /** extra frames stay unmounted until the shopper actually engages,
   *  so the grid's initial payload is still one image per card */
  const [engaged, setEngaged] = useState(false);

  const add = useCart((s) => s.add);
  const openDrawer = useCart((s) => s.openDrawer);
  const show = useToast((s) => s.show);

  const images = item.images;
  const hasGallery = images.length > 1;

  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const sTiltX = useSpring(tiltX, { stiffness: 260, damping: 22 });
  const sTiltY = useSpring(tiltY, { stiffness: 260, damping: 22 });

  // desktop: cycle through the gallery while hovered, reset on leave
  useEffect(() => {
    if (!hovering || !full || reduced || !hasGallery) return;
    const t = setInterval(
      () => setImgIndex((i) => (i + 1) % images.length),
      CYCLE_MS
    );
    return () => clearInterval(t);
  }, [hovering, full, reduced, hasGallery, images.length]);

  useEffect(() => {
    if (!hovering) setImgIndex(0);
  }, [hovering]);

  const onMove = (e: React.PointerEvent) => {
    if (!full || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    tiltY.set(((e.clientX - r.left) / r.width - 0.5) * 10);
    tiltX.set(((e.clientY - r.top) / r.height - 0.5) * -10);
  };

  /** hover-intent: warm the second image so the first switch never flashes */
  const preloadSecond = () => {
    if (!hasGallery) return;
    const img = new window.Image();
    img.src = images[1].url;
  };

  const fromPrice = formatPoisha(lowestEntryPrice(item));
  const defaultTierId =
    item.tiers.find((t) => t.is_default)?.id ?? item.tiers[0]?.id ?? null;

  /** Secondary action: straight to cart at MOQ on the default tier. */
  const instantAdd = async () => {
    setAdding(true);
    await new Promise((r) => setTimeout(r, 260));
    const tier = item.tiers.find((t) => t.id === defaultTierId) ?? null;
    add({
      kind: "product",
      slug: item.slug,
      name: item.name_bn,
      image: images[0]?.url ?? item.image,
      tierId: tier?.id ?? null,
      tierName: tier?.name_bn ?? null,
      quantity: item.moq,
      moq: item.moq,
      step: item.step_quantity,
      slabs: tier ? tier.slabs : item.slabs,
      addons: [],
    });
    setAdding(false);
    show(
      `${item.name_bn}${tier ? ` (${tier.name_bn})` : ""} — ${toBanglaDigits(item.moq)} পিস কার্টে যোগ হয়েছে`
    );
    openDrawer();
  };

  return (
    <div>
      <div
        ref={ref}
        className="group relative"
        style={{ perspective: "1200px" }}
        onPointerMove={onMove}
        onPointerEnter={() => {
          setHovering(true);
          setEngaged(true);
          preloadSecond();
        }}
        onPointerLeave={() => {
          tiltX.set(0);
          tiltY.set(0);
          setHovering(false);
        }}
      >
        {/* tilt layer */}
        <motion.div
          style={{ transformStyle: "preserve-3d", rotateX: sTiltX, rotateY: sTiltY }}
        >
          {/* flip layer */}
          <motion.button
            type="button"
            aria-pressed={flipped}
            aria-label={`${item.name_bn} — ${flipped ? "ছবি দেখুন" : "বিস্তারিত দেখুন"}`}
            onClick={() => setFlipped((f) => !f)}
            className="relative block aspect-[5/7] w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
            style={{ transformStyle: "preserve-3d" }}
            animate={{ rotateY: reduced ? 0 : flipped ? 180 : 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* front — the cycling gallery */}
            <div
              className="absolute inset-0 overflow-hidden rounded-xl bg-ink/5 shadow-[0_18px_40px_-24px_rgba(17,17,17,0.5)]"
              style={{ backfaceVisibility: "hidden" }}
            >
              {images.length ? (
                /* Layers are mounted once and crossfaded by opacity.
                   AnimatePresence churned mount/unmount every 700ms and left
                   several frames stuck at partial opacity, blending together. */
                images.map((img, i) =>
                  i === 0 || engaged ? (
                    <motion.div
                      key={img.id}
                      className="absolute inset-0"
                      initial={false}
                      animate={{ opacity: i === imgIndex ? 1 : 0 }}
                      transition={{ duration: reduced ? 0 : 0.18 }}
                    >
                      <Image
                        src={img.url}
                        alt={img.alt_bn ?? item.name_bn}
                        fill
                        sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                        priority={priority && i === 0}
                        loading={priority && i === 0 ? "eager" : "lazy"}
                        className="object-cover"
                        placeholder={i === 0 && item.blur_data_url ? "blur" : "empty"}
                        blurDataURL={item.blur_data_url ?? undefined}
                      />
                    </motion.div>
                  ) : null
                )
              ) : (
                <CardArt hue={item.hue} label={item.name_bn} className="h-full w-full" />
              )}
            </div>

            {/* back */}
            <div
              className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-xl border border-ink/15 bg-paper p-5 shadow-[0_18px_40px_-24px_rgba(17,17,17,0.5)]"
              style={{ backfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
            >
              <div>
                <p className="bangla-safe text-lg font-bold">{item.name_bn}</p>
                <p className="mt-2 text-sm leading-bangla text-ink/70">
                  {item.tagline_bn}
                </p>
              </div>
              <div className="text-sm text-ink/70">
                <p>সর্বনিম্ন {toBanglaDigits(item.moq)} পিস</p>
                <p className="mt-1 text-xl font-bold text-brand-700">
                  {fromPrice} থেকে
                </p>
              </div>
            </div>
          </motion.button>
        </motion.div>

        {/* ---- overlays above the transform layers ---- */}

        {/* tier badges */}
        {item.tiers.length > 1 && (
          <div className="pointer-events-none absolute left-2 top-2 z-10 flex gap-1">
            {item.tiers.map((t) => (
              <span
                key={t.id}
                className="rounded-full bg-paper/90 px-2 py-0.5 text-[10px] font-bold text-ink shadow-sm"
              >
                {t.name_bn}
              </span>
            ))}
          </div>
        )}

        {/* dot indicators while cycling */}
        {hasGallery && (
          <div
            className={`pointer-events-none absolute inset-x-0 bottom-14 z-10 flex justify-center gap-1.5 transition-opacity duration-200 ${
              hovering || !full ? "opacity-100" : "opacity-0"
            }`}
          >
            {images.map((img, i) => (
              <span
                key={img.id}
                className={`h-1.5 rounded-full transition-all duration-200 ${
                  i === imgIndex ? "w-4 bg-paper" : "w-1.5 bg-paper/50"
                }`}
                style={{ boxShadow: "0 0 3px rgba(0,0,0,.5)" }}
              />
            ))}
          </div>
        )}

        {/* mobile: swipe through the gallery inside the card */}
        {hasGallery && !full && (
          <div
            className="absolute inset-0 z-10 md:hidden"
            onTouchStart={(e) => {
              (e.currentTarget as HTMLElement).dataset.x = String(
                e.touches[0].clientX
              );
            }}
            onTouchEnd={(e) => {
              const start = Number(
                (e.currentTarget as HTMLElement).dataset.x ?? 0
              );
              const dx = e.changedTouches[0].clientX - start;
              if (Math.abs(dx) < 40) return;
              setEngaged(true);
              setImgIndex(
                (i) => (i + (dx < 0 ? 1 : images.length - 1)) % images.length
              );
            }}
          />
        )}

        {/* action buttons — always visible on mobile, revealed on hover */}
        <div className="pointer-events-none absolute inset-x-2 bottom-2 z-20 flex gap-2 opacity-100 transition-all duration-300 ease-paper md:translate-y-2 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100">
          <button
            type="button"
            onClick={() => onOrder?.(item)}
            className="pointer-events-auto flex min-h-[44px] flex-1 items-center justify-center rounded-full bg-ink px-3 text-sm font-bold text-paper shadow-lg transition-colors hover:bg-brand-700"
          >
            অর্ডার করুন
          </button>
          <button
            type="button"
            onClick={instantAdd}
            disabled={adding}
            aria-label={`${item.name_bn} — সর্বনিম্ন পরিমাণে কার্টে যোগ করুন`}
            className="pointer-events-auto flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-paper text-ink shadow-lg transition-colors hover:bg-brand-700 hover:text-paper disabled:opacity-70"
          >
            {adding ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-ink/30 border-t-ink" />
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                <path d="M6 7h12l-1.5 12h-9L6 7Z" />
                <path d="M9 7a3 3 0 0 1 6 0" />
              </svg>
            )}
          </button>
        </div>
      </div>

      <div className="mt-3 flex items-baseline justify-between gap-2 px-1">
        <Link
          href={`/collections/${item.slug}`}
          className="bangla-safe min-w-0 truncate font-semibold hover:text-brand-700"
        >
          {item.name_bn}
        </Link>
        <span className="shrink-0 text-sm text-ink/60">{fromPrice} থেকে</span>
      </div>
    </div>
  );
}
