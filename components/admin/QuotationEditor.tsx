"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveQuotation, type QuoteItem } from "@/app/admin/quotations/actions";
import { tk, toPoisha, toTakaInput } from "@/lib/admin/money";

const input =
  "w-full rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand-700";
const lbl = "block text-xs font-semibold uppercase tracking-wide text-ink/50";

type Row = { name: string; quantity: string; unitPrice: string };

export default function QuotationEditor({
  prefillName,
  prefillPhone,
  prefillItems,
  prefillDelivery,
}: {
  prefillName: string;
  prefillPhone: string;
  /* eslint-disable @typescript-eslint/no-explicit-any */
  prefillItems: any[];
  prefillDelivery: number;
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");

  const [name, setName] = useState(prefillName);
  const [phone, setPhone] = useState(prefillPhone);
  const [notes, setNotes] = useState("");
  const [expires, setExpires] = useState("");
  const [delivery, setDelivery] = useState(toTakaInput(prefillDelivery));
  const [rows, setRows] = useState<Row[]>(
    prefillItems.length
      ? prefillItems.map((i) => ({
          name: i.name ?? "",
          quantity: String(i.quantity ?? 1),
          unitPrice: toTakaInput(i.unitPrice ?? 0),
        }))
      : [{ name: "", quantity: "100", unitPrice: "1" }]
  );

  const items: QuoteItem[] = rows.map((r) => {
    const q = parseInt(r.quantity, 10) || 0;
    const u = toPoisha(r.unitPrice);
    return { name: r.name, quantity: q, unitPrice: u, lineTotal: q * u };
  });
  const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
  const total = subtotal + toPoisha(delivery);

  const save = (status: "draft" | "sent") =>
    start(async () => {
      const res = await saveQuotation({
        customer_name: name,
        customer_phone: phone,
        items: items.filter((i) => i.name.trim() && i.quantity > 0),
        delivery: toPoisha(delivery),
        notes,
        expires_on: expires || null,
        status,
      });
      if (res.error) setMsg(res.error);
      else router.push("/admin/quotations");
    });

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <section className="rounded-2xl border border-ink/10 bg-white p-4">
          <h2 className="font-bold">Customer</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <label className={lbl}>Name
              <input className={`${input} mt-1 font-normal normal-case`} value={name}
                onChange={(e) => setName(e.target.value)} /></label>
            <label className={lbl}>Phone *
              <input dir="ltr" className={`${input} mt-1 font-normal normal-case`} value={phone}
                onChange={(e) => setPhone(e.target.value)} /></label>
          </div>
        </section>

        <section className="rounded-2xl border border-ink/10 bg-white p-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold">Lines</h2>
            <button type="button"
              onClick={() => setRows([...rows, { name: "", quantity: "100", unitPrice: "1" }])}
              className="rounded-lg border border-ink/20 px-3 py-1 text-xs font-semibold hover:bg-ink/5">
              + Add line
            </button>
          </div>
          <div className="mt-3 space-y-2">
            <div className="grid grid-cols-[2fr_1fr_1fr_auto_auto] gap-2 text-xs font-semibold uppercase tracking-wide text-ink/50">
              <span>Description</span><span>Qty</span><span>Rate ৳/pc</span><span>Total</span><span />
            </div>
            {rows.map((r, i) => (
              <div key={i} className="grid grid-cols-[2fr_1fr_1fr_auto_auto] items-center gap-2">
                <input className={input} value={r.name} placeholder="Item"
                  onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, name: e.target.value } : x))} />
                <input className={input} value={r.quantity} inputMode="numeric"
                  onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, quantity: e.target.value } : x))} />
                <input className={input} value={r.unitPrice} inputMode="decimal"
                  onChange={(e) => setRows(rows.map((x, j) => j === i ? { ...x, unitPrice: e.target.value } : x))} />
                <span className="w-20 text-right text-sm font-semibold">{tk(items[i]?.lineTotal ?? 0)}</span>
                <button type="button" onClick={() => setRows(rows.filter((_, j) => j !== i))}
                  className="rounded-lg border border-ink/20 px-3 py-2 text-sm hover:bg-rose-50">✕</button>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="space-y-4">
        <section className="rounded-2xl border border-ink/10 bg-white p-4">
          <h2 className="font-bold">Totals</h2>
          <label className={`${lbl} mt-3 block`}>Delivery ৳
            <input className={`${input} mt-1 font-normal normal-case`} value={delivery} inputMode="decimal"
              onChange={(e) => setDelivery(e.target.value)} /></label>
          <dl className="mt-3 space-y-1 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{tk(subtotal)}</dd></div>
            <div className="flex justify-between font-bold"><dt>Total</dt><dd>{tk(total)}</dd></div>
          </dl>
          <label className={`${lbl} mt-3 block`}>Expires on
            <input type="date" className={`${input} mt-1 font-normal normal-case`} value={expires}
              onChange={(e) => setExpires(e.target.value)} /></label>
          <label className={`${lbl} mt-3 block`}>Notes
            <textarea rows={3} className={`${input} mt-1 font-normal normal-case`} value={notes}
              onChange={(e) => setNotes(e.target.value)} /></label>
          {msg && <p className="mt-2 text-sm font-semibold text-rose-700">{msg}</p>}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <button type="button" disabled={pending} onClick={() => save("draft")}
              className="rounded-lg border border-ink/20 px-3 py-2 text-sm font-semibold hover:bg-ink/5 disabled:opacity-60">
              Save draft
            </button>
            <button type="button" disabled={pending} onClick={() => save("sent")}
              className="rounded-lg bg-ink px-3 py-2 text-sm font-bold text-paper hover:bg-brand-700 disabled:opacity-60">
              Save &amp; mark sent
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
