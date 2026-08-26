import { toBanglaDigits } from "./format";

/**
 * ALL money in this file is INTEGER POISHA (1 taka = 100 poisha).
 * Never use floats for money — slab rates like ৳0.60/pc make float
 * rounding errors compound fast across thousands of pieces.
 */

export type Slab = {
  min_qty: number;
  /** null = open ended (e.g. 3000+) */
  max_qty: number | null;
  /** poisha per piece */
  unit_price: number;
};

export type Addon = {
  id?: string;
  name_bn: string;
  /** poisha — flat total, or per piece depending on `type` */
  price: number;
  type: "flat" | "per_unit";
};

/** The slab a given quantity falls into, or null if below the lowest. */
export function resolveSlab(slabs: Slab[], qty: number): Slab | null {
  const sorted = [...slabs].sort((a, b) => a.min_qty - b.min_qty);
  for (const s of sorted) {
    if (qty >= s.min_qty && (s.max_qty === null || qty <= s.max_qty)) return s;
  }
  // above every defined slab -> use the open-ended/highest one
  const last = sorted[sorted.length - 1];
  if (last && qty > last.min_qty) return last;
  return null;
}

export function unitPriceFor(slabs: Slab[], qty: number, fallback = 0): number {
  return resolveSlab(slabs, qty)?.unit_price ?? fallback;
}

/** Cheapest per-piece rate anywhere in the table (reached at the top slab). */
export function lowestUnitPrice(slabs: Slab[], fallback = 0): number {
  if (!slabs.length) return fallback;
  return Math.min(...slabs.map((s) => s.unit_price));
}

/**
 * The smallest amount a customer can actually spend: MOQ priced at the
 * MOQ's own slab. Powers the "৳X থেকে" label.
 *
 * Deliberately NOT `lowestUnitPrice * moq` — the cheapest rate belongs to
 * the top slab, so that product would advertise a price nobody can buy at.
 */
export function minOrderValue(
  slabs: Slab[],
  moq: number,
  fallback = 0
): number {
  return unitPriceFor(slabs, moq, fallback) * moq;
}

export type PriceBreakdown = {
  unitPrice: number;
  baseTotal: number;
  addonTotal: number;
  total: number;
  slab: Slab | null;
};

export function priceFor(
  slabs: Slab[],
  qty: number,
  addons: Addon[] = [],
  fallbackUnit = 0
): PriceBreakdown {
  const slab = resolveSlab(slabs, qty);
  const unitPrice = slab?.unit_price ?? fallbackUnit;
  const baseTotal = unitPrice * qty;
  const addonTotal = addons.reduce(
    (sum, a) => sum + (a.type === "per_unit" ? a.price * qty : a.price),
    0
  );
  return { unitPrice, baseTotal, addonTotal, total: baseTotal + addonTotal, slab };
}

/**
 * "আরও ৳X বাঁচান" nudge: how much the customer saves on the CURRENT
 * order by topping up to the next slab. Returns null when they're
 * already on the best rate, or the next slab is unrealistically far.
 */
export function nextSlabNudge(
  slabs: Slab[],
  qty: number,
  /** only nudge when the jump is within this multiple of the step */
  maxStepsAway = 10,
  step = 100
): { qtyNeeded: number; targetQty: number; saving: number; unitPrice: number } | null {
  const sorted = [...slabs].sort((a, b) => a.min_qty - b.min_qty);
  const next = sorted.find((s) => s.min_qty > qty);
  if (!next) return null;

  const currentUnit = unitPriceFor(slabs, qty);
  if (next.unit_price >= currentUnit) return null;

  const qtyNeeded = next.min_qty - qty;
  if (qtyNeeded > maxStepsAway * step) return null;

  // saving = what they'd pay now for that many pieces vs at the better rate
  const costNow = currentUnit * next.min_qty;
  const costThen = next.unit_price * next.min_qty;
  const saving = costNow - costThen;
  if (saving <= 0) return null;

  return { qtyNeeded, targetQty: next.min_qty, saving, unitPrice: next.unit_price };
}

/** Round a typed quantity up to the nearest valid step at/above MOQ. */
export function normaliseQty(qty: number, moq: number, step: number): number {
  if (!Number.isFinite(qty) || qty < moq) return moq;
  const stepsAbove = Math.round((qty - moq) / step);
  return moq + Math.max(0, stepsAbove) * step;
}

// ---------- formatting ----------

/** ৳ with Bangla numerals. Whole taka when exact, else 2 decimals. */
export function formatPoisha(poisha: number): string {
  const taka = poisha / 100;
  const str =
    poisha % 100 === 0
      ? Math.round(taka).toLocaleString("en-IN")
      : taka.toLocaleString("en-IN", {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
  return `৳${toBanglaDigits(str)}`;
}

/** Per-piece rate, always 2 decimals: ৳০.৬০ */
export function formatUnitPoisha(poisha: number): string {
  return `৳${toBanglaDigits((poisha / 100).toFixed(2))}`;
}

/** "১০০–৪৯৯ পিস" / "৩০০০+ পিস" */
export function slabLabel(slab: Slab): string {
  return slab.max_qty === null
    ? `${toBanglaDigits(slab.min_qty)}+ পিস`
    : `${toBanglaDigits(slab.min_qty)}–${toBanglaDigits(slab.max_qty)} পিস`;
}
