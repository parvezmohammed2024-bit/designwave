"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { useMotionPrefs } from "@/lib/useMotionPrefs";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Brand lockup: mark + wordmark, always on one line.
 * `variant="light"` uses the light-on-dark mark for the footer.
 */
export default function Logo({
  variant = "dark",
  priority = false,
}: {
  variant?: "dark" | "light";
  priority?: boolean;
}) {
  const { reduced } = useMotionPrefs();
  const light = variant === "light";

  return (
    <Link
      href="/"
      aria-label="Design Wave — হোম"
      className={`flex shrink-0 items-center gap-2 whitespace-nowrap ${
        light ? "" : "rounded-full bg-paper/80 py-1 pl-1.5 pr-3 backdrop-blur-sm"
      }`}
    >
      <motion.span
        className="relative block h-7 w-[40px] shrink-0 md:h-8 md:w-[46px]"
        initial={reduced ? false : { opacity: 0, scale: 0.8, rotate: -8 }}
        animate={{ opacity: 1, scale: 1, rotate: 0 }}
        transition={{ duration: 0.6, ease: EASE }}
      >
        <Image
          src={light ? "/logo-light.svg" : "/logo.svg"}
          alt=""
          fill
          priority={priority}
          sizes="46px"
          className="object-contain"
        />
      </motion.span>
      <motion.span
        className={`text-lg font-bold tracking-tight md:text-xl ${
          light ? "text-paper" : "text-ink"
        }`}
        initial={reduced ? false : { opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.12, ease: EASE }}
      >
        Design
        <span className={light ? "text-wave-300" : "text-brand-700"}> Wave</span>
      </motion.span>
    </Link>
  );
}
