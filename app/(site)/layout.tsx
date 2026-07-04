import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PromoBanner } from "@/components/PromoBanner";
import { Chatbot } from "@/components/Chatbot";
import { getSiteContent } from "@/lib/queries";
import type { PromoBannerContent } from "@/lib/format";
import { resolveBlock, DEFAULT_BUSINESS_CONTACT } from "@/lib/site-content";
import { SITE } from "@/lib/seo";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const content = await getSiteContent();
  const promo = content.promo_banner as PromoBannerContent | undefined;
  const biz = resolveBlock(content, "business_contact", DEFAULT_BUSINESS_CONTACT);

  return (
    <>
      {promo && <PromoBanner content={promo} />}
      <Header />
      <main>{children}</main>
      <Footer />
      <Chatbot storeName={SITE.name} contact={biz} />
    </>
  );
}
