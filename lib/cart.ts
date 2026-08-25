"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DELIVERY_INSIDE_CTG, DELIVERY_OUTSIDE_CTG } from "./site";

export type CartLine = {
  key: string; // slug + variant fingerprint
  slug: string;
  tierQty: number; // pieces in the chosen tier
  unitPrice: number; // price of one tier bundle
  lamination?: string;
  quantity: number; // how many bundles
};

type CartState = {
  lines: CartLine[];
  drawerOpen: boolean;
  add: (line: Omit<CartLine, "key" | "quantity">) => void;
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
      add: (line) =>
        set((s) => {
          const key = `${line.slug}:${line.tierQty}:${line.lamination ?? ""}`;
          const existing = s.lines.find((l) => l.key === key);
          const lines = existing
            ? s.lines.map((l) =>
                l.key === key ? { ...l, quantity: l.quantity + 1 } : l
              )
            : [...s.lines, { ...line, key, quantity: 1 }];
          return { lines };
        }),
      remove: (key) => set((s) => ({ lines: s.lines.filter((l) => l.key !== key) })),
      setQuantity: (key, quantity) =>
        set((s) => ({
          lines:
            quantity < 1
              ? s.lines.filter((l) => l.key !== key)
              : s.lines.map((l) => (l.key === key ? { ...l, quantity } : l)),
        })),
      clear: () => set({ lines: [] }),
      openDrawer: () => set({ drawerOpen: true }),
      closeDrawer: () => set({ drawerOpen: false }),
    }),
    {
      name: "design-wave-cart",
      partialize: (s) => ({ lines: s.lines }) as CartState,
    }
  )
);

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0);
}

export function cartCount(lines: CartLine[]): number {
  return lines.reduce((sum, l) => sum + l.quantity, 0);
}

export function deliveryCharge(insideCity: boolean): number {
  return insideCity ? DELIVERY_INSIDE_CTG : DELIVERY_OUTSIDE_CTG;
}
