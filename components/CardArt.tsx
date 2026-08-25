import type { Collection } from "@/lib/products";

// Design Wave palette (see tailwind.config.ts). Used only as the
// fallback face when a product photo is missing.
const palettes: Record<
  Collection["hue"],
  { bg: string; fg: string; accent: string }
> = {
  brand: { bg: "#6B21A8", fg: "#F7F4ED", accent: "#7DD3FC" },
  wave: { bg: "#0EA5E9", fg: "#111111", accent: "#F7F4ED" },
  ink: { bg: "#111111", fg: "#F7F4ED", accent: "#38BDF8" },
  magenta: { bg: "#A855F7", fg: "#F7F4ED", accent: "#BAE6FD" },
};

/**
 * Pure-SVG card face — zero image bytes, paints instantly, scales crisply.
 * Corner ornaments + central monogram ring, echoing letterpress cards.
 */
export default function CardArt({
  hue,
  label,
  className = "",
}: {
  hue: Collection["hue"];
  label: string;
  className?: string;
}) {
  const p = palettes[hue];
  const corner = (
    <path
      d="M8 30 Q8 8 30 8 M14 30 Q14 14 30 14"
      fill="none"
      stroke={p.accent}
      strokeWidth="2"
      strokeLinecap="round"
    />
  );
  return (
    <svg
      viewBox="0 0 200 280"
      className={className}
      role="img"
      aria-label={label}
    >
      <rect width="200" height="280" rx="10" fill={p.bg} />
      <rect
        x="10"
        y="10"
        width="180"
        height="260"
        rx="6"
        fill="none"
        stroke={p.fg}
        strokeOpacity="0.25"
        strokeWidth="1"
        strokeDasharray="3 5"
      />
      <g>{corner}</g>
      <g transform="translate(200 0) scale(-1 1)">{corner}</g>
      <g transform="translate(0 280) scale(1 -1)">{corner}</g>
      <g transform="translate(200 280) scale(-1 -1)">{corner}</g>
      <circle
        cx="100"
        cy="128"
        r="46"
        fill="none"
        stroke={p.accent}
        strokeWidth="1.5"
      />
      <circle
        cx="100"
        cy="128"
        r="40"
        fill="none"
        stroke={p.fg}
        strokeOpacity="0.35"
        strokeWidth="1"
      />
      <text
        x="100"
        y="140"
        textAnchor="middle"
        fontSize="30"
        fontWeight="700"
        fill={p.fg}
        fontFamily="var(--font-bangla), sans-serif"
      >
        DW
      </text>
      <text
        x="100"
        y="232"
        textAnchor="middle"
        fontSize="14"
        fontWeight="600"
        fill={p.fg}
        fontFamily="var(--font-bangla), sans-serif"
      >
        {label.length > 14 ? label.slice(0, 13) + "…" : label}
      </text>
    </svg>
  );
}
