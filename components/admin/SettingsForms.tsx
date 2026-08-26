"use client";

import { useState, useTransition } from "react";
import { saveSetting } from "@/app/admin/banner/actions";
import { toPoisha, toTakaInput } from "@/lib/admin/money";

const input =
  "w-full rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand-700";
const lbl = "block text-xs font-semibold uppercase tracking-wide text-ink/50";

type Contact = { phone: string; whatsapp: string; email: string; hours_bn: string; address_bn: string };
type Payment = { bkash: string; nagad: string; design_charge: number };
type Delivery = { inside_ctg: number; outside_ctg: number };
type Template = { key: string; label: string; body_bn: string };

export default function SettingsForms({
  contact,
  payment,
  delivery,
  whatsappTemplates,
}: {
  contact?: Contact;
  payment?: Payment;
  delivery?: Delivery;
  whatsappTemplates?: Template[];
  canEditStaff?: boolean;
}) {
  const [c, setC] = useState<Contact>(
    contact ?? { phone: "", whatsapp: "", email: "", hours_bn: "", address_bn: "" }
  );
  const [p, setP] = useState({
    bkash: payment?.bkash ?? "",
    nagad: payment?.nagad ?? "",
    design_charge: toTakaInput(payment?.design_charge ?? 20000),
  });
  const [d, setD] = useState({
    inside_ctg: toTakaInput(delivery?.inside_ctg ?? 8000),
    outside_ctg: toTakaInput(delivery?.outside_ctg ?? 15000),
  });
  const [t, setT] = useState<Template[]>(whatsappTemplates ?? []);
  const [msg, setMsg] = useState("");
  const [pending, start] = useTransition();

  const save = (key: string, value: unknown) =>
    start(async () => {
      const res = await saveSetting(key, value);
      setMsg(res.error ?? `Saved ${key}.`);
    });

  const btn =
    "mt-3 rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-brand-700 disabled:opacity-60";

  return (
    <div className="mt-4 space-y-4">
      {msg && <p className="text-sm font-semibold text-brand-700">{msg}</p>}

      <section className="rounded-2xl border border-ink/10 bg-white p-4">
        <h2 className="font-bold">Business &amp; contact</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className={lbl}>Phone (intl)
            <input dir="ltr" className={`${input} mt-1 font-normal normal-case`} value={c.phone}
              onChange={(e) => setC({ ...c, phone: e.target.value })} /></label>
          <label className={lbl}>WhatsApp (digits only)
            <input dir="ltr" className={`${input} mt-1 font-normal normal-case`} value={c.whatsapp}
              onChange={(e) => setC({ ...c, whatsapp: e.target.value })} /></label>
          <label className={lbl}>Email
            <input dir="ltr" className={`${input} mt-1 font-normal normal-case`} value={c.email}
              onChange={(e) => setC({ ...c, email: e.target.value })} /></label>
          <label className={lbl}>Hours (Bangla)
            <input className={`${input} mt-1 font-normal normal-case`} value={c.hours_bn}
              onChange={(e) => setC({ ...c, hours_bn: e.target.value })} /></label>
          <label className={`${lbl} sm:col-span-2`}>Address (Bangla)
            <input className={`${input} mt-1 font-normal normal-case`} value={c.address_bn}
              onChange={(e) => setC({ ...c, address_bn: e.target.value })} /></label>
        </div>
        <button type="button" className={btn} disabled={pending} onClick={() => save("contact", c)}>
          Save contact
        </button>
      </section>

      <section className="rounded-2xl border border-ink/10 bg-white p-4">
        <h2 className="font-bold">Payment</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <label className={lbl}>bKash number
            <input dir="ltr" className={`${input} mt-1 font-normal normal-case`} value={p.bkash}
              onChange={(e) => setP({ ...p, bkash: e.target.value })} /></label>
          <label className={lbl}>Nagad number
            <input dir="ltr" className={`${input} mt-1 font-normal normal-case`} value={p.nagad}
              onChange={(e) => setP({ ...p, nagad: e.target.value })} /></label>
          <label className={lbl}>Design charge ৳
            <input className={`${input} mt-1 font-normal normal-case`} value={p.design_charge} inputMode="decimal"
              onChange={(e) => setP({ ...p, design_charge: e.target.value })} /></label>
        </div>
        <button type="button" className={btn} disabled={pending}
          onClick={() => save("payment", {
            bkash: p.bkash, nagad: p.nagad, design_charge: toPoisha(p.design_charge),
          })}>
          Save payment
        </button>
      </section>

      <section className="rounded-2xl border border-ink/10 bg-white p-4">
        <h2 className="font-bold">Delivery rates</h2>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <label className={lbl}>Inside Chattogram city ৳
            <input className={`${input} mt-1 font-normal normal-case`} value={d.inside_ctg} inputMode="decimal"
              onChange={(e) => setD({ ...d, inside_ctg: e.target.value })} /></label>
          <label className={lbl}>Outside Chattogram ৳
            <input className={`${input} mt-1 font-normal normal-case`} value={d.outside_ctg} inputMode="decimal"
              onChange={(e) => setD({ ...d, outside_ctg: e.target.value })} /></label>
        </div>
        <button type="button" className={btn} disabled={pending}
          onClick={() => save("delivery", {
            inside_ctg: toPoisha(d.inside_ctg), outside_ctg: toPoisha(d.outside_ctg),
          })}>
          Save delivery
        </button>
      </section>

      <section className="rounded-2xl border border-ink/10 bg-white p-4">
        <h2 className="font-bold">WhatsApp templates</h2>
        <p className="mt-1 text-xs text-ink/55">
          Variables: {"{{name}}"} {"{{order_id}}"} {"{{amount}}"} {"{{payment_number}}"}
        </p>
        <div className="mt-3 space-y-3">
          {t.map((tpl, i) => (
            <div key={i} className="rounded-lg border border-ink/10 p-3">
              <div className="grid gap-2 sm:grid-cols-2">
                <input className={input} value={tpl.label} placeholder="Label"
                  onChange={(e) => setT(t.map((x, j) => j === i ? { ...x, label: e.target.value } : x))} />
                <input dir="ltr" className={input} value={tpl.key} placeholder="key"
                  onChange={(e) => setT(t.map((x, j) => j === i ? { ...x, key: e.target.value } : x))} />
              </div>
              <textarea rows={2} className={`${input} mt-2`} value={tpl.body_bn}
                onChange={(e) => setT(t.map((x, j) => j === i ? { ...x, body_bn: e.target.value } : x))} />
              <button type="button" onClick={() => setT(t.filter((_, j) => j !== i))}
                className="mt-2 text-xs font-semibold text-rose-700 hover:underline">Remove</button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <button type="button"
            onClick={() => setT([...t, { key: "", label: "", body_bn: "" }])}
            className="mt-3 rounded-lg border border-ink/20 px-3 py-2 text-sm font-semibold hover:bg-ink/5">
            + Add template
          </button>
          <button type="button" className={btn} disabled={pending}
            onClick={() => save("whatsapp_templates", t)}>
            Save templates
          </button>
        </div>
      </section>
    </div>
  );
}
