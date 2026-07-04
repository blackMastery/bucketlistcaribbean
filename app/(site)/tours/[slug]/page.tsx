import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Carousel } from "@/components/tour/Carousel";
import { Itinerary } from "@/components/tour/Itinerary";
import { Gallery } from "@/components/tour/Gallery";
import { BookingSummaryCard } from "@/components/tour/BookingSummaryCard";
import { MobileBookBar } from "@/components/tour/MobileBookBar";
import { getTourBySlug, getTourSlugs, getDefaultPaymentTerms, getSiteContent } from "@/lib/queries";
import { formatPrice, formatDate } from "@/lib/format";
import { DEFAULT_BUSINESS_CONTACT, resolveBlock } from "@/lib/site-content";
import { tourDisplayPriceCents, tourHasOccupancyPricing } from "@/lib/tour-filters";
import { JsonLd } from "@/components/seo/JsonLd";
import { Icon, Stars } from "@/components/icons";
import { buildMetadata, getSeoConfig, tourJsonLd, breadcrumbJsonLd } from "@/lib/seo";

export async function generateStaticParams() {
  const slugs = await getTourSlugs();
  return slugs.map((slug) => ({ slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [tour, site] = await Promise.all([getTourBySlug(slug), getSeoConfig()]);
  if (!tour) return { title: "Tour not found", robots: { index: false, follow: false } };
  return buildMetadata({
    title: tour.title,
    description: tour.overview ?? undefined,
    path: `/tours/${tour.slug}`,
    image: tour.card_image_url,
    type: "article",
    site,
  });
}

export default async function TourDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [tour, defaultTerms, content, site] = await Promise.all([
    getTourBySlug(slug),
    getDefaultPaymentTerms(),
    getSiteContent(),
    getSeoConfig(),
  ]);
  if (!tour) notFound();
  const biz = resolveBlock(content, "business_contact", DEFAULT_BUSINESS_CONTACT);

  const terms = tour.payment_terms ?? defaultTerms;
  const todayISO = new Date().toISOString().slice(0, 10);
  const depositOpen = !terms?.deadline || todayISO <= terms.deadline;

  const carouselImages = (
    tour.tour_images.filter((im) => im.in_carousel).map((im) => im.url)
  );
  const heroImages = carouselImages.length ? carouselImages : [tour.card_image_url];
  const galleryImages = tour.tour_images.length
    ? tour.tour_images.map((im) => im.url)
    : [tour.card_image_url];

  const included = tour.tour_inclusions.filter((i) => i.kind === "included");
  const excluded = tour.tour_inclusions.filter((i) => i.kind === "excluded");

  const pricedOccupancy =
    tour.pricing?.occupancy.filter((t) => t.price_cents > 0) ?? [];
  const pricedChildren =
    tour.pricing?.children.filter((c) => c.price_cents > 0) ?? [];

  return (
    <div>
      <JsonLd
        data={[
          tourJsonLd(tour, site),
          breadcrumbJsonLd(
            [
              { name: "Home", path: "/" },
              { name: "Tours", path: "/tours" },
              { name: tour.title, path: `/tours/${tour.slug}` },
            ],
            site,
          ),
        ]}
      />

      {/* BREADCRUMB */}
      <div className="mx-auto max-w-[1280px] px-8 pt-[22px] max-[640px]:px-[22px]">
        <div className="truncate font-sans text-[13px] text-muted-light">
          <Link href="/" className="text-muted-light no-underline">Home</Link> ·{" "}
          <Link href="/tours" className="text-muted-light no-underline">Tours</Link> ·{" "}
          <span className="text-green">{tour.title}</span>
        </div>
      </div>

      {/* CAROUSEL */}
      <section className="mx-auto max-w-[1280px] px-8 pt-5 max-[640px]:px-[22px]">
        <Carousel images={heroImages} tourId={tour.id} slug={tour.slug} />
      </section>

      {/* MAIN GRID */}
      <div className="mx-auto grid max-w-[1280px] grid-cols-[1fr_380px] items-start gap-12 px-8 pb-20 pt-10 max-[920px]:grid-cols-1 max-[920px]:pb-28 max-[640px]:px-[22px]">
        {/* LEFT */}
        <div>
          <span className="inline-flex items-center gap-1.5 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-gold">
            <Icon name="map-pin" size={13} strokeWidth={2.5} />
            {tour.location}
          </span>
          <h1 className="m-0 mb-3.5 mt-2.5 font-serif text-[40px] font-bold leading-[1.12] text-ink max-[600px]:text-[30px]">
            {tour.title}
          </h1>
          <div className="mb-[30px] flex flex-wrap items-center gap-[18px]">
            <div className="flex items-center gap-2">
              <Stars size={16} />
              <span className="text-[14px] text-muted">
                <strong className="text-ink">{tour.rating.toFixed(1)}</strong> ·{" "}
                {tour.reviews_count} reviews
              </span>
            </div>
            <span className="h-[18px] w-px bg-[#D9D2C2]" />
            <span className="inline-flex items-center gap-1.5 text-[14px] text-muted">
              <Icon name="clock" size={14} className="text-muted" />
              {tour.duration_label}
            </span>
            {tour.booked_last_24h ? (
              <>
                <span className="h-[18px] w-px bg-[#D9D2C2]" />
                <span className="rounded-md bg-coral/[0.12] px-3 py-1 font-sans text-[12px] font-semibold text-coral">
                  {tour.booked_last_24h} booked in last 24h
                </span>
              </>
            ) : null}
          </div>

          {/* OVERVIEW */}
          {tour.overview && (
            <>
              <h2 className="m-0 mb-3.5 font-serif text-[26px] font-semibold text-ink">
                Overview
              </h2>
              <p className="m-0 mb-[26px] text-[15.5px] leading-[1.75] text-ink-soft">
                {tour.overview}
              </p>
            </>
          )}

          {/* PRICING */}
          {(pricedOccupancy.length > 0 || pricedChildren.length > 0) && (
            <div className="mb-9 rounded-2xl bg-white p-[26px] px-7 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <h3 className="m-0 mb-4 font-sans text-[16px] font-semibold text-ink">
                Pricing
              </h3>
              <div className="flex flex-col">
                {pricedOccupancy.map((t, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between border-b border-ink/[0.06] py-2.5 last:border-0"
                  >
                    <span className="text-[14.5px] text-ink-soft">{t.label}</span>
                    <span className="font-serif text-[16px] font-bold text-gold">
                      {formatPrice(t.price_cents)}
                    </span>
                  </div>
                ))}
                {pricedChildren.map((c) => (
                  <div
                    key={c.key}
                    className="flex items-center justify-between border-b border-ink/[0.06] py-2.5 last:border-0"
                  >
                    <span className="text-[14.5px] text-ink-soft">{c.label}</span>
                    <span className="font-serif text-[16px] font-bold text-gold">
                      {formatPrice(c.price_cents)}
                      <span className="font-body text-[12px] font-normal text-muted-light">
                        {" "}
                        / child
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* PAYMENT TERMS */}
          {terms && (
            <div className="mb-9 rounded-2xl bg-white p-[26px] px-7 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <h3 className="m-0 mb-3 font-sans text-[16px] font-semibold text-ink">
                Payment
              </h3>
              <p className="m-0 mb-3 text-[14.5px] leading-[1.65] text-ink-soft">
                {terms.deadline && depositOpen ? (
                  <>
                    Deposit{" "}
                    <strong className="text-ink">
                      {formatPrice(terms.deposit_cents)}
                    </strong>{" "}
                    per {terms.deposit_per} to book by{" "}
                    <strong className="text-ink">{formatDate(terms.deadline)}</strong>.{" "}
                    {terms.final_note}
                  </>
                ) : terms.deadline && !depositOpen ? (
                  <>{terms.final_note}</>
                ) : (
                  <>
                    Deposit{" "}
                    <strong className="text-ink">
                      {formatPrice(terms.deposit_cents)}
                    </strong>{" "}
                    per {terms.deposit_per} to book. {terms.final_note}
                  </>
                )}
              </p>
              {terms.methods.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {terms.methods.map((m) => (
                    <span
                      key={m}
                      className="rounded-md bg-green/[0.1] px-3 py-1.5 font-sans text-[12px] font-semibold text-green"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* HIGHLIGHTS */}
          {tour.tour_highlights.length > 0 && (
            <div className="mb-9 rounded-2xl bg-white p-[26px] px-7 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
              <h3 className="m-0 mb-4 font-sans text-[16px] font-semibold text-ink">
                Trip Highlights
              </h3>
              <div className="grid grid-cols-2 gap-[13px] max-[600px]:grid-cols-1">
                {tour.tour_highlights.map((h) => (
                  <div key={h.id} className="flex items-start gap-[11px]">
                    <span className="mt-px flex h-[22px] w-[22px] flex-shrink-0 items-center justify-center rounded-full bg-green/[0.12] text-green">
                      <Icon name="check" size={12} strokeWidth={3} />
                    </span>
                    <span className="text-[14.5px] leading-[1.5] text-ink-soft">
                      {h.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ITINERARY */}
          {tour.tour_itinerary.length > 0 && (
            <>
              <h2 className="m-0 mb-[18px] font-serif text-[26px] font-semibold text-ink">
                Itinerary
              </h2>
              <Itinerary days={tour.tour_itinerary} />
            </>
          )}

          {/* WHAT'S INCLUDED */}
          {(included.length > 0 || excluded.length > 0) && (
            <>
              <h2 className="m-0 mb-[18px] font-serif text-[26px] font-semibold text-ink">
                What&apos;s Included
              </h2>
              <div className="mb-9 grid grid-cols-2 gap-6 max-[600px]:grid-cols-1">
                <div className="rounded-xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <h4 className="m-0 mb-3.5 font-sans text-[14px] font-semibold text-green">
                    Included
                  </h4>
                  <div className="flex flex-col gap-[11px]">
                    {included.map((i) => (
                      <div key={i.id} className="flex items-center gap-2.5 text-[14px] text-ink-soft">
                        <Icon name="check" size={14} className="shrink-0 text-green" strokeWidth={3} />
                        {i.text}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rounded-xl bg-white p-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                  <h4 className="m-0 mb-3.5 font-sans text-[14px] font-semibold text-[#B0524A]">
                    Not Included
                  </h4>
                  <div className="flex flex-col gap-[11px]">
                    {excluded.map((i) => (
                      <div key={i.id} className="flex items-center gap-2.5 text-[14px] text-muted-light">
                        <Icon name="x" size={14} className="shrink-0 text-[#C0857E]" strokeWidth={3} />
                        {i.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* GALLERY */}
          <h2 className="m-0 mb-[18px] font-serif text-[26px] font-semibold text-ink">
            Gallery
          </h2>
          <Gallery images={galleryImages} />

          {/* REVIEWS */}
          {tour.reviews.length > 0 && (
            <>
              <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                <h2 className="m-0 font-serif text-[26px] font-semibold text-ink max-[600px]:text-[22px]">
                  Reviews
                </h2>
                <div className="flex items-center gap-2.5">
                  <span className="font-serif text-[32px] font-bold text-green">
                    {tour.rating.toFixed(1)}
                  </span>
                  <div>
                    <Stars size={14} />
                    <div className="text-[12.5px] text-muted-light">
                      {tour.reviews_count} reviews
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-4">
                {tour.reviews.map((r) => (
                  <div key={r.id} className="rounded-xl bg-white p-[22px] px-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
                    <div className="mb-3 flex items-center gap-[13px]">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-green font-sans text-[15px] font-semibold text-sand">
                        {r.initials}
                      </div>
                      <div className="flex-1">
                        <div className="font-sans text-[14.5px] font-semibold text-ink">
                          {r.author_name}
                        </div>
                        <div className="text-[12px] text-muted-light">{r.review_date}</div>
                      </div>
                      <Stars size={13} />
                    </div>
                    <p className="m-0 text-[14.5px] leading-[1.65] text-ink-soft">{r.body}</p>
                  </div>
                ))}
              </div>
              <button className="mt-5 rounded-lg border-2 border-gold bg-transparent px-7 py-3 font-sans text-[14px] font-semibold text-green hover:bg-gold hover:text-white">
                See All {tour.reviews_count} Reviews
              </button>
            </>
          )}
        </div>

        {/* RIGHT: BOOKING */}
        <div className="sticky top-24 flex flex-col gap-[18px] max-[920px]:static">
          <BookingSummaryCard
            slug={tour.slug}
            basePriceCents={tour.price_cents}
            spotsLeft={tour.spots_left}
            pricing={tour.pricing}
            paymentTerms={terms}
            depositOpen={depositOpen}
          />
          <div className="rounded-2xl bg-white p-[22px] px-6 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
            <h4 className="m-0 mb-3.5 font-sans text-[14px] font-semibold text-ink">
              Questions? Talk to us
            </h4>
            <div className="flex flex-col gap-3">
              <a href={biz.phone_href} className="flex items-center gap-3 text-[14px] text-ink-soft no-underline">
                <span className="flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-cream text-green">
                  <Icon name="phone" size={16} />
                </span>
                {biz.phone}
              </a>
              <a href={`mailto:${biz.email}`} className="flex items-center gap-3 text-[14px] text-ink-soft no-underline">
                <span className="flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-cream text-green">
                  <Icon name="mail" size={16} />
                </span>
                {biz.email}
              </a>
              <a href={biz.whatsapp_href} className="flex items-center gap-3 text-[14px] text-ink-soft no-underline">
                <span className="flex h-[34px] w-[34px] items-center justify-center rounded-lg bg-green/[0.12] text-green">
                  <Icon name="message-circle" size={16} />
                </span>
                {biz.whatsapp_short_label}
              </a>
            </div>
          </div>
        </div>
      </div>

      <MobileBookBar
        slug={tour.slug}
        priceLabel={
          tourHasOccupancyPricing(tour)
            ? `From ${formatPrice(tourDisplayPriceCents(tour))}`
            : `${formatPrice(tour.price_cents)} / person`
        }
        spotsLeft={tour.spots_left}
      />
    </div>
  );
}
