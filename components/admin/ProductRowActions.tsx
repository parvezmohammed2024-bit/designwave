"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteProduct,
  duplicateProduct,
  toggleStatus,
} from "@/app/admin/products/actions";

export default function ProductRowActions({
  id,
  slug,
  name,
  status,
}: {
  id: string;
  slug: string;
  name: string;
  status: "active" | "draft";
}) {
  const [pending, start] = useTransition();
  const [err, setErr] = useState("");
  const router = useRouter();

  const btn =
    "rounded-lg border border-ink/20 px-2.5 py-1 text-xs font-semibold hover:bg-ink/5 disabled:opacity-50";

  return (
    <div className="flex flex-wrap gap-1.5">
      <button
        type="button"
        disabled={pending}
        className={btn}
        onClick={() =>
          start(async () => {
            const r = await toggleStatus(id, status === "active" ? "draft" : "active");
            if (r.error) setErr(r.error);
          })
        }
      >
        {status === "active" ? "Unpublish" : "Publish"}
      </button>
      <button
        type="button"
        disabled={pending}
        className={btn}
        onClick={() =>
          start(async () => {
            const r = await duplicateProduct(id);
            if (r.error) setErr(r.error);
            else if (r.id) router.push(`/admin/products/${r.id}`);
          })
        }
      >
        Duplicate
      </button>
      <button
        type="button"
        disabled={pending}
        className={`${btn} border-rose-300 text-rose-700 hover:bg-rose-50`}
        onClick={() => {
          if (!confirm(`Delete "${name}" permanently? Past orders keep their own copy of the item details, but the product will vanish from the shop.`)) return;
          start(async () => {
            const r = await deleteProduct(id, slug);
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
