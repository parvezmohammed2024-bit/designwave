"use client";

import { createBrowserClient } from "@supabase/ssr";

/** Browser client that persists the session in cookies for middleware. */
export const adminClient = () =>
  createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
