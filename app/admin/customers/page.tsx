import Link from "next/link";
import { requireStaff, serverClient } from "@/lib/admin/server";
import { tk, fmtDate } from "@/lib/admin/money";
import CustomerExport from "@/components/admin/CustomerExport";

export const dynamic = "force-dynamic";

const SEGMENTS = {
  all: "All customers",
  repeat: "Repeat (2+ orders)",
  dormant: "Dormant 60+ days",
  high: "High value (৳5,000+)",
} as const;

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { q?: string; segment?: keyof typeof SEGMENTS };
}) {
  await requireStaff();
  const sb = serverClient();

  const [{ data: customers }, { data: orders }] = await Promise.all([
    sb.from("dw_customers").select("*").order("created_at", { ascending: false }),
    sb.from("dw_orders").select("phone,total_poisha,created_at,status"),
  ]);

  const byPhone = new Map<string, { count: number; value: number; last: string }>();
  for (const o of orders ?? []) {
    const cur = byPhone.get(o.phone) ?? { count: 0, value: 0, last: o.created_at };
    cur.count += 1;
    if (o.status !== "cancelled") cur.value += o.total_poisha ?? 0;
    if (o.created_at > cur.last) cur.last = o.created_at;
    byPhone.set(o.phone, cur);
  }

  const dormantCut = Date.now() - 60 * 86_400_000;
  const q = searchParams.q?.trim().toLowerCase();
  const segment = searchParams.segment ?? "all";

  let rows = (customers ?? []).map((c) => {
    const s = byPhone.get(c.phone) ?? { count: 0, value: 0, last: c.created_at };
    return { ...c, orders: s.count, lifetime: s.value, last: s.last };
  });

  if (q) {
    rows = rows.filter(
      (r) => r.phone.includes(q) || (r.name ?? "").toLowerCase().includes(q)
    );
  }
  if (segment === "repeat") rows = rows.filter((r) => r.orders >= 2);
  if (segment === "dormant")
    rows = rows.filter((r) => new Date(r.last).getTime() < dormantCut);
  if (segment === "high") rows = rows.filter((r) => r.lifetime >= 500_000);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Customers</h1>
        <CustomerExport
          rows={rows.map((r) => ({
            name: r.name ?? "",
            phone: r.phone,
            orders: r.orders,
            lifetime: r.lifetime / 100,
            last: r.last,
            tags: (r.tags ?? []).join("|"),
          }))}
        />
      </div>

      <form className="mt-4 flex flex-wrap gap-2 rounded-2xl border border-ink/10 bg-white p-3">
        <input name="q" defaultValue={searchParams.q ?? ""} placeholder="Search name or phone"
          className="flex-1 rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand-700" />
        <select name="segment" defaultValue={segment}
          className="rounded-lg border border-ink/20 px-3 py-2 text-sm">
          {Object.entries(SEGMENTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
        <button className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-brand-700">
          Filter
        </button>
      </form>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full min-w-[680px] text-sm">
          <thead className="bg-ink/[0.03] text-left text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="p-3">Customer</th><th className="p-3">Tags</th>
              <th className="p-3 text-right">Orders</th><th className="p-3 text-right">Lifetime</th>
              <th className="p-3">Last order</th><th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-ink/10 hover:bg-ink/[0.02]">
                <td className="p-3">
                  <Link href={`/admin/customers/${encodeURIComponent(r.phone)}`}
                    className="font-semibold text-brand-700 hover:underline">
                    {r.name || "—"}
                  </Link>
                  <span className="block text-xs text-ink/55" dir="ltr">{r.phone}</span>
                </td>
                <td className="p-3">
                  {(r.tags ?? []).map((t: string) => (
                    <span key={t} className="mr-1 rounded bg-ink/5 px-1.5 py-0.5 text-xs">{t}</span>
                  ))}
                </td>
                <td className="p-3 text-right">{r.orders}</td>
                <td className="p-3 text-right font-semibold">{tk(r.lifetime)}</td>
                <td className="p-3 whitespace-nowrap text-ink/60">{fmtDate(r.last)}</td>
                <td className="p-3">
                  <a href={`https://wa.me/${r.phone.replace(/\D/g, "").replace(/^0/, "880")}`}
                    target="_blank" rel="noopener noreferrer"
                    className="rounded-lg border border-ink/20 px-2.5 py-1 text-xs font-semibold hover:bg-ink/5">
                    WhatsApp
                  </a>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-ink/50">No customers match.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
