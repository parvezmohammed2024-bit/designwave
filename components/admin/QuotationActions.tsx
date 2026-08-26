"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { convertToOrder, deleteQuotation } from "@/app/admin/quotations/actions";
import { tk } from "@/lib/admin/money";

export default function QuotationActions({
  id,
  phone,
  total,
  status,
}: {
  id: string;
  phone: string;
  total: number;
  status: string;
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const router = useRouter();

  const btn =
    "rounded-lg border border-ink/20 px-2.5 py-1 text-xs font-semibold hover:bg-ink/5 disabled:opacity-50";

  const waText = encodeURIComponent(
    `আসসালামু আলাইকুম! আপনার কোটেশন ${id} — মোট ${tk(total)}। বিস্তারিত জানতে চাইলে জানাবেন।`
  );

  return (
    <div className="flex flex-wrap gap-1.5">
      <a
        href={`https://wa.me/${phone.replace(/\D/g, "").replace(/^0/, "880")}?text=${waText}`}
        target="_blank"
        rel="noopener noreferrer"
        className={btn}
      >
        Send
      </a>
      {status !== "converted" && (
        <button
          type="button"
          disabled={pending}
          className={btn}
          onClick={() => {
            const district = prompt("Delivery district?", "চট্টগ্রাম");
            if (district === null) return;
            const address = prompt("Delivery address?") ?? "";
            start(async () => {
              const r = await convertToOrder(id, district, address);
              if (r.error) setErr(r.error);
              else router.push(`/admin/orders/${r.orderId}`);
            });
          }}
        >
          → Order
        </button>
      )}
      <button
        type="button"
        disabled={pending}
        className={`${btn} border-rose-300 text-rose-700 hover:bg-rose-50`}
        onClick={() => {
          if (!confirm(`Delete quotation ${id}?`)) return;
          start(async () => {
            const r = await deleteQuotation(id);
            if (r.error) setErr(r.error);
          });
        }}
      >
        Delete
      </button>
      {err && <span className="w-full text-xs text-rose-600">{err}</span>}
    </div>
  );
}
