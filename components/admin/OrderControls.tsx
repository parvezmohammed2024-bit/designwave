"use client";

import { useState, useTransition } from "react";
import {
  recordPayment,
  requestRevision,
  saveOrderNotes,
  setOrderStatus,
} from "@/app/admin/orders/actions";
import { tk, toPoisha, toTakaInput } from "@/lib/admin/money";
import {
  MAX_REVISIONS,
  ORDER_STATUSES,
  PAYMENT_LABEL,
  STATUS_LABEL,
  nextStatus,
  type OrderStatus,
  type PaymentKind,
} from "@/lib/admin/orders";

export default function OrderControls({
  id,
  status,
  revisionCount,
  amountDue,
  outstanding,
  notes,
  courier,
  tracking,
}: {
  id: string;
  status: OrderStatus;
  revisionCount: number;
  amountDue: number;
  outstanding: number;
  notes: string;
  courier: string;
  tracking: string;
}) {
  const [pending, start] = useTransition();
  // optimistic status so the badge/button react instantly
  const [localStatus, setLocalStatus] = useState<OrderStatus>(status);
  const [msg, setMsg] = useState("");

  const [kind, setKind] = useState<PaymentKind>("design_charge");
  const [amount, setAmount] = useState(toTakaInput(amountDue));
  const [txn, setTxn] = useState("");
  const [method, setMethod] = useState("bKash");

  const [noteText, setNoteText] = useState(notes);
  const [courierText, setCourierText] = useState(courier);
  const [trackingText, setTrackingText] = useState(tracking);

  const next = nextStatus(localStatus);

  const advance = () => {
    if (!next) return;
    const prev = localStatus;
    setLocalStatus(next);
    start(async () => {
      const res = await setOrderStatus(id, next);
      if (res.error) {
        setLocalStatus(prev);
        setMsg(res.error);
      } else setMsg(`Moved to ${STATUS_LABEL[next]}.`);
    });
  };

  const jumpTo = (s: OrderStatus) => {
    if (s === "cancelled" && !confirm("Cancel this order? This is visible to the customer on the tracking page.")) return;
    const prev = localStatus;
    setLocalStatus(s);
    start(async () => {
      const res = await setOrderStatus(id, s);
      if (res.error) {
        setLocalStatus(prev);
        setMsg(res.error);
      } else setMsg(`Status set to ${STATUS_LABEL[s]}.`);
    });
  };

  const addPayment = () => {
    const poisha = toPoisha(amount);
    if (poisha <= 0) return setMsg("Enter an amount greater than zero.");
    start(async () => {
      const res = await recordPayment(id, kind, poisha, txn, method);
      if (res.error) setMsg(res.error);
      else {
        setMsg(`Recorded ${tk(poisha)} (${PAYMENT_LABEL[kind]}).`);
        setTxn("");
      }
    });
  };

  const revise = () => {
    if (revisionCount + 1 >= MAX_REVISIONS && !confirm(
      `This is revision ${revisionCount + 1} of ${MAX_REVISIONS}. Further revisions are usually chargeable — continue?`
    )) return;
    start(async () => {
      const res = await requestRevision(id, revisionCount);
      if (res.error) setMsg(res.error);
      else {
        setLocalStatus("revision_requested");
        setMsg(`Revision ${revisionCount + 1} logged.`);
      }
    });
  };

  const saveNotes = () => {
    start(async () => {
      const res = await saveOrderNotes(id, noteText, courierText, trackingText);
      setMsg(res.error ?? "Notes saved.");
    });
  };

  const input = "w-full rounded-lg border border-ink/20 px-3 py-2 text-sm outline-none focus:border-brand-700";

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-4">
      <h2 className="font-bold">Manage</h2>
      {msg && <p className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">{msg}</p>}

      {next && (
        <button
          type="button"
          onClick={advance}
          disabled={pending}
          className="mt-3 w-full rounded-lg bg-ink px-3 py-2.5 text-sm font-bold text-paper hover:bg-brand-700 disabled:opacity-60"
        >
          Advance → {STATUS_LABEL[next]}
        </button>
      )}

      <label className="mt-3 block text-xs font-semibold uppercase tracking-wide text-ink/50">
        Set status
      </label>
      <select
        value={localStatus}
        onChange={(e) => jumpTo(e.target.value as OrderStatus)}
        disabled={pending}
        className={input}
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
        ))}
      </select>

      {/* revisions */}
      <div className="mt-4 border-t border-ink/10 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
          Revisions {revisionCount}/{MAX_REVISIONS}
        </p>
        {revisionCount >= MAX_REVISIONS - 1 && (
          <p className="mt-1 text-xs font-semibold text-amber-700">
            ⚠ At or past the free-revision limit.
          </p>
        )}
        <button
          type="button"
          onClick={revise}
          disabled={pending}
          className="mt-2 w-full rounded-lg border border-ink/20 px-3 py-2 text-sm font-semibold hover:bg-ink/5 disabled:opacity-60"
        >
          Log revision request
        </button>
      </div>

      {/* payments */}
      <div className="mt-4 border-t border-ink/10 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
          Record payment
        </p>
        <p className="mt-1 text-xs text-ink/60">Outstanding {tk(outstanding)}</p>
        <select value={kind} onChange={(e) => setKind(e.target.value as PaymentKind)} className={`${input} mt-2`}>
          {(Object.keys(PAYMENT_LABEL) as PaymentKind[]).map((k) => (
            <option key={k} value={k}>{PAYMENT_LABEL[k]}</option>
          ))}
        </select>
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" placeholder="Amount ৳" className={input} />
          <select value={method} onChange={(e) => setMethod(e.target.value)} className={input}>
            <option>bKash</option><option>Nagad</option><option>Cash</option><option>Bank</option>
          </select>
        </div>
        <input value={txn} onChange={(e) => setTxn(e.target.value)} placeholder="Transaction ID" className={`${input} mt-2`} dir="ltr" />
        <button
          type="button"
          onClick={addPayment}
          disabled={pending}
          className="mt-2 w-full rounded-lg bg-emerald-700 px-3 py-2 text-sm font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
        >
          Mark received
        </button>
      </div>

      {/* notes + courier */}
      <div className="mt-4 border-t border-ink/10 pt-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-ink/50">
          Internal notes
        </p>
        <textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={3} className={`${input} mt-2`} />
        <div className="mt-2 grid grid-cols-2 gap-2">
          <input value={courierText} onChange={(e) => setCourierText(e.target.value)} placeholder="Courier" className={input} />
          <input value={trackingText} onChange={(e) => setTrackingText(e.target.value)} placeholder="Tracking no." className={input} dir="ltr" />
        </div>
        <button
          type="button"
          onClick={saveNotes}
          disabled={pending}
          className="mt-2 w-full rounded-lg border border-ink/20 px-3 py-2 text-sm font-semibold hover:bg-ink/5 disabled:opacity-60"
        >
          Save
        </button>
      </div>
    </section>
  );
}
