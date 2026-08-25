"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useCart, cartCount } from "@/lib/cart";
import { toBanglaDigits } from "@/lib/format";

/** Header cart trigger with animated count badge. */
export default function CartButton() {
  const openDrawer = useCart((s) => s.openDrawer);
  const lines = useCart((s) => s.lines);
  // avoid hydration mismatch: localStorage cart only known client-side
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const count = mounted ? cartCount(lines) : 0;

  return (
    <button
      type="button"
      onClick={openDrawer}
      aria-label={`কার্ট খুলুন${count ? ` — ${count}টি আইটেম` : ""}`}
      className="relative flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-paper/80 backdrop-blur-sm transition-colors hover:bg-ink hover:text-paper"
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M6 7h12l-1.5 12h-9L6 7Z" />
        <path d="M9 7a3 3 0 0 1 6 0" />
      </svg>
      <AnimatePresence>
        {count > 0 && (
          <motion.span
            key={count}
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.4, opacity: 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 22 }}
            className="absolute -right-1 -top-1 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-brand-700 px-1 text-xs font-bold text-paper"
          >
            {toBanglaDigits(count)}
          </motion.span>
        )}
      </AnimatePresence>
    </button>
  );
}
