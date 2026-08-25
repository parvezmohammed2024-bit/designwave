"use client";

import { useEffect } from "react";
import { useMotionPrefs } from "@/lib/useMotionPrefs";

/**
 * Nudges the paper-grain overlay as the page scrolls (transform only,
 * rAF-throttled). Skipped on mobile and under reduced motion.
 */
export default function GrainShift() {
  const { full } = useMotionPrefs();

  useEffect(() => {
    if (!full) return;
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        document.documentElement.style.setProperty(
          "--grain-shift",
          `${(window.scrollY * 0.06) % 60}px`
        );
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.documentElement.style.removeProperty("--grain-shift");
    };
  }, [full]);

  return null;
}
