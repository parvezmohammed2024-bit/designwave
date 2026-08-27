"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/lib/cart";
import type { Combo } from "@/lib/combos";
import { matchingCombos, shapeCombo } from "@/lib/combos";
import ComboUpsell from "./ComboUpsell";

/**
 * Looks at what's already in the cart and offers the combo upgrade when a
 * line exactly matches one of its components. Fetches combos lazily —
 * the drawer is client-side and has no server props.
 */
export default function CartComboUpsell() {
  const lines = useCart((s) => s.lines);
  const [combos, setCombos] = useState<Combo[]>([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // the combo shape needs the same nested read the server uses
      const { data } = await supabase
        .from("dw_combos")
        .select(
          `*, dw_combo_items(id, quantity, override_spec_bn, sort_order, tier_id, product_id,
             dw_products(id, slug, name_bn, image,
               dw_price_slabs(min_qty,max_qty,unit_price,tier_id),
               dw_product_images(url,sort_order,is_primary)),
             dw_product_tiers(id, name_bn, dw_price_slabs(min_qty,max_qty,unit_price)))`
        )
        .eq("active", true)
        .order("sort_order");
      if (cancelled || !data) return;
      setCombos(data.map(shapeCombo));
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!combos.length) return null;

  // already holding a combo? nothing to upsell
  if (lines.some((l) => l.kind === "combo")) return null;

  for (const line of lines) {
    if (line.kind !== "product") continue;
    const hits = matchingCombos(combos, line.slug, line.quantity, line.tierId);
    if (hits.length) {
      return (
        <div className="px-5">
          <ComboUpsell
            combos={combos}
            productSlug={line.slug}
            quantity={line.quantity}
            tierId={line.tierId}
            swapFromCart
          />
        </div>
      );
    }
  }
  return null;
}
