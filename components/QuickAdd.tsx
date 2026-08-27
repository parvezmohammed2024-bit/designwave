"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import { defaultTier, imagesFor, type Product } from "@/lib/catalog";
import QuantityPricer from "./QuantityPricer";
import TierSelector from "./TierSelector";
import CardArt from "./CardArt";

/** Quick-order modal: tier + quantity + add-ons, straight from the grid. */
export default function QuickAdd({
  product,
  onClose,
}: {
  product: Product | null;
  onClose: () => void;
}) {
  const [tierId, setTierId] = useState<string | null>(null);

  // reset to the product's default tier each time the modal opens
  useEffect(() => {
    setTierId(product ? (defaultTier(product)?.id ?? null) : null);
  }, [product]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const tier = product?.tiers.find((t) => t.id === tierId) ?? null;
  const cover = product ? imagesFor(product, tierId)[0] : null;

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
              <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-ink/5">
                {cover ? (
                  <Image
                    src={cover.url}
                    alt={cover.alt_bn ?? product.name_bn}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <CardArt hue={product.hue} label={product.name_bn} className="h-full w-full" />
                )}
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

            {product.tiers.length > 1 && (
              <div className="mt-5">
                <TierSelector
                  tiers={product.tiers}
                  selectedId={tierId}
                  onSelect={setTierId}
                  baseUnitPrice={product.base_unit_price}
                  compact
                />
              </div>
            )}

            <div className="mt-5">
              <QuantityPricer
                product={product}
                tier={tier}
                compact
                onAdded={onClose}
              />
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
