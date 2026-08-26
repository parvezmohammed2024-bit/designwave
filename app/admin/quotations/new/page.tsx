import Link from "next/link";
import { requireStaff, serverClient } from "@/lib/admin/server";
import QuotationEditor from "@/components/admin/QuotationEditor";

export const dynamic = "force-dynamic";

export default async function NewQuotation({
  searchParams,
}: {
  searchParams: { from?: string };
}) {
  await requireStaff();
  const sb = serverClient();

  // "Reorder" deep-link: prefill from a past order
  let prefill = null;
  if (searchParams.from) {
    const { data } = await sb
      .from("dw_orders")
      .select("name,phone,items,delivery_poisha")
      .eq("id", searchParams.from.toUpperCase())
      .maybeSingle();
    if (data) prefill = data;
  }

  return (
    <div>
      <Link href="/admin/quotations" className="text-sm text-brand-700 hover:underline">
        ← Quotations
      </Link>
      <h1 className="mb-6 mt-1 text-2xl font-bold">New quotation</h1>
      <QuotationEditor
        prefillName={prefill?.name ?? ""}
        prefillPhone={prefill?.phone ?? ""}
        /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
        prefillItems={(prefill?.items as any[]) ?? []}
        prefillDelivery={prefill?.delivery_poisha ?? 0}
      />
    </div>
  );
}
