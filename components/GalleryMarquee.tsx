"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import type { Product } from "@/lib/catalog";
import { useMotionPrefs } from "@/lib/useMotionPrefs";
import { RevealWords } from "./Reveal";

/**
 * Work gallery: a horizontal band of printed-card photography that
 * slides sideways as the page scrolls (transform-only).
 */
export default function GalleryMarquee({ products }: { products: Product[] }) {
  const { full } = useMotionPrefs();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const x = useTransform(scrollYProgress, [0, 1], ["2%", "-32%"]);

  const withPhotos = products.filter((p) => p.image);
  if (!withPhotos.length) return null;
  const items = [...withPhotos, ...withPhotos.slice(0, 4)];

  return (
    <section
      ref={ref}
      className="overflow-hidden bg-paper py-12 md:py-16"
      aria-labelledby="gallery-title"
    >
      <div className="mx-auto max-w-6xl px-5">
        <RevealWords
          as="h2"
          id="gallery-title"
          text="আমাদের ছাপাখানা থেকে"
          className="bangla-safe text-3xl font-bold md:text-4xl"
        />
        <p className="mt-2 leading-bangla text-ink/70">
          সাম্প্রতিক কাজের এক ঝলক — প্রতিটিই কারও গল্পের অংশ।
        </p>
      </div>

      {full ? (
        <motion.div style={{ x }} className="mt-8 flex w-max gap-4 px-5">
          {items.map((c, i) => (
            <MarqueeTile key={`${c.slug}-${i}`} slug={c.slug} image={c.image!} name={c.name_bn} />
          ))}
        </motion.div>
      ) : (
        <div className="mt-8 flex snap-x gap-4 overflow-x-auto px-5 pb-3">
          {withPhotos.map((c) => (
            <MarqueeTile key={c.slug} slug={c.slug} image={c.image!} name={c.name_bn} snap />
          ))}
        </div>
      )}
    </section>
  );
}

function MarqueeTile({
  slug,
  image,
  name,
  snap = false,
}: {
  slug: string;
  image: string;
  name: string;
  snap?: boolean;
}) {
  return (
    <Link
      href={`/collections/${slug}`}
      className={`group relative block h-48 w-36 shrink-0 overflow-hidden rounded-xl shadow-md md:h-56 md:w-44 ${
        snap ? "snap-center" : ""
      }`}
    >
      <Image
        src={image}
        alt={name}
        fill
        sizes="176px"
        className="object-cover transition-transform duration-500 ease-paper group-hover:scale-105"
      />
      <span className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-ink/70 to-transparent p-2.5 pt-6 text-xs font-semibold text-paper">
        {name}
      </span>
    </Link>
  );
}
