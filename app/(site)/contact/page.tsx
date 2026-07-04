import { Eyebrow } from "@/components/ui";
import { ContactForm } from "@/components/ContactForm";
import { Icon } from "@/components/icons";
import { buildPageMetadata } from "@/lib/seo";
import { getSiteContent } from "@/lib/queries";
import {
  contactChannels,
  resolveBlock,
  resolveList,
  DEFAULT_BUSINESS_CONTACT,
  DEFAULT_CONTACT_PAGE,
  DEFAULT_SOCIAL_LINKS,
} from "@/lib/site-content";

export async function generateMetadata() {
  return buildPageMetadata({
    title: "Contact",
    description:
      "Tell us your dream and our concierge team will design it. We respond within 24 hours.",
    path: "/contact",
  });
}

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1505228395891-9a51e7e86bf6?auto=format&fit=crop&w=2000&q=80";
const MAP_IMAGE =
  "https://images.unsplash.com/photo-1524813686514-a57563d77965?auto=format&fit=crop&w=900&q=80";

export default async function ContactPage() {
  const content = await getSiteContent();
  const page = resolveBlock(content, "contact_page", DEFAULT_CONTACT_PAGE);
  const biz = resolveBlock(content, "business_contact", DEFAULT_BUSINESS_CONTACT);
  const socials = resolveList(content, "social_links", DEFAULT_SOCIAL_LINKS);
  const contacts = contactChannels(biz);

  return (
    <div>
      {/* HERO */}
      <section
        className="relative flex min-h-[340px] items-center px-8 py-20 max-[640px]:px-[22px]"
        style={{
          background: `linear-gradient(120deg,rgba(15,42,58,0.82),rgba(27,122,92,0.5)),url('${HERO_IMAGE}') center/cover`,
        }}
      >
        <div className="mx-auto w-full max-w-[1280px]">
          <Eyebrow>{page.eyebrow}</Eyebrow>
          <h1 className="m-0 mb-2.5 mt-3 font-serif text-[46px] font-bold leading-[1.1] text-sand max-[640px]:text-[34px]">
            {page.headline}
          </h1>
          <p className="m-0 max-w-[520px] text-[16px] leading-[1.6] text-sand/90">
            {page.description}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-[1180px] px-8 pb-[84px] pt-[72px] max-[640px]:px-[22px]">
        <div className="grid grid-cols-[1.3fr_1fr] items-start gap-12 max-[920px]:grid-cols-1">
          <ContactForm />

          {/* INFO */}
          <div className="flex flex-col gap-[18px]">
            <div className="rounded-2xl bg-white p-[30px] shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <h3 className="m-0 mb-5 font-serif text-[22px] font-semibold text-ink">
                {page.info_heading}
              </h3>
              <div className="flex flex-col gap-[18px]">
                {contacts.map((c) => (
                  <a key={c.label} href={c.href} className="flex items-start gap-3.5 no-underline">
                    <span className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-[10px] bg-cream text-green">
                      <Icon name={c.icon} size={18} strokeWidth={1.75} />
                    </span>
                    <span>
                      <span className="mb-[3px] block font-sans text-[12px] font-semibold uppercase tracking-[0.5px] text-muted-light">
                        {c.label}
                      </span>
                      <span className="block text-[15px] text-ink">{c.value}</span>
                    </span>
                  </a>
                ))}
              </div>
            </div>

            <div
              className="rounded-2xl p-[26px] px-[30px] text-sand"
              style={{ background: "linear-gradient(140deg,#1B7A5C,#15543F)" }}
            >
              <h4 className="m-0 mb-2.5 font-sans text-[14px] font-semibold tracking-[0.5px]">
                {page.hours_heading}
              </h4>
              <div className="whitespace-pre-line text-[14px] leading-[1.9] text-sand/90">
                {biz.hours}
              </div>
              <div className="mt-5 flex gap-2.5">
                {socials.map((s) => (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-sand/[0.12] text-sand no-underline transition-colors hover:bg-gold"
                  >
                    <Icon name={s.icon} size={18} strokeWidth={1.75} />
                  </a>
                ))}
              </div>
            </div>

            <div
              className="relative h-[200px] overflow-hidden rounded-2xl shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
              style={{ background: `url('${MAP_IMAGE}') center/cover` }}
            >
              <div className="absolute inset-0 bg-gradient-to-b from-[rgba(15,42,58,0.1)] to-[rgba(15,42,58,0.55)]" />
              <div className="absolute bottom-4 left-[18px] flex items-center gap-2.5 text-sand">
                <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full bg-gold text-blue">
                  <Icon name="map-pin" size={16} strokeWidth={2} />
                </span>
                <span className="font-sans text-[14px] font-semibold">{biz.map_label}</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
