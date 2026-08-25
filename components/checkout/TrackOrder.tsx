"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { formatTaka, toBanglaDigits } from "@/lib/format";
import { PHONE_BN, waLink } from "@/lib/site";

const STATUS_STEPS: { key: string; label: string }[] = [
  { key: "payment_pending", label: "পেমেন্ট যাচাই" },
  { key: "design", label: "ডিজাইন চলছে" },
  { key: "approved", label: "ডিজাইন অনুমোদিত" },
  { key: "printing", label: "প্রিন্ট ও ফিনিশিং" },
  { key: "shipped", label: "ডেলিভারিতে" },
  { key: "delivered", label: "ডেলিভারি সম্পন্ন" },
];

type Order = {
  id: string;
  status: string;
  subtotal: number;
  delivery: number;
  total: number;
  amount_due: number;
  txn_id: string | null;
  created_at: string;
  items: {
    name: string;
    tierQty: number;
    quantity: number;
    lineTotal: number;
  }[];
};

export default function TrackOrder() {
  const params = useSearchParams();
  const [orderId, setOrderId] = useState(params.get("id") ?? "");
  const [phone, setPhone] = useState("");
  const [order, setOrder] = useState<Order | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "notfound" | "error">("idle");

  const search = async (e: FormEvent) => {
    e.preventDefault();
    if (!orderId.trim() || !phone.trim()) return;
    setState("loading");
    setOrder(null);
    const { data, error } = await supabase.rpc("dw_track_order", {
      p_id: orderId,
      p_phone: phone,
    });
    if (error) return setState("error");
    if (!data || data.length === 0) return setState("notfound");
    setOrder(data[0] as Order);
    setState("idle");
  };

  const field =
    "w-full rounded-xl border border-ink/20 bg-white/60 px-4 py-3 text-base outline-none transition-colors focus:border-brand-700";
  const statusIdx = order
    ? Math.max(0, STATUS_STEPS.findIndex((s) => s.key === order.status))
    : 0;

  return (
    <div className="mt-8">
      <form onSubmit={search} className="space-y-4">
        <div>
          <label htmlFor="tr-id" className="mb-1.5 block font-semibold">অর্ডার আইডি</label>
          <input id="tr-id" type="text" dir="ltr" placeholder="DW-XXXXXX"
            className={field} value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="tr-phone" className="mb-1.5 block font-semibold">ফোন নম্বর</label>
          <input id="tr-phone" type="tel" dir="ltr" inputMode="numeric"
            placeholder="017XXXXXXXX" className={field} value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>
        <button type="submit" disabled={state === "loading"}
          className="min-h-[52px] w-full rounded-full bg-ink text-lg font-semibold text-paper transition-colors hover:bg-brand-700 disabled:opacity-60"
        >
          {state === "loading" ? "খোঁজা হচ্ছে…" : "স্ট্যাটাস দেখুন"}
        </button>
      </form>

      {state === "notfound" && (
        <p className="mt-5 rounded-xl border border-ink/10 p-4 text-center leading-bangla text-ink/70">
          এই আইডি ও নম্বরে কোনো অর্ডার পাওয়া যায়নি। বানান দেখে আবার চেষ্টা
          করুন, বা{" "}
          <a href={waLink("আমার অর্ডার খুঁজে পাচ্ছি না।")} target="_blank"
            rel="noopener noreferrer" className="font-semibold text-brand-700 underline"
          >
            হোয়াটসঅ্যাপে জিজ্ঞেস করুন
          </a>
          ।
        </p>
      )}
      {state === "error" && (
        <p className="mt-5 text-center text-[#B3261E]">
          সমস্যা হয়েছে — একটু পরে আবার চেষ্টা করুন।
        </p>
      )}

      {order && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mt-8 rounded-2xl border border-ink/10 p-5"
        >
          <div className="flex items-baseline justify-between">
            <p dir="ltr" className="font-bold tracking-wider text-brand-700">{order.id}</p>
            <p className="text-sm text-ink/60">
              {new Date(order.created_at).toLocaleDateString("bn-BD")}
            </p>
          </div>

          <ol className="mt-5 space-y-3">
            {STATUS_STEPS.map((s, i) => (
              <li key={s.key} className="flex items-center gap-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    i <= statusIdx ? "bg-brand-700 text-paper" : "bg-ink/10 text-ink/40"
                  }`}
                >
                  {i < statusIdx ? "✓" : toBanglaDigits(i + 1)}
                </span>
                <span className={i <= statusIdx ? "font-semibold" : "text-ink/50"}>
                  {s.label}
                </span>
              </li>
            ))}
          </ol>

          <div className="mt-5 border-t border-ink/10 pt-4 text-sm">
            {order.items.map((it, i) => (
              <div key={i} className="flex justify-between py-0.5">
                <span className="min-w-0 truncate pr-3">
                  {it.name} — {toBanglaDigits(it.tierQty)} পিস × {toBanglaDigits(it.quantity)}
                </span>
                <span>{formatTaka(it.lineTotal)}</span>
              </div>
            ))}
            <div className="mt-2 flex justify-between border-t border-ink/10 pt-2 font-bold">
              <span>মোট</span><span>{formatTaka(order.total)}</span>
            </div>
            <div className="flex justify-between text-brand-700">
              <span>প্রদেয়</span><span className="font-semibold">{formatTaka(order.amount_due)}</span>
            </div>
          </div>

          <p className="mt-4 text-center text-sm text-ink/55">
            প্রশ্ন থাকলে: {PHONE_BN}
          </p>
        </motion.div>
      )}
    </div>
  );
}
