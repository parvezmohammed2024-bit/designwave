"use client";

import { useEffect } from "react";
import { useCurrentProduct } from "@/lib/currentProduct";

/** Tells the floating WhatsApp button which product is on screen. */
export default function SetCurrentProduct({ name }: { name: string }) {
  const setName = useCurrentProduct((s) => s.setName);
  useEffect(() => {
    setName(name);
    return () => setName(null);
  }, [name, setName]);
  return null;
}
