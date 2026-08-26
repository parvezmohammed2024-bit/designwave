import Link from "next/link";
import { requireStaff, serverClient } from "@/lib/admin/server";
import { tk, fmtDate } from "@/lib/admin/money";
import { ORDER_STATUSES, STATUS_LABEL, STATUS_TONE, type OrderStatus } from "@/lib/admin/orders";
import OrderBulkBar from "@/components/admin/OrderBulkBar";

export const dynamic = "force-dynamic";

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string; from?: string; to?: string };
}) {
  await requireStaff();
  const sb = serverClient();

  let query = sb
    .from("dw_orders")
    .select("id,name,phone,district,status,total_poisha,amount_due_poisha,created_at")
    .order("created_at", { ascending: false })
    .limit(200);

  if (searchParams.status) query = query.eq("status", searchParams.status);
  if (searchParams.from) query = query.gte("created_at", searchParams.from);
  if (searchParams.to) query = query.lte("created_at", `${searchParams.to}T23:59:59`);

  const q = searchParams.q?.trim();
  if (q) {
    query = query.or(
      `id.ilike.%${q.toUpperCase()}%,phone.ilike.%${q}%,name.ilike.%${q}%`
    );
  }

  const { data: orders } = await query;
  const list = orders ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Orders</h1>
        <p className="text-sm text-ink/60">{list.length} shown</p>
      </div>

      <form className="mt-4 grid gap-2 rounded-2xl border border-ink/10 bg-white p-3 sm:grid-cols-2 lg:grid-cols-5">
        <input
          name="q"
          defaultValue={searchParams.q ?? ""}
          placeholder="Search phone / order ID / name"
          className="rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand-700 lg:col-span-2"
        />
        <select
          name="status"
          defaultValue={searchParams.status ?? ""}
          className="rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand-700"
        >
          <option value="">All statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>{STATUS_LABEL[s]}</option>
          ))}
        </select>
        <input type="date" name="from" defaultValue={searchParams.from ?? ""}
          className="rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand-700" />
        <div className="flex gap-2">
          <input type="date" name="to" defaultValue={searchParams.to ?? ""}
            className="w-full rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand-700" />
          <button className="shrink-0 rounded-lg bg-ink px-4 text-sm font-semibold text-paper hover:bg-brand-700">
            Filter
          </button>
        </div>
      </form>

      <OrderBulkBar
        orders={list.map((o) => ({
          id: o.id,
          name: o.name,
          phone: o.phone,
          district: o.district,
          status: o.status as OrderStatus,
          total: o.total_poisha ?? 0,
          due: o.amount_due_poisha ?? 0,
          created_at: o.created_at,
        }))}
      />

      {list.length === 0 && (
        <p className="mt-6 rounded-2xl border border-ink/10 bg-white p-8 text-center text-ink/55">
          No orders match these filters.
        </p>
      )}
    </div>
  );
}
