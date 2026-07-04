import type { Json, PaymentTerms, TourPricing } from "@/lib/database.types";

// Single source of truth for booking price math. Used by the booking wizard
// (for live display) and the server action (for the authoritative, persisted
// total) call these pure functions so they can never disagree.

/** What the customer chose. The server recomputes price from this — never trusts
 * a client-supplied total. */
export type BookingSelection = {
  /** Index into `pricing.occupancy`; null for flat per-traveler pricing. */
  occupancyIndex: number | null;
  /** One count per `pricing.children` tier, in order. */
  childCounts: number[];
  /** Head count for flat (non-tiered) pricing. */
  travelers: number;
};

const nonNeg = (n: number): number => (Number.isFinite(n) && n > 0 ? n : 0);

export function hasTierPricing(pricing: TourPricing | null): boolean {
  return (pricing?.occupancy.length ?? 0) > 0;
}

function selectedTier(pricing: TourPricing, sel: BookingSelection) {
  const idx = sel.occupancyIndex ?? 0;
  return pricing.occupancy[idx] ?? pricing.occupancy[0];
}

export function computePeopleCount(
  pricing: TourPricing | null,
  sel: BookingSelection,
): number {
  if (!hasTierPricing(pricing)) return nonNeg(sel.travelers);
  const tier = selectedTier(pricing as TourPricing, sel);
  const children = sel.childCounts.reduce((sum, n) => sum + nonNeg(n), 0);
  return (tier?.occupants ?? 0) + children;
}

export function computeBookingTotalCents(
  pricing: TourPricing | null,
  basePriceCents: number,
  sel: BookingSelection,
): number {
  if (!hasTierPricing(pricing)) return basePriceCents * nonNeg(sel.travelers);

  const p = pricing as TourPricing;
  const tier = selectedTier(p, sel);
  const tierPrice = tier?.price_cents ?? 0;
  const childTotal = p.children.reduce(
    (sum, c, i) => sum + nonNeg(sel.childCounts[i] ?? 0) * c.price_cents,
    0,
  );
  return tierPrice + childTotal;
}

export function computeDepositCents(
  terms: PaymentTerms | null,
  depositOpen: boolean,
  people: number,
): number {
  if (!terms || !depositOpen) return 0;
  return terms.deposit_per === "person"
    ? terms.deposit_cents * nonNeg(people)
    : terms.deposit_cents;
}

/** Structural guard the server uses to reject tampered/incoherent selections
 * before persisting a booking. */
export function selectionFitsPricing(
  pricing: TourPricing | null,
  sel: BookingSelection,
): boolean {
  if (!hasTierPricing(pricing)) {
    return Number.isInteger(sel.travelers) && sel.travelers >= 1;
  }
  const p = pricing as TourPricing;
  const idx = sel.occupancyIndex;
  if (idx === null || !Number.isInteger(idx) || idx < 0 || idx >= p.occupancy.length) {
    return false;
  }
  return sel.childCounts.every((n) => Number.isInteger(n) && n >= 0);
}

/** Authoritative, server-built breakdown stored on the booking row. Mirrors the
 * shape the widget shows the customer, but every figure is server-recomputed. */
export function buildPricingBreakdown(
  pricing: TourPricing | null,
  basePriceCents: number,
  terms: PaymentTerms | null,
  depositOpen: boolean,
  sel: BookingSelection,
): Json {
  const totalCents = computeBookingTotalCents(pricing, basePriceCents, sel);
  const people = computePeopleCount(pricing, sel);
  const depositCents = computeDepositCents(terms, depositOpen, people);

  if (!hasTierPricing(pricing)) {
    return {
      travelers: nonNeg(sel.travelers),
      deposit_cents: depositCents,
      total_cents: totalCents,
    };
  }

  const p = pricing as TourPricing;
  const tier = selectedTier(p, sel);
  return {
    occupancy_label: tier?.label ?? null,
    occupants: tier?.occupants ?? null,
    tier_price_cents: tier?.price_cents ?? null,
    adults: tier?.occupants ?? null,
    children: p.children.map((c, i) => ({
      key: c.key,
      label: c.label,
      count: nonNeg(sel.childCounts[i] ?? 0),
      price_cents: c.price_cents,
    })),
    deposit_cents: depositCents,
    total_cents: totalCents,
  };
}
