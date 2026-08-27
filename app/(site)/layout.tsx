import SmoothScroll from "@/components/SmoothScroll";
import CustomCursor from "@/components/CustomCursor";
import GrainShift from "@/components/GrainShift";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CartDrawer from "@/components/CartDrawer";
import Toaster from "@/components/Toaster";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import { getSetting, type ContactSettings } from "@/lib/catalog";
import { DELIVERY_INSIDE_CTG, DELIVERY_OUTSIDE_CTG } from "@/lib/site";

type DeliverySettings = { inside_ctg: number; outside_ctg: number };

export const revalidate = 60;

/** Customer-facing chrome. Not applied to /admin. */
export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [contact, delivery] = await Promise.all([
    getSetting<ContactSettings>("contact", {
      phone: "+8801836065919",
      whatsapp: "8801836065919",
      email: "hello@designwave.com",
      hours_bn: "শনি–বৃহস্পতি, সকাল ১০টা – রাত ৮টা",
      address_bn: "চট্টগ্রাম, বাংলাদেশ",
    }),
    getSetting<DeliverySettings>("delivery", {
      inside_ctg: DELIVERY_INSIDE_CTG,
      outside_ctg: DELIVERY_OUTSIDE_CTG,
    }),
  ]);

  return (
    <div className="grain">
      <SmoothScroll>
        <CustomCursor />
        <GrainShift />
        <Header />
        {children}
        <Footer contact={contact} />
        <CartDrawer
          deliveryInside={delivery.inside_ctg}
          deliveryOutside={delivery.outside_ctg}
        />
        <Toaster />
        <WhatsAppFloat phone={contact.whatsapp} />
      </SmoothScroll>
    </div>
  );
}
