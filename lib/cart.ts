"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { priceFor, normaliseQty, type Addon, type Slab } from "./pricing";

/**
 * Cart lines are self-contained snapshots: they carry the product's name,
 * image, tier, slabs and add-ons so the drawer needs no extra fetch AND so
 * the line can be re-priced correctly when the quantity is edited.
 * All money is integer poisha.
 */
/** A component of a combo, shown indented under its line. */
export type CartComponent = {
  name: string;
  tierName: string | null;
  quantity: number;
  value: number;
  spec: string | null;
};

export type CartLine = {
  key: string;
  slug: string;
  name: string;
  image: string | null;
  /** combos are fixed-price bundles; products price through slabs */
  kind: "product" | "combo";
  /** combo only */
  components?: CartComponent[];
  regularValue?: number;
  /** null when the product has no tiers */
  tierId: string | null;
  tierName: string | null;
  quantity: number;
  moq: number;
  step: number;
  slabs: Slab[];
  addons: Addon[];
  /** derived, kept on the line so the UI never recomputes inconsistently */
  unitPrice: number;
  lineTotal: number;
};

export type NewCartLine = Omit<CartLine, "key" | "unitPrice" | "lineTotal"> & {
  /** required for combos (the fixed bundle price); ignored for products */
  unitPrice?: number;
};

function repriceLine(line: NewCartLine & Partial<CartLine>): CartLine {
  // A combo is a fixed price for the bundle — no MOQ, no slabs, the only
  // quantity is how many bundles.
  if (line.kind === "combo") {
    const qty = Math.max(1, Math.round(line.quantity));
    return {
      ...(line as CartLine),
      key: `combo::${line.slug}`,
      quantity: qty,
      unitPrice: line.unitPrice ?? 0,
      lineTotal: (line.unitPrice ?? 0) * qty,
    };
  }

  const qty = normaliseQty(line.quantity, line.moq, line.step);
  const { unitPrice, total } = priceFor(line.slabs, qty, line.addons);
  const addonKey = line.addons.map((a) => a.name_bn).sort().join(",");
  return {
    ...(line as CartLine),
    // the same product in two tiers is two separate lines
    key: `${line.slug}::${line.tierId ?? "-"}::${addonKey}`,
    quantity: qty,
    unitPrice,
    lineTotal: total,
  };
}

type CartState = {
  lines: CartLine[];
  drawerOpen: boolean;
  add: (line: NewCartLine) => void;
  remove: (key: string) => void;
  setQuantity: (key: string, quantity: number) => void;
  clear: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      drawerOpen: false,
      add: (incoming) =>
        set((s) => {
          const priced = repriceLine(incoming);
          const existing = s.lines.find((l) => l.key === priced.key);
          if (!existing) return { lines: [...s.lines, priced] };
          // same product + tier + add-ons -> quantities accumulate, then re-slab
          return {
            lines: s.lines.map((l) =>
              l.key === priced.key
                ? repriceLine({ ...l, quantity: l.quantity + priced.quantity })
                : l
            ),
          };
        }),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      setQuantity: (key, quantity) =>
        set((s) => ({
          lines: s.lines.flatMap((l) => {
            if (l.key !== key) return [l];
            if (l.kind === "combo")
              return quantity < 1 ? [] : [repriceLine({ ...l, quantity })];
            if (quantity < l.moq) return []; // dropping below MOQ removes the line
            return [repriceLine({ ...l, quantity })];
          }),
        })),
      clear: () => set({ lines: [] }),
      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
    }),
    {
      // bumped: lines gained tier fields
      name: "design-wave-cart-v3",
      partialize: (s) => ({ lines: s.lines }) as CartState,
    }
  )
);

/** Subtotal in poisha. */
export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.lineTotal, 0);
}

/** Distinct line count (badge). */
export function cartCount(lines: CartLine[]): number {
  return lines.length;
}

/** Total pieces across the cart. */
export function cartPieces(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}
