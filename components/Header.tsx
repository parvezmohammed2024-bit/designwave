"use client";

import Link from "next/link";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CartButton from "./CartButton";
import Logo from "./Logo";

const links = [
  { href: "/collections", label: "কালেকশন" },
  { href: "/#how", label: "কীভাবে কাজ করে" },
  { href: "/order", label: "অর্ডার করুন" },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4">
        <Logo priority />

        <nav aria-label="মূল নেভিগেশন" className="hidden items-center gap-1 rounded-full bg-paper/80 px-2 py-1.5 backdrop-blur-sm md:flex">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-full px-4 py-2 text-sm font-semibold transition-colors hover:bg-ink hover:text-paper"
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <CartButton />
          <button
            type="button"
            aria-expanded={open}
            aria-label={open ? "মেনু বন্ধ করুন" : "মেনু খুলুন"}
            onClick={() => setOpen(!open)}
            className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-ink text-paper md:hidden"
          >
            <span className="text-sm font-semibold">{open ? "✕" : "মেনু"}</span>
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            aria-label="মোবাইল নেভিগেশন"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="mx-5 rounded-2xl border border-ink/10 bg-paper p-3 shadow-xl md:hidden"
          >
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block rounded-xl px-4 py-3.5 text-base font-semibold hover:bg-ink/5"
              >
                {l.label}
              </Link>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}
