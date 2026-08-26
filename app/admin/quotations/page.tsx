import Link from "next/link";
import { requireStaff, serverClient } from "@/lib/admin/server";
import { tk, fmtDate } from "@/lib/admin/money";
import QuotationActions from "@/components/admin/QuotationActions";

export const dynamic = "force-dynamic";

const TONE: Record<string, string> = {
  draft: "bg-ink/10 text-ink/70",
  sent: "bg-sky-100 text-sky-900",
  accepted: "bg-emerald-100 text-emerald-900",
  expired: "bg-amber-100 text-amber-900",
  converted: "bg-violet-100 text-violet-900",
};

export default async function QuotationsPage() {
  await requireStaff();
  const sb = serverClient();
  const { data } = await sb
    .from("dw_quotations")
    .select("*")
    .order("created_at", { ascending: false });

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Quotations</h1>
        <Link href="/admin/quotations/new"
          className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-brand-700">
          + New quotation
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-ink/[0.03] text-left text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="p-3">Quote</th><th className="p-3">Customer</th>
              <th className="p-3 text-right">Total</th><th className="p-3">Expires</th>
              <th className="p-3">Status</th><th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {(data ?? []).map((q) => {
              const expired = q.expires_on && q.expires_on < today && q.status !== "converted";
              return (
                <tr key={q.id} className="border-t border-ink/10 hover:bg-ink/[0.02]">
                  <td className="p-3">
                    <Link href={`/admin/quotations/${q.id}`} className="font-semibold text-brand-700 hover:underline">
                      {q.id}
                    </Link>
                    <span className="block text-xs text-ink/50">{fmtDate(q.created_at)}</span>
                  </td>
                  <td className="p-3">
                    {q.customer_name || "—"}
                    <span className="block text-xs text-ink/55" dir="ltr">{q.customer_phone}</span>
                  </td>
                  <td className="p-3 text-right font-semibold">{tk(q.total)}</td>
                  <td className="p-3">
                    {q.expires_on ?? "—"}
                    {expired && <span className="ml-1 text-xs font-bold text-amber-700">past</span>}
                  </td>
                  <td className="p-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${TONE[q.status]}`}>
                      {q.status}
                    </span>
                    {q.converted_order_id && (
                      <Link href={`/admin/orders/${q.converted_order_id}`}
                        className="block text-xs text-brand-700 hover:underline">
                        {q.converted_order_id}
                      </Link>
                    )}
                  </td>
                  <td className="p-3">
                    <QuotationActions
                      id={q.id}
                      phone={q.customer_phone}
                      total={q.total}
                      status={q.status}
                    />
                  </td>
                </tr>
              );
            })}
            {(data ?? []).length === 0 && (
              <tr><td colSpan={6} className="p-8 text-center text-ink/50">
                No quotations yet. Use these for bulk or non-catalogue jobs.
              </td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
