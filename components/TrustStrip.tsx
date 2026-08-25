"use client";

import { animate, motion, useInView } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { toBanglaDigits } from "@/lib/format";
import { useMotionPrefs } from "@/lib/useMotionPrefs";

const stats = [
  { value: 1200, suffix: "+", label: "অর্ডার সম্পন্ন" },
  { value: 64, suffix: " জেলায়", label: "ডেলিভারি কাভারেজ" },
  { value: 3, suffix: "–৫ দিনে", label: "টার্নঅ্যারাউন্ড" },
  { value: 2, suffix: "টি ফ্রি", label: "ডিজাইন রিভিশন" },
];

/** Trust strip: animated Bangla-numeral counters on scroll into view. */
export default function TrustStrip() {
  return (
    <section className="bg-ink py-10 text-paper md:py-12" aria-label="আস্থার পরিসংখ্যান">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-5 md:grid-cols-4">
        {stats.map((s, i) => (
          <Counter key={s.label} {...s} delay={i * 0.08} />
        ))}
      </div>
    </section>
  );
}

function Counter({
  value,
  suffix,
  label,
  delay,
}: {
  value: number;
  suffix: string;
  label: string;
  delay: number;
}) {
  const { reduced } = useMotionPrefs();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });
  const [display, setDisplay] = useState(reduced ? value : 0);

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: 1.4,
      delay,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, value, delay, reduced]);

  return (
    <motion.div
      ref={ref}
      initial={reduced ? {} : { opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
      className="text-center"
    >
      <p className="text-3xl font-bold text-wave-300 md:text-4xl">
        {toBanglaDigits(display)}
        <span className="text-xl md:text-2xl">{suffix}</span>
      </p>
      <p className="mt-1 text-sm text-paper/70">{label}</p>
    </motion.div>
  );
}
