import Link from "next/link";
import { requireStaff, serverClient } from "@/lib/admin/server";
import { tk, fmtDateTime } from "@/lib/admin/money";
import { STATUS_LABEL, STATUS_TONE, type OrderStatus } from "@/lib/admin/orders";

export const dynamic = "force-dynamic";

function startOf(days: number) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - days);
  return d.toISOString();
}

export default async function AdminDashboard() {
  await requireStaff();
  const sb = serverClient();

  const [ordersRes, paymentsRes, activityRes] = await Promise.all([
    sb
      .from("dw_orders")
      .select("id,name,phone,status,total_poisha,amount_due_poisha,created_at")
      .order("created_at", { ascending: false }),
    sb.from("dw_payments").select("amount,received_at"),
    sb
      .from("dw_activity_log")
      .select("action,entity,entity_id,actor_email,created_at")
      .order("created_at", { ascending: false })
      .limit(8),
  ]);

  const orders = ordersRes.data ?? [];
  const payments = paymentsRes.data ?? [];
  const activity = activityRes.data ?? [];

  const since = (iso: string) => orders.filter((o) => o.created_at >= iso);
  const today = since(startOf(0));
  const week = since(startOf(7));
  const month = since(startOf(30));

  const revenueMonth = payments
    .filter((p) => p.received_at >= startOf(30))
    .reduce((s, p) => s + p.amount, 0);

  const pendingVerification = orders.filter(
    (o) => o.status === "payment_pending"
  );
  const awaitingApproval = orders.filter((o) =>
    ["design_in_review", "revision_requested"].includes(o.status)
  );
  const inProduction = orders.filter((o) =>
    ["in_production", "advance_paid"].includes(o.status)
  );

  const lastOrderAt = orders[0]?.created_at;
  const quietDays = lastOrderAt
    ? Math.floor((Date.now() - new Date(lastOrderAt).getTime()) / 86_400_000)
    : null;

  const cards = [
    { label: "Orders today", value: today.length, href: "/admin/orders" },
    { label: "This week", value: week.length, href: "/admin/orders" },
    { label: "This month", value: month.length, href: "/admin/orders" },
    { label: "Revenue (30d)", value: tk(revenueMonth), href: "/admin/reports" },
  ];

  const queues = [
    {
      label: "Pending payment verification",
      list: pendingVerification,
      href: "/admin/orders?status=payment_pending",
      tone: "border-amber-300 bg-amber-50",
    },
    {
      label: "Awaiting design approval",
      list: awaitingApproval,
      href: "/admin/orders?status=design_in_review",
      tone: "border-sky-300 bg-sky-50",
    },
    {
      label: "In production",
      list: inProduction,
      href: "/admin/orders?status=in_production",
      tone: "border-indigo-300 bg-indigo-50",
    },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold">Dashboard</h1>

      {quietDays !== null && quietDays >= 3 && (
        <p className="mt-4 rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-900">
          ⚠ No new orders in {quietDays} days — last order {fmtDateTime(lastOrderAt!)}.
        </p>
      )}
      {orders.length === 0 && (
        <p className="mt-4 rounded-xl border border-ink/15 bg-white px-4 py-3 text-sm text-ink/70">
          No orders yet. Once customers check out they will appear here.
        </p>
      )}

      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.label}
            href={c.href}
            className="rounded-2xl border border-ink/10 bg-white p-4 transition-shadow hover:shadow-md"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
              {c.label}
            </p>
            <p className="mt-2 text-2xl font-bold">{c.value}</p>
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-3 lg:grid-cols-3">
        {queues.map((q) => (
          <Link
            key={q.label}
            href={q.href}
            className={`rounded-2xl border p-4 transition-shadow hover:shadow-md ${q.tone}`}
          >
            <p className="text-sm font-semibold">{q.label}</p>
            <p className="mt-1 text-3xl font-bold">{q.list.length}</p>
            {q.list.slice(0, 2).map((o) => (
              <p key={o.id} className="mt-1 truncate text-xs opacity-80">
                {o.id} · {o.name}
              </p>
            ))}
          </Link>
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <section className="rounded-2xl border border-ink/10 bg-white p-4 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm font-semibold text-brand-700 hover:underline">
              View all
            </Link>
          </div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead className="text-left text-xs uppercase tracking-wide text-ink/50">
                <tr>
                  <th className="pb-2">Order</th>
                  <th className="pb-2">Customer</th>
                  <th className="pb-2">Status</th>
                  <th className="pb-2 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {orders.slice(0, 8).map((o) => (
                  <tr key={o.id} className="border-t border-ink/10">
                    <td className="py-2">
                      <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand-700 hover:underline">
                        {o.id}
                      </Link>
                    </td>
                    <td className="py-2">{o.name}</td>
                    <td className="py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[o.status as OrderStatus]}`}>
                        {STATUS_LABEL[o.status as OrderStatus]}
                      </span>
                    </td>
                    <td className="py-2 text-right font-semibold">{tk(o.total_poisha)}</td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr><td colSpan={4} className="py-6 text-center text-ink/50">Nothing yet</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white p-4">
          <h2 className="font-bold">Quick actions</h2>
          <div className="mt-3 space-y-2">
            <Link href="/admin/products/new" className="block rounded-lg border border-ink/15 px-3 py-2 text-sm font-semibold hover:bg-ink/5">+ New product</Link>
            <Link href="/admin/quotations/new" className="block rounded-lg border border-ink/15 px-3 py-2 text-sm font-semibold hover:bg-ink/5">+ New quotation</Link>
            <Link href="/admin/banner" className="block rounded-lg border border-ink/15 px-3 py-2 text-sm font-semibold hover:bg-ink/5">Edit homepage banner</Link>
            <Link href="/admin/settings" className="block rounded-lg border border-ink/15 px-3 py-2 text-sm font-semibold hover:bg-ink/5">Delivery & payment settings</Link>
          </div>

          <h2 className="mt-6 font-bold">Activity</h2>
          <ul className="mt-2 space-y-2 text-xs text-ink/70">
            {activity.map((a, i) => (
              <li key={i} className="border-t border-ink/10 pt-2">
                <span className="font-semibold text-ink">{a.action}</span>{" "}
                {a.entity} {a.entity_id}
                <br />
                <span className="text-ink/45">
                  {a.actor_email} · {fmtDateTime(a.created_at)}
                </span>
              </li>
            ))}
            {activity.length === 0 && <li className="text-ink/45">No activity yet</li>}
          </ul>
        </section>
      </div>
    </div>
  );
}
