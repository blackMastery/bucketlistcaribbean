import type { TourPricing } from "@/lib/database.types";
import type { TourWithActivities } from "@/lib/queries";

export type TourDurationFilter = "any" | "1-3" | "4-7" | "8+";
export type TourSort =
  | "popular"
  | "newest"
  | "price-low"
  | "price-high"
  | "rating";

export type TourFilters = {
  destSlugs: string[];
  activities: string[];
  maxPriceGyd: number;
  dur: TourDurationFilter;
  minRating: number;
  sort: TourSort;
};

export type TourPriceBounds = {
  minGyd: number;
  maxGyd: number;
};

export const DURATION_OPTIONS: { label: string; val: TourDurationFilter }[] = [
  { label: "Any duration", val: "any" },
  { label: "1–3 days", val: "1-3" },
  { label: "4–7 days", val: "4-7" },
  { label: "8+ days", val: "8+" },
];

export const RATING_OPTIONS: { label: string; val: number }[] = [
  { label: "Any rating", val: 0 },
  { label: "4.5 & up", val: 4.5 },
  { label: "4.8 & up", val: 4.8 },
];

export const SORT_OPTIONS: { value: TourSort; label: string }[] = [
  { value: "popular", label: "Most Popular" },
  { value: "newest", label: "Newest" },
  { value: "price-low", label: "Price: Low to High" },
  { value: "price-high", label: "Price: High to Low" },
  { value: "rating", label: "Highest Rated" },
];

const SORT_SET = new Set<string>(SORT_OPTIONS.map((s) => s.value));
const DUR_SET = new Set<string>(DURATION_OPTIONS.map((d) => d.val));

/** Card/listing price: lowest occupancy tier total when set, else flat price_cents. */
export function tourDisplayPriceCents(tour: {
  price_cents: number;
  pricing: TourPricing | null;
}): number {
  const tiers =
    tour.pricing?.occupancy
      ?.map((t) => t.price_cents)
      .filter((c) => c > 0) ?? [];
  if (tiers.length) return Math.min(...tiers);
  return tour.price_cents;
}

export function tourHasOccupancyPricing(tour: {
  pricing: TourPricing | null;
}): boolean {
  return (tour.pricing?.occupancy?.length ?? 0) > 0;
}

export function tourDisplayPriceGyd(tour: {
  price_cents: number;
  pricing: TourPricing | null;
}): number {
  return Math.round(tourDisplayPriceCents(tour) / 100);
}

export function computePriceBounds(
  tours: { price_cents: number; pricing: TourPricing | null }[],
): TourPriceBounds {
  if (!tours.length) return { minGyd: 50_000, maxGyd: 600_000 };
  const gyd = tours.map(tourDisplayPriceGyd);
  const rawMin = Math.min(...gyd);
  const rawMax = Math.max(...gyd);
  const step = 10_000;
  return {
    minGyd: Math.max(step, Math.floor(rawMin / step) * step),
    maxGyd: Math.ceil(rawMax / step) * step,
  };
}

export function defaultFilters(bounds: TourPriceBounds): TourFilters {
  return {
    destSlugs: [],
    activities: [],
    maxPriceGyd: bounds.maxGyd,
    dur: "any",
    minRating: 0,
    sort: "popular",
  };
}

function parseList(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value.join(",") : (value ?? "");
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function parseNumber(value: string | string[] | undefined, fallback: number): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export function parseTourFilters(
  params: Record<string, string | string[] | undefined>,
  bounds: TourPriceBounds,
): TourFilters {
  const defaults = defaultFilters(bounds);
  const sortRaw = Array.isArray(params.sort) ? params.sort[0] : params.sort;
  const durRaw = Array.isArray(params.dur) ? params.dur[0] : params.dur;

  return {
    destSlugs: parseList(params.dest),
    activities: parseList(params.activity),
    maxPriceGyd: parseNumber(params.maxPrice, defaults.maxPriceGyd),
    dur: DUR_SET.has(durRaw ?? "") ? (durRaw as TourDurationFilter) : defaults.dur,
    minRating: parseNumber(params.rating, defaults.minRating),
    sort: SORT_SET.has(sortRaw ?? "") ? (sortRaw as TourSort) : defaults.sort,
  };
}

export function buildTourSearchParams(filters: TourFilters, bounds: TourPriceBounds): string {
  const p = new URLSearchParams();
  const defaults = defaultFilters(bounds);

  if (filters.destSlugs.length) p.set("dest", filters.destSlugs.join(","));
  if (filters.activities.length) p.set("activity", filters.activities.join(","));
  if (filters.maxPriceGyd !== defaults.maxPriceGyd) {
    p.set("maxPrice", String(filters.maxPriceGyd));
  }
  if (filters.dur !== defaults.dur) p.set("dur", filters.dur);
  if (filters.minRating !== defaults.minRating) {
    p.set("rating", String(filters.minRating));
  }
  if (filters.sort !== defaults.sort) p.set("sort", filters.sort);

  return p.toString();
}

function matchesDuration(days: number, dur: TourDurationFilter): boolean {
  if (dur === "any") return true;
  if (dur === "1-3") return days >= 1 && days <= 3;
  if (dur === "4-7") return days >= 4 && days <= 7;
  return days >= 8;
}

export function filterTours(
  tours: TourWithActivities[],
  filters: TourFilters,
  destSlugByName: Map<string, string>,
): TourWithActivities[] {
  const destSet = new Set(filters.destSlugs);
  const actSet = new Set(filters.activities);
  const maxCents = filters.maxPriceGyd * 100;

  return tours.filter((t) => {
    if (destSet.size) {
      const slug = t.destinations?.slug ?? destSlugByName.get(t.destinations?.name ?? "");
      if (!slug || !destSet.has(slug)) return false;
    }

    if (actSet.size) {
      const names = t.tour_activities
        .map((ta) => ta.activity_types?.name)
        .filter((n): n is string => !!n);
      if (!names.some((n) => actSet.has(n))) return false;
    }

    if (tourDisplayPriceCents(t) > maxCents) return false;
    if (!matchesDuration(t.duration_days, filters.dur)) return false;
    if (t.rating < filters.minRating) return false;

    return true;
  });
}

export function sortTours(
  tours: TourWithActivities[],
  sort: TourSort,
): TourWithActivities[] {
  const copy = [...tours];
  switch (sort) {
    case "price-low":
      return copy.sort(
        (a, b) => tourDisplayPriceCents(a) - tourDisplayPriceCents(b),
      );
    case "price-high":
      return copy.sort(
        (a, b) => tourDisplayPriceCents(b) - tourDisplayPriceCents(a),
      );
    case "rating":
      return copy.sort((a, b) => b.rating - a.rating);
    case "newest":
      return copy.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    case "popular":
    default:
      return copy.sort((a, b) => b.reviews_count - a.reviews_count);
  }
}
