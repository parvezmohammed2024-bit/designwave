"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import type { Combo } from "@/lib/combos";
import { formatPoisha } from "@/lib/pricing";
import { toBanglaDigits } from "@/lib/format";
import { useMotionPrefs } from "@/lib/useMotionPrefs";

/** Grid tile for a combo — ribbon, both prices, savings corner badge. */
export default function ComboCard({ combo }: { combo: Combo }) {
  const { reduced } = useMotionPrefs();
  const cover = combo.images[0]?.url ?? combo.items.find((i) => i.image)?.image ?? null;
  const hasSaving = combo.savings > 0;

  return (
    <div>
      <Link href={`/combos/${combo.slug}`} className="group block">
        <div className="relative aspect-[5/7] overflow-hidden rounded-xl bg-ink/5 shadow-[0_18px_40px_-24px_rgba(17,17,17,0.5)]">
          {cover && (
            <Image
              src={cover}
              alt={combo.name_bn}
              fill
              sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 ease-paper group-hover:scale-105"
            />
          )}

          {/* ribbon */}
          <span className="absolute left-0 top-3 rounded-r-full bg-brand-700 py-1 pl-2 pr-3 text-xs font-bold text-paper shadow">
            কম্বো
          </span>

          {/* savings corner badge */}
          {hasSaving && (
            <motion.span
              initial={reduced ? false : { scale: 0.7, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 280, damping: 18 }}
              className="absolute right-2 top-2 flex h-14 w-14 flex-col items-center justify-center rounded-full bg-wave-400 text-center text-[10px] font-bold leading-tight text-ink shadow-lg"
            >
              <span className="text-sm">{toBanglaDigits(combo.savingsPct)}%</span>
              ছাড়
            </motion.span>
          )}

          {/* stacked component count */}
          <span className="absolute bottom-2 left-2 rounded-full bg-paper/90 px-2.5 py-1 text-xs font-bold text-ink">
            {toBanglaDigits(combo.items.length)}টি আইটেম
          </span>
        </div>
      </Link>

      <div className="mt-3 px-1">
        <Link
          href={`/combos/${combo.slug}`}
          className="bangla-safe block truncate font-semibold hover:text-brand-700"
        >
          {combo.name_bn}
        </Link>
        <p className="mt-0.5 flex items-baseline gap-2">
          {hasSaving && (
            <s className="text-sm text-ink/45">{formatPoisha(combo.regularValue)}</s>
          )}
          <span className="font-bold text-brand-700">
            {formatPoisha(combo.combo_price)}
          </span>
        </p>
      </div>
    </div>
  );
}
