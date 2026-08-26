import { requireStaff, serverClient } from "@/lib/admin/server";
import { tk } from "@/lib/admin/money";
import ReceiptBulkExport from "@/components/admin/ReceiptBulkExport";

export const dynamic = "force-dynamic";

type Bucket = { label: string; orders: number; revenue: number };

export default async function ReportsPage() {
  await requireStaff();
  const sb = serverClient();

  const [{ data: orders }, { data: payments }] = await Promise.all([
    sb.from("dw_orders").select("id,phone,items,total_poisha,status,created_at,design_finalized"),
    sb.from("dw_payments").select("kind,amount,order_id,received_at"),
  ]);

  const list = orders ?? [];
  const pays = payments ?? [];
  const live = list.filter((o) => o.status !== "cancelled");

  // revenue buckets from actual payments received
  const byDay = new Map<string, Bucket>();
  const byMonth = new Map<string, Bucket>();
  for (const p of pays) {
    const d = p.received_at.slice(0, 10);
    const m = p.received_at.slice(0, 7);
    const day = byDay.get(d) ?? { label: d, orders: 0, revenue: 0 };
    day.revenue += p.amount;
    byDay.set(d, day);
    const mon = byMonth.get(m) ?? { label: m, orders: 0, revenue: 0 };
    mon.revenue += p.amount;
    byMonth.set(m, mon);
  }
  for (const o of live) {
    const m = o.created_at.slice(0, 7);
    const mon = byMonth.get(m) ?? { label: m, orders: 0, revenue: 0 };
    mon.orders += 1;
    byMonth.set(m, mon);
  }

  // best sellers
  const products = new Map<string, { qty: number; revenue: number }>();
  for (const o of live) {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    for (const it of (Array.isArray(o.items) ? o.items : []) as any[]) {
      const cur = products.get(it.name) ?? { qty: 0, revenue: 0 };
      cur.qty += Number(it.quantity) || 0;
      cur.revenue += Number(it.lineTotal) || 0;
      products.set(it.name, cur);
    }
  }
  const bestSellers = [...products.entries()]
    .sort((a, b) => b[1].revenue - a[1].revenue)
    .slice(0, 8);

  // AOV + repeat rate
  const aov = live.length
    ? live.reduce((s, o) => s + (o.total_poisha ?? 0), 0) / live.length
    : 0;
  const phoneCounts = new Map<string, number>();
  live.forEach((o) => phoneCounts.set(o.phone, (phoneCounts.get(o.phone) ?? 0) + 1));
  const repeaters = [...phoneCounts.values()].filter((n) => n > 1).length;
  const repeatRate = phoneCounts.size ? (repeaters / phoneCounts.size) * 100 : 0;

  // design charge conversion
  const designPaidOrders = new Set(
    pays.filter((p) => p.kind === "design_charge").map((p) => p.order_id)
  );
  const converted = [...designPaidOrders].filter((id) => {
    const o = list.find((x) => x.id === id);
    return (
      o &&
      ["advance_paid", "in_production", "out_for_delivery", "delivered"].includes(o.status)
    );
  }).length;

  const monthRows = [...byMonth.values()].sort((a, b) => b.label.localeCompare(a.label));
  const dayRows = [...byDay.values()].sort((a, b) => b.label.localeCompare(a.label)).slice(0, 14);

  const Card = ({ l, v, s }: { l: string; v: string; s?: string }) => (
    <div className="rounded-2xl border border-ink/10 bg-white p-4">
      <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">{l}</p>
      <p className="mt-1 text-2xl font-bold">{v}</p>
      {s && <p className="mt-1 text-xs text-ink/55">{s}</p>}
    </div>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold">Reports</h1>

      <div className="mt-4">
        <ReceiptBulkExport />
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Card l="Average order value" v={tk(aov)} s={`${live.length} live orders`} />
        <Card l="Repeat customer rate" v={`${repeatRate.toFixed(0)}%`} s={`${repeaters} of ${phoneCounts.size}`} />
        <Card l="Design charges collected" v={String(designPaidOrders.size)} s={`${converted} went to production`} />
        <Card
          l="Design → order conversion"
          v={designPaidOrders.size ? `${((converted / designPaidOrders.size) * 100).toFixed(0)}%` : "—"}
          s="paid for design and ordered"
        />
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <section className="rounded-2xl border border-ink/10 bg-white p-4">
          <h2 className="font-bold">Monthly</h2>
          <p className="text-xs text-ink/55">Revenue counts payments actually received.</p>
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-ink/50">
              <tr><th className="pb-2">Month</th><th className="pb-2 text-right">Orders</th><th className="pb-2 text-right">Received</th></tr>
            </thead>
            <tbody>
              {monthRows.map((m) => (
                <tr key={m.label} className="border-t border-ink/10">
                  <td className="py-2">{m.label}</td>
                  <td className="py-2 text-right">{m.orders}</td>
                  <td className="py-2 text-right font-semibold">{tk(m.revenue)}</td>
                </tr>
              ))}
              {monthRows.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-ink/50">No data yet</td></tr>}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-ink/55">
            Seasonal comparison: read Eid months against neighbouring months above.
          </p>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white p-4">
          <h2 className="font-bold">Best sellers</h2>
          <table className="mt-3 w-full text-sm">
            <thead className="text-left text-xs uppercase tracking-wide text-ink/50">
              <tr><th className="pb-2">Product</th><th className="pb-2 text-right">Pieces</th><th className="pb-2 text-right">Revenue</th></tr>
            </thead>
            <tbody>
              {bestSellers.map(([name, s]) => (
                <tr key={name} className="border-t border-ink/10">
                  <td className="py-2">{name}</td>
                  <td className="py-2 text-right">{s.qty.toLocaleString("en-IN")}</td>
                  <td className="py-2 text-right font-semibold">{tk(s.revenue)}</td>
                </tr>
              ))}
              {bestSellers.length === 0 && <tr><td colSpan={3} className="py-6 text-center text-ink/50">No data yet</td></tr>}
            </tbody>
          </table>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white p-4 lg:col-span-2">
          <h2 className="font-bold">Last 14 days received</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {dayRows.map((d) => (
                <tr key={d.label} className="border-t border-ink/10">
                  <td className="py-2">{d.label}</td>
                  <td className="py-2">
                    <span className="block h-2 rounded bg-brand-500"
                      style={{ width: `${Math.min(100, (d.revenue / Math.max(...dayRows.map((x) => x.revenue), 1)) * 100)}%` }} />
                  </td>
                  <td className="py-2 text-right font-semibold">{tk(d.revenue)}</td>
                </tr>
              ))}
              {dayRows.length === 0 && <tr><td className="py-6 text-center text-ink/50">No payments recorded yet</td></tr>}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
