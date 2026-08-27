import { notFound } from "next/navigation";
import { requireStaff, serverClient } from "@/lib/admin/server";
import { tk, fmtDateTime } from "@/lib/admin/money";
import { STATUS_LABEL, type OrderStatus } from "@/lib/admin/orders";
import PrintButton from "@/components/admin/PrintButton";

export const dynamic = "force-dynamic";

type Item = {
  name: string;
  tier?: string | null;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  addons?: { name_bn: string }[];
};

/** Print-ready job sheet for the press. Ctrl+P → Save as PDF. */
export default async function JobSheet({ params }: { params: { id: string } }) {
  await requireStaff();
  const sb = serverClient();
  const { data: order } = await sb
    .from("dw_orders")
    .select("*")
    .eq("id", params.id.toUpperCase())
    .maybeSingle();
  if (!order) notFound();

  const items: Item[] = Array.isArray(order.items) ? order.items : [];

  return (
    <div className="mx-auto max-w-3xl bg-white p-8 text-ink print:p-0">
      <PrintButton />

      <div className="flex items-start justify-between border-b-2 border-ink pb-4">
        <div>
          <h1 className="text-3xl font-bold">JOB SHEET</h1>
          <p className="mt-1 text-sm">Design Wave · Chattogram</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold">{order.id}</p>
          <p className="text-sm">{fmtDateTime(order.created_at)}</p>
          <p className="mt-1 text-sm font-semibold">
            {STATUS_LABEL[order.status as OrderStatus]}
          </p>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-6 text-sm">
        <div>
          <h2 className="font-bold uppercase tracking-wide">Customer</h2>
          <p className="mt-1">{order.name}</p>
          <p dir="ltr">{order.phone}</p>
        </div>
        <div>
          <h2 className="font-bold uppercase tracking-wide">Deliver to</h2>
          <p className="mt-1">{order.address}</p>
          <p>{order.district}{order.inside_city ? " (city)" : ""}</p>
          {order.courier_name && <p className="mt-1">Courier: {order.courier_name} {order.tracking_number}</p>}
        </div>
      </div>

      <h2 className="mt-6 font-bold uppercase tracking-wide">Production</h2>
      <table className="mt-2 w-full border-collapse text-sm">
        <thead>
          <tr className="border-y-2 border-ink text-left">
            <th className="py-2">Product</th>
            <th className="py-2">Finishing</th>
            <th className="py-2 text-right">Qty</th>
            <th className="py-2 text-right">Rate</th>
            <th className="py-2 text-right">Amount</th>
          </tr>
        </thead>
        <tbody>
          {items.map((it, i) => (
            <tr key={i} className="border-b border-ink/30">
              <td className="py-3 font-semibold">
                {it.name}
                {it.tier && <span className="block text-xs font-normal">মান: {it.tier}</span>}
              </td>
              <td className="py-3">{it.addons?.map((a) => a.name_bn).join(", ") || "—"}</td>
              <td className="py-3 text-right text-lg font-bold">
                {it.quantity.toLocaleString("en-IN")}
              </td>
              <td className="py-3 text-right">{tk(it.unitPrice)}</td>
              <td className="py-3 text-right">{tk(it.lineTotal)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <dl className="w-64 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{tk(order.subtotal_poisha)}</dd></div>
          <div className="flex justify-between"><dt>Delivery</dt><dd>{tk(order.delivery_poisha)}</dd></div>
          <div className="mt-1 flex justify-between border-t border-ink pt-1 text-base font-bold">
            <dt>Total</dt><dd>{tk(order.total_poisha)}</dd>
          </div>
        </dl>
      </div>

      {order.note && (
        <>
          <h2 className="mt-6 font-bold uppercase tracking-wide">Customer note</h2>
          <p className="mt-1 text-sm">{order.note}</p>
        </>
      )}
      {order.internal_notes && (
        <>
          <h2 className="mt-4 font-bold uppercase tracking-wide">Internal notes</h2>
          <p className="mt-1 text-sm">{order.internal_notes}</p>
        </>
      )}

      <div className="mt-10 grid grid-cols-3 gap-6 text-xs">
        {["Designed by", "Printed by", "Checked by"].map((l) => (
          <div key={l}>
            <div className="h-10 border-b border-ink" />
            <p className="mt-1">{l}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
