"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import type { Combo } from "@/lib/combos";
import { formatPoisha } from "@/lib/pricing";
import { toBanglaDigits } from "@/lib/format";
import { useMotionPrefs } from "@/lib/useMotionPrefs";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Homepage offer band, styled like the client's Facebook posters — the
 * anchor price pair does the selling. Renders nothing when no combo is
 * live, so an expired offer disappears on its own.
 */
export default function ComboBand({ combos }: { combos: Combo[] }) {
  const { reduced, full } = useMotionPrefs();
  const featured = combos.filter((c) => c.featured);
  const combo = featured[0] ?? combos[0];
  if (!combo) return null;

  const hasSaving = combo.savings > 0;

  return (
    <section aria-labelledby="combo-band-title">
      <div className="torn-edge torn-edge--flip" style={{ backgroundColor: "#4C1D95" }} aria-hidden />
      <div className="relative overflow-hidden bg-brand-900 py-12 text-paper md:py-16">
        {full && (
          <div aria-hidden className="pointer-events-none absolute inset-0">
            {[
              { x: "8%", y: "18%", d: 10 },
              { x: "88%", y: "24%", d: 12 },
              { x: "80%", y: "74%", d: 9 },
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

        <div className="relative mx-auto grid max-w-6xl items-center gap-8 px-5 md:grid-cols-2 md:gap-12">
          <motion.div
            initial={reduced ? false : { opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.55, ease: EASE }}
          >
            {combo.badge_text_bn && (
              <span className="inline-block rounded-full bg-wave-400 px-3 py-1 text-xs font-bold text-ink">
                {combo.badge_text_bn}
              </span>
            )}
            <h2
              id="combo-band-title"
              className="bangla-safe mt-3 text-3xl font-bold leading-bangla-tight md:text-5xl"
            >
              {combo.name_bn}
            </h2>
            {combo.tagline_bn && (
              <p className="mt-3 max-w-md leading-bangla text-paper/85">
                {combo.tagline_bn}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-baseline gap-3">
              {hasSaving && (
                <span className="text-xl text-paper/50 line-through">
                  {formatPoisha(combo.regularValue)}
                </span>
              )}
              <span className="text-4xl font-bold text-wave-300 md:text-5xl">
                {formatPoisha(combo.combo_price)}
              </span>
            </div>
            {hasSaving && (
              <p className="mt-2 font-bold text-paper">
                {formatPoisha(combo.savings)} সাশ্রয় ·{" "}
                {toBanglaDigits(combo.savingsPct)}% ছাড়
              </p>
            )}

            <ul className="mt-4 space-y-1 text-sm leading-bangla text-paper/85">
              {combo.items.map((i) => (
                <li key={i.id}>
                  • {toBanglaDigits(i.quantity)} পিস {i.name_bn}
                  {i.tierName ? ` (${i.tierName})` : ""}
                </li>
              ))}
            </ul>

            <Link
              href={`/combos/${combo.slug}`}
              className="mt-6 inline-flex min-h-[48px] items-center rounded-full bg-wave-400 px-7 font-bold text-ink transition-colors hover:bg-wave-300"
            >
              অফারটি দেখুন
            </Link>
          </motion.div>

          {/* component photos, fanned like the poster */}
          <motion.div
            className="relative mx-auto flex h-[220px] w-full max-w-sm items-center justify-center md:h-[300px]"
            initial={reduced ? false : { opacity: 0, scale: 0.94 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, ease: EASE }}
          >
            {combo.items
              .filter((i) => i.image)
              .slice(0, 3)
              .map((i, idx, arr) => (
                <motion.div
                  key={i.id}
                  className="absolute overflow-hidden rounded-2xl shadow-[0_30px_60px_-25px_rgba(0,0,0,0.7)]"
                  style={{
                    width: 160,
                    height: 210,
                    zIndex: arr.length - idx,
                    rotate: (idx - (arr.length - 1) / 2) * 10,
                    x: (idx - (arr.length - 1) / 2) * 80,
                  }}
                  whileHover={reduced ? undefined : { y: -10 }}
                >
                  <Image
                    src={i.image!}
                    alt={i.name_bn}
                    fill
                    sizes="160px"
                    className="object-cover"
                  />
                </motion.div>
              ))}
          </motion.div>
        </div>
      </div>
      <div className="torn-edge" style={{ backgroundColor: "#4C1D95" }} aria-hidden />
    </section>
  );
}
