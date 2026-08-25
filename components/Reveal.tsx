"use client";

import { motion, Variants } from "framer-motion";
import { ReactNode } from "react";
import { useMotionPrefs } from "@/lib/useMotionPrefs";

/**
 * Word-level reveal. Bangla conjuncts (যুক্তাক্ষর) break if split
 * per-character, so we NEVER animate by character — words only.
 */
export function RevealWords({
  text,
  className = "",
  delay = 0,
  as: Tag = "span",
  id,
}: {
  text: string;
  className?: string;
  delay?: number;
  as?: "span" | "h1" | "h2" | "h3" | "p";
  id?: string;
}) {
  const { reduced } = useMotionPrefs();
  const words = text.split(" ");

  if (reduced)
    return (
      <Tag id={id} className={className}>
        {text}
      </Tag>
    );

  const container: Variants = {
    hidden: {},
    show: { transition: { staggerChildren: 0.055, delayChildren: delay } },
  };
  const word: Variants = {
    hidden: { opacity: 0, y: "0.6em" },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.55, ease: [0.22, 1, 0.36, 1] },
    },
  };

  const MotionTag = motion[Tag];
  return (
    <MotionTag
      id={id}
      className={className}
      variants={container}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-40px" }}
    >
      {words.map((w, i) => (
        <span key={i} className="inline-block overflow-hidden align-bottom">
          <motion.span variants={word} className="bangla-safe inline-block">
            {w}
            {i < words.length - 1 ? " " : ""}
          </motion.span>
        </span>
      ))}
    </MotionTag>
  );
}

/** Simple fade-up block for below-the-fold content. */
export function Rise({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const { reduced } = useMotionPrefs();
  if (reduced) return <div className={className}>{children}</div>;
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
