import Link from "next/link";
import { requireStaff, serverClient } from "@/lib/admin/server";
import { tk } from "@/lib/admin/money";
import { shapeCombo } from "@/lib/combos";
import { COMBO_SELECT } from "@/lib/admin/comboCatalogue";
import ComboRowActions from "@/components/admin/ComboRowActions";

export const dynamic = "force-dynamic";

export default async function CombosPage() {
  await requireStaff();
  const sb = serverClient();
  const { data } = await sb.from("dw_combos").select(COMBO_SELECT).order("sort_order");
  const combos = (data ?? []).map(shapeCombo);
  const today = new Date().toISOString().slice(0, 10);

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Combos</h1>
        <Link
          href="/admin/combos/new"
          className="rounded-lg bg-ink px-4 py-2 text-sm font-semibold text-paper hover:bg-brand-700"
        >
          + New combo
        </Link>
      </div>

      <div className="mt-4 overflow-x-auto rounded-2xl border border-ink/10 bg-white">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-ink/[0.03] text-left text-xs uppercase tracking-wide text-ink/50">
            <tr>
              <th className="p-3">Combo</th>
              <th className="p-3">Components</th>
              <th className="p-3 text-right">Derived</th>
              <th className="p-3 text-right">Shown</th>
              <th className="p-3 text-right">Price</th>
              <th className="p-3 text-right">Saving</th>
              <th className="p-3">Status</th>
              <th className="p-3" />
            </tr>
          </thead>
          <tbody>
            {combos.map((c) => {
              const expired = c.valid_until && c.valid_until < today;
              const scheduled = c.valid_from && c.valid_from > today;
              return (
                <tr key={c.id} className="border-t border-ink/10 align-top hover:bg-ink/[0.02]">
                  <td className="p-3">
                    <Link
                      href={`/admin/combos/${c.id}`}
                      className="font-semibold text-brand-700 hover:underline"
                    >
                      {c.name_bn}
                    </Link>
                    <span className="block text-xs text-ink/50" dir="ltr">
                      {c.slug}
                    </span>
                  </td>
                  <td className="p-3 text-xs">
                    {c.items.map((i) => (
                      <span key={i.id} className="block">
                        {i.quantity.toLocaleString("en-IN")} × {i.name_bn}
                        {i.tierName ? ` (${i.tierName})` : ""}
                      </span>
                    ))}
                  </td>
                  <td className="p-3 text-right">{tk(c.derivedValue)}</td>
                  <td className="p-3 text-right">
                    {tk(c.regularValue)}
                    {c.overrideValue != null && (
                      <span className="block text-[10px] font-bold text-amber-700">
                        override
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-right font-semibold">{tk(c.combo_price)}</td>
                  <td
                    className={`p-3 text-right font-semibold ${
                      c.savings > 0 ? "text-emerald-700" : "text-rose-700"
                    }`}
                  >
                    {tk(c.savings)}
                  </td>
                  <td className="p-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        c.active
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-ink/10 text-ink/60"
                      }`}
                    >
                      {c.active ? "live" : "draft"}
                    </span>
                    {expired && (
                      <span className="block text-[10px] font-bold text-rose-700">expired</span>
                    )}
                    {scheduled && (
                      <span className="block text-[10px] font-bold text-amber-700">scheduled</span>
                    )}
                    {c.featured && (
                      <span className="block text-[10px] font-bold text-violet-700">homepage</span>
                    )}
                  </td>
                  <td className="p-3">
                    <ComboRowActions
                      id={c.id}
                      slug={c.slug}
                      name={c.name_bn}
                      active={c.active}
                    />
                  </td>
                </tr>
              );
            })}
            {combos.length === 0 && (
              <tr>
                <td colSpan={8} className="p-8 text-center text-ink/50">
                  No combos yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
