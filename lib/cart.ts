"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { priceFor, normaliseQty, type Addon, type Slab } from "./pricing";

/**
 * Cart lines are self-contained snapshots: they carry the product's name,
 * image, slabs and add-ons so the drawer needs no extra fetch AND so the
 * line can be re-priced correctly when the quantity is edited in the cart.
 * All money is integer poisha.
 */
export type CartLine = {
  key: string;
  slug: string;
  name: string;
  image: string | null;
  quantity: number;
  moq: number;
  step: number;
  slabs: Slab[];
  addons: Addon[];
  /** derived, kept on the line so the UI never recomputes inconsistently */
  unitPrice: number;
  lineTotal: number;
};

export type NewCartLine = Omit<CartLine, "key" | "unitPrice" | "lineTotal">;

function repriceLine(line: NewCartLine & Partial<CartLine>): CartLine {
  const qty = normaliseQty(line.quantity, line.moq, line.step);
  const { unitPrice, total } = priceFor(line.slabs, qty, line.addons);
  const addonKey = line.addons
    .map((a) => a.name_bn)
    .sort()
    .join(",");
  return {
    ...(line as CartLine),
    key: `${line.slug}::${addonKey}`,
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
          // same product + same add-ons -> quantities accumulate, then re-slab
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
            if (quantity < l.moq) return []; // dropping below MOQ removes the line
            return [repriceLine({ ...l, quantity })];
          }),
        })),
      clear: () => set({ lines: [] }),
      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
    }),
    {
      name: "design-wave-cart-v2",
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
