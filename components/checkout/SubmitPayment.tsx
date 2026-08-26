"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import ReceiptUpload, { type ReceiptState } from "@/components/ReceiptUpload";
import { formatPoisha } from "@/lib/pricing";
import { toBanglaDigits } from "@/lib/format";

const STAGES = [
  { key: "design_charge", label: "ডিজাইন চার্জ" },
  { key: "advance", label: "৫০% অ্যাডভান্স" },
  { key: "balance", label: "বাকি টাকা" },
] as const;

const STATUS_BN: Record<string, string> = {
  pending: "যাচাই চলছে",
  verified: "নিশ্চিত হয়েছে ✓",
  rejected: "বাতিল",
};

export type PaymentRecord = {
  id: string;
  kind: string;
  amount: number | null;
  txn_id: string | null;
  has_receipt: boolean;
  verification_status: string;
  rejection_reason: string | null;
  received_at: string;
};

/**
 * Lets a customer send a later payment (advance or balance) from the
 * tracking page — days after checkout, which is when they actually pay.
 */
export default function SubmitPayment({
  orderId,
  phone,
  payments,
  onSubmitted,
}: {
  orderId: string;
  phone: string;
  payments: PaymentRecord[];
  onSubmitted: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<string>("advance");
  const [txn, setTxn] = useState("");
  const [amount, setAmount] = useState("");
  const [receipt, setReceipt] = useState<ReceiptState | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const submit = async () => {
    if (!txn.trim() && !receipt) {
      setError("ট্রানজেকশন আইডি অথবা পেমেন্টের স্ক্রিনশট — যেকোনো একটি দিন।");
      return;
    }
    setError("");
    setBusy(true);

    const taka = parseFloat(amount.replace(/[^\d.]/g, ""));
    const { error: rpcError } = await supabase.rpc("dw_submit_payment", {
      payload: {
        order_id: orderId,
        phone,
        kind: stage,
        txn_id: txn.trim(),
        receipt_path: receipt?.path ?? "",
        amount: Number.isFinite(taka) ? Math.round(taka * 100) : null,
      },
    });

    setBusy(false);
    if (rpcError) {
      setError("জমা দেওয়া যায়নি — আবার চেষ্টা করুন।");
      return;
    }
    setDone(true);
    setTxn("");
    setAmount("");
    setReceipt(null);
    onSubmitted();
  };

  const field =
    "w-full rounded-xl border border-ink/20 bg-white/60 px-4 py-3 text-base outline-none transition-colors focus:border-brand-700";

  return (
    <section className="mt-6 rounded-2xl border border-ink/10 p-5">
      <h3 className="bangla-safe font-bold">পেমেন্টের তথ্য</h3>

      {payments.length > 0 && (
        <ul className="mt-3 space-y-2">
          {payments.map((p) => {
            const label = STAGES.find((s) => s.key === p.kind)?.label ?? p.kind;
            return (
              <li
                key={p.id}
                className="rounded-xl border border-ink/10 px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-semibold">{label}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                      p.verification_status === "verified"
                        ? "bg-emerald-100 text-emerald-800"
                        : p.verification_status === "rejected"
                          ? "bg-[#B3261E]/10 text-[#B3261E]"
                          : "bg-amber-100 text-amber-900"
                    }`}
                  >
                    {STATUS_BN[p.verification_status]}
                  </span>
                </div>
                <p className="mt-0.5 text-xs text-ink/60">
                  {p.amount ? formatPoisha(p.amount) : "পরিমাণ যাচাই হবে"}
                  {p.txn_id && <> · {p.txn_id}</>}
                  {p.has_receipt && <> · স্ক্রিনশট জমা আছে</>}
                </p>
                {p.verification_status === "rejected" && p.rejection_reason && (
                  <p className="mt-1 text-xs font-semibold text-[#B3261E]">
                    কারণ: {p.rejection_reason}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {done && (
        <motion.p
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-3 rounded-xl border border-brand-700/30 bg-brand-50 px-4 py-3 text-sm font-semibold text-brand-700"
        >
          পেমেন্টের তথ্য পৌঁছেছে — যাচাই করে জানাব ইনশাআল্লাহ।
        </motion.p>
      )}

      {!open ? (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setDone(false);
          }}
          className="mt-4 w-full rounded-full border border-ink/20 py-3 font-semibold hover:border-brand-700"
        >
          নতুন পেমেন্ট জমা দিন
        </button>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="pay-stage" className="mb-1.5 block font-semibold">
              কোন কিস্তি?
            </label>
            <select
              id="pay-stage"
              className={field}
              value={stage}
              onChange={(e) => setStage(e.target.value)}
            >
              {STAGES.map((s) => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="pay-amount" className="mb-1.5 block font-semibold">
              পরিমাণ (৳){" "}
              <span className="font-normal text-ink/50">(ঐচ্ছিক)</span>
            </label>
            <input
              id="pay-amount"
              dir="ltr"
              inputMode="decimal"
              className={field}
              placeholder="600"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>

          <div>
            <label htmlFor="pay-txn" className="mb-1.5 block font-semibold">
              ট্রানজেকশন আইডি
            </label>
            <input
              id="pay-txn"
              dir="ltr"
              className={field}
              placeholder="যেমন: 9HK7A2B5CD"
              value={txn}
              onChange={(e) => {
                setTxn(e.target.value);
                if (e.target.value.trim()) setError("");
              }}
            />
          </div>

          <div className="flex items-center gap-3">
            <span className="h-px flex-1 bg-ink/10" />
            <span className="text-xs font-semibold text-ink/45">অথবা</span>
            <span className="h-px flex-1 bg-ink/10" />
          </div>

          <ReceiptUpload
            orderId={orderId}
            stage={stage.replace("_", "-")}
            value={receipt}
            onChange={(r) => {
              setReceipt(r);
              if (r) setError("");
            }}
          />

          {error && (
            <p className="rounded-xl border border-[#B3261E]/30 bg-[#B3261E]/5 px-4 py-3 text-sm font-semibold text-[#B3261E]">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="min-h-[48px] flex-1 rounded-full border border-ink/20 font-semibold hover:border-ink"
            >
              বাতিল
            </button>
            <button
              type="button"
              onClick={submit}
              disabled={busy}
              className="min-h-[48px] flex-1 rounded-full bg-ink font-semibold text-paper transition-colors hover:bg-brand-700 disabled:opacity-60"
            >
              {busy ? "জমা হচ্ছে…" : "জমা দিন"}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
