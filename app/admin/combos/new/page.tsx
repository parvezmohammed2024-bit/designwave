import Link from "next/link";
import { requireStaff } from "@/lib/admin/server";
import ComboBuilder from "@/components/admin/ComboBuilder";
import { loadCatalogueOptions } from "@/lib/admin/comboCatalogue";

export const dynamic = "force-dynamic";

export default async function NewCombo() {
  await requireStaff();
  const catalogue = await loadCatalogueOptions();
  return (
    <div>
      <Link href="/admin/combos" className="text-sm text-brand-700 hover:underline">
        ← Combos
      </Link>
      <h1 className="mb-6 mt-1 text-2xl font-bold">New combo</h1>
      <ComboBuilder combo={{}} items={[]} catalogue={catalogue} />
    </div>
  );
}
