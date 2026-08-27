import "server-only";
import { serverClient } from "@/lib/admin/server";
import type { CatalogueOption } from "@/components/admin/ComboBuilder";
import type { Slab } from "@/lib/pricing";

/** Products + tiers with their slabs, powering the builder's live preview. */
export async function loadCatalogueOptions(): Promise<CatalogueOption[]> {
  const sb = serverClient();
  const { data } = await sb
    .from("dw_products")
    .select(
      "id,slug,name_bn,sort_order,dw_price_slabs(min_qty,max_qty,unit_price,tier_id),dw_product_tiers(id,name_bn,sort_order,dw_price_slabs(min_qty,max_qty,unit_price))"
    )
    .order("sort_order");

  /* eslint-disable @typescript-eslint/no-explicit-any */
  return (data ?? []).map((p: any) => ({
    id: p.id,
    slug: p.slug,
    name_bn: p.name_bn,
    slabs: ((p.dw_price_slabs ?? []) as (Slab & { tier_id: string | null })[])
      .filter((s) => !s.tier_id)
      .sort((a, b) => a.min_qty - b.min_qty),
    tiers: ((p.dw_product_tiers ?? []) as any[])
      .sort((a, b) => a.sort_order - b.sort_order)
      .map((t) => ({
        id: t.id,
        name_bn: t.name_bn,
        slabs: ((t.dw_price_slabs ?? []) as Slab[]).sort(
          (a, b) => a.min_qty - b.min_qty
        ),
      })),
  }));
}

export const COMBO_SELECT = `*, dw_combo_items(id, quantity, override_spec_bn, sort_order, tier_id, product_id,
  dw_products(id, slug, name_bn, image, dw_price_slabs(min_qty,max_qty,unit_price,tier_id),
    dw_product_images(url,sort_order,is_primary)),
  dw_product_tiers(id, name_bn, dw_price_slabs(min_qty,max_qty,unit_price)))`;
