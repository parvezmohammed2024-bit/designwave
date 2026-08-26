"use client";

import { useState } from "react";

type Template = { key: string; label: string; body_bn: string };

/**
 * One click opens WhatsApp with the Bangla message already filled in —
 * this is how the studio actually talks to customers.
 */
export default function WhatsAppTemplates({
  templates,
  phone,
  vars,
}: {
  templates: Template[];
  phone: string;
  vars: Record<string, string>;
}) {
  const [preview, setPreview] = useState<string | null>(null);

  const fill = (body: string) =>
    body.replace(/\{\{(\w+)\}\}/g, (_, k) => vars[k] ?? `{{${k}}}`);

  const waHref = (body: string) =>
    `https://wa.me/${phone.replace(/\D/g, "").replace(/^0/, "880")}?text=${encodeURIComponent(fill(body))}`;

  if (!templates.length) return null;

  return (
    <section className="rounded-2xl border border-ink/10 bg-white p-4">
      <h2 className="font-bold">WhatsApp</h2>
      <p className="mt-1 text-xs text-ink/55">Opens with the message ready to send.</p>
      <div className="mt-3 space-y-2">
        {templates.map((t) => (
          <div key={t.key}>
            <div className="flex gap-2">
              <a
                href={waHref(t.body_bn)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-lg bg-[#25D366] px-3 py-2 text-center text-sm font-bold text-white hover:brightness-95"
              >
                {t.label}
              </a>
              <button
                type="button"
                onClick={() => setPreview(preview === t.key ? null : t.key)}
                aria-label={`Preview ${t.label}`}
                className="rounded-lg border border-ink/20 px-3 text-sm hover:bg-ink/5"
              >
                👁
              </button>
            </div>
            {preview === t.key && (
              <p className="mt-1 rounded-lg bg-ink/[0.04] p-2 text-xs leading-relaxed">
                {fill(t.body_bn)}
              </p>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}
