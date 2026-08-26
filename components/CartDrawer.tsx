"use client";

import { AnimatePresence, motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCart, cartSubtotal, cartCount } from "@/lib/cart";
import { formatPoisha, formatUnitPoisha } from "@/lib/pricing";
import { toBanglaDigits } from "@/lib/format";
import { DELIVERY_INSIDE_CTG, DELIVERY_OUTSIDE_CTG } from "@/lib/site";

/** Slide-out cart with the site's paper-fold entrance. Money in poisha. */
export default function CartDrawer() {
  const { lines, drawerOpen, closeDrawer, setQuantity, remove } = useCart();
  const subtotal = cartSubtotal(lines);

  return (
    <AnimatePresence>
      {drawerOpen && (
        <motion.div
          className="fixed inset-0 z-[60] bg-ink/50"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeDrawer}
        >
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="শপিং কার্ট"
            className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-paper shadow-2xl"
            initial={{ x: "100%", rotateY: -12 }}
            animate={{ x: 0, rotateY: 0 }}
            exit={{ x: "100%", rotateY: -8 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            style={{ transformPerspective: 1200, transformOrigin: "right center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-ink/10 px-5 py-4">
              <h2 className="bangla-safe text-xl font-bold">
                আপনার কার্ট{" "}
                {lines.length > 0 && (
                  <span className="text-base font-semibold text-ink/50">
                    ({toBanglaDigits(cartCount(lines))})
                  </span>
                )}
              </h2>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="কার্ট বন্ধ করুন"
                className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 hover:bg-ink hover:text-paper"
              >
                ✕
              </button>
            </div>

            {lines.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <svg viewBox="0 0 120 90" className="w-28 opacity-70" aria-hidden>
                  <rect x="14" y="12" width="64" height="44" rx="5" fill="none" stroke="#7A22C9" strokeWidth="2.5" strokeDasharray="5 4" transform="rotate(-6 46 34)" />
                  <rect x="42" y="32" width="64" height="44" rx="5" fill="#F7F4ED" stroke="#111" strokeWidth="2.5" transform="rotate(4 74 54)" />
                  <path d="M52 52h36M52 62h24" stroke="#0EA5E9" strokeWidth="2.5" strokeLinecap="round" transform="rotate(4 74 54)" />
                </svg>
                <p className="bangla-safe mt-6 text-lg font-bold">কার্ট এখনো খালি</p>
                <p className="mt-2 text-sm leading-bangla text-ink/60">
                  পছন্দের কার্ড বেছে নিন — বাকিটা আমরা ছাপব।
                </p>
                <Link
                  href="/collections"
                  onClick={closeDrawer}
                  className="mt-6 rounded-full bg-ink px-6 py-3 font-semibold text-paper transition-colors hover:bg-brand-700"
                >
                  কালেকশন দেখুন
                </Link>
              </div>
            ) : (
              <>
                <ul className="flex-1 space-y-4 overflow-y-auto px-5 py-4">
                  {lines.map((l) => (
                    <li key={l.key} className="flex gap-3 rounded-xl border border-ink/10 p-3">
                      <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-lg bg-ink/5">
                        {l.image && (
                          <Image src={l.image} alt={l.name} fill sizes="56px" className="object-cover" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="bangla-safe truncate font-semibold">{l.name}</p>
                        <p className="text-xs text-ink/60">
                          {formatUnitPoisha(l.unitPrice)} × {toBanglaDigits(l.quantity)} পিস
                        </p>
                        {l.addons.length > 0 && (
                          <p className="mt-0.5 truncate text-xs text-brand-700">
                            {l.addons.map((a) => a.name_bn).join(", ")}
                          </p>
                        )}
                        <p className="mt-1 text-sm font-bold text-brand-700">
                          {formatPoisha(l.lineTotal)}
                        </p>
                        <div className="mt-2 flex items-center gap-3">
                          <div className="flex items-center rounded-full border border-ink/20">
                            <button
                              type="button"
                              aria-label={`${l.name} — পরিমাণ কমান`}
                              onClick={() => setQuantity(l.key, l.quantity - l.step)}
                              className="h-9 w-9 rounded-l-full hover:bg-ink/5"
                            >
                              −
                            </button>
                            <span className="w-14 text-center text-sm font-semibold">
                              {toBanglaDigits(l.quantity)}
                            </span>
                            <button
                              type="button"
                              aria-label={`${l.name} — পরিমাণ বাড়ান`}
                              onClick={() => setQuantity(l.key, l.quantity + l.step)}
                              className="h-9 w-9 rounded-r-full hover:bg-ink/5"
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => remove(l.key)}
                            className="text-sm text-ink/50 underline underline-offset-2 hover:text-[#B3261E]"
                          >
                            সরান
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>

                <div className="border-t border-ink/10 px-5 py-4">
                  <div className="flex justify-between text-sm">
                    <span>সাবটোটাল</span>
                    <span className="font-semibold">{formatPoisha(subtotal)}</span>
                  </div>
                  <div className="mt-1 flex justify-between text-sm text-ink/60">
                    <span>ডেলিভারি চার্জ</span>
                    <span>
                      {formatPoisha(DELIVERY_INSIDE_CTG)}–{formatPoisha(DELIVERY_OUTSIDE_CTG)}{" "}
                      (চেকআউটে)
                    </span>
                  </div>
                  <div className="mt-2 flex justify-between border-t border-ink/10 pt-2 text-lg font-bold">
                    <span>মোট (ডেলিভারি ছাড়া)</span>
                    <span className="text-brand-700">{formatPoisha(subtotal)}</span>
                  </div>
                  <Link
                    href="/checkout"
                    onClick={closeDrawer}
                    className="mt-4 block rounded-full bg-ink py-3.5 text-center text-lg font-semibold text-paper transition-colors hover:bg-brand-700"
                  >
                    চেকআউট করুন
                  </Link>
                </div>
              </>
            )}
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
