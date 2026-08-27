import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff, serverClient } from "@/lib/admin/server";
import ProductEditor from "@/components/admin/ProductEditor";
import TierManager from "@/components/admin/TierManager";
import ImageManager from "@/components/admin/ImageManager";

export const dynamic = "force-dynamic";

export default async function EditProduct({ params }: { params: { id: string } }) {
  await requireStaff();
  const sb = serverClient();

  const [{ data: product }, { data: cats }] = await Promise.all([
    sb
      .from("dw_products")
      .select(
        "*, dw_price_slabs(min_qty,max_qty,unit_price,tier_id), dw_addons(id,name_bn,price,type,active), dw_product_tiers(id,name_bn,description_bn,sort_order,is_default,active,dw_price_slabs(min_qty,max_qty,unit_price)), dw_product_images(id,url,alt_bn,sort_order,is_primary,tier_id)"
      )
      .eq("id", params.id)
      .maybeSingle(),
    sb.from("dw_settings").select("value").eq("key", "categories").maybeSingle(),
  ]);

  if (!product) notFound();
  /* eslint-disable @typescript-eslint/no-explicit-any */
  const p = product as any;

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-brand-700 hover:underline">
        ← Products
      </Link>
      <h1 className="mb-6 mt-1 text-2xl font-bold">{p.name_bn}</h1>
      <ProductEditor
        product={p}
        slabs={(p.dw_price_slabs ?? [])
          .filter((s: any) => !s.tier_id)
          .sort((a: any, b: any) => a.min_qty - b.min_qty)}
        addons={p.dw_addons ?? []}
        categories={(cats?.value as { slug: string; name_bn: string }[]) ?? []}
        hasTiers={(p.dw_product_tiers ?? []).length > 0}
      />

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <TierManager
          productId={p.id}
          moq={p.moq}
          initial={(p.dw_product_tiers ?? [])
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((t: any) => ({
              id: t.id,
              name_bn: t.name_bn,
              description_bn: t.description_bn,
              sort_order: t.sort_order,
              is_default: t.is_default,
              active: t.active,
              slabs: t.dw_price_slabs ?? [],
            }))}
        />
        <ImageManager
          productId={p.id}
          slug={p.slug}
          tiers={(p.dw_product_tiers ?? []).map((t: any) => ({
            id: t.id,
            name_bn: t.name_bn,
          }))}
          initial={(p.dw_product_images ?? [])
            .sort((a: any, b: any) => a.sort_order - b.sort_order)
            .map((i: any) => ({
              id: i.id,
              url: i.url,
              alt_bn: i.alt_bn ?? "",
              sort_order: i.sort_order,
              is_primary: i.is_primary,
              tier_id: i.tier_id,
            }))}
        />
      </div>
    </div>
  );
}
