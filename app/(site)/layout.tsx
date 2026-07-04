import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { PromoBanner } from "@/components/PromoBanner";
import { Chatbot } from "@/components/Chatbot";
import { getSiteContent } from "@/lib/queries";
import type { PromoBannerContent } from "@/lib/format";
import { resolveBlock, DEFAULT_BUSINESS_CONTACT } from "@/lib/site-content";
import { getSeoConfig } from "@/lib/seo";

export default async function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [content, site] = await Promise.all([getSiteContent(), getSeoConfig()]);
  const promo = content.promo_banner as PromoBannerContent | undefined;
  const biz = resolveBlock(content, "business_contact", DEFAULT_BUSINESS_CONTACT);

  return (
    <>
      {promo && <PromoBanner content={promo} />}
      <Header />
      <main>{children}</main>
      <Footer />
      <Chatbot storeName={site.name} contact={biz} />
    </>
  );
}
