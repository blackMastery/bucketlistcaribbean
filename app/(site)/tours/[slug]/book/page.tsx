import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BookingWizard } from "@/components/tour/BookingWizard";
import { Icon } from "@/components/icons";
import { getTourBySlug, getDefaultPaymentTerms } from "@/lib/queries";
import { buildMetadata, getSeoConfig } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const [tour, site] = await Promise.all([getTourBySlug(slug), getSeoConfig()]);
  if (!tour) return { title: "Tour not found", robots: { index: false, follow: false } };
  return buildMetadata({
    title: `Book ${tour.title}`,
    description: `Request a booking for ${tour.title}.`,
    path: `/tours/${tour.slug}/book`,
    noIndex: true,
    site,
  });
}

export default async function TourBookPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [tour, defaultTerms] = await Promise.all([
    getTourBySlug(slug),
    getDefaultPaymentTerms(),
  ]);
  if (!tour) notFound();

  const terms = tour.payment_terms ?? defaultTerms;
  const todayISO = new Date().toISOString().slice(0, 10);
  const depositOpen = !terms?.deadline || todayISO <= terms.deadline;

  return (
    <div className="mx-auto max-w-[640px] px-8 pb-20 pt-[22px] max-[640px]:px-[22px]">
      <div className="mb-6 truncate font-sans text-[13px] text-muted-light">
        <Link href="/" className="text-muted-light no-underline">
          Home
        </Link>{" "}
        ·{" "}
        <Link href="/tours" className="text-muted-light no-underline">
          Tours
        </Link>{" "}
        ·{" "}
        <Link href={`/tours/${tour.slug}`} className="text-muted-light no-underline">
          {tour.title}
        </Link>{" "}
        · <span className="text-green">Book</span>
      </div>

      <Link
        href={`/tours/${tour.slug}`}
        className="mb-5 inline-flex items-center gap-1.5 font-sans text-[13px] font-semibold text-green no-underline hover:underline"
      >
        <Icon name="chevron-left" size={14} />
        Back to tour
      </Link>

      <div className="mb-8">
        <span className="inline-flex items-center gap-1.5 font-sans text-[13px] font-semibold uppercase tracking-[1.5px] text-gold">
          <Icon name="map-pin" size={13} strokeWidth={2.5} />
          {tour.location}
        </span>
        <h1 className="m-0 mb-2 mt-2.5 font-serif text-[32px] font-bold leading-[1.15] text-ink max-[600px]:text-[26px]">
          Book {tour.title}
        </h1>
        <p className="m-0 flex items-center gap-1.5 text-[14px] text-muted">
          <Icon name="clock" size={14} className="text-muted" />
          {tour.duration_label}
        </p>
      </div>

      <BookingWizard
        tourId={tour.id}
        basePriceCents={tour.price_cents}
        spotsLeft={tour.spots_left}
        pricing={tour.pricing}
        paymentTerms={terms}
        depositOpen={depositOpen}
      />
    </div>
  );
}
