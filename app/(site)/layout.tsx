import SmoothScroll from "@/components/SmoothScroll";
import CustomCursor from "@/components/CustomCursor";
import GrainShift from "@/components/GrainShift";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import Toaster from "@/components/Toaster";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { getSetting, type ContactSettings } from "@/lib/catalog";

export const revalidate = 60;

/** Customer-facing chrome. Not applied to /admin. */
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const contact = await getSetting<ContactSettings>("contact", {
    phone: "+8801836065919",
    whatsapp: "8801836065919",
    email: "hello@designwave.com",
    hours_bn: "শনি–বৃহস্পতি, সকাল ১০টা – রাত ৮টা",
    address_bn: "চট্টগ্রাম, বাংলাদেশ",
  });

  return (
    <div className="grain">
      <SmoothScroll>
        <CustomCursor />
        <GrainShift />
        <Header />
        {children}
        <Footer contact={contact} />
        <CartDrawer />
        <Toaster />
        <WhatsAppFloat phone={contact.whatsapp} />
      </SmoothScroll>
    </div>
  );
}
