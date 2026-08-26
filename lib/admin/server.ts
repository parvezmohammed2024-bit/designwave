import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/** Server client bound to the request's cookies. */
export function serverClient() {
  const store = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => store.getAll(),
        setAll: (list) => {
          try {
            list.forEach(({ name, value, options }) =>
              store.set(name, value, options)
            );
          } catch {
            /* called from a Server Component — middleware refreshes instead */
          }
        },
      },
    }
  );
}

export type StaffRow = {
  id: string;
  email: string;
  full_name: string | null;
  role: "admin" | "staff";
};

/** Throws the visitor out unless they hold a staff row. */
export async function requireStaff(): Promise<StaffRow> {
  const sb = serverClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/admin/login");

  const { data } = await sb
    .from("dw_staff")
    .select("id,email,full_name,role")
    .eq("id", user.id)
    .maybeSingle();

  if (!data) redirect("/admin/login?denied=1");
  return data as StaffRow;
}

export async function requireAdmin(): Promise<StaffRow> {
  const staff = await requireStaff();
  if (staff.role !== "admin") redirect("/admin?denied=1");
  return staff;
}

/** Append to the audit trail. Never throws — logging must not break a write. */
export async function logActivity(
  action: string,
  entity: string,
  entityId: string,
  meta?: Record<string, unknown>
) {
  try {
    const sb = serverClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    await sb.from("dw_activity_log").insert({
      actor: user?.id ?? null,
      actor_email: user?.email ?? null,
      action,
      entity,
      entity_id: entityId,
      meta: meta ?? null,
    });
  } catch {
    /* ignore */
  }
}
