"use client";

import { ReactNode, createContext, useContext, useEffect, useState } from "react";
import Lenis from "lenis";
import { useMotionPrefs } from "@/lib/useMotionPrefs";

const LenisContext = createContext<Lenis | null>(null);
export const useLenis = () => useContext(LenisContext);

/**
 * Lenis smooth scroll — desktop only. Mobile keeps native scrolling
 * (cheaper, and native momentum feels better on touch). Disabled
 * entirely under prefers-reduced-motion.
 */
export default function SmoothScroll({ children }: { children: ReactNode }) {
  const { full } = useMotionPrefs();
  const [lenis, setLenis] = useState<Lenis | null>(null);

  useEffect(() => {
    if (!full) return;

    const instance = new Lenis({ lerp: 0.12, wheelMultiplier: 1 });
    let raf = requestAnimationFrame(function loop(time) {
      instance.raf(time);
      raf = requestAnimationFrame(loop);
    });
    setLenis(instance);

    return () => {
      cancelAnimationFrame(raf);
      instance.destroy();
      setLenis(null);
    };
  }, [full]);

  return <LenisContext.Provider value={lenis}>{children}</LenisContext.Provider>;
}
