"use client";

import Image from "next/image";
import { useState } from "react";
import CardArt from "./CardArt";
import type { Hue } from "@/lib/catalog";

/**
 * A product's visual. Renders the photograph (next/image, WebP, blur-up);
 * if the file is missing it falls back to the branded SVG face so the
 * layout never breaks.
 */
export default function CardFace({
  image,
  blur,
  hue,
  name,
  sizes,
  className = "",
  priority = false,
}: {
  image: string | null;
  blur?: string | null;
  hue: Hue;
  name: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const [failed, setFailed] = useState(false);

  if (!image || failed) {
    return <CardArt hue={hue} label={name} className={className} />;
  }

  return (
    <div className={`relative overflow-hidden ${className}`}>
      <Image
        src={image}
        alt={name}
        fill
        sizes={sizes}
        priority={priority}
        className="object-cover"
        placeholder={blur ? "blur" : "empty"}
        blurDataURL={blur ?? undefined}
        onError={() => setFailed(true)}
      />
    </div>
  );
}
