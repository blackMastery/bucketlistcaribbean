import { ToursClient, type ClientTour } from "./ToursClient";
import {
  getAllTours,
  getActivityTypes,
  getDestinations,
  getFilteredTours,
} from "@/lib/queries";
import { getFavoriteSet } from "@/lib/auth";
import {
  computePriceBounds,
  parseTourFilters,
  tourDisplayPriceCents,
  tourHasOccupancyPricing,
} from "@/lib/tour-filters";
import { buildMetadata } from "@/lib/seo";
import { getSiteContent } from "@/lib/queries";
import { DEFAULT_TOURS_PAGE, resolveBlock } from "@/lib/site-content";

export const metadata = buildMetadata({
  title: "Tours & Experiences",
  description:
    "Handcrafted journeys across the Caribbean's most beautiful islands. Filter to find the escape that fits you.",
  path: "/tours",
});

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1473116763249-2faaef81ccda?auto=format&fit=crop&w=2000&q=80";

export default async function ToursPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;

  const [allTours, activityTypes, destinations, favs, content] = await Promise.all([
    getAllTours(),
    getActivityTypes(),
    getDestinations(),
    getFavoriteSet(),
    getSiteContent(),
  ]);
  const page = resolveBlock(content, "tours_page", DEFAULT_TOURS_PAGE);

  const destSlugByName = new Map(destinations.map((d) => [d.name, d.slug]));
  const priceBounds = computePriceBounds(allTours);
  const filters = parseTourFilters(params, priceBounds);
  const filteredTours = await getFilteredTours(filters, destSlugByName, allTours);

  const clientTours: ClientTour[] = filteredTours.map((t) => ({
    id: t.id,
    slug: t.slug,
    title: t.title,
    location: t.location,
    price_cents: tourDisplayPriceCents(t),
    pricePerPerson: !tourHasOccupancyPricing(t),
    rating: t.rating,
    reviews_count: t.reviews_count,
    duration_label: t.duration_label,
    duration_days: t.duration_days,
    badge: t.badge,
    badge_color: t.badge_color,
    card_image_url: t.card_image_url,
    destName: t.destinations?.name ?? "",
    destSlug: t.destinations?.slug ?? "",
    acts: t.tour_activities
      .map((ta) => ta.activity_types?.name)
      .filter((n): n is string => !!n),
    isFavorite: favs.has(t.id),
  }));

  const destOptions = destinations
    .map((d) => ({
      name: d.name,
      slug: d.slug,
      count: allTours.filter((t) => t.destinations?.slug === d.slug).length,
    }))
    .filter((d) => d.count > 0);

  return (
    <div className="min-h-screen">
      <section
        className="px-8 py-16 max-[640px]:px-[22px]"
        style={{
          background: `linear-gradient(120deg,rgba(15,42,58,0.74),rgba(15,76,117,0.62)),url('${HERO_IMAGE}') center/cover`,
        }}
      >
        <div className="mx-auto max-w-[1280px]">
          <span className="font-sans text-[13px] font-semibold uppercase tracking-[2px] text-gold">
            {page.eyebrow}
          </span>
          <h1 className="m-0 mb-2 mt-2.5 font-serif text-[46px] font-bold leading-[1.1] text-sand max-[640px]:text-[34px]">
            {page.headline}
          </h1>
          <p className="m-0 max-w-[560px] text-[16px] text-sand/[0.88]">
            {page.description}
          </p>
        </div>
      </section>

      <ToursClient
        tours={clientTours}
        destOptions={destOptions}
        activityTypes={activityTypes}
        filters={filters}
        priceBounds={priceBounds}
      />
    </div>
  );
}
