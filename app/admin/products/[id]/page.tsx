import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff, serverClient } from "@/lib/admin/server";
import ProductEditor from "@/components/admin/ProductEditor";

export const dynamic = "force-dynamic";

export default async function EditProduct({ params }: { params: { id: string } }) {
  await requireStaff();
  const sb = serverClient();

  const [{ data: product }, { data: cats }] = await Promise.all([
    sb
      .from("dw_products")
      .select("*, dw_price_slabs(min_qty,max_qty,unit_price), dw_addons(id,name_bn,price,type,active)")
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
        slabs={(p.dw_price_slabs ?? []).sort((a: any, b: any) => a.min_qty - b.min_qty)}
        addons={p.dw_addons ?? []}
        categories={(cats?.value as { slug: string; name_bn: string }[]) ?? []}
      />
    </div>
  );
}
