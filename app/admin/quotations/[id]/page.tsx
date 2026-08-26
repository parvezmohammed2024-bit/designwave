import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff, serverClient } from "@/lib/admin/server";
import { tk, fmtDate } from "@/lib/admin/money";
import PrintButton from "@/components/admin/PrintButton";
import QuotationActions from "@/components/admin/QuotationActions";

export const dynamic = "force-dynamic";

export default async function QuotationDetail({
  params,
}: {
  params: { id: string };
}) {
  await requireStaff();
  const sb = serverClient();
  const { data: q } = await sb
    .from("dw_quotations")
    .select("*")
    .eq("id", params.id.toUpperCase())
    .maybeSingle();
  if (!q) notFound();

  /* eslint-disable @typescript-eslint/no-explicit-any */
  const items = (Array.isArray(q.items) ? q.items : []) as any[];

  return (
    <div>
      <div className="print:hidden">
        <Link href="/admin/quotations" className="text-sm text-brand-700 hover:underline">
          ← Quotations
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <PrintButton />
          <QuotationActions id={q.id} phone={q.customer_phone} total={q.total} status={q.status} />
        </div>
      </div>

      <div className="mx-auto mt-4 max-w-2xl rounded-2xl border border-ink/10 bg-white p-8 print:border-0 print:p-0">
        <div className="flex items-start justify-between border-b-2 border-ink pb-4">
          <div>
            <h1 className="text-2xl font-bold">QUOTATION</h1>
            <p className="text-sm">Design Wave · Chattogram</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-bold">{q.id}</p>
            <p className="text-sm">{fmtDate(q.created_at)}</p>
            {q.expires_on && <p className="text-sm">Valid until {q.expires_on}</p>}
          </div>
        </div>

        <div className="mt-4 text-sm">
          <p className="font-bold uppercase tracking-wide">For</p>
          <p>{q.customer_name || "—"}</p>
          <p dir="ltr">{q.customer_phone}</p>
        </div>

        <table className="mt-6 w-full border-collapse text-sm">
          <thead>
            <tr className="border-y-2 border-ink text-left">
              <th className="py-2">Description</th>
              <th className="py-2 text-right">Qty</th>
              <th className="py-2 text-right">Rate</th>
              <th className="py-2 text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it, i) => (
              <tr key={i} className="border-b border-ink/20">
                <td className="py-2">{it.name}</td>
                <td className="py-2 text-right">{Number(it.quantity).toLocaleString("en-IN")}</td>
                <td className="py-2 text-right">{tk(it.unitPrice)}</td>
                <td className="py-2 text-right">{tk(it.lineTotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="mt-4 flex justify-end">
          <dl className="w-56 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{tk(q.subtotal)}</dd></div>
            <div className="flex justify-between"><dt>Delivery</dt><dd>{tk(q.delivery)}</dd></div>
            <div className="mt-1 flex justify-between border-t border-ink pt-1 text-base font-bold">
              <dt>Total</dt><dd>{tk(q.total)}</dd>
            </div>
          </dl>
        </div>

        {q.notes && (
          <>
            <p className="mt-6 font-bold uppercase tracking-wide">Notes</p>
            <p className="text-sm">{q.notes}</p>
          </>
        )}
        <p className="mt-8 text-xs text-ink/60">
          Payment: ৳200 design charge → design approval → 50% advance → print → delivery.
        </p>
      </div>
    </div>
  );
}
