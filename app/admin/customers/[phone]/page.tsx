import Link from "next/link";
import { notFound } from "next/navigation";
import { requireStaff, serverClient } from "@/lib/admin/server";
import { tk, fmtDate } from "@/lib/admin/money";
import { STATUS_LABEL, STATUS_TONE, type OrderStatus } from "@/lib/admin/orders";
import CustomerNotes from "@/components/admin/CustomerNotes";

export const dynamic = "force-dynamic";

export default async function CustomerDetail({
  params,
}: {
  params: { phone: string };
}) {
  await requireStaff();
  const sb = serverClient();
  const phone = decodeURIComponent(params.phone);

  const [{ data: customer }, { data: orders }] = await Promise.all([
    sb.from("dw_customers").select("*").eq("phone", phone).maybeSingle(),
    sb
      .from("dw_orders")
      .select("id,status,total_poisha,created_at,design_files")
      .eq("phone", phone)
      .order("created_at", { ascending: false }),
  ]);

  if (!customer) notFound();

  const list = orders ?? [];
  const lifetime = list
    .filter((o) => o.status !== "cancelled")
    .reduce((s, o) => s + (o.total_poisha ?? 0), 0);
  const files = list.flatMap((o) =>
    (Array.isArray(o.design_files) ? o.design_files : []).map((f: string) => ({
      order: o.id,
      path: f,
    }))
  );

  return (
    <div>
      <Link href="/admin/customers" className="text-sm text-brand-700 hover:underline">
        ← Customers
      </Link>
      <h1 className="mt-1 text-2xl font-bold">{customer.name || "—"}</h1>
      <p dir="ltr" className="text-ink/60">{customer.phone}</p>

      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <div className="grid grid-cols-3 gap-3">
            {[
              { l: "Orders", v: list.length },
              { l: "Lifetime value", v: tk(lifetime) },
              { l: "Last order", v: list[0] ? fmtDate(list[0].created_at) : "—" },
            ].map((s) => (
              <div key={s.l} className="rounded-2xl border border-ink/10 bg-white p-4">
                <p className="text-xs uppercase tracking-wide text-ink/50">{s.l}</p>
                <p className="mt-1 text-xl font-bold">{s.v}</p>
              </div>
            ))}
          </div>

          <section className="rounded-2xl border border-ink/10 bg-white p-4">
            <h2 className="font-bold">Order history</h2>
            <table className="mt-3 w-full text-sm">
              <tbody>
                {list.map((o) => (
                  <tr key={o.id} className="border-t border-ink/10">
                    <td className="py-2">
                      <Link href={`/admin/orders/${o.id}`} className="font-semibold text-brand-700 hover:underline">
                        {o.id}
                      </Link>
                    </td>
                    <td className="py-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_TONE[o.status as OrderStatus]}`}>
                        {STATUS_LABEL[o.status as OrderStatus]}
                      </span>
                    </td>
                    <td className="py-2 text-right font-semibold">{tk(o.total_poisha)}</td>
                    <td className="py-2 text-right text-ink/55">{fmtDate(o.created_at)}</td>
                    <td className="py-2 text-right">
                      <Link href={`/admin/quotations/new?from=${o.id}`}
                        className="rounded-lg border border-ink/20 px-2.5 py-1 text-xs font-semibold hover:bg-ink/5">
                        Reorder
                      </Link>
                    </td>
                  </tr>
                ))}
                {list.length === 0 && (
                  <tr><td className="py-6 text-center text-ink/50">No orders yet.</td></tr>
                )}
              </tbody>
            </table>
          </section>

          <section className="rounded-2xl border border-ink/10 bg-white p-4">
            <h2 className="font-bold">Design files on record</h2>
            {files.length === 0 ? (
              <p className="mt-2 text-sm text-ink/55">None uploaded.</p>
            ) : (
              <ul className="mt-3 space-y-2 text-sm">
                {files.map((f) => (
                  <li key={f.path} className="flex items-center justify-between gap-3 rounded-lg border border-ink/10 px-3 py-2">
                    <span className="min-w-0 truncate">
                      <span className="text-ink/50">{f.order}</span> · {f.path.split("/").pop()}
                    </span>
                    <a href={`/admin/orders/download?path=${encodeURIComponent(f.path)}`}
                      target="_blank" rel="noopener noreferrer"
                      className="shrink-0 rounded-lg border border-ink/20 px-3 py-1 text-xs font-semibold hover:bg-ink/5">
                      Download
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-4">
          <section className="rounded-2xl border border-ink/10 bg-white p-4">
            <h2 className="font-bold">Addresses</h2>
            <ul className="mt-2 space-y-2 text-sm text-ink/75">
              {(Array.isArray(customer.addresses) ? customer.addresses : []).map(
                (a: { district?: string; address?: string }, i: number) => (
                  <li key={i} className="rounded-lg border border-ink/10 p-2">
                    {a.address}
                    <span className="block text-xs text-ink/50">{a.district}</span>
                  </li>
                )
              )}
            </ul>
          </section>

          <CustomerNotes
            phone={customer.phone}
            tags={customer.tags ?? []}
            notes={customer.notes ?? ""}
            followUp={customer.follow_up_at}
          />

          <a href={`https://wa.me/${customer.phone.replace(/\D/g, "").replace(/^0/, "880")}`}
            target="_blank" rel="noopener noreferrer"
            className="block rounded-lg bg-[#25D366] px-4 py-2.5 text-center text-sm font-bold text-white hover:brightness-95">
            Message on WhatsApp
          </a>
        </div>
      </div>
    </div>
  );
}
