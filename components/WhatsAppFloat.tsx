"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { getProduct } from "@/lib/products";
import { waLink } from "@/lib/site";

/**
 * Floating WhatsApp button. On a product page the message is prefilled
 * with that product's name; elsewhere a generic greeting.
 */
export default function WhatsAppFloat() {
  const pathname = usePathname();
  const slug = pathname?.startsWith("/collections/")
    ? pathname.split("/")[2]
    : null;
  const product = slug ? getProduct(slug) : null;
  const message = product
    ? `আসসালামু আলাইকুম! আমি "${product.name}" নিয়ে জানতে চাই।`
    : "আসসালামু আলাইকুম! আমি কাস্টম কার্ড নিয়ে জানতে চাই।";

  return (
    <motion.a
      href={waLink(message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="হোয়াটসঅ্যাপে মেসেজ করুন"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1.2, type: "spring", stiffness: 260, damping: 18 }}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.94 }}
    >
      <svg viewBox="0 0 32 32" className="h-7 w-7" fill="#fff" aria-hidden>
        <path d="M16 3C9.4 3 4 8.3 4 14.9c0 2.6.8 5 2.3 7L4 29l7.3-2.3c1.5.8 3.1 1.2 4.7 1.2 6.6 0 12-5.3 12-11.9S22.6 3 16 3Zm0 21.8c-1.5 0-2.9-.4-4.2-1.1l-.3-.2-4.3 1.4 1.4-4.2-.2-.3c-1.3-1.6-2-3.5-2-5.5 0-5.4 4.4-9.9 9.6-9.9s9.6 4.4 9.6 9.9-4.3 9.9-9.6 9.9Zm5.5-7.4c-.3-.2-1.8-.9-2-1-.3-.1-.5-.2-.7.2-.2.3-.8 1-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.6-.1-.2-.7-1.7-1-2.3-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1.1 1-1.1 2.5s1.1 2.9 1.3 3.1c.2.2 2.2 3.4 5.4 4.7.8.3 1.4.5 1.8.7.8.2 1.5.2 2 .1.6-.1 1.8-.7 2.1-1.5.3-.7.3-1.3.2-1.5-.1-.1-.3-.2-.6-.3Z" />
      </svg>
    </motion.a>
  );
}
