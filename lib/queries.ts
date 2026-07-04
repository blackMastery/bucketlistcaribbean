import { createClient } from "@/lib/supabase/server";
import { createStaticClient } from "@/lib/supabase/static";
import { getCurrentSiteId } from "@/lib/site";
import {
  filterTours,
  sortTours,
  type TourFilters,
} from "@/lib/tour-filters";
import { rowsToTourPricing, withAssembledPricing } from "@/lib/tour-pricing";
import type {
  Tour,
  Destination,
  Testimonial,
  TeamMember,
  Review,
  TourImage,
  TourHighlight,
  TourItinerary,
  TourInclusion,
  PaymentTerms,
  TourPricing,
  TourPricingRow,
} from "@/lib/database.types";

export type TourWithActivities = Tour & {
  destinations: { name: string; slug: string } | null;
  tour_activities: { activity_types: { name: string } | null }[];
};

export type TourDetail = Tour & {
  destinations: { name: string; slug: string } | null;
  tour_images: TourImage[];
  tour_highlights: TourHighlight[];
  tour_itinerary: TourItinerary[];
  tour_inclusions: TourInclusion[];
  reviews: Review[];
};

type RawTourList = Omit<TourWithActivities, "pricing"> & {
  tour_pricing: TourPricingRow[];
};

function mapTourList(rows: RawTourList[]): TourWithActivities[] {
  return rows.map((row) => withAssembledPricing(row) as TourWithActivities);
}

// True only when Supabase is configured. Lets pages render (empty) instead of
// crashing the build before env vars are set.
const hasEnv = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const TOUR_LIST_SELECT =
  "*, destinations(name, slug), tour_activities(activity_types(name)), tour_pricing(*)";

export async function getFeaturedTours(): Promise<TourWithActivities[]> {
  if (!hasEnv) return [];
  try {
    const supabase = createStaticClient();
    const { data } = await supabase
      .from("tours")
      .select(TOUR_LIST_SELECT)
      .eq("is_featured", true)
      .order("sort_order", { ascending: false });
    return mapTourList((data as unknown as RawTourList[]) ?? []);
  } catch {
    return [];
  }
}

export async function getAllTours(): Promise<TourWithActivities[]> {
  if (!hasEnv) return [];
  try {
    const supabase = createStaticClient();
    const { data } = await supabase
      .from("tours")
      .select(TOUR_LIST_SELECT)
      .eq("is_published", true)
      .order("sort_order", { ascending: false });
    return mapTourList((data as unknown as RawTourList[]) ?? []);
  } catch {
    return [];
  }
}

export async function getFilteredTours(
  filters: TourFilters,
  destSlugByName: Map<string, string>,
  preloaded?: TourWithActivities[],
): Promise<TourWithActivities[]> {
  const all = preloaded ?? (await getAllTours());
  return sortTours(filterTours(all, filters, destSlugByName), filters.sort);
}

export async function getTourSlugs(): Promise<string[]> {
  if (!hasEnv) return [];
  try {
    const supabase = createStaticClient();
    const { data } = await supabase.from("tours").select("slug");
    return (data ?? []).map((t) => t.slug);
  } catch {
    return [];
  }
}

export async function getTourBySlug(slug: string): Promise<TourDetail | null> {
  if (!hasEnv) return null;
  try {
    const supabase = createStaticClient();
    const { data } = await supabase
      .from("tours")
      .select(
        "*, destinations(name, slug), tour_images(*), tour_highlights(*), tour_itinerary(*), tour_inclusions(*), reviews(*), tour_pricing(*)",
      )
      .eq("slug", slug)
      .maybeSingle();
    if (!data) return null;

    const raw = data as unknown as TourDetail & { tour_pricing: TourPricingRow[] };
    const assembled = withAssembledPricing(raw) as TourDetail;
    assembled.tour_images = [...assembled.tour_images].sort((a, b) => a.position - b.position);
    assembled.tour_highlights = [...assembled.tour_highlights].sort((a, b) => a.position - b.position);
    assembled.tour_itinerary = [...assembled.tour_itinerary].sort((a, b) => a.day_number - b.day_number);
    assembled.tour_inclusions = [...assembled.tour_inclusions].sort((a, b) => a.position - b.position);
    return assembled;
  } catch {
    return null;
  }
}

export async function getDestinations(): Promise<Destination[]> {
  if (!hasEnv) return [];
  try {
    const supabase = createStaticClient();
    const { data } = await supabase.from("destinations").select("*").order("sort_order");
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getFeaturedDestination(): Promise<Destination | null> {
  if (!hasEnv) return null;
  try {
    const supabase = createStaticClient();
    const { data } = await supabase
      .from("destinations")
      .select("*")
      .eq("is_featured", true)
      .order("sort_order")
      .limit(1)
      .maybeSingle();
    return data ?? null;
  } catch {
    return null;
  }
}

export async function getActivityTypes(): Promise<string[]> {
  if (!hasEnv) return [];
  try {
    const supabase = createStaticClient();
    const { data } = await supabase
      .from("activity_types")
      .select("name")
      .order("sort_order");
    return (data ?? []).map((a) => a.name);
  } catch {
    return [];
  }
}

export async function getTestimonials(): Promise<Testimonial[]> {
  if (!hasEnv) return [];
  try {
    const supabase = createStaticClient();
    const { data } = await supabase.from("testimonials").select("*").order("sort_order");
    return data ?? [];
  } catch {
    return [];
  }
}

export async function getTeam(): Promise<TeamMember[]> {
  if (!hasEnv) return [];
  try {
    const supabase = createStaticClient();
    const { data } = await supabase.from("team_members").select("*").order("sort_order");
    return data ?? [];
  } catch {
    return [];
  }
}

// Returns a key -> jsonb value map for the brand micro-content blocks.
export async function getSiteContent(siteId?: string): Promise<Record<string, unknown>> {
  if (!hasEnv) return {};
  const scopedSiteId = siteId ?? getCurrentSiteId();
  try {
    const supabase = createStaticClient();
    const { data } = await supabase
      .from("site_content")
      .select("key, value")
      .eq("site_id", scopedSiteId);
    const map: Record<string, unknown> = {};
    for (const row of data ?? []) map[row.key] = row.value;
    return map;
  } catch {
    return {};
  }
}

// Global default payment terms (site_content key "payment_terms"). Tours with a
// non-null payment_terms override this; null falls back to these defaults.
export async function getDefaultPaymentTerms(siteId?: string): Promise<PaymentTerms | null> {
  if (!hasEnv) return null;
  const scopedSiteId = siteId ?? getCurrentSiteId();
  try {
    const supabase = createStaticClient();
    const { data } = await supabase
      .from("site_content")
      .select("value")
      .eq("site_id", scopedSiteId)
      .eq("key", "payment_terms")
      .maybeSingle();
    return (data?.value as PaymentTerms | undefined) ?? null;
  } catch {
    return null;
  }
}

// Server-side pricing context for a booking. Loads the authoritative base
// price, tier pricing and resolved payment terms so createBookingRequest can
// recompute the total instead of trusting the browser. Returns null when the
// tour does not exist or is not published.
export type BookingPricingContext = {
  basePriceCents: number;
  pricing: TourPricing | null;
  paymentTerms: PaymentTerms | null;
  depositOpen: boolean;
};

export async function getBookingPricingContext(
  tourId: string,
): Promise<BookingPricingContext | null> {
  if (!hasEnv) return null;
  try {
    const supabase = createStaticClient();
    const { data } = await supabase
      .from("tours")
      .select("price_cents, payment_terms, tour_pricing(*)")
      .eq("id", tourId)
      .eq("is_published", true)
      .maybeSingle();
    if (!data) return null;

    const row = data as unknown as {
      price_cents: number;
      payment_terms: PaymentTerms | null;
      tour_pricing: TourPricingRow[];
    };
    const pricing = rowsToTourPricing(row.tour_pricing ?? []);
    const terms = row.payment_terms ?? (await getDefaultPaymentTerms());
    const todayISO = new Date().toISOString().slice(0, 10);
    const depositOpen = !terms?.deadline || todayISO <= terms.deadline;

    return {
      basePriceCents: row.price_cents,
      pricing,
      paymentTerms: terms,
      depositOpen,
    };
  } catch {
    return null;
  }
}

export async function getFavoriteTourIds(userId: string): Promise<string[]> {
  if (!hasEnv) return [];
  try {
    const supabase = await createClient();
    const { data } = await supabase
      .from("favorites")
      .select("tour_id")
      .eq("user_id", userId);
    return (data ?? []).map((f) => f.tour_id);
  } catch {
    return [];
  }
}
