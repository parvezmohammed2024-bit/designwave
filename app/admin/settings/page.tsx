import { requireStaff, serverClient } from "@/lib/admin/server";
import SettingsForms from "@/components/admin/SettingsForms";
import { fmtDateTime } from "@/lib/admin/money";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const me = await requireStaff();
  const sb = serverClient();

  const [{ data: settings }, { data: staff }, { data: activity }] = await Promise.all([
    sb.from("dw_settings").select("key,value"),
    sb.from("dw_staff").select("email,full_name,role,created_at").order("created_at"),
    sb
      .from("dw_activity_log")
      .select("action,entity,entity_id,actor_email,created_at")
      .order("created_at", { ascending: false })
      .limit(40),
  ]);

  const get = (k: string) => settings?.find((s) => s.key === k)?.value;

  return (
    <div>
      <h1 className="text-2xl font-bold">Settings</h1>

      <SettingsForms
        contact={get("contact") as any}
        payment={get("payment") as any}
        delivery={get("delivery") as any}
        whatsappTemplates={get("whatsapp_templates") as any}
        canEditStaff={me.role === "admin"}
      />

      <section className="mt-6 rounded-2xl border border-ink/10 bg-white p-4">
        <h2 className="font-bold">Staff accounts</h2>
        <table className="mt-3 w-full text-sm">
          <thead className="text-left text-xs uppercase tracking-wide text-ink/50">
            <tr><th className="pb-2">Name</th><th className="pb-2">Email</th><th className="pb-2">Role</th></tr>
          </thead>
          <tbody>
            {(staff ?? []).map((s) => (
              <tr key={s.email} className="border-t border-ink/10">
                <td className="py-2">{s.full_name ?? "—"}</td>
                <td className="py-2" dir="ltr">{s.email}</td>
                <td className="py-2 uppercase">{s.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-3 text-xs text-ink/55">
          Add a staff member: create the user in Supabase → Authentication → Users,
          then insert a row in <code>dw_staff</code> with their id and role.
        </p>
      </section>

      <section className="mt-6 rounded-2xl border border-ink/10 bg-white p-4">
        <h2 className="font-bold">Activity log</h2>
        <ul className="mt-3 space-y-2 text-xs">
          {(activity ?? []).map((a, i) => (
            <li key={i} className="border-t border-ink/10 pt-2">
              <span className="font-semibold">{a.action}</span> · {a.entity} {a.entity_id}
              <span className="block text-ink/45">{a.actor_email} · {fmtDateTime(a.created_at)}</span>
            </li>
          ))}
          {(activity ?? []).length === 0 && <li className="text-ink/45">Nothing logged yet.</li>}
        </ul>
      </section>
    </div>
  );
}
