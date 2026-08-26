"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";
import {
  RECEIPT_ACCEPT,
  RECEIPT_ERROR_BN,
  RECEIPT_MAX_BYTES,
  compressReceipt,
  humanSize,
  isAcceptedReceipt,
  receiptPath,
} from "@/lib/receipt";

export type ReceiptState = {
  path: string;
  name: string;
  size: number;
  previewUrl: string | null;
  isPdf: boolean;
};

/**
 * Drag-and-drop / tap-to-browse receipt uploader.
 * `accept` is image/* + pdf and there is no `capture` attribute, so Android
 * opens the gallery picker (with Camera offered) rather than forcing the
 * camera straight on.
 */
export default function ReceiptUpload({
  orderId,
  stage,
  value,
  onChange,
}: {
  orderId: string;
  stage: string;
  value: ReceiptState | null;
  onChange: (r: ReceiptState | null) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  // release the object URL when the preview changes or unmounts
  useEffect(() => {
    const url = value?.previewUrl;
    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [value?.previewUrl]);

  const handle = async (file: File) => {
    setError("");

    if (!isAcceptedReceipt(file)) return setError(RECEIPT_ERROR_BN.type);
    if (file.size > RECEIPT_MAX_BYTES) return setError(RECEIPT_ERROR_BN.size);

    setBusy(true);
    setProgress(15);

    let prepared: File;
    try {
      prepared = await compressReceipt(file);
    } catch {
      setBusy(false);
      setProgress(0);
      return setError(RECEIPT_ERROR_BN.compress);
    }

    setProgress(55);
    const path = receiptPath(orderId, stage, prepared);
    const { error: upErr } = await supabase.storage
      .from("dw-receipts")
      .upload(path, prepared, { contentType: prepared.type });

    if (upErr) {
      setBusy(false);
      setProgress(0);
      return setError(RECEIPT_ERROR_BN.upload);
    }

    setProgress(100);
    onChange({
      path,
      name: file.name,
      size: prepared.size,
      previewUrl:
        prepared.type === "application/pdf" ? null : URL.createObjectURL(prepared),
      isPdf: prepared.type === "application/pdf",
    });
    setBusy(false);
    setTimeout(() => setProgress(0), 600);
  };

  const remove = () => {
    if (value?.previewUrl) URL.revokeObjectURL(value.previewUrl);
    onChange(null);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  };

  return (
    <div>
      <label htmlFor={`receipt-${stage}`} className="mb-1.5 block font-semibold">
        পেমেন্টের স্ক্রিনশট আপলোড করুন
      </label>
      <p className="mb-2 text-sm text-ink/55">
        বিকাশ/নগদের কনফার্মেশন স্ক্রিনশটটি আপলোড করুন
      </p>

      <AnimatePresence mode="wait">
        {value ? (
          <motion.div
            key="preview"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 rounded-2xl border border-brand-300 bg-brand-50 p-3"
          >
            <div className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-white">
              {value.isPdf ? (
                <span className="flex h-full w-full items-center justify-center text-xs font-bold text-ink/60">
                  PDF
                </span>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={value.previewUrl!}
                  alt="আপলোড করা রসিদ"
                  className="h-full w-full object-cover"
                />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-brand-700">
                আপলোড হয়েছে ✓
              </p>
              <p className="truncate text-xs text-ink/60">{value.name}</p>
              <p className="text-xs text-ink/45">{humanSize(value.size)}</p>
            </div>
            <div className="flex shrink-0 flex-col gap-1.5">
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="rounded-lg border border-ink/20 px-3 py-1.5 text-xs font-semibold hover:bg-white"
              >
                বদলান
              </button>
              <button
                type="button"
                onClick={remove}
                className="rounded-lg border border-ink/20 px-3 py-1.5 text-xs font-semibold text-[#B3261E] hover:bg-white"
              >
                সরান
              </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="drop"
            role="button"
            tabIndex={0}
            aria-label="পেমেন্টের স্ক্রিনশট আপলোড করুন"
            onClick={() => !busy && inputRef.current?.click()}
            onKeyDown={(e) =>
              (e.key === "Enter" || e.key === " ") && !busy && inputRef.current?.click()
            }
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handle(f);
            }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className={`flex min-h-[120px] cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed p-5 text-center transition-colors ${
              dragging ? "border-brand-700 bg-brand-50" : "border-ink/25 hover:border-brand-700"
            } ${busy ? "opacity-70" : ""}`}
          >
            {busy ? (
              <>
                <p className="text-sm font-semibold">আপলোড হচ্ছে…</p>
                <span className="mt-2 block h-1.5 w-40 overflow-hidden rounded-full bg-ink/10">
                  <motion.span
                    className="block h-full rounded-full bg-brand-700"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </span>
              </>
            ) : (
              <>
                <span aria-hidden className="text-2xl">📷</span>
                <p className="mt-1 text-sm font-semibold">
                  ছবি টেনে আনুন বা ট্যাপ করুন
                </p>
                <p className="mt-1 text-xs text-ink/55">
                  jpg · png · webp · pdf — সর্বোচ্চ ১০MB
                </p>
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <input
        ref={inputRef}
        id={`receipt-${stage}`}
        type="file"
        hidden
        accept={RECEIPT_ACCEPT}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handle(f);
        }}
      />

      {error && <p className="mt-2 text-sm text-[#B3261E]">{error}</p>}
    </div>
  );
}
