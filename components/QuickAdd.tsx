"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect } from "react";
import type { Product } from "@/lib/catalog";
import QuantityPricer from "./QuantityPricer";
import CardFace from "./CardFace";

/** Quick-order modal: quantity + add-ons, straight from the grid. */
export default function QuickAdd({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          className="fixed inset-0 z-[70] flex items-end justify-center overflow-y-auto bg-ink/50 p-4 md:items-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={`${product.name_bn} — দ্রুত অর্ডার`}
            className="my-auto w-full max-w-md rounded-2xl border border-ink/10 bg-paper p-6 shadow-2xl"
            initial={{ opacity: 0, y: 40, rotateX: -8 }}
            animate={{ opacity: 1, y: 0, rotateX: 0 }}
            exit={{ opacity: 0, y: 24 }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            style={{ transformPerspective: 900 }}
          >
            <div className="flex items-start gap-3">
              <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg">
                <CardFace
                  image={product.image}
                  blur={product.blur_data_url}
                  hue={product.hue}
                  name={product.name_bn}
                  sizes="56px"
                  className="h-full w-full"
                />
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="bangla-safe text-lg font-bold">{product.name_bn}</h2>
                <p className="text-sm leading-bangla text-ink/60">
                  {product.tagline_bn}
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                aria-label="বন্ধ করুন"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-ink/15 hover:bg-ink hover:text-paper"
              >
                ✕
              </button>
            </div>

            <div className="mt-5">
              <QuantityPricer product={product} compact onAdded={onClose} />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
