"use client";

import { FormEvent, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";

type Option = { slug: string; name: string };

type Errors = Partial<Record<"name" | "phone" | "collection" | "qty", string>>;

/**
 * Labels stay visible (never placeholder-only), errors render next to
 * their field, and numeric inputs keep ENGLISH digits for usability —
 * only display text is Bangla.
 */
export default function OrderForm({ options }: { options: Option[] }) {
  const params = useSearchParams();
  const preselect = params.get("collection") ?? "";
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const next: Errors = {};

    if (!String(data.get("name")).trim()) next.name = "আপনার নামটি লিখুন";
    const phone = String(data.get("phone")).trim();
    if (!phone) next.phone = "ফোন নম্বর লিখুন";
    else if (!/^01[3-9]\d{8}$/.test(phone))
      next.phone = "সঠিক নম্বর লিখুন — যেমন 017XXXXXXXX";
    if (!String(data.get("collection"))) next.collection = "একটি কালেকশন বাছাই করুন";
    const qty = Number(data.get("qty"));
    if (!qty || qty < 1) next.qty = "কমপক্ষে ১টি কার্ড লাগবে";

    setErrors(next);
    if (Object.keys(next).length === 0) {
      // TODO: wire to backend / WhatsApp API. UI contract is final.
      setSent(true);
    }
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="mt-12 rounded-2xl border border-brand-700/30 bg-brand-700/5 p-8 text-center"
        role="status"
      >
        <p className="text-4xl" aria-hidden>
          ✉️
        </p>
        <h2 className="bangla-safe mt-4 text-2xl font-bold text-brand-700">
          আপনার অনুরোধ পৌঁছেছে!
        </h2>
        <p className="mx-auto mt-3 max-w-sm leading-bangla text-ink/70">
          ধন্যবাদ! ২৪ ঘণ্টার মধ্যে আমরা যোগাযোগ করব। ততক্ষণে কালেকশনটা আরেকবার
          ঘুরে দেখতে পারেন।
        </p>
      </motion.div>
    );
  }

  const field = "w-full rounded-xl border border-ink/20 bg-white/60 px-4 py-3 text-base outline-none transition-colors focus:border-brand-700";
  const label = "mb-1.5 block font-semibold";
  const errText = "mt-1.5 text-sm text-[#B3261E]";

  return (
    <form onSubmit={onSubmit} noValidate className="mt-10 space-y-6">
      <div>
        <label htmlFor="name" className={label}>
          আপনার নাম
        </label>
        <input
          id="name"
          name="name"
          type="text"
          autoComplete="name"
          placeholder="যেমন: রাহিম আহমেদ"
          className={field}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-err" : undefined}
        />
        {errors.name && (
          <p id="name-err" className={errText}>
            {errors.name}
          </p>
        )}
      </div>

      <div>
        <label htmlFor="phone" className={label}>
          ফোন নম্বর
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          inputMode="numeric"
          autoComplete="tel-national"
          placeholder="017XXXXXXXX"
          dir="ltr"
          className={field}
          aria-invalid={!!errors.phone}
          aria-describedby="phone-help"
        />
        <p id="phone-help" className="mt-1.5 text-sm text-ink/55">
          ইংরেজি সংখ্যায় লিখুন — এই নম্বরেই আমরা কল করব
        </p>
        {errors.phone && <p className={errText}>{errors.phone}</p>}
      </div>

      <div>
        <label htmlFor="collection" className={label}>
          কোন কালেকশন?
        </label>
        <select
          id="collection"
          name="collection"
          defaultValue={preselect}
          className={field}
          aria-invalid={!!errors.collection}
        >
          <option value="">বাছাই করুন…</option>
          {options.map((c) => (
            <option key={c.slug} value={c.slug}>
              {c.name}
            </option>
          ))}
          <option value="custom">নিজের ডিজাইন / অন্য কিছু</option>
        </select>
        {errors.collection && <p className={errText}>{errors.collection}</p>}
      </div>

      <div>
        <label htmlFor="qty" className={label}>
          কতগুলো কার্ড?
        </label>
        <input
          id="qty"
          name="qty"
          type="number"
          inputMode="numeric"
          min={1}
          defaultValue={100}
          dir="ltr"
          className={field}
          aria-invalid={!!errors.qty}
        />
        {errors.qty && <p className={errText}>{errors.qty}</p>}
      </div>

      <div>
        <label htmlFor="note" className={label}>
          আপনার ভাবনা <span className="font-normal text-ink/50">(ঐচ্ছিক)</span>
        </label>
        <textarea
          id="note"
          name="note"
          rows={4}
          placeholder="রঙ, থিম, তারিখ — যা মাথায় আছে লিখে ফেলুন"
          className={field}
        />
      </div>

      <button
        type="submit"
        className="min-h-[52px] w-full rounded-full bg-ink text-lg font-semibold text-paper transition-colors duration-300 hover:bg-brand-700"
      >
        অনুরোধ পাঠান
      </button>
    </form>
  );
}
