"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useState, type ReactNode } from "react";
import { adminClient } from "@/lib/admin/client";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: "▤" },
  { href: "/admin/orders", label: "Orders", icon: "▣" },
  { href: "/admin/products", label: "Products", icon: "▦" },
  { href: "/admin/combos", label: "Combos", icon: "◈" },
  { href: "/admin/customers", label: "Customers", icon: "◍" },
  { href: "/admin/quotations", label: "Quotations", icon: "✎" },
  { href: "/admin/banner", label: "Banner & content", icon: "◫" },
  { href: "/admin/reports", label: "Reports", icon: "◪" },
  { href: "/admin/settings", label: "Settings", icon: "⚙" },
];

export default function AdminShell({
  children,
  email,
  name,
  role,
}: {
  children: ReactNode;
  email: string;
  name: string | null;
  role: "admin" | "staff";
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const signOut = async () => {
    await adminClient().auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  };

  const isActive = (href: string) =>
    href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);

  return (
    <div className="min-h-screen bg-[#F4F5F7] text-ink">
      {/* top bar (mobile) */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-ink/10 bg-white px-4 py-3 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2">
          <Image src="/logo.svg" alt="" width={34} height={24} />
          <span className="font-bold">Admin</span>
        </Link>
        <button
          type="button"
          onClick={() => setOpen(!open)}
          aria-expanded={open}
          aria-label="Menu"
          className="flex h-11 w-11 items-center justify-center rounded-lg border border-ink/15"
        >
          {open ? "✕" : "☰"}
        </button>
      </header>

      <div className="flex">
        {/* sidebar */}
        <aside
          className={`fixed inset-x-0 top-[57px] z-30 border-b border-ink/10 bg-white lg:sticky lg:top-0 lg:h-screen lg:w-60 lg:shrink-0 lg:border-b-0 lg:border-r ${
            open ? "block" : "hidden lg:block"
          }`}
        >
          <div className="hidden items-center gap-2 border-b border-ink/10 px-5 py-4 lg:flex">
            <Image src="/logo.svg" alt="" width={38} height={26} />
            <span className="font-bold">
              Design<span className="text-brand-700"> Wave</span>
            </span>
          </div>
          <nav className="p-3">
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                onClick={() => setOpen(false)}
                className={`mb-1 flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors ${
                  isActive(n.href)
                    ? "bg-brand-700 text-paper"
                    : "text-ink/75 hover:bg-ink/5"
                }`}
              >
                <span aria-hidden className="w-4 text-center">{n.icon}</span>
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="border-t border-ink/10 p-4 text-sm">
            <p className="truncate font-semibold">{name ?? email}</p>
            <p className="text-xs uppercase tracking-wide text-ink/50">{role}</p>
            <div className="mt-3 flex gap-2">
              <Link
                href="/"
                target="_blank"
                className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold hover:bg-ink/5"
              >
                View site
              </Link>
              <button
                type="button"
                onClick={signOut}
                className="rounded-lg border border-ink/15 px-3 py-1.5 text-xs font-semibold hover:bg-ink/5"
              >
                Sign out
              </button>
            </div>
          </div>
        </aside>

        <main className="min-w-0 flex-1 p-4 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
