import Link from "next/link";
import { requireStaff, serverClient } from "@/lib/admin/server";
import ProductEditor from "@/components/admin/ProductEditor";

export const dynamic = "force-dynamic";

export default async function NewProduct() {
  await requireStaff();
  const sb = serverClient();
  const { data: cats } = await sb
    .from("dw_settings")
    .select("value")
    .eq("key", "categories")
    .maybeSingle();

  return (
    <div>
      <Link href="/admin/products" className="text-sm text-brand-700 hover:underline">
        ← Products
      </Link>
      <h1 className="mb-6 mt-1 text-2xl font-bold">New product</h1>
      <ProductEditor
        product={{}}
        slabs={[
          { min_qty: 100, max_qty: 499, unit_price: 100 },
          { min_qty: 500, max_qty: 999, unit_price: 80 },
          { min_qty: 1000, max_qty: 2999, unit_price: 60 },
          { min_qty: 3000, max_qty: null, unit_price: 50 },
        ]}
        addons={[]}
        categories={(cats?.value as { slug: string; name_bn: string }[]) ?? []}
      />
    </div>
  );
}
