"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { useMemo, useRef, useState } from "react";
import { useCart, cartSubtotal } from "@/lib/cart";
import { districts } from "@/lib/districts";
import { formatPoisha, formatUnitPoisha } from "@/lib/pricing";
import { toBanglaDigits } from "@/lib/format";
import { PHONE_BN, waLink } from "@/lib/site";
import type { DeliverySettings, PaymentSettings } from "@/lib/catalog";
import { supabase } from "@/lib/supabase";
import ReceiptUpload, { type ReceiptState } from "@/components/ReceiptUpload";

const EASE = [0.22, 1, 0.36, 1] as const;
const STEPS = ["তথ্য", "ডিজাইন ফাইল", "পেমেন্ট", "নিশ্চিতকরণ"];
const ACCEPTED = [".jpg", ".jpeg", ".png", ".pdf", ".ai", ".psd"];
const MAX_BYTES = 25 * 1024 * 1024;

type Info = {
  name: string;
  phone: string;
  district: string;
  insideCity: boolean;
  address: string;
  note: string;
};
type UploadedFile = {
  name: string;
  status: "uploading" | "done" | "error";
  path?: string;
};

function makeOrderId(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  const arr = new Uint32Array(6);
  crypto.getRandomValues(arr);
  arr.forEach((n) => {
    s += chars[n % chars.length];
  });
  return `DW-${s}`;
}

const field =
  "w-full rounded-xl border border-ink/20 bg-white/60 px-4 py-3 text-base outline-none transition-colors focus:border-brand-700";
const label = "mb-1.5 block font-semibold";
const errText = "mt-1.5 text-sm text-[#B3261E]";

export default function CheckoutFlow({
  delivery: deliveryRates,
  payment,
}: {
  delivery: DeliverySettings;
  payment: PaymentSettings;
}) {
  const { lines, clear } = useCart();
  const [step, setStep] = useState(0);
  const [orderId] = useState(makeOrderId);
  const [info, setInfo] = useState<Info>({
    name: "",
    phone: "",
    district: "",
    insideCity: true,
    address: "",
    note: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof Info, string>>>({});
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [designFinalized, setDesignFinalized] = useState(false);
  const [txnId, setTxnId] = useState("");
  const [receipt, setReceipt] = useState<ReceiptState | null>(null);
  const [payError, setPayError] = useState("");
  const [copied, setCopied] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [placed, setPlaced] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const subtotal = useMemo(() => cartSubtotal(lines), [lines]);
  const delivery =
    info.district === "চট্টগ্রাম" && info.insideCity
      ? deliveryRates.inside_ctg
      : deliveryRates.outside_ctg;
  const total = subtotal + delivery;
  const amountDue = designFinalized
    ? Math.ceil(total / 2)
    : payment.design_charge;

  if (lines.length === 0 && !placed) {
    return (
      <div className="mt-12 rounded-2xl border border-ink/10 p-10 text-center">
        <p className="bangla-safe text-lg font-bold">কার্ট খালি</p>
        <p className="mt-2 leading-bangla text-ink/60">
          চেকআউটের আগে কালেকশন থেকে পণ্য যোগ করুন।
        </p>
        <Link
          href="/collections"
          className="mt-6 inline-block rounded-full bg-ink px-6 py-3 font-semibold text-paper hover:bg-brand-700"
        >
          কালেকশন দেখুন
        </Link>
      </div>
    );
  }

  const validateInfo = (): boolean => {
    const next: typeof errors = {};
    if (!info.name.trim()) next.name = "আপনার নামটি লিখুন";
    if (!info.phone.trim()) next.phone = "ফোন নম্বর লিখুন";
    else if (!/^01[3-9]\d{8}$/.test(info.phone.trim()))
      next.phone = "সঠিক নম্বর লিখুন — যেমন 017XXXXXXXX";
    if (!info.district) next.district = "জেলা বাছাই করুন";
    if (!info.address.trim()) next.address = "সম্পূর্ণ ঠিকানা লিখুন";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const uploadFiles = async (list: FileList | File[]) => {
    for (const file of Array.from(list)) {
      const ext = "." + (file.name.split(".").pop() ?? "").toLowerCase();
      if (!ACCEPTED.includes(ext) || file.size > MAX_BYTES) {
        setFiles((f) => [...f, { name: file.name, status: "error" }]);
        continue;
      }
      const path = `orders/${orderId}/${Date.now()}-${file.name.replace(/[^\w.\-]/g, "_")}`;
      setFiles((f) => [...f, { name: file.name, status: "uploading", path }]);
      const { error } = await supabase.storage.from("dw-designs").upload(path, file);
      setFiles((f) =>
        f.map((x) => (x.path === path ? { ...x, status: error ? "error" : "done" } : x))
      );
    }
  };

  const placeOrder = async () => {
    // one proof of payment is enough — either reference works
    if (!txnId.trim() && !receipt) {
      setPayError(
        "ট্রানজেকশন আইডি অথবা পেমেন্টের স্ক্রিনশট — যেকোনো একটি দিন।"
      );
      return;
    }
    setPayError("");
    setSubmitting(true);
    setSubmitError("");
    const items = lines.map((l) => ({
      slug: l.slug,
      name: l.name,
      quantity: l.quantity,
      unitPrice: l.unitPrice,
      lineTotal: l.lineTotal,
      addons: l.addons.map((a) => ({ name_bn: a.name_bn, price: a.price, type: a.type })),
    }));

    const { error } = await supabase.rpc("dw_place_order", {
      payload: {
        id: orderId,
        name: info.name.trim(),
        phone: info.phone.trim(),
        district: info.district,
        inside_city: info.district === "চট্টগ্রাম" && info.insideCity,
        address: info.address.trim(),
        note: info.note.trim(),
        items,
        subtotal,
        delivery,
        total,
        amount_due: amountDue,
        design_finalized: designFinalized,
        design_files: files.filter((f) => f.status === "done").map((f) => f.path),
        txn_id: txnId.trim(),
        receipt_path: receipt?.path ?? "",
      },
    });

    setSubmitting(false);
    if (error) {
      setSubmitError(
        "অর্ডার জমা দেওয়া যায়নি — আবার চেষ্টা করুন বা হোয়াটসঅ্যাপে যোগাযোগ করুন।"
      );
      return;
    }
    setPlaced(true);
    clear();
    setStep(3);
  };

  const copyNumber = async () => {
    try {
      await navigator.clipboard.writeText(payment.bkash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const orderSummaryText = () =>
    `আসসালামু আলাইকুম! আমার অর্ডার:\nঅর্ডার আইডি: ${orderId}\n` +
    lines
      .map((l) => `• ${l.name} — ${toBanglaDigits(l.quantity)} পিস`)
      .join("\n") +
    `\nমোট: ${formatPoisha(total)}\nপ্রদেয়: ${formatPoisha(amountDue)}`;

  return (
    <div className="mt-8">
      <ol className="flex items-center gap-1" aria-label="চেকআউট ধাপ">
        {STEPS.map((s, i) => (
          <li key={s} className="flex flex-1 flex-col items-center gap-1.5">
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                i < step
                  ? "bg-wave-500 text-ink"
                  : i === step
                    ? "bg-brand-700 text-paper"
                    : "bg-ink/10 text-ink/50"
              }`}
              aria-current={i === step ? "step" : undefined}
            >
              {toBanglaDigits(i + 1)}
            </span>
            <span className="text-xs font-semibold text-ink/70">{s}</span>
          </li>
        ))}
      </ol>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 28, rotateX: -6 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          exit={{ opacity: 0, y: -20, rotateX: 4 }}
          transition={{ duration: 0.4, ease: EASE }}
          style={{ transformPerspective: 1000 }}
          className="mt-8"
        >
          {step === 0 && (
            <section aria-label="আপনার তথ্য" className="space-y-5">
              <div>
                <label htmlFor="co-name" className={label}>নাম</label>
                <input id="co-name" type="text" autoComplete="name" className={field}
                  value={info.name}
                  onChange={(e) => setInfo({ ...info, name: e.target.value })}
                  aria-invalid={!!errors.name} />
                {errors.name && <p className={errText}>{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="co-phone" className={label}>ফোন নম্বর</label>
                <input id="co-phone" type="tel" inputMode="numeric" dir="ltr"
                  autoComplete="tel-national" placeholder="017XXXXXXXX" className={field}
                  value={info.phone}
                  onChange={(e) => setInfo({ ...info, phone: e.target.value })}
                  aria-invalid={!!errors.phone} />
                <p className="mt-1.5 text-sm text-ink/55">ইংরেজি সংখ্যায় লিখুন</p>
                {errors.phone && <p className={errText}>{errors.phone}</p>}
              </div>
              <div>
                <label htmlFor="co-district" className={label}>জেলা</label>
                <select id="co-district" className={field} value={info.district}
                  onChange={(e) => setInfo({ ...info, district: e.target.value })}
                  aria-invalid={!!errors.district}>
                  <option value="">বাছাই করুন…</option>
                  {districts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.district && <p className={errText}>{errors.district}</p>}
              </div>
              {info.district === "চট্টগ্রাম" && (
                <fieldset>
                  <legend className={label}>ডেলিভারি এলাকা</legend>
                  <div className="flex gap-2">
                    {[
                      { v: true, t: `সিটির ভেতরে · ${formatPoisha(deliveryRates.inside_ctg)}` },
                      { v: false, t: `সিটির বাইরে · ${formatPoisha(deliveryRates.outside_ctg)}` },
                    ].map((o) => (
                      <button key={String(o.v)} type="button"
                        onClick={() => setInfo({ ...info, insideCity: o.v })}
                        aria-pressed={info.insideCity === o.v}
                        className={`min-h-[44px] rounded-full border px-4 py-2 text-sm font-semibold ${
                          info.insideCity === o.v
                            ? "border-brand-700 bg-brand-700 text-paper"
                            : "border-ink/20 hover:border-brand-700"
                        }`}>
                        {o.t}
                      </button>
                    ))}
                  </div>
                </fieldset>
              )}
              <div>
                <label htmlFor="co-address" className={label}>সম্পূর্ণ ঠিকানা</label>
                <textarea id="co-address" rows={3} className={field}
                  placeholder="বাসা/হোল্ডিং, রোড, এলাকা, থানা" value={info.address}
                  onChange={(e) => setInfo({ ...info, address: e.target.value })}
                  aria-invalid={!!errors.address} />
                {errors.address && <p className={errText}>{errors.address}</p>}
              </div>
              <div>
                <label htmlFor="co-note" className={label}>
                  অতিরিক্ত নোট <span className="font-normal text-ink/50">(ঐচ্ছিক)</span>
                </label>
                <textarea id="co-note" rows={2} className={field} value={info.note}
                  onChange={(e) => setInfo({ ...info, note: e.target.value })} />
              </div>
              <button type="button" onClick={() => validateInfo() && setStep(1)}
                className="min-h-[52px] w-full rounded-full bg-ink text-lg font-semibold text-paper transition-colors hover:bg-brand-700">
                পরের ধাপ — ডিজাইন ফাইল
              </button>
            </section>
          )}

          {step === 1 && (
            <section aria-label="ডিজাইন ফাইল" className="space-y-5">
              <p className="leading-bangla text-ink/70">
                লোগো বা রেফারেন্স আর্টওয়ার্ক আপলোড করুন (jpg, png, pdf, ai, psd —
                সর্বোচ্চ ২৫MB)। চাইলে এড়িয়ে যান, পরে{" "}
                <a href={waLink(`অর্ডার ${orderId} — ডিজাইন ফাইল পাঠাচ্ছি।`, payment.bkash.replace(/\D/g, "").replace(/^0/, "88"))}
                  target="_blank" rel="noopener noreferrer"
                  className="font-semibold text-brand-700 underline underline-offset-2">
                  হোয়াটসঅ্যাপে পাঠাতে পারবেন
                </a>।
              </p>
              <div role="button" tabIndex={0}
                onClick={() => fileInput.current?.click()}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && fileInput.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); uploadFiles(e.dataTransfer.files); }}
                className="flex min-h-[140px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-ink/25 p-6 text-center transition-colors hover:border-brand-700">
                <p className="font-semibold">ফাইল টেনে আনুন বা ক্লিক করুন</p>
                <p className="mt-1 text-sm text-ink/55">jpg · png · pdf · ai · psd</p>
                <input ref={fileInput} type="file" multiple hidden accept={ACCEPTED.join(",")}
                  onChange={(e) => e.target.files && uploadFiles(e.target.files)} />
              </div>
              {files.length > 0 && (
                <ul className="space-y-2">
                  {files.map((f, i) => (
                    <li key={i} className="flex items-center gap-3 rounded-xl border border-ink/10 px-4 py-2.5 text-sm">
                      <span className="min-w-0 flex-1 truncate">{f.name}</span>
                      {f.status === "uploading" && (
                        <span className="relative h-1.5 w-20 overflow-hidden rounded-full bg-ink/10">
                          <motion.span className="absolute inset-y-0 w-1/3 rounded-full bg-wave-500"
                            animate={{ x: ["-100%", "300%"] }}
                            transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }} />
                        </span>
                      )}
                      {f.status === "done" && <span className="font-semibold text-brand-700">আপলোড হয়েছে ✓</span>}
                      {f.status === "error" && <span className="text-[#B3261E]">ব্যর্থ — ফরম্যাট/সাইজ দেখুন</span>}
                    </li>
                  ))}
                </ul>
              )}
              <fieldset className="rounded-2xl border border-ink/10 p-4">
                <legend className="px-1 font-semibold">ডিজাইনের অবস্থা</legend>
                {[
                  { v: false, t: "ডিজাইন Design Wave করবে", d: `ডিজাইন চার্জ ${formatPoisha(payment.design_charge)} — অনুমোদনের পর বাকি পেমেন্ট` },
                  { v: true, t: "আমার ডিজাইন চূড়ান্ত", d: "সরাসরি ৫০% অ্যাডভান্স দিয়ে প্রিন্টে যাবে" },
                ].map((o) => (
                  <label key={String(o.v)} className="mt-2 flex cursor-pointer items-start gap-3 rounded-xl p-2 hover:bg-ink/5">
                    <input type="radio" name="design-state" className="mt-1.5"
                      checked={designFinalized === o.v}
                      onChange={() => setDesignFinalized(o.v)} />
                    <span>
                      <span className="font-semibold">{o.t}</span>
                      <span className="block text-sm text-ink/60">{o.d}</span>
                    </span>
                  </label>
                ))}
              </fieldset>
              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(0)}
                  className="min-h-[52px] flex-1 rounded-full border border-ink/20 font-semibold hover:border-ink">
                  আগের ধাপ
                </button>
                <button type="button" onClick={() => setStep(2)}
                  className="min-h-[52px] flex-1 rounded-full bg-ink text-lg font-semibold text-paper transition-colors hover:bg-brand-700">
                  পরের ধাপ — পেমেন্ট
                </button>
              </div>
            </section>
          )}

          {step === 2 && (
            <section aria-label="পেমেন্ট" className="space-y-5">
              <div className="rounded-2xl border border-ink/10 p-5">
                {lines.map((l) => (
                  <div key={l.key} className="flex justify-between gap-3 py-1 text-sm">
                    <span className="min-w-0 truncate">
                      {l.name} — {toBanglaDigits(l.quantity)} পিস × {formatUnitPoisha(l.unitPrice)}
                    </span>
                    <span className="shrink-0">{formatPoisha(l.lineTotal)}</span>
                  </div>
                ))}
                <div className="mt-2 flex justify-between border-t border-ink/10 pt-2 text-sm">
                  <span>সাবটোটাল</span><span>{formatPoisha(subtotal)}</span>
                </div>
                <div className="mt-1 flex justify-between text-sm">
                  <span>ডেলিভারি ({info.district === "চট্টগ্রাম" && info.insideCity ? "চট্টগ্রাম সিটি" : "সারা দেশ"})</span>
                  <span>{formatPoisha(delivery)}</span>
                </div>
                <div className="mt-2 flex justify-between border-t border-ink/10 pt-2 font-bold">
                  <span>মোট</span><span>{formatPoisha(total)}</span>
                </div>
              </div>

              <div className="rounded-2xl bg-brand-700 p-5 text-paper">
                <p className="text-sm text-paper/80">
                  এখন প্রদেয় ({designFinalized ? "৫০% অ্যাডভান্স" : "ডিজাইন চার্জ"})
                </p>
                <p className="mt-1 text-3xl font-bold text-wave-300">{formatPoisha(amountDue)}</p>
                <div className="mt-4 flex items-center justify-between gap-3 rounded-xl bg-paper/10 px-4 py-3">
                  <div>
                    <p className="text-xs text-paper/70">বিকাশ / নগদ (পার্সোনাল)</p>
                    <p dir="ltr" className="text-lg font-bold tracking-wider">
                      {toBanglaDigits(payment.bkash)}
                    </p>
                  </div>
                  <button type="button" onClick={copyNumber}
                    className="min-h-[44px] rounded-full bg-wave-500 px-4 text-sm font-bold text-ink transition-colors hover:bg-wave-400">
                    {copied ? "কপি হয়েছে ✓" : "নম্বর কপি করুন"}
                  </button>
                </div>
                <ol className="mt-4 space-y-1 text-sm leading-bangla text-paper/85">
                  <li>১. ডিজাইন চার্জ {formatPoisha(payment.design_charge)} (ডিজাইন লাগলে)</li>
                  <li>২. ডিজাইন অনুমোদন — হোয়াটসঅ্যাপে প্রুফ দেখে</li>
                  <li>৩. মোটের ৫০% অ্যাডভান্স</li>
                  <li>৪. প্রিন্ট ও ফিনিশিং</li>
                  <li>৫. ডেলিভারি — বাকি টাকা হাতে পেয়ে</li>
                </ol>
              </div>

              <div>
                <label htmlFor="co-txn" className={label}>
                  ট্রানজেকশন আইডি
                </label>
                <input id="co-txn" type="text" dir="ltr" className={field}
                  placeholder="যেমন: 9HK7A2B5CD" value={txnId}
                  onChange={(e) => {
                    setTxnId(e.target.value);
                    if (e.target.value.trim()) setPayError("");
                  }} />
              </div>

              <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-ink/10" />
                <span className="text-xs font-semibold text-ink/45">অথবা</span>
                <span className="h-px flex-1 bg-ink/10" />
              </div>

              <ReceiptUpload
                orderId={orderId}
                stage={designFinalized ? "advance" : "design-charge"}
                value={receipt}
                onChange={(r) => {
                  setReceipt(r);
                  if (r) setPayError("");
                }}
              />

              {payError && (
                <p className="rounded-xl border border-[#B3261E]/30 bg-[#B3261E]/5 px-4 py-3 text-sm font-semibold text-[#B3261E]">
                  {payError}
                </p>
              )}
              {submitError && <p className={errText}>{submitError}</p>}

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className="min-h-[52px] flex-1 rounded-full border border-ink/20 font-semibold hover:border-ink">
                  আগের ধাপ
                </button>
                <button type="button" onClick={placeOrder} disabled={submitting}
                  className="min-h-[52px] flex-1 rounded-full bg-ink text-lg font-semibold text-paper transition-colors hover:bg-brand-700 disabled:opacity-60">
                  {submitting ? "জমা হচ্ছে…" : "অর্ডার নিশ্চিত করুন"}
                </button>
              </div>
            </section>
          )}

          {step === 3 && placed && (
            <section aria-label="অর্ডার নিশ্চিত" className="text-center">
              <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", stiffness: 260, damping: 18 }}
                className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-brand-700 text-4xl text-paper"
                aria-hidden>
                ✓
              </motion.div>
              <h2 className="bangla-safe mt-5 text-2xl font-bold">অর্ডার পৌঁছেছে!</h2>
              <p className="mt-2 leading-bangla text-ink/70">
                আপনার অর্ডার আইডি লিখে রাখুন — ট্র্যাকিংয়ে লাগবে।
              </p>
              <p dir="ltr" className="mx-auto mt-4 w-fit rounded-xl border-2 border-dashed border-brand-700 px-6 py-3 text-2xl font-bold tracking-widest text-brand-700">
                {orderId}
              </p>
              <div className="mx-auto mt-6 max-w-sm rounded-2xl border border-ink/10 p-5 text-left text-sm">
                <div className="flex justify-between"><span>মোট</span><span className="font-semibold">{formatPoisha(total)}</span></div>
                <div className="mt-1 flex justify-between"><span>এখন প্রদেয়</span><span className="font-semibold text-brand-700">{formatPoisha(amountDue)}</span></div>
                <div className="mt-1 flex justify-between"><span>স্ট্যাটাস</span><span className="font-semibold">পেমেন্ট যাচাই চলছে</span></div>
              </div>
              <div className="mt-7 flex flex-col items-center gap-3">
                <a href={waLink(orderSummaryText())} target="_blank" rel="noopener noreferrer"
                  className="inline-flex min-h-[48px] items-center gap-2 rounded-full bg-[#25D366] px-7 py-3 font-bold text-white">
                  হোয়াটসঅ্যাপে কনফার্ম করুন
                </a>
                <Link href={`/track?id=${orderId}`} className="font-semibold text-brand-700 underline underline-offset-4">
                  অর্ডার ট্র্যাক করুন
                </Link>
                <p className="text-sm text-ink/55">সাহায্য লাগলে: {PHONE_BN}</p>
              </div>
            </section>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
