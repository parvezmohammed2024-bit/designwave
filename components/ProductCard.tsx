"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useRef, useState } from "react";
import Link from "next/link";
import CardFace from "./CardFace";
import { formatTaka } from "@/lib/format";
import type { Collection } from "@/lib/products";
import { useMotionPrefs } from "@/lib/useMotionPrefs";

/**
 * 3D flip tile: hover flips to the card's "back" (desktop), tap toggles
 * on touch. Cursor-following tilt on desktop only. Transform-only.
 * Tilt and flip live on separate nested elements so their rotations
 * don't fight over the same transform.
 */
export default function ProductCard({
  item,
  priority = false,
  onAdd,
}: {
  item: Collection;
  priority?: boolean;
  /** Opens the variant picker (QuickAdd) for this product. */
  onAdd?: (item: Collection) => void;
}) {
  const { full, reduced } = useMotionPrefs();
  const ref = useRef<HTMLDivElement>(null);
  const [flipped, setFlipped] = useState(false);

  const tiltX = useMotionValue(0);
  const tiltY = useMotionValue(0);
  const sTiltX = useSpring(tiltX, { stiffness: 260, damping: 22 });
  const sTiltY = useSpring(tiltY, { stiffness: 260, damping: 22 });

  const onMove = (e: React.PointerEvent) => {
    if (!full || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    tiltY.set(((e.clientX - r.left) / r.width - 0.5) * 10);
    tiltX.set(((e.clientY - r.top) / r.height - 0.5) * -10);
  };
  const resetTilt = () => {
    tiltX.set(0);
    tiltY.set(0);
  };

  return (
    <div>
      <div
        ref={ref}
        style={{ perspective: "1200px" }}
        onPointerMove={onMove}
        onPointerLeave={() => {
          resetTilt();
          if (full) setFlipped(false);
        }}
        onPointerEnter={() => full && setFlipped(true)}
      >
        {/* tilt layer */}
        <motion.div
          style={{
            transformStyle: "preserve-3d",
            rotateX: sTiltX,
            rotateY: sTiltY,
          }}
        >
          {/* flip layer */}
          <motion.button
            type="button"
            aria-pressed={flipped}
            aria-label={`${item.name} — বিস্তারিত দেখুন`}
            onClick={() => !full && setFlipped(!flipped)}
            className="relative block aspect-[5/7] w-full text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-700"
            style={{ transformStyle: "preserve-3d" }}
            animate={{ rotateY: reduced ? 0 : flipped ? 180 : 0 }}
            transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* front */}
            <div
              className="absolute inset-0 overflow-hidden rounded-xl shadow-[0_18px_40px_-24px_rgba(17,17,17,0.5)]"
              style={{ backfaceVisibility: "hidden" }}
            >
              <CardFace
                item={item}
                sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="h-full w-full"
                priority={priority}
              />
            </div>
            {/* back */}
            <div
              className="absolute inset-0 flex flex-col justify-between overflow-hidden rounded-xl border border-ink/15 bg-paper p-5 shadow-[0_18px_40px_-24px_rgba(17,17,17,0.5)]"
              style={{
                backfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div>
                <p className="bangla-safe text-lg font-bold">{item.name}</p>
                <p className="mt-2 text-sm leading-bangla text-ink/70">
                  {item.tagline}
                </p>
              </div>
              <div>
                <p className="text-sm text-ink/60">শুরু</p>
                <p className="text-2xl font-bold text-brand-700">
                  {formatTaka(item.priceFrom)}
                </p>
                <span
                  role="button"
                  tabIndex={0}
                  onClick={(e) => {
                    e.stopPropagation();
                    onAdd?.(item);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      e.stopPropagation();
                      onAdd?.(item);
                    }
                  }}
                  className="mt-3 inline-block rounded-full bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-brand-700"
                >
                  কার্টে যোগ করুন
                </span>
              </div>
            </div>
          </motion.button>
        </motion.div>
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2 px-1">
        <Link
          href={`/collections/${item.slug}`}
          className="bangla-safe min-w-0 truncate font-semibold hover:text-brand-700"
        >
          {item.name}
        </Link>
        <span className="shrink-0 text-sm text-ink/60">
          {formatTaka(item.priceFrom)} থেকে
        </span>
      </div>
    </div>
  );
}
