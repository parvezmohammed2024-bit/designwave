"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { stages } from "@/lib/products";
import { toBanglaDigits } from "@/lib/format";
import { useMotionPrefs } from "@/lib/useMotionPrefs";
import { RevealWords, Rise } from "./Reveal";

/**
 * The 5 stages draw in along an ink line as you scroll — the SVG path's
 * pathLength is driven by scroll progress, like ink spreading on paper.
 */
export default function HowItWorks() {
  const { reduced } = useMotionPrefs();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start 0.75", "end 0.45"],
  });
  const pathLength = useTransform(scrollYProgress, [0, 1], [0, 1]);

  return (
    <section id="how" ref={ref} className="bg-paper py-12 md:py-16" aria-labelledby="how-title">
      <div className="mx-auto max-w-3xl px-5">
        <RevealWords
          as="h2"
          id="how-title"
          text="কীভাবে কাজ করে"
          className="bangla-safe text-3xl font-bold md:text-4xl"
        />
        <p className="mt-3 leading-bangla text-ink/70">
          অর্ডার থেকে ডেলিভারি — পাঁচটি ধাপ, প্রতিটিতে আমাদের হাতের ছোঁয়া।
        </p>

        <div className="relative mt-10">
          {/* the ink line */}
          <svg
            aria-hidden
            className="absolute left-[22px] top-0 h-full w-12 md:left-1/2 md:-ml-6"
            viewBox="0 0 48 1000"
            preserveAspectRatio="none"
            fill="none"
          >
            <motion.path
              d="M24 0 C 40 120, 8 200, 24 320 C 40 440, 8 540, 24 660 C 40 780, 8 880, 24 1000"
              stroke="var(--brand)"
              strokeWidth="2.5"
              strokeLinecap="round"
              style={reduced ? { pathLength: 1 } : { pathLength }}
            />
          </svg>

          <ol className="space-y-10">
            {stages.map((s, i) => (
              <li key={s.title} className="relative">
                <Rise
                  delay={i * 0.05}
                  className={`ml-14 max-w-sm md:ml-0 md:w-[calc(50%-3.5rem)] ${
                    i % 2 ? "md:ml-auto" : ""
                  }`}
                >
                  <div className="rounded-2xl border border-ink/10 bg-paper p-5 shadow-[0_14px_36px_-26px_rgba(17,17,17,0.5)]">
                    <span
                      aria-hidden
                      className="absolute left-0 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-brand-700 font-bold text-paper md:left-1/2 md:-ml-[22px]"
                    >
                      {toBanglaDigits(i + 1)}
                    </span>
                    <h3 className="bangla-safe text-xl font-bold">
                      {s.title}
                    </h3>
                    <p className="mt-1.5 text-sm leading-bangla text-ink/70">
                      {s.detail}
                    </p>
                  </div>
                </Rise>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  );
}
