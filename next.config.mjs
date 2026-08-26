/** @type {import('next').NextConfig} */
const supabaseHost = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : undefined;

// The PDF receipt pulls in files that static tracing cannot see:
//  - pdfkit lazily requires its built-in AFM fonts by computed path
//  - our Hind Siliguri TTFs and the logo are read at runtime
// Without these, the serverless function 500s with MODULE_NOT_FOUND.
const RECEIPT_FILES = [
  "./assets/fonts/**",
  "./public/logo.svg",
  "./node_modules/pdfkit/js/**",
  "./node_modules/fontkit/**",
  "./node_modules/linebreak/**",
];

const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: supabaseHost
      ? [{ protocol: "https", hostname: supabaseHost, pathname: "/storage/v1/object/public/**" }]
      : [],
  },
  experimental: {
    // Keep the PDF stack out of the webpack bundle so its runtime
    // requires resolve against real node_modules instead.
    serverComponentsExternalPackages: ["@react-pdf/renderer", "sharp"],
    outputFileTracingIncludes: {
      "/api/receipts/[paymentId]": RECEIPT_FILES,
      "/api/receipts/bulk": RECEIPT_FILES,
    },
  },
};

export default nextConfig;
