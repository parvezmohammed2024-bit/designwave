"use client";

import { motion, useMotionValue, useSpring } from "framer-motion";
import { ReactNode, useRef } from "react";
import Link from "next/link";
import { useMotionPrefs } from "@/lib/useMotionPrefs";

type Props = {
  href: string;
  children: ReactNode;
  variant?: "ink" | "paper" | "wave";
};

const styles: Record<NonNullable<Props["variant"]>, string> = {
  ink: "bg-ink text-paper hover:bg-brand-700",
  paper: "bg-paper text-ink border border-ink/20 hover:border-ink",
  wave: "bg-wave-500 text-ink hover:bg-wave-400",
};

/** Button that leans toward the cursor within its hover area (desktop only). */
export default function MagneticButton({ href, children, variant = "ink" }: Props) {
  const { full } = useMotionPrefs();
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const sx = useSpring(x, { stiffness: 220, damping: 18 });
  const sy = useSpring(y, { stiffness: 220, damping: 18 });

  const onMove = (e: React.PointerEvent) => {
    if (!full || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    x.set((e.clientX - r.left - r.width / 2) * 0.3);
    y.set((e.clientY - r.top - r.height / 2) * 0.35);
  };
  const reset = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={reset}
      style={{ x: sx, y: sy }}
      className="inline-block"
    >
      <Link
        href={href}
        className={`inline-flex min-h-[48px] items-center justify-center rounded-full px-7 py-3 text-base font-semibold transition-colors duration-300 ease-paper ${styles[variant]}`}
      >
        {children}
      </Link>
    </motion.div>
  );
}
