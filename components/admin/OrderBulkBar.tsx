"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { bulkSetStatus } from "@/app/admin/orders/actions";
import { tk, fmtDate } from "@/lib/admin/money";
import {
  ORDER_STATUSES,
  STATUS_LABEL,
  STATUS_TONE,
  type OrderStatus,
} from "@/lib/admin/orders";

type Row = {
  id: string;
  name: string;
  phone: string;
  district: string;
  status: OrderStatus;
  total: number;
  due: number;
  created_at: string;
};

export default function OrderBulkBar({ orders }: { orders: Row[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [target, setTarget] = useState<OrderStatus>("in_production");
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const allOn = selected.length === orders.length && orders.length > 0;

  const apply = () => {
    if (!selected.length) return;
    if (
      !confirm(
        `Change ${selected.length} order(s) to "${STATUS_LABEL[target]}"? This notifies nobody automatically.`
      )
    )
      return;
    start(async () => {
      const res = await bulkSetStatus(selected, target);
      setMsg(res.error ? res.error : `Updated ${selected.length} order(s).`);
      setSelected([]);
    });
  };

  if (!orders.length) return null;

  return (
    <>
      {selected.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-brand-300 bg-brand-50 p-3">
          <span className="text-sm font-semibold">{selected.length} selected</span>
          <select
            value={target}
            onChange={(e) => setTarget(e.target.value as OrderStatus)}
            className="rounded-lg border border-ink/20 px-3 py-2 text-sm"
          >
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>{STATUS_LABEL[s]}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={apply}
            disabled={pending}
            className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-brand-700 disabled:opacity-60"
          >
            {pending ? "Updating…" : "Apply"}
          </button>
          <button
            type="button"
            onClick={() => setSelected([])}
            className="text-sm font-semibold text-ink/60 hover:underline"
          >
            Clear
          </button>
        </div>
      )}
      {msg && <p className="mt-3 text-sm font-semibold text-brand-700">{msg}</p>}

      <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="bg-ink/[0.03] text-left text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="p-3">
                <input
                  type="checkbox"
                  checked={allOn}
                  onChange={() => setSelected(allOn ? [] : orders.map((o) => o.id))}
                  aria-label="Select all"
                />
              </th>
              <th className="p-3">Order</th>
              <th className="p-3">Customer</th>
              <th className="p-3">District</th>
              <th className="p-3">Status</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-right">Due now</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t border-ink/10 hover:bg-ink/[0.02]">
                <td className="p-3">
                  <input
                    type="checkbox"
                    checked={selected.includes(o.id)}
                    onChange={() => toggle(o.id)}
                    aria-label={`Select ${o.id}`}
                  />
                </td>
                <td className="p-3">
                  <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand-700 hover:underline">
                    {o.id}
                  </Link>
                </td>
                <td className="p-3">
                  <span className="block font-medium">{o.name}</span>
                  <span dir="ltr" className="text-xs text-ink/55">{o.phone}</span>
                </td>
                <td className="p-3">{o.district}</td>
                <td className="p-3">
                  <span className={`whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[o.status]}`}>
                    {STATUS_LABEL[o.status]}
                  </span>
                </td>
                <td className="p-3 text-right font-semibold">{tk(o.total)}</td>
                <td className="p-3 text-right">{tk(o.due)}</td>
                <td className="p-3 whitespace-nowrap text-ink/60">{fmtDate(o.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
