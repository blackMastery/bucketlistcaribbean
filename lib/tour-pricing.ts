import type {
  ChildTier,
  OccupancyTier,
  TourPricing,
  TourPricingRow,
} from "@/lib/database.types";

export type { TourPricingRow };

/** Assemble relational rows into the TourPricing shape used by forms and widgets. */
export function rowsToTourPricing(rows: TourPricingRow[]): TourPricing | null {
  if (!rows.length) return null;

  const occupancy = rows
    .filter((r) => r.kind === "occupancy")
    .sort((a, b) => a.position - b.position)
    .map(
      (r): OccupancyTier => ({
        occupants: r.occupants!,
        label: r.label,
        price_cents: r.price_cents,
      }),
    );

  const children = rows
    .filter((r) => r.kind === "child")
    .sort((a, b) => a.position - b.position)
    .map(
      (r): ChildTier => ({
        key: r.child_key!,
        label: r.label,
        price_cents: r.price_cents,
      }),
    );

  if (!occupancy.length && !children.length) return null;
  return { occupancy, children };
}

/** Convert assembled pricing to insert rows (omits id; server assigns on sync). */
export function tourPricingToRows(
  tourId: string,
  pricing: TourPricing | null,
): Omit<TourPricingRow, "id">[] {
  if (!pricing) return [];

  const rows: Omit<TourPricingRow, "id">[] = [];

  pricing.occupancy.forEach((t, i) => {
    rows.push({
      tour_id: tourId,
      kind: "occupancy",
      occupants: t.occupants,
      child_key: null,
      label: t.label,
      price_cents: t.price_cents,
      position: i,
    });
  });

  pricing.children.forEach((c, i) => {
    rows.push({
      tour_id: tourId,
      kind: "child",
      occupants: null,
      child_key: c.key,
      label: c.label,
      price_cents: c.price_cents,
      position: i,
    });
  });

  return rows;
}

/** Attach assembled `pricing` from nested `tour_pricing` relation rows. */
export function withAssembledPricing<T extends { tour_pricing?: TourPricingRow[] }>(
  tour: T,
): Omit<T, "tour_pricing"> & { pricing: TourPricing | null } {
  const { tour_pricing = [], ...rest } = tour;
  return {
    ...rest,
    pricing: rowsToTourPricing(tour_pricing),
  };
}
