"use client";

import { useEffect, useState } from "react";
import { useReducedMotion } from "framer-motion";

/**
 * Central switch for the motion system.
 * - `reduced`: user asked for reduced motion — ship the static fallback.
 * - `desktop`: fine pointer + >=768px — the full show (tilt, cursor, deck fan,
 *   smooth scroll). Below that, mobile gets tasteful restraint.
 */
export function useMotionPrefs() {
  const reduced = useReducedMotion() ?? false;
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px) and (pointer: fine)");
    const update = () => setDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return { reduced, desktop, full: desktop && !reduced };
}
