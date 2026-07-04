import Link from "next/link";
import { Reveal } from "@/components/Reveal";
import { Eyebrow, Stars } from "@/components/ui";
import { Icon, parseRatingText, StatBig } from "@/components/icons";
import { TourCard } from "@/components/TourCard";
import { LiveBookingToast } from "@/components/LiveBookingToast";
import { buildMetadata } from "@/lib/seo";
import {
  getFeaturedTours,
  getDestinations,
  getTestimonials,
  getSiteContent,
} from "@/lib/queries";
import { getFavoriteSet } from "@/lib/auth";
import { tourDisplayPriceCents, tourHasOccupancyPricing } from "@/lib/tour-filters";
import {
  DEFAULT_HOME_HERO,
  type HeroContent,
  type StatItem,
  type PillarItem,
} from "@/lib/format";
import {
  DEFAULT_HOME_DESTINATIONS,
  DEFAULT_HOME_FEATURED_TOURS,
  DEFAULT_HOME_TESTIMONIALS,
  DEFAULT_HOME_WHY_CHOOSE,
  resolveBlock,
} from "@/lib/site-content";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=2000&q=80";

export const metadata = buildMetadata({ path: "/" });

export default async function HomePage() {
  const [tours, destinations, testimonials, content, favs] = await Promise.all([
    getFeaturedTours(),
    getDestinations(),
    getTestimonials(),
    getSiteContent(),
    getFavoriteSet(),
  ]);

  const hero: HeroContent = {
    ...DEFAULT_HOME_HERO,
    ...(content.home_hero as Partial<HeroContent> | undefined),
  };
  const featuredTours = resolveBlock(content, "home_featured_tours", DEFAULT_HOME_FEATURED_TOURS);
  const whyChoose = resolveBlock(content, "home_why_choose", DEFAULT_HOME_WHY_CHOOSE);
  const destinationsSection = resolveBlock(content, "home_destinations", DEFAULT_HOME_DESTINATIONS);
  const testimonialsSection = resolveBlock(content, "home_testimonials", DEFAULT_HOME_TESTIMONIALS);
  const stats = (content.hero_stats as StatItem[] | undefined) ?? [];
  const pillars = (content.pillars as PillarItem[] | undefined) ?? [];
  const teaser = destinations.slice(0, 3);

  return (
    <div className="overflow-x-hidden">
      {/* HERO */}
      <section
        className="relative flex min-h-[560px] flex-col sm:min-h-[680px]"
        style={{
          background: `linear-gradient(90deg,rgba(6,9,10,0.9) 0%,rgba(6,9,10,0.66) 38%,rgba(6,9,10,0.28) 68%,rgba(6,9,10,0.1) 100%),url('${HERO_IMAGE}') center/cover`,
        }}
      >
        <div className="flex flex-1 items-center px-[22px] pb-12 pt-[88px] sm:px-8 sm:pb-16 sm:pt-[120px]">
          <div className="mx-auto w-full max-w-[1280px]">
            <Reveal className="max-w-[680px]">
              <div className="mb-6 inline-flex items-center gap-2 rounded-[30px] border border-gold/50 bg-gold/[0.18] px-4 py-[7px]">
                <span className="inline-flex items-center gap-1 text-gold">
                  <Icon name="star" size={13} fill="currentColor" strokeWidth={0} />
                  <span className="font-sans text-[12.5px] font-medium tracking-[0.3px] text-sand">
                    {parseRatingText(hero.badge_rating)}
                  </span>
                </span>
                <span className="font-sans text-[12.5px] font-medium tracking-[0.3px] text-sand">
                  {hero.badge_text}
                </span>
              </div>
              <h1 className="m-0 mb-5 font-serif text-[34px] font-bold leading-[1.08] text-sand [text-shadow:0_2px_24px_rgba(0,0,0,0.6)] sm:text-[48px] sm:leading-[1.05] lg:text-[64px]">
                {hero.headline}
              </h1>
              <p className="m-0 mb-8 max-w-[560px] text-[16px] leading-[1.6] text-sand/90 [text-shadow:0_1px_12px_rgba(0,0,0,0.55)] sm:text-[19px]">
                {hero.description}
              </p>
              <div className="flex flex-col items-stretch gap-3.5 sm:flex-row sm:items-center sm:gap-4">
                <Link
                  href={hero.primary_cta_href}
                  className="rounded-lg bg-green px-9 py-4 text-center font-sans text-[16px] font-semibold text-sand no-underline shadow-[0_8px_24px_rgba(27,122,92,0.4)] transition-transform hover:-translate-y-0.5 hover:bg-green-dark"
                >
                  {hero.primary_cta_label}
                </Link>
                <Link
                  href={hero.secondary_cta_href}
                  className="rounded-lg border-2 border-sand/50 bg-white/[0.08] px-8 py-3.5 text-center font-sans text-[16px] font-semibold text-sand no-underline transition-colors hover:border-gold hover:bg-white/[0.16]"
                >
                  {hero.secondary_cta_label}
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-x-8 gap-y-5 border-t border-gold/25 bg-[rgba(6,9,10,0.62)] px-[22px] py-5 backdrop-blur-sm sm:gap-16 sm:px-8 sm:py-[22px]">
          {stats.map((st) => (
            <div key={st.label} className="min-w-[40%] text-center sm:min-w-0">
              <div className="font-serif text-[24px] font-bold text-gold sm:text-[26px]">
                <StatBig value={st.num} starSize={18} />
              </div>
              <div className="font-sans text-[12px] uppercase tracking-[0.5px] text-sand/80">
                {st.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FEATURED TOURS */}
      <section className="mx-auto max-w-[1280px] px-8 py-[90px] max-[640px]:px-[22px] max-[640px]:py-14">
        <Reveal className="mx-auto mb-[54px] max-w-[620px] text-center">
          <Eyebrow>{featuredTours.eyebrow}</Eyebrow>
          <h2 className="m-0 mb-3.5 mt-3 font-serif text-[42px] font-bold leading-[1.15] text-ink max-[640px]:text-[30px]">
            {featuredTours.headline}
          </h2>
          <p className="m-0 text-[16px] leading-[1.6] text-muted">
            {featuredTours.description}
          </p>
        </Reveal>
        <div className="grid grid-cols-3 gap-7 max-[980px]:grid-cols-2 max-[640px]:grid-cols-1">
          {tours.map((t, i) => (
            <Reveal key={t.id} delay={i * 0.08}>
              <TourCard
                tour={{
                  ...t,
                  price_cents: tourDisplayPriceCents(t),
                  pricePerPerson: !tourHasOccupancyPricing(t),
                }}
                isFavorite={favs.has(t.id)}
              />
            </Reveal>
          ))}
        </div>
        <div className="mt-[46px] text-center">
          <Link
            href={featuredTours.cta_href ?? "/tours"}
            className="inline-block rounded-lg border-2 border-gold px-[34px] py-[13px] font-sans text-[15px] font-semibold text-green no-underline transition-colors hover:bg-gold hover:text-white"
          >
            {featuredTours.cta_label}
          </Link>
        </div>
      </section>

      {/* WHY CHOOSE */}
      <section style={{ background: "linear-gradient(160deg,#1B7A5C 0%,#15543F 100%)" }}>
        <div className="mx-auto max-w-[1280px] px-8 py-[90px] max-[640px]:px-[22px] max-[640px]:py-14">
          <Reveal className="mx-auto mb-14 max-w-[620px] text-center">
            <Eyebrow>{whyChoose.eyebrow}</Eyebrow>
            <h2 className="m-0 mt-3 font-serif text-[42px] font-bold leading-[1.15] text-sand max-[640px]:text-[30px]">
              {whyChoose.headline}
            </h2>
          </Reveal>
          <div className="grid grid-cols-4 gap-6 max-[980px]:grid-cols-2 max-[640px]:grid-cols-1 max-[640px]:gap-4">
            {pillars.map((p, i) => (
              <Reveal key={p.title} delay={i * 0.07} className="h-full">
                <div className="h-full rounded-2xl border border-sand/[0.14] bg-sand/[0.07] p-8 px-[26px] text-center transition-colors hover:bg-sand/[0.12]">
                  <div className="mx-auto mb-[18px] flex h-[62px] w-[62px] items-center justify-center rounded-full border border-gold/40 bg-gold/[0.16] text-gold">
                    <Icon name={p.icon} size={26} strokeWidth={1.75} />
                  </div>
                  <h3 className="m-0 mb-[9px] font-sans text-[18px] font-semibold text-sand">
                    {p.title}
                  </h3>
                  <p className="m-0 text-[14px] leading-[1.6] text-sand/[0.78]">
                    {p.body}
                  </p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* DESTINATIONS TEASER */}
      <section className="mx-auto max-w-[1280px] px-8 py-[90px] max-[640px]:px-[22px] max-[640px]:py-14">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
          <div className="max-w-[560px]">
            <Eyebrow>{destinationsSection.eyebrow}</Eyebrow>
            <h2 className="m-0 mt-3 font-serif text-[42px] font-bold leading-[1.15] text-ink max-[640px]:text-[30px]">
              {destinationsSection.headline}
            </h2>
          </div>
          <Link
            href={destinationsSection.link_href ?? "/destinations"}
            className="border-b-2 border-gold pb-[3px] font-sans text-[14px] font-semibold text-green no-underline"
          >
            {destinationsSection.link_label}
          </Link>
        </div>
        <div className="grid grid-cols-3 gap-6 max-[980px]:grid-cols-2 max-[640px]:grid-cols-1">
          {teaser.map((d, i) => (
            <Reveal key={d.id} delay={i * 0.08}>
              <Link
                href="/destinations"
                className="relative block h-[340px] overflow-hidden rounded-2xl no-underline shadow-[0_2px_8px_rgba(0,0,0,0.1)]"
                style={{ background: `url('${d.hero_image_url}') center/cover` }}
              >
                <div className="absolute inset-0 bg-gradient-to-b from-transparent from-[35%] to-[rgba(15,38,30,0.85)]" />
                <div className="absolute bottom-0 left-0 right-0 p-[26px]">
                  <h3 className="m-0 mb-1.5 font-serif text-[24px] font-bold text-sand">
                    {d.name}
                  </h3>
                  <p className="m-0 mb-3 text-[13.5px] leading-[1.5] text-sand/85">
                    {d.description}
                  </p>
                  <span className="font-sans text-[13px] font-semibold text-gold">
                    Explore →
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="bg-cream">
        <div className="mx-auto max-w-[1280px] px-8 py-[90px] max-[640px]:px-[22px] max-[640px]:py-14">
          <Reveal className="mx-auto mb-[54px] max-w-[620px] text-center">
            <Eyebrow>{testimonialsSection.eyebrow}</Eyebrow>
            <h2 className="m-0 mt-3 font-serif text-[42px] font-bold leading-[1.15] text-ink max-[640px]:text-[30px]">
              {testimonialsSection.headline}
            </h2>
          </Reveal>
          <div className="grid grid-cols-3 gap-6 max-[980px]:grid-cols-2 max-[640px]:grid-cols-1">
            {testimonials.map((t, i) => (
              <Reveal key={t.id} delay={i * 0.08}>
                <div className="rounded-2xl bg-white p-[30px] shadow-[0_2px_8px_rgba(0,0,0,0.06)]">
                  <Stars />
                  <p className="my-4 mb-[22px] font-serif text-[17px] italic leading-[1.55] text-ink">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div className="flex items-center gap-[13px]">
                    <div className="flex h-[46px] w-[46px] items-center justify-center rounded-full bg-green font-sans text-[16px] font-semibold text-sand">
                      {t.initials}
                    </div>
                    <div>
                      <div className="font-sans text-[14.5px] font-semibold text-ink">
                        {t.name}
                      </div>
                      <div className="text-[12.5px] text-muted-light">{t.trip}</div>
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* <LiveBookingToast /> */}
    </div>
  );
}
