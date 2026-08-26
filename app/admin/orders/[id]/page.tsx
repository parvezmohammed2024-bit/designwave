import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff, serverClient } from "@/lib/admin/server";
import { tk, fmtDateTime } from "@/lib/admin/money";
import { STATUS_LABEL, STATUS_TONE, type OrderStatus } from "@/lib/admin/orders";
import OrderControls from "@/components/admin/OrderControls";
import WhatsAppTemplates from "@/components/admin/WhatsAppTemplates";

export const dynamic = "force-dynamic";

type Item = {
  name: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  addons?: { name_bn: string; price: number; type: string }[];
};

export default async function OrderDetail({ params }: { params: { id: string } }) {
  await requireStaff();
  const sb = serverClient();

  const [{ data: order }, { data: payments }, { data: templates }, { data: paySettings }] =
    await Promise.all([
      sb.from("dw_orders").select("*").eq("id", params.id.toUpperCase()).maybeSingle(),
      sb.from("dw_payments").select("*").eq("order_id", params.id.toUpperCase()).order("received_at"),
      sb.from("dw_settings").select("value").eq("key", "whatsapp_templates").maybeSingle(),
      sb.from("dw_settings").select("value").eq("key", "payment").maybeSingle(),
    ]);

  if (!order) notFound();

  const items: Item[] = Array.isArray(order.items) ? order.items : [];
  const paid = (payments ?? []).reduce((s, p) => s + p.amount, 0);
  const outstanding = (order.total_poisha ?? 0) - paid;
  const files: string[] = Array.isArray(order.design_files) ? order.design_files : [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <Link href="/admin/orders" className="text-sm text-brand-700 hover:underline">
            ← Orders
          </Link>
          <h1 className="mt-1 text-2xl font-bold">{order.id}</h1>
        </div>
        <div className="flex items-center gap-2">
          <span className={`rounded-full px-3 py-1 text-sm font-semibold ${STATUS_TONE[order.status as OrderStatus]}`}>
            {STATUS_LABEL[order.status as OrderStatus]}
          </span>
          <Link
            href={`/admin/orders/${order.id}/job-sheet`}
            target="_blank"
            className="rounded-lg border border-ink/20 px-3 py-2 text-sm font-semibold hover:bg-ink/5"
          >
            Job sheet ↗
          </Link>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* customer */}
          <section className="rounded-2xl border border-ink/10 bg-white p-4">
            <h2 className="font-bold">Customer</h2>
            <div className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
              <div><dt className="text-ink/50">Name</dt><dd className="font-semibold">{order.name}</dd></div>
              <div><dt className="text-ink/50">Phone</dt><dd dir="ltr" className="font-semibold">{order.phone}</dd></div>
              <div><dt className="text-ink/50">District</dt><dd>{order.district} {order.inside_city && "(city)"}</dd></div>
              <div><dt className="text-ink/50">Placed</dt><dd>{fmtDateTime(order.created_at)}</dd></div>
              <div className="sm:col-span-2"><dt className="text-ink/50">Address</dt><dd>{order.address}</dd></div>
              {order.note && (
                <div className="sm:col-span-2"><dt className="text-ink/50">Customer note</dt><dd>{order.note}</dd></div>
              )}
            </div>
          </section>

          {/* items */}
          <section className="rounded-2xl border border-ink/10 bg-white p-4">
            <h2 className="font-bold">Line items</h2>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[460px] text-sm">
                <thead className="text-left text-xs uppercase tracking-wide text-ink/50">
                  <tr><th className="pb-2">Product</th><th className="pb-2 text-right">Qty</th><th className="pb-2 text-right">Rate</th><th className="pb-2 text-right">Total</th></tr>
                </thead>
                <tbody>
                  {items.map((it, i) => (
                    <tr key={i} className="border-t border-ink/10">
                      <td className="py-2">
                        {it.name}
                        {it.addons && it.addons.length > 0 && (
                          <span className="block text-xs text-brand-700">
                            + {it.addons.map((a) => a.name_bn).join(", ")}
                          </span>
                        )}
                      </td>
                      <td className="py-2 text-right">{it.quantity.toLocaleString("en-IN")}</td>
                      <td className="py-2 text-right">{tk(it.unitPrice)}</td>
                      <td className="py-2 text-right font-semibold">{tk(it.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <dl className="mt-3 space-y-1 border-t border-ink/10 pt-3 text-sm">
              <div className="flex justify-between"><dt>Subtotal</dt><dd>{tk(order.subtotal_poisha)}</dd></div>
              <div className="flex justify-between"><dt>Delivery</dt><dd>{tk(order.delivery_poisha)}</dd></div>
              <div className="flex justify-between text-base font-bold"><dt>Total</dt><dd>{tk(order.total_poisha)}</dd></div>
            </dl>
          </section>

          {/* design files */}
          <section className="rounded-2xl border border-ink/10 bg-white p-4">
            <h2 className="font-bold">Design files</h2>
            {files.length === 0 ? (
              <p className="mt-2 text-sm text-ink/55">
                None uploaded — customer may send them over WhatsApp.
              </p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {files.map((f) => (
                  <li key={f} className="flex items-center justify-between gap-3 rounded-lg border border-ink/10 px-3 py-2">
                    <span className="min-w-0 truncate">{f.split("/").pop()}</span>
                    <DownloadLink path={f} />
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        {/* right rail */}
        <div className="space-y-4">
          <section className="rounded-2xl border border-ink/10 bg-white p-4">
            <h2 className="font-bold">Payments</h2>
            <dl className="mt-2 space-y-1 text-sm">
              <div className="flex justify-between"><dt>Received</dt><dd className="font-semibold text-emerald-700">{tk(paid)}</dd></div>
              <div className="flex justify-between"><dt>Outstanding</dt><dd className={`font-semibold ${outstanding > 0 ? "text-amber-700" : "text-emerald-700"}`}>{tk(outstanding)}</dd></div>
            </dl>
            {(payments ?? []).length > 0 && (
              <ul className="mt-3 space-y-2 border-t border-ink/10 pt-3 text-xs">
                {payments!.map((p) => (
                  <li key={p.id}>
                    <span className="font-semibold">{tk(p.amount)}</span> · {p.kind}
                    {p.txn_id && <> · <span dir="ltr">{p.txn_id}</span></>}
                    <br />
                    <span className="text-ink/45">{fmtDateTime(p.received_at)}</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <OrderControls
            id={order.id}
            status={order.status as OrderStatus}
            revisionCount={order.revision_count ?? 0}
            amountDue={order.amount_due_poisha ?? 0}
            outstanding={outstanding}
            notes={order.internal_notes ?? ""}
            courier={order.courier_name ?? ""}
            tracking={order.tracking_number ?? ""}
          />

          <WhatsAppTemplates
            templates={(templates?.value as { key: string; label: string; body_bn: string }[]) ?? []}
            phone={order.phone}
            vars={{
              name: order.name,
              order_id: order.id,
              amount: tk(order.amount_due_poisha ?? 0),
              payment_number:
                (paySettings?.value as { bkash?: string })?.bkash ?? "01836-065919",
            }}
          />
        </div>
      </div>
    </div>
  );
}

/** Routes through /admin/orders/download, which mints a signed URL. */
function DownloadLink({ path }: { path: string }) {
  return (
    <a
      href={`/admin/orders/download?path=${encodeURIComponent(path)}`}
      target="_blank"
      rel="noopener noreferrer"
      className="shrink-0 rounded-lg border border-ink/20 px-3 py-1 text-xs font-semibold hover:bg-ink/5"
    >
      Download
    </a>
  );
}
