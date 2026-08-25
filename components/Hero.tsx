"use client";

import { motion } from "framer-motion";
import MagneticButton from "./MagneticButton";
import { useMotionPrefs } from "@/lib/useMotionPrefs";
import { toBanglaDigits } from "@/lib/format";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * The opening move: a gatefold card, server-rendered CLOSED (the painted
 * covers are the LCP element), that swings open on load to reveal the
 * headline. Reduced motion renders it open and static.
 */
export default function Hero() {
  const { reduced } = useMotionPrefs();

  const cover = (side: "left" | "right") => ({
    initial: reduced ? { rotateY: side === "left" ? -165 : 165 } : { rotateY: 0 },
    animate: { rotateY: side === "left" ? -165 : 165 },
    transition: { duration: 1.15, delay: 0.35, ease: EASE },
  });

  return (
    <section className="relative flex min-h-[100svh] items-center justify-center overflow-hidden px-5 pt-20">
      {/* faint scattered mini-cards */}
      <div aria-hidden className="absolute inset-0 hidden md:block">
        {[
          { x: "8%", y: "18%", r: -14 },
          { x: "86%", y: "22%", r: 10 },
          { x: "12%", y: "72%", r: 8 },
          { x: "82%", y: "70%", r: -8 },
        ].map((c, i) => (
          <motion.div
            key={i}
            className="absolute h-24 w-[68px] rounded-md border border-ink/15 bg-paper shadow-sm"
            style={{ left: c.x, top: c.y, rotate: c.r }}
            initial={reduced ? {} : { opacity: 0, y: 24 }}
            animate={{ opacity: 0.7, y: 0 }}
            transition={{ delay: 1.3 + i * 0.12, duration: 0.7, ease: EASE }}
          />
        ))}
      </div>

      <div
        className="relative w-full max-w-2xl"
        style={{ perspective: "1600px" }}
      >
        {/* card interior — the revealed page */}
        <div className="relative rounded-2xl border border-ink/10 bg-paper px-6 py-14 text-center shadow-[0_30px_80px_-40px_rgba(17,17,17,0.45)] md:px-14 md:py-20">
          <motion.p
            className="bangla-safe text-sm font-semibold tracking-wide text-brand-700"
            initial={reduced ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1, duration: 0.5 }}
          >
            কাস্টম কার্ড ও প্রিন্ট স্টুডিও — চট্টগ্রাম
          </motion.p>

          <h1 className="bangla-safe mt-4 text-4xl font-bold leading-bangla-tight md:text-6xl">
            {["প্রতিটি", "ভাঁজে", "লুকানো"].map((w, i) => (
              <span key={w} className="inline-block overflow-hidden align-bottom">
                <motion.span
                  className="bangla-safe inline-block"
                  initial={reduced ? {} : { y: "0.7em", opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 1.15 + i * 0.08, duration: 0.6, ease: EASE }}
                >
                  {w}&nbsp;
                </motion.span>
              </span>
            ))}
            <span className="inline-block overflow-hidden align-bottom">
              <motion.span
                className="bangla-safe inline-block text-brand-700"
                initial={reduced ? {} : { y: "0.7em", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 1.39, duration: 0.6, ease: EASE }}
              >
                আপনার&nbsp;গল্প
              </motion.span>
            </span>
          </h1>

          <motion.p
            className="mx-auto mt-5 max-w-md leading-bangla text-ink/70"
            initial={reduced ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.55, duration: 0.6, ease: EASE }}
          >
            বিয়ে, ঈদ, জন্মদিন কিংবা প্রথম পরিচয় — কাগজ, কালি আর ডাই-কাটের
            যত্নে আমরা ছাপি আপনার শুভেচ্ছা।
          </motion.p>

          <motion.div
            className="mt-8 flex flex-wrap items-center justify-center gap-3"
            initial={reduced ? {} : { opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.7, duration: 0.6, ease: EASE }}
          >
            <MagneticButton href="/collections">ডিজাইন শুরু করুন</MagneticButton>
            <MagneticButton href="/#how" variant="paper">
              কীভাবে কাজ করে
            </MagneticButton>
          </motion.div>

          <motion.p
            className="mt-8 text-xs text-ink/50"
            initial={reduced ? {} : { opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.9, duration: 0.5 }}
          >
            {toBanglaDigits(1200)}+ অর্ডার পৌঁছেছে সারা দেশে
          </motion.p>
        </div>

        {/* gatefold covers — SSR paints these closed (LCP), then they swing open */}
        {(["left", "right"] as const).map((side) => (
          <motion.div
            key={side}
            aria-hidden
            className={`absolute inset-y-0 w-1/2 ${side === "left" ? "left-0" : "right-0"}`}
            style={{
              transformOrigin: side === "left" ? "left center" : "right center",
              transformStyle: "preserve-3d",
              backfaceVisibility: "hidden",
              zIndex: 10,
            }}
            {...cover(side)}
          >
            <div
              className={`h-full w-full bg-brand-700 shadow-xl ${
                side === "left" ? "rounded-l-2xl" : "rounded-r-2xl"
              }`}
              style={{
                backfaceVisibility: "hidden",
                // die-cut arch window on each cover
                WebkitMaskImage:
                  "radial-gradient(ellipse 34% 26% at " +
                  (side === "left" ? "88%" : "12%") +
                  " 42%, transparent 98%, black 100%)",
                maskImage:
                  "radial-gradient(ellipse 34% 26% at " +
                  (side === "left" ? "88%" : "12%") +
                  " 42%, transparent 98%, black 100%)",
                backgroundImage:
                  "radial-gradient(circle at 50% 20%, rgba(56,189,248,0.3), transparent 55%)",
              }}
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
