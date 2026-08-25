"use client";

import Image from "next/image";
import { useState } from "react";
import CardArt from "./CardArt";
import type { Collection } from "@/lib/products";

/**
 * The single source of a product's visual. Renders the photograph from
 * item.image (next/image, WebP, blur-up); if the file is missing it
 * falls back to the branded SVG face so the layout never breaks.
 * Swapping in real client photography = replacing the file in
 * public/products/ — this component never changes.
 */
export default function CardFace({
  item,
  sizes,
  className = "",
  priority = false,
}: {
  item: Collection;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return <CardArt hue={item.hue} label={item.name} className={className} />;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={item.image}
        alt={item.name}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
        placeholder={item.blurDataURL ? "blur" : "empty"}
        blurDataURL={item.blurDataURL}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
