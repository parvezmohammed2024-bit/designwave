"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";
import { useMotionPrefs } from "@/lib/useMotionPrefs";

/**
 * Desktop-only follower shaped like a small card. The native cursor stays
 * visible (never hide the real cursor — accessibility). Rotates slightly
 * with horizontal velocity, like a card being carried.
 */
export default function CustomCursor() {
  const { full } = useMotionPrefs();
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 400, damping: 40 });
  const sy = useSpring(y, { stiffness: 400, damping: 40 });
  const rotate = useMotionValue(0);
  const sRotate = useSpring(rotate, { stiffness: 200, damping: 20 });

  useEffect(() => {
    if (!full) return;
    let lastX = 0;
    const move = (e: PointerEvent) => {
      x.set(e.clientX + 14);
      y.set(e.clientY + 14);
      rotate.set(Math.max(-18, Math.min(18, (e.clientX - lastX) * 1.4)));
      lastX = e.clientX;
    };
    window.addEventListener("pointermove", move, { passive: true });
    return () => window.removeEventListener("pointermove", move);
  }, [full, x, y, rotate]);

  if (!full) return null;

  return (
    <motion.div
      aria-hidden
      className="cursor-card hidden md:block"
      style={{ x: sx, y: sy, rotate: sRotate }}
    />
  );
}
