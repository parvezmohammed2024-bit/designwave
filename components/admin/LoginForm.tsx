"use client";

import { FormEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Image from "next/image";
import { adminClient } from "@/lib/admin/client";

export default function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(
    params.get("denied") ? "This account has no staff access." : ""
  );
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    const sb = adminClient();
    const { error: authError } = await sb.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (authError) {
      setBusy(false);
      setError("Wrong email or password.");
      return;
    }
    router.replace(params.get("next") ?? "/admin");
    router.refresh();
  };

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-sm rounded-2xl border border-ink/10 bg-white p-8 shadow-xl"
    >
      <div className="flex items-center gap-2">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <Image src="/logo.svg" alt="" width={46} height={32} />
        <span className="text-xl font-bold">
          Design<span className="text-brand-700"> Wave</span>
        </span>
      </div>
      <h1 className="mt-6 text-2xl font-bold">Admin sign in</h1>
      <p className="mt-1 text-sm text-ink/60">Staff accounts only.</p>

      <label htmlFor="email" className="mt-6 mb-1.5 block font-semibold">
        Email
      </label>
      <input
        id="email"
        type="email"
        autoComplete="username"
        required
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-xl border border-ink/20 px-4 py-3 outline-none focus:border-brand-700"
      />

      <label htmlFor="password" className="mt-4 mb-1.5 block font-semibold">
        Password
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        required
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="w-full rounded-xl border border-ink/20 px-4 py-3 outline-none focus:border-brand-700"
      />

      {error && <p className="mt-3 text-sm text-[#B3261E]">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="mt-6 min-h-[48px] w-full rounded-full bg-ink font-semibold text-paper transition-colors hover:bg-brand-700 disabled:opacity-60"
      >
        {busy ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
