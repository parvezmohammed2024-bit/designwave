import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff, serverClient } from "@/lib/admin/server";
import ComboBuilder from "@/components/admin/ComboBuilder";
import { loadCatalogueOptions } from "@/lib/admin/comboCatalogue";

export const dynamic = "force-dynamic";

export default async function EditCombo({ params }: { params: { id: string } }) {
  await requireStaff();
  const sb = serverClient();
  const [{ data: combo }, catalogue] = await Promise.all([
    sb
      .from("dw_combos")
      .select("*, dw_combo_items(product_id,tier_id,quantity,override_spec_bn,sort_order)")
      .eq("id", params.id)
      .maybeSingle(),
    loadCatalogueOptions(),
  ]);
  if (!combo) notFound();

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const c = combo as any;

  return (
    <div>
      <Link href="/admin/combos" className="text-sm text-brand-700 hover:underline">
        ← Combos
      </Link>
      <h1 className="mb-6 mt-1 text-2xl font-bold">{c.name_bn}</h1>
      <ComboBuilder
        combo={c}
        items={(c.dw_combo_items ?? []).sort(
          (a: any, b: any) => a.sort_order - b.sort_order
        )}
        catalogue={catalogue}
      />
    </div>
  );
}
