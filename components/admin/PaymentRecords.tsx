"use client";

import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  rejectPayment,
  signReceipt,
  verifyPayment,
} from "@/app/admin/orders/actions";
import { tk, toPoisha, toTakaInput, fmtDateTime } from "@/lib/admin/money";
import { PAYMENT_LABEL, type PaymentKind } from "@/lib/admin/orders";

export type AdminPayment = {
  id: string;
  kind: PaymentKind;
  amount: number | null;
  txn_id: string | null;
  method: string | null;
  receipt_path: string | null;
  verification_status: "pending" | "verified" | "rejected";
  rejection_reason: string | null;
  source: "customer" | "staff";
  received_at: string;
};

const TONE = {
  pending: "bg-amber-100 text-amber-900",
  verified: "bg-emerald-100 text-emerald-900",
  rejected: "bg-rose-100 text-rose-900",
};

/**
 * Payment records with receipt preview, lightbox and verify/reject.
 * `duplicateTxns` are transaction IDs seen on more than one order.
 */
export default function PaymentRecords({
  orderId,
  payments,
  duplicateTxns,
  customerPhone,
  customerName,
  rejectTemplate,
}: {
  orderId: string;
  payments: AdminPayment[];
  duplicateTxns: string[];
  customerPhone: string;
  customerName: string;
  rejectTemplate: string;
}) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [amounts, setAmounts] = useState<Record<string, string>>(
    Object.fromEntries(
      payments.map((p) => [p.id, p.amount ? toTakaInput(p.amount) : ""])
    )
  );
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [reason, setReason] = useState("");

  // mint signed URLs for any receipts on screen
  useEffect(() => {
    let cancelled = false;
    (async () => {
      for (const p of payments) {
        if (!p.receipt_path || urls[p.id]) continue;
        const res = await signReceipt(p.receipt_path);
        if (!cancelled && res.url) {
          setUrls((u) => ({ ...u, [p.id]: res.url! }));
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [payments]);

  const waHref = (p: AdminPayment, why: string) => {
    const body = rejectTemplate
      .replace(/\{\{name\}\}/g, customerName)
      .replace(/\{\{order_id\}\}/g, orderId)
      .replace(/\{\{reason\}\}/g, why)
      .replace(/\{\{amount\}\}/g, p.amount ? tk(p.amount) : "");
    return `https://wa.me/${customerPhone.replace(/\D/g, "").replace(/^0/, "880")}?text=${encodeURIComponent(body)}`;
  };

  if (!payments.length) {
    return (
      <section className="rounded-2xl border border-ink/10 bg-white p-4">
        <h2 className="font-bold">Payment records</h2>
        <p className="mt-2 text-sm text-ink/55">
          No payment claim submitted yet.
        </p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-4">
      <h2 className="font-bold">Payment records</h2>
      {msg && (
        <p className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
          {msg}
        </p>
      )}

      <ul className="mt-3 space-y-3">
        {payments.map((p) => {
          const dupe = p.txn_id && duplicateTxns.includes(p.txn_id);
          return (
            <li key={p.id} className="rounded-xl border border-ink/10 p-3">
              <div className="flex flex-wrap items-start gap-3">
                {/* receipt thumbnail */}
                {p.receipt_path && (
                  <button
                    type="button"
                    onClick={() => urls[p.id] && setLightbox(urls[p.id])}
                    className="relative h-24 w-20 shrink-0 overflow-hidden rounded-lg border border-ink/15 bg-ink/5"
                    aria-label="View receipt full size"
                  >
                    {urls[p.id] ? (
                      p.receipt_path.endsWith(".pdf") ? (
                        <span className="flex h-full w-full items-center justify-center text-xs font-bold">
                          PDF
                        </span>
                      ) : (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={urls[p.id]}
                          alt="Payment receipt"
                          className="h-full w-full object-cover"
                        />
                      )
                    ) : (
                      <span className="flex h-full w-full items-center justify-center text-[10px] text-ink/40">
                        loading…
                      </span>
                    )}
                  </button>
                )}

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{PAYMENT_LABEL[p.kind]}</span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TONE[p.verification_status]}`}>
                      {p.verification_status}
                    </span>
                    {p.source === "customer" && (
                      <span className="rounded-full bg-ink/5 px-2 py-0.5 text-xs">
                        customer submitted
                      </span>
                    )}
                  </div>

                  <p className="mt-1 text-sm">
                    <strong>{p.amount ? tk(p.amount) : "amount not stated"}</strong>
                    {p.txn_id && (
                      <>
                        {" · "}
                        <span dir="ltr" className="font-mono text-xs">{p.txn_id}</span>
                      </>
                    )}
                    {p.method && <> · {p.method}</>}
                  </p>
                  <p className="text-xs text-ink/45">{fmtDateTime(p.received_at)}</p>

                  {dupe && (
                    <p className="mt-1 rounded-lg bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700">
                      ⚠ This transaction ID appears on another order — check before verifying.
                    </p>
                  )}
                  {p.verification_status === "rejected" && p.rejection_reason && (
                    <p className="mt-1 text-xs font-semibold text-rose-700">
                      Rejected: {p.rejection_reason}
                    </p>
                  )}

                  {/* actions */}
                  {p.verification_status === "pending" && (
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <input
                        value={amounts[p.id] ?? ""}
                        onChange={(e) =>
                          setAmounts((a) => ({ ...a, [p.id]: e.target.value }))
                        }
                        inputMode="decimal"
                        placeholder="Amount ৳"
                        className="w-28 rounded-lg border border-ink/20 px-2 py-1.5 text-sm"
                      />
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() =>
                          start(async () => {
                            const res = await verifyPayment(
                              p.id,
                              orderId,
                              toPoisha(amounts[p.id] ?? "0")
                            );
                            setMsg(res.error ?? "Payment verified.");
                          })
                        }
                        className="rounded-lg bg-emerald-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-800 disabled:opacity-60"
                      >
                        Approve
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setRejecting(rejecting === p.id ? null : p.id);
                          setReason("");
                        }}
                        className="rounded-lg border border-rose-300 px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-50"
                      >
                        Reject
                      </button>
                      {p.receipt_path && urls[p.id] && (
                        <a
                          href={urls[p.id]}
                          download
                          className="rounded-lg border border-ink/20 px-3 py-1.5 text-xs font-semibold hover:bg-ink/5"
                        >
                          Download
                        </a>
                      )}
                    </div>
                  )}

                  {rejecting === p.id && (
                    <div className="mt-2 rounded-lg border border-rose-200 bg-rose-50 p-2">
                      <input
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Reason (the customer sees this)"
                        className="w-full rounded-lg border border-ink/20 px-2 py-1.5 text-sm"
                      />
                      <div className="mt-2 flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() =>
                            start(async () => {
                              const res = await rejectPayment(p.id, orderId, reason);
                              setMsg(res.error ?? "Payment rejected.");
                              if (!res.error) setRejecting(null);
                            })
                          }
                          className="rounded-lg bg-rose-700 px-3 py-1.5 text-xs font-bold text-white hover:bg-rose-800 disabled:opacity-60"
                        >
                          Confirm reject
                        </button>
                        {reason.trim() && (
                          <a
                            href={waHref(p, reason)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-bold text-white"
                          >
                            Tell customer on WhatsApp
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <AnimatePresence>
        {lightbox && (
          <motion.div
            className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/80 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setLightbox(null)}
          >
            <button
              type="button"
              onClick={() => setLightbox(null)}
              aria-label="Close"
              className="absolute right-4 top-4 rounded-lg bg-white px-3 py-2 text-sm font-bold"
            >
              ✕
            </button>
            {lightbox.includes(".pdf") ? (
              <iframe src={lightbox} title="Receipt" className="h-[85vh] w-full max-w-3xl rounded-lg bg-white" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={lightbox}
                alt="Payment receipt full size"
                className="max-h-[90vh] max-w-full rounded-lg object-contain"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
