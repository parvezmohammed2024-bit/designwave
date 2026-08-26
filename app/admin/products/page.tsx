import Link from "next/link";
import { requireStaff, serverClient } from "@/lib/admin/server";
import { tk } from "@/lib/admin/money";
import ProductRowActions from "@/components/admin/ProductRowActions";
import BulkPriceForm from "@/components/admin/BulkPriceForm";

export const dynamic = "force-dynamic";

export default async function ProductsPage() {
  await requireStaff();
  const sb = serverClient();

  const [{ data: products }, { data: cats }] = await Promise.all([
    sb
      .from("dw_products")
      .select("*, dw_price_slabs(min_qty,max_qty,unit_price)")
      .order("sort_order"),
    sb.from("dw_settings").select("value").eq("key", "categories").maybeSingle(),
  ]);

  const categories =
    (cats?.value as { slug: string; name_bn: string }[] | undefined) ?? [];
  const list = products ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Products</h1>
        <Link
          href="/admin/products/new"
          className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-brand-700"
        >
          + New product
        </Link>
      </div>

      <BulkPriceForm categories={categories} />

      <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full min-w-[820px] text-sm">
          <thead className="bg-ink/[0.03] text-left text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="p-3">Product</th>
              <th className="p-3">Category</th>
              <th className="p-3 text-right">MOQ / step</th>
              <th className="p-3">Slabs (per pc)</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {list.map((p) => {
              /* eslint-disable @typescript-eslint/no-explicit-any */
              const slabs = ((p as any).dw_price_slabs ?? []).sort(
                (a: any, b: any) => a.min_qty - b.min_qty
              );
              return (
                <tr key={p.id} className="border-t border-ink/10 align-top hover:bg-ink/[0.02]">
                  <td className="p-3">
                    <Link
                      href={`/admin/products/${p.id}`}
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      {p.name_bn}
                    </Link>
                    <span className="block text-xs text-ink/50" dir="ltr">{p.slug}</span>
                    {p.featured && (
                      <span className="mt-1 inline-block rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold text-violet-800">
                        FEATURED
                      </span>
                    )}
                  </td>
                  <td className="p-3">{p.category_slug ?? "—"}</td>
                  <td className="p-3 text-right">
                    {p.moq.toLocaleString("en-IN")} / {p.step_quantity.toLocaleString("en-IN")}
                  </td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-1">
                      {slabs.map((s: any) => (
                        <span key={s.min_qty} className="whitespace-nowrap rounded bg-ink/5 px-1.5 py-0.5 text-xs">
                          {s.min_qty}{s.max_qty ? `–${s.max_qty}` : "+"}: {tk(s.unit_price)}
                        </span>
                      ))}
                      {slabs.length === 0 && <span className="text-xs text-rose-600">no slabs</span>}
                    </div>
                  </td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      p.status === "active" ? "bg-emerald-100 text-emerald-800" : "bg-ink/10 text-ink/60"
                    }`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <ProductRowActions
                      id={p.id}
                      slug={p.slug}
                      name={p.name_bn}
                      status={p.status as "active" | "draft"}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
