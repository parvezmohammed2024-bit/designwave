"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useState, useTransition } from "react";
import { reviseReceipt } from "@/app/admin/receipts/actions";
import { tk } from "@/lib/admin/money";
import { PAYMENT_KIND_BN } from "@/lib/receipt/theme";

export type ReceiptOption = {
  paymentId: string;
  kind: string;
  amount: number;
  receiptNo: string | null;
  token: string | null;
  revision: number;
};

/**
 * Receipt row beneath the WhatsApp templates. wa.me links cannot carry
 * attachments, so the flow is: download the PDF, then attach it manually.
 */
export default function ReceiptPanel({
  orderId,
  options,
  customerPhone,
  customerName,
  siteOrigin,
}: {
  orderId: string;
  options: ReceiptOption[];
  customerPhone: string;
  customerName: string;
  siteOrigin: string;
}) {
  const [idx, setIdx] = useState(0);
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [revising, setRevising] = useState(false);
  const [reason, setReason] = useState("");

  if (!options.length) {
    return (
      <section className="rounded-2xl border border-ink/10 bg-white p-4">
        <h2 className="font-bold">রসিদ / Receipt</h2>
        <p className="mt-2 text-sm text-ink/55">
          Verify a payment first — receipts are only issued against verified
          payments.
        </p>
      </section>
    );
  }

  const current = options[Math.min(idx, options.length - 1)];
  const pdfUrl = `/api/receipts/${current.paymentId}`;

  const waMessage =
    `আসসালামু আলাইকুম ${customerName}, আপনার ${orderId} অর্ডারের ` +
    `${PAYMENT_KIND_BN[current.kind] ?? current.kind} বাবদ ${tk(current.amount)} ` +
    `পেমেন্টের রসিদ প্রস্তুত।` +
    (current.token ? ` অনলাইনে যাচাই করুন: ${siteOrigin}/receipt/${current.token}` : "");

  const waHref = `https://wa.me/${customerPhone
    .replace(/\D/g, "")
    .replace(/^0/, "880")}?text=${encodeURIComponent(waMessage)}`;

  // The PDF route issues the receipt itself on first request, so the
  // buttons can act immediately with no intermediate step.

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-4">
      <h2 className="font-bold">রসিদ / Receipt</h2>

      {options.length > 1 && (
        <>
          <label
            htmlFor="receipt-pick"
            className="mt-3 block text-xs font-semibold uppercase tracking-wide text-ink/50"
          >
            Which payment?
          </label>
          <select
            id="receipt-pick"
            value={idx}
            onChange={(e) => setIdx(Number(e.target.value))}
            className="mt-1 w-full rounded-lg border border-ink/20 px-3 py-2 text-sm"
          >
            {options.map((o, i) => (
              <option key={o.paymentId} value={i}>
                {PAYMENT_KIND_BN[o.kind] ?? o.kind} — {tk(o.amount)}
                {o.receiptNo ? ` (${o.receiptNo})` : " (not issued)"}
              </option>
            ))}
          </select>
        </>
      )}

      <p className="mt-2 text-xs text-ink/55">
        {current.receiptNo ? (
          <>
            {current.receiptNo}
            {current.revision > 1 && ` · revision ${current.revision}`}
          </>
        ) : (
          "Not issued yet — the first download will issue it."
        )}
      </p>

      {msg && (
        <p className="mt-2 rounded-lg bg-brand-50 px-3 py-2 text-xs font-semibold text-brand-700">
          {msg}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <a
          href={pdfUrl}
          className="flex-1 rounded-lg bg-ink px-3 py-2.5 text-center text-sm font-bold text-paper hover:bg-brand-700"
        >
          রসিদ ডাউনলোড / Download PDF
        </a>
        <button
          type="button"
          aria-label="Preview receipt"
          onClick={() => setPreview(`${pdfUrl}?disposition=inline`)}
          className="rounded-lg border border-ink/20 px-3 text-sm hover:bg-ink/5"
        >
          👁
        </button>
      </div>

      <a
        href={waHref}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 block rounded-lg bg-[#25D366] px-3 py-2.5 text-center text-sm font-bold text-white hover:brightness-95"
      >
        রসিদ পাঠান / Send receipt
      </a>

      <p className="mt-2 text-xs text-ink/55">
        PDF ডাউনলোড করে WhatsApp-এ অ্যাটাচ করুন
      </p>

      {/* revision */}
      {current.receiptNo && (
        <div className="mt-3 border-t border-ink/10 pt-3">
          {!revising ? (
            <button
              type="button"
              onClick={() => setRevising(true)}
              className="text-xs font-semibold text-brand-700 hover:underline"
            >
              Order details corrected? Re-issue this receipt
            </button>
          ) : (
            <div>
              <input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="What was corrected?"
                className="w-full rounded-lg border border-ink/20 px-3 py-2 text-sm"
              />
              <p className="mt-1 text-xs text-ink/50">
                Keeps receipt number {current.receiptNo}; bumps the revision.
              </p>
              <div className="mt-2 flex gap-2">
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    start(async () => {
                      const res = await reviseReceipt(
                        current.paymentId,
                        orderId,
                        reason
                      );
                      setMsg(res.error ?? `Revised to v${res.revision}.`);
                      if (!res.error) {
                        setRevising(false);
                        setReason("");
                      }
                    })
                  }
                  className="rounded-lg bg-ink px-3 py-1.5 text-xs font-bold text-paper disabled:opacity-60"
                >
                  Re-issue
                </button>
                <button
                  type="button"
                  onClick={() => setRevising(false)}
                  className="rounded-lg border border-ink/20 px-3 py-1.5 text-xs font-semibold"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      <AnimatePresence>
        {preview && (
          <motion.div
            className="fixed inset-0 z-[80] flex flex-col bg-ink/80 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="mb-3 flex items-center justify-between">
              <p className="font-bold text-white">
                {current.receiptNo} — preview
              </p>
              <div className="flex gap-2">
                <a
                  href={pdfUrl}
                  className="rounded-lg bg-white px-3 py-2 text-sm font-bold"
                >
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setPreview(null)}
                  className="rounded-lg bg-white px-3 py-2 text-sm font-bold"
                >
                  ✕ Close
                </button>
              </div>
            </div>
            <iframe
              src={preview}
              title="Receipt preview"
              className="flex-1 rounded-lg bg-white"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
