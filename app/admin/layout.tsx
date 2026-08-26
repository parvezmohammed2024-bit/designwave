import type { ReactNode } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { serverClient } from "@/lib/admin/server";

export const metadata = { title: "Admin — Design Wave" };
export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const sb = serverClient();
  const {
    data: { user },
  } = await sb.auth.getUser();

  // The login page renders inside this layout too — show it bare.
  if (!user) return <>{children}</>;

  const { data: staff } = await sb
    .from("dw_staff")
    .select("email,full_name,role")
    .eq("id", user.id)
    .maybeSingle();

  if (!staff) return <>{children}</>;

  return (
    <AdminShell
      email={staff.email}
      name={staff.full_name}
      role={staff.role as "admin" | "staff"}
    >
      {children}
    </AdminShell>
  );
}
