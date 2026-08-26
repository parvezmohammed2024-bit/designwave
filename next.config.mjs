/** @type {import('next').NextConfig} */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  experimental: {
    // The PDF receipt reads these at runtime; tracing can't infer them
    // from dynamic path.join calls, so include them explicitly.
    outputFileTracingIncludes: {
      "/api/receipts/**": ["./assets/fonts/**", "./public/logo.svg"],
    },
  },
};

export default nextConfig;
