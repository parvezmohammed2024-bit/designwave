"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteCombo,
  duplicateCombo,
  toggleCombo,
} from "@/app/admin/combos/actions";

export default function ComboRowActions({
  id,
  slug,
  name,
  active,
}: {
  id: string;
  slug: string;
  name: string;
  active: boolean;
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
            const r = await toggleCombo(id, !active);
            if (r.error) setErr(r.error);
          })
        }
      >
        {active ? "Unpublish" : "Publish"}
      </button>
      <button
        type="button"
        disabled={pending}
        className={btn}
        onClick={() =>
          start(async () => {
            const r = await duplicateCombo(id);
            if (r.error) setErr(r.error);
            else if (r.id) router.push(`/admin/combos/${r.id}`);
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
          if (
            !confirm(
              `Delete combo "${name}"? Past orders keep their own copy of the details.`
            )
          )
            return;
          start(async () => {
            const r = await deleteCombo(id, slug);
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
