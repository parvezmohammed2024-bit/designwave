"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { RevealWords, Rise } from "./Reveal";

type CompareProps = {
  title: string;
  a: { label: string; note: string };
  b: { label: string; note: string };
  render: (side: "a" | "b") => React.ReactNode;
};

/**
 * Interactive paper & finishing comparison — 300 vs 350 GSM, glossy vs
 * matt, straight-cut vs die-cut. Educates the premium tiers, in Bangla.
 * All visuals are CSS/transform-only.
 */
export default function FinishShowcase() {
  return (
    <section className="bg-paper py-12 md:py-16" aria-labelledby="finish-title">
      <div className="mx-auto max-w-6xl px-5">
        <RevealWords
          as="h2"
          id="finish-title"
          text="কাগজ আর ফিনিশের পার্থক্য, হাতে-কলমে"
          className="bangla-safe text-3xl font-bold md:text-4xl"
        />
        <p className="mt-3 max-w-xl leading-bangla text-ink/70">
          একই ডিজাইন, আলাদা অনুভূতি। ট্যাপ করে দেখুন কোন কাগজ আর ফিনিশ আপনার
          কার্ডকে প্রিমিয়াম করে তোলে।
        </p>

        <div className="mt-8 grid gap-5 md:grid-cols-3">
          <CompareCard
            title="কাগজের পুরুত্ব"
            a={{ label: "৩০০ GSM", note: "হালকা, নমনীয় — দৈনন্দিন ব্যবহারে" }}
            b={{ label: "৩৫০ GSM", note: "ভারী, শক্ত — হাতে নিলেই প্রিমিয়াম" }}
            render={(side) => (
              <div className="flex h-full items-center justify-center">
                <motion.div
                  className="w-3/4 rounded-md bg-paper shadow-lg"
                  animate={{
                    height: side === "a" ? 8 : 13,
                    boxShadow:
                      side === "a"
                        ? "0 6px 14px -6px rgba(17,17,17,0.4)"
                        : "0 10px 22px -6px rgba(17,17,17,0.55)",
                  }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  style={{ border: "1.5px solid #11111133" }}
                />
              </div>
            )}
          />
          <CompareCard
            title="ল্যামিনেশন"
            a={{ label: "গ্লসি", note: "চকচকে, রঙ উজ্জ্বল দেখায়" }}
            b={{ label: "ম্যাট", note: "নরম, আঙুলের ছাপ পড়ে না" }}
            render={(side) => (
              <div className="relative flex h-full items-center justify-center overflow-hidden">
                <div className="relative h-24 w-36 overflow-hidden rounded-lg bg-brand-700">
                  <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center font-bold text-paper">
                    Design Wave
                  </p>
                  <motion.div
                    aria-hidden
                    className="absolute inset-y-0 w-16 rotate-12 bg-paper/40"
                    animate={
                      side === "a"
                        ? { x: [-80, 200], opacity: 0.5 }
                        : { x: -80, opacity: 0 }
                    }
                    transition={
                      side === "a"
                        ? { duration: 1.6, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.6 }
                        : { duration: 0.2 }
                    }
                  />
                </div>
              </div>
            )}
          />
          <CompareCard
            title="কাটিং"
            a={{ label: "স্ট্রেট-কাট", note: "ক্লাসিক চারকোনা কার্ড" }}
            b={{ label: "ডাই-কাট", note: "যেকোনো আকৃতি — ব্র্যান্ডের মতো করে" }}
            render={(side) => (
              <div className="flex h-full items-center justify-center">
                <motion.div
                  className="h-24 w-36 bg-wave-500"
                  animate={{
                    borderRadius:
                      side === "a"
                        ? "8px 8px 8px 8px"
                        : "50% 12px 45% 12px",
                    rotate: side === "a" ? 0 : -4,
                  }}
                  transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
            )}
          />
        </div>
      </div>
    </section>
  );
}

function CompareCard({ title, a, b, render }: CompareProps) {
  const [side, setSide] = useState<"a" | "b">("b");
  const opt = side === "a" ? a : b;

  return (
    <Rise>
      <div className="flex h-full flex-col rounded-2xl border border-ink/10 bg-paper p-5 shadow-sm">
        <h3 className="bangla-safe font-bold">{title}</h3>
        <div className="mt-3 h-32">{render(side)}</div>
        <p className="mt-2 min-h-[44px] text-sm leading-bangla text-ink/60">{opt.note}</p>
        <div className="mt-3 grid grid-cols-2 gap-2" role="group" aria-label={title}>
          {(["a", "b"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSide(s)}
              aria-pressed={side === s}
              className={`min-h-[44px] rounded-full border text-sm font-semibold transition-colors ${
                side === s
                  ? "border-brand-700 bg-brand-700 text-paper"
                  : "border-ink/20 hover:border-brand-700"
              }`}
            >
              {s === "a" ? a.label : b.label}
            </button>
          ))}
        </div>
      </div>
    </Rise>
  );
}
