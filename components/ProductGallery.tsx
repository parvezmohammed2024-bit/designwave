"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import type { ProductImage } from "@/lib/catalog";
import { useMotionPrefs } from "@/lib/useMotionPrefs";
import { toBanglaDigits } from "@/lib/format";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Main image + thumbnail strip (vertical on desktop, horizontal on mobile).
 * Arrow keys and swipe change image, hover zooms on desktop, click opens a
 * lightbox. The next image is prefetched so switching never flashes.
 */
export default function ProductGallery({
  images,
  name,
  blur,
}: {
  images: ProductImage[];
  name: string;
  blur?: string | null;
}) {
  const { reduced, full } = useMotionPrefs();
  const [index, setIndex] = useState(0);
  const [dir, setDir] = useState(1);
  const [lightbox, setLightbox] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  // switching tier can shrink the list — never point past the end
  useEffect(() => {
    setIndex((i) => (i < images.length ? i : 0));
  }, [images.length]);

  const go = useCallback(
    (next: number, direction: number) => {
      if (!images.length) return;
      setDir(direction);
      setIndex(((next % images.length) + images.length) % images.length);
    },
    [images.length]
  );

  // preload the neighbouring frame so the next switch is instant
  useEffect(() => {
    if (images.length < 2) return;
    const nextUrl = images[(index + 1) % images.length].url;
    const img = new window.Image();
    img.src = nextUrl;
  }, [index, images]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(index + 1, 1);
      else if (e.key === "ArrowLeft") go(index - 1, -1);
      else if (e.key === "Escape") setLightbox(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, go]);

  if (!images.length) {
    return <div className="aspect-[5/7] w-full rounded-2xl bg-ink/5" />;
  }
  const current = images[Math.min(index, images.length - 1)];

  return (
    <div className="flex flex-col gap-3 md:flex-row-reverse md:gap-4">
      <div className="min-w-0 flex-1">
        <motion.div
          ref={frameRef}
          className="relative aspect-[5/7] w-full cursor-zoom-in overflow-hidden rounded-2xl bg-ink/5 shadow-[0_24px_60px_-32px_rgba(17,17,17,0.5)]"
          drag={reduced || images.length < 2 ? false : "x"}
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.12}
          onDragEnd={(_, info) => {
            if (info.offset.x < -50) go(index + 1, 1);
            else if (info.offset.x > 50) go(index - 1, -1);
          }}
          onClick={() => setLightbox(true)}
          onPointerMove={(e) => {
            if (!full || !frameRef.current) return;
            const r = frameRef.current.getBoundingClientRect();
            setZoom({
              x: ((e.clientX - r.left) / r.width) * 100,
              y: ((e.clientY - r.top) / r.height) * 100,
            });
          }}
          onPointerLeave={() => setZoom(null)}
        >
          <AnimatePresence mode="wait" custom={dir}>
            <motion.div
              key={current.id}
              className="absolute inset-0"
              initial={reduced ? false : { opacity: 0, x: dir * 24 }}
              animate={{ opacity: 1, x: 0 }}
              exit={reduced ? {} : { opacity: 0, x: dir * -24 }}
              transition={{ duration: 0.35, ease: EASE }}
            >
              <Image
                src={current.url}
                alt={current.alt_bn ?? name}
                fill
                priority={index === 0}
                sizes="(max-width: 768px) 100vw, 45vw"
                className="object-cover transition-transform duration-200"
                placeholder={index === 0 && blur ? "blur" : "empty"}
                blurDataURL={blur ?? undefined}
                style={
                  zoom
                    ? {
                        transform: "scale(1.9)",
                        transformOrigin: `${zoom.x}% ${zoom.y}%`,
                      }
                    : undefined
                }
              />
            </motion.div>
          </AnimatePresence>

          {images.length > 1 && (
            <span className="pointer-events-none absolute bottom-2 right-2 rounded-full bg-ink/70 px-2.5 py-1 text-xs font-semibold text-paper">
              {toBanglaDigits(index + 1)}/{toBanglaDigits(images.length)}
            </span>
          )}
        </motion.div>
      </div>

      {images.length > 1 && (
        <div
          role="tablist"
          aria-label="ছবির তালিকা"
          className="flex shrink-0 gap-2 overflow-x-auto md:w-20 md:flex-col md:overflow-y-auto"
        >
          {images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              role="tab"
              aria-selected={i === index}
              aria-label={`ছবি ${i + 1}`}
              onClick={() => go(i, i > index ? 1 : -1)}
              className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-colors md:h-24 md:w-full ${
                i === index
                  ? "border-brand-700"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <Image
                src={img.url}
                alt=""
                fill
                sizes="80px"
                loading={i < 2 ? "eager" : "lazy"}
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="fixed inset-0 z-[90] flex items-center justify-center bg-ink/90 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(false)}
            role="dialog"
            aria-modal="true"
            aria-label={`${name} — বড় ছবি`}
          >
            <button
              type="button"
              onClick={() => setLightbox(false)}
              aria-label="বন্ধ করুন"
              className="absolute right-4 top-4 rounded-full bg-paper px-4 py-2 font-bold"
            >
              ✕
            </button>
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  aria-label="আগের ছবি"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(index - 1, -1);
                  }}
                  className="absolute left-3 rounded-full bg-paper/90 px-4 py-3 text-xl font-bold"
                >
                  ‹
                </button>
                <button
                  type="button"
                  aria-label="পরের ছবি"
                  onClick={(e) => {
                    e.stopPropagation();
                    go(index + 1, 1);
                  }}
                  className="absolute right-3 rounded-full bg-paper/90 px-4 py-3 text-xl font-bold"
                >
                  ›
                </button>
              </>
            )}
            <motion.div
              className="relative h-[85vh] w-full max-w-3xl"
              initial={reduced ? false : { scale: 0.94, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, ease: EASE }}
              onClick={(e) => e.stopPropagation()}
            >
              <Image
                src={current.url}
                alt={current.alt_bn ?? name}
                fill
                sizes="90vw"
                className="object-contain"
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
