"use client";

import { AnimatePresence, motion, type PanInfo } from "framer-motion";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import MagneticButton from "./MagneticButton";
import type { BannerSlide } from "@/lib/catalog";
import { useMotionPrefs } from "@/lib/useMotionPrefs";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Rotating multi-category banner, driven by dw_banner_slides. Auto-advances,
 * pauses on hover/focus, supports dots and touch swipe. Under reduced motion
 * the rotation stops and the dots become the only control.
 */
export default function SeasonalBanner({
  slides,
  rotationMs = 6000,
}: {
  slides: BannerSlide[];
  rotationMs?: number;
}) {
  const { reduced, full } = useMotionPrefs();
  const [[index, dir], setState] = useState<[number, number]>([0, 1]);
  const [paused, setPaused] = useState(false);

  const go = useCallback(
    (next: number, direction: number) => {
      if (!slides.length) return;
      setState([(next + slides.length) % slides.length, direction]);
    },
    [slides.length]
  );

  useEffect(() => {
    if (reduced || paused || slides.length < 2) return;
    const t = setInterval(() => {
      setState(([i]) => [(i + 1) % slides.length, 1]);
    }, rotationMs);
    return () => clearInterval(t);
  }, [reduced, paused, slides.length, rotationMs]);

  if (!slides.length) return null;
  const slide = slides[Math.min(index, slides.length - 1)];

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -60) go(index + 1, 1);
    else if (info.offset.x > 60) go(index - 1, -1);
  };

  return (
    <section
      aria-labelledby="banner-title"
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
    >
      <motion.div
        className="torn-edge torn-edge--flip"
        animate={{ backgroundColor: slide.bg_color }}
        transition={{ duration: 0.6, ease: EASE }}
        aria-hidden
      />

      <div className="relative overflow-hidden">
        <motion.div
          className="relative py-12 text-paper md:py-16"
          animate={{ backgroundColor: slide.bg_color }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          {full && (
            <div aria-hidden className="pointer-events-none absolute inset-0">
              {[
                { x: "12%", y: "20%", d: 9 },
                { x: "85%", y: "18%", d: 11 },
                { x: "78%", y: "72%", d: 10 },
                { x: "18%", y: "76%", d: 12 },
              ].map((s, i) => (
                <motion.div
                  key={i}
                  className="absolute h-2.5 w-2.5 rotate-45 bg-wave-400/70"
                  style={{ left: s.x, top: s.y }}
                  animate={{ y: [0, -14, 0] }}
                  transition={{ duration: s.d, repeat: Infinity, ease: "easeInOut" }}
                />
              ))}
            </div>
          )}

          <motion.div
            className="relative mx-auto grid max-w-6xl items-center gap-8 px-5 md:grid-cols-2 md:gap-12"
            drag={reduced ? false : "x"}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.14}
            onDragEnd={onDragEnd}
          >
            <div aria-live="polite" aria-atomic="true">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={slide.id}
                  initial={reduced ? false : { opacity: 0, x: dir * 40, rotateY: dir * -8 }}
                  animate={{ opacity: 1, x: 0, rotateY: 0 }}
                  exit={reduced ? {} : { opacity: 0, x: dir * -30, rotateY: dir * 6 }}
                  transition={{ duration: 0.5, ease: EASE }}
                  style={{ transformPerspective: 1000 }}
                >
                  {slide.eyebrow_bn && (
                    <motion.p
                      className="text-sm font-semibold tracking-wide text-wave-300"
                      initial={reduced ? false : { opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.05, ease: EASE }}
                    >
                      {slide.eyebrow_bn}
                    </motion.p>
                  )}
                  <motion.h2
                    id="banner-title"
                    className="bangla-safe mt-3 text-2xl font-bold sm:text-3xl md:text-5xl"
                    initial={reduced ? false : { opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.12, ease: EASE }}
                  >
                    {slide.headline_bn}
                  </motion.h2>
                  {slide.body_bn && (
                    <motion.p
                      className="mt-4 max-w-md leading-bangla text-paper/85"
                      initial={reduced ? false : { opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.2, ease: EASE }}
                    >
                      {slide.body_bn}
                    </motion.p>
                  )}
                  {slide.highlight_bn && (
                    <motion.p
                      className="mt-4 font-bold leading-bangla text-wave-300"
                      initial={reduced ? false : { opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.28, ease: EASE }}
                    >
                      {slide.highlight_bn}
                    </motion.p>
                  )}
                  {slide.cta_label_bn && slide.cta_href && (
                    <motion.div
                      className="mt-7"
                      initial={reduced ? false : { opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, delay: 0.36, ease: EASE }}
                    >
                      <MagneticButton href={slide.cta_href} variant="wave">
                        {slide.cta_label_bn}
                      </MagneticButton>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="relative mx-auto h-[240px] w-full max-w-[300px] md:h-[320px] md:max-w-none">
              <AnimatePresence mode="wait" custom={dir}>
                <motion.div
                  key={slide.id}
                  className="absolute inset-0 flex items-center justify-center"
                  initial={reduced ? false : { opacity: 0, y: 40, rotate: dir * 8, scale: 0.92 }}
                  animate={{ opacity: 1, y: 0, rotate: -4, scale: 1 }}
                  exit={reduced ? {} : { opacity: 0, y: -30, rotate: dir * -8, scale: 0.94 }}
                  transition={{ duration: 0.55, ease: EASE }}
                >
                  {slide.visual_kind === "photo" && slide.image_path ? (
                    <div className="relative h-full w-[190px] overflow-hidden rounded-2xl shadow-[0_30px_60px_-25px_rgba(0,0,0,0.7)] md:w-[240px]">
                      <Image
                        src={slide.image_path}
                        alt={slide.headline_bn}
                        fill
                        sizes="240px"
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <EidVisual />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {slides.length > 1 && (
            <div className="relative mt-8 flex items-center justify-center gap-2.5">
              {slides.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => go(i, i > index ? 1 : -1)}
                  aria-label={`স্লাইড ${i + 1}: ${s.eyebrow_bn ?? s.headline_bn}`}
                  aria-current={i === index}
                  className="group flex h-11 w-11 items-center justify-center"
                >
                  <span
                    className={`block rounded-full transition-all duration-300 ${
                      i === index
                        ? "h-2.5 w-7 bg-wave-300"
                        : "h-2.5 w-2.5 bg-paper/40 group-hover:bg-paper/70"
                    }`}
                  />
                </button>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <motion.div
        className="torn-edge"
        animate={{ backgroundColor: slide.bg_color }}
        transition={{ duration: 0.6, ease: EASE }}
        aria-hidden
      />
    </section>
  );
}

function EidVisual() {
  return (
    <svg viewBox="0 0 320 320" className="h-full w-auto drop-shadow-[0_30px_50px_rgba(0,0,0,0.55)]" aria-hidden>
      <circle cx="160" cy="150" r="110" fill="#38BDF8" opacity="0.16" />
      <path d="M212 62a118 118 0 1 0 0 176 92 92 0 0 1 0-176Z" fill="#38BDF8" />
      <rect x="120" y="120" width="120" height="164" rx="10" fill="#F7F4ED" transform="rotate(8 180 202)" />
      <text
        x="176" y="200" textAnchor="middle" fontSize="26" fontWeight="700"
        fill="#7A22C9" fontFamily="var(--font-bangla), sans-serif"
        transform="rotate(8 180 202)"
      >
        ঈদ মোবারক
      </text>
    </svg>
  );
}
