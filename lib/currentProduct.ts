"use client";

import { create } from "zustand";

/**
 * Lets the floating WhatsApp button prefill the product name without
 * refetching — the product page sets it on mount.
 */
type State = { name: string | null; setName: (n: string | null) => void };

export const useCurrentProduct = create<State>((set) => ({
  name: null,
  setName: (name) => set({ name }),
}));
