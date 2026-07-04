import Image from "next/image";
import Link from "next/link";
import { getAllTours, getFeaturedTours, getSiteContent } from "@/lib/queries";
import {
  DEFAULT_BUSINESS_CONTACT,
  DEFAULT_FOOTER,
  DEFAULT_SOCIAL_LINKS,
  resolveBlock,
  resolveList,
} from "@/lib/site-content";
import { Icon } from "@/components/icons";

export async function Footer() {
  const [featured, content] = await Promise.all([getFeaturedTours(), getSiteContent()]);
  const tours =
    featured.length > 0 ? featured.slice(0, 5) : (await getAllTours()).slice(0, 5);
  const biz = resolveBlock(content, "business_contact", DEFAULT_BUSINESS_CONTACT);
  const footer = resolveBlock(content, "footer", DEFAULT_FOOTER);
  const socials = resolveList(content, "social_links", DEFAULT_SOCIAL_LINKS);

  return (
    <footer className="border-t border-gold/20 bg-[#0A0D0C] font-body text-[#C9CFCB]">
      <div className="mx-auto max-w-[1280px] px-8 pt-16 max-[640px]:px-[22px]">
        <div className="grid grid-cols-1 gap-12 min-[541px]:grid-cols-2 min-[861px]:grid-cols-[1.6fr_1fr_1fr_1fr]">
          <div>
            <div className="mb-[18px] flex items-center gap-3">
              <span className="relative h-[46px] w-[46px] overflow-hidden rounded-full border-[1.5px] border-gold/60">
                <Image src="/logo-mark.png" alt="Mista Concierge" fill className="object-cover" />
              </span>
              <span className="text-gold-gradient font-serif text-[19px] font-bold">
                Mista Concierge
              </span>
            </div>
            <p className="mb-5 max-w-[320px] text-[14px] leading-[1.7] text-[#9AA39E]">
              {footer.tagline}
            </p>
            <div className="flex gap-2.5">
              {socials.map((s) => (
                <a
                  key={s.label}
                  href={s.href}
                  aria-label={s.label}
                  className="flex h-[38px] w-[38px] items-center justify-center rounded-lg bg-white/[0.06] text-[#C9CFCB] no-underline transition-colors hover:bg-gold hover:text-[#1F2A26]"
                >
                  <Icon name={s.icon} size={16} strokeWidth={1.75} />
                </a>
              ))}
            </div>
          </div>

          {tours.length > 0 && (
            <div>
              <h4 className="mb-[18px] font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-gold">
                Popular Tours
              </h4>
              <div className="flex flex-col gap-[11px]">
                {tours.map((t) => (
                  <Link
                    key={t.id}
                    href={`/tours/${t.slug}`}
                    className="text-[14px] text-[#9AA39E] no-underline transition-colors hover:text-sand"
                  >
                    {t.title}
                  </Link>
                ))}
              </div>
            </div>
          )}

          <div>
            <h4 className="mb-[18px] font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-gold">
              Contact
            </h4>
            <div className="flex flex-col gap-[11px] text-[14px] text-[#9AA39E]">
              <a href={biz.phone_href} className="no-underline hover:text-sand">
                {biz.phone}
              </a>
              <a href={`mailto:${biz.email}`} className="no-underline hover:text-sand">
                {biz.email}
              </a>
              <a href={biz.whatsapp_href} className="no-underline hover:text-sand">
                {biz.whatsapp_footer_label}
              </a>
              <span className="leading-[1.6]">
                {biz.address_line1}
                <br />
                {biz.address_line2}
              </span>
            </div>
          </div>

          <div>
            <h4 className="mb-[18px] font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-gold">
              Explore
            </h4>
            <div className="flex flex-col gap-[11px] text-[14px]">
              <Link href="/destinations" className="text-[#9AA39E] no-underline hover:text-sand">Destinations</Link>
              <Link href="/about" className="text-[#9AA39E] no-underline hover:text-sand">About Us</Link>
              <Link href="/tours" className="text-[#9AA39E] no-underline hover:text-sand">All Tours</Link>
              <Link href="/contact" className="text-[#9AA39E] no-underline hover:text-sand">Plan a Trip</Link>
            </div>
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center gap-3.5 border-t border-white/[0.08] py-6 text-[13px] text-[#7C857F] min-[541px]:flex-row min-[541px]:justify-between">
          <span>{footer.copyright}</span>
          <div className="flex gap-6">
            <a href={footer.terms_href} className="text-[#7C857F] no-underline hover:text-[#C9CFCB]">
              {footer.terms_label}
            </a>
            <a href={footer.privacy_href} className="text-[#7C857F] no-underline hover:text-[#C9CFCB]">
              {footer.privacy_label}
            </a>
            <a href={footer.sitemap_href} className="text-[#7C857F] no-underline hover:text-[#C9CFCB]">
              {footer.sitemap_label}
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
