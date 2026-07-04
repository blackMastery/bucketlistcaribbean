import { describe, it, expect } from "vitest";
import type { TourPricing, PaymentTerms } from "@/lib/database.types";
import {
  computeBookingTotalCents,
  computeDepositCents,
  computePeopleCount,
  selectionFitsPricing,
  buildPricingBreakdown,
  type BookingSelection,
} from "@/lib/pricing";

const tierPricing: TourPricing = {
  occupancy: [
    { occupants: 2, label: "Double", price_cents: 500_000 },
    { occupants: 1, label: "Single", price_cents: 300_000 },
  ],
  children: [{ key: "child", label: "Child 6-11", price_cents: 50_000 }],
};

const emptyPricing: TourPricing = { occupancy: [], children: [] };

const flatSelection: BookingSelection = {
  occupancyIndex: null,
  childCounts: [],
  travelers: 3,
};

const tierSelection: BookingSelection = {
  occupancyIndex: 0,
  childCounts: [2],
  travelers: 0,
};

describe("computeBookingTotalCents", () => {
  it("multiplies base price by travelers for flat pricing", () => {
    expect(computeBookingTotalCents(null, 100_000, flatSelection)).toBe(300_000);
  });

  it("treats empty occupancy as flat pricing", () => {
    expect(computeBookingTotalCents(emptyPricing, 100_000, flatSelection)).toBe(300_000);
  });

  it("sums the selected occupancy tier plus per-child tiers", () => {
    // 500_000 (double) + 2 * 50_000 (children) = 600_000
    expect(computeBookingTotalCents(tierPricing, 0, tierSelection)).toBe(600_000);
  });

  it("uses the selected occupancy index", () => {
    const sel = { ...tierSelection, occupancyIndex: 1, childCounts: [0] };
    expect(computeBookingTotalCents(tierPricing, 0, sel)).toBe(300_000);
  });

  it("ignores negative traveler counts (floors at zero)", () => {
    expect(computeBookingTotalCents(null, 100_000, { ...flatSelection, travelers: -5 })).toBe(0);
  });

  it("falls back to first tier when occupancyIndex is out of range", () => {
    const sel = { ...tierSelection, occupancyIndex: 99, childCounts: [0] };
    expect(computeBookingTotalCents(tierPricing, 0, sel)).toBe(500_000);
  });
});

describe("computePeopleCount", () => {
  it("returns travelers for flat pricing", () => {
    expect(computePeopleCount(null, flatSelection)).toBe(3);
  });

  it("returns tier occupants plus children for tier pricing", () => {
    expect(computePeopleCount(tierPricing, tierSelection)).toBe(4); // 2 adults + 2 children
  });
});

describe("computeDepositCents", () => {
  const perPerson: PaymentTerms = {
    deposit_cents: 10_000,
    deposit_per: "person",
    deadline: null,
    final_note: "",
    methods: [],
  };
  const perBooking: PaymentTerms = { ...perPerson, deposit_per: "booking" };

  it("multiplies per-person deposit by people", () => {
    expect(computeDepositCents(perPerson, true, 4)).toBe(40_000);
  });

  it("uses a flat per-booking deposit", () => {
    expect(computeDepositCents(perBooking, true, 4)).toBe(10_000);
  });

  it("is zero when the deposit window is closed", () => {
    expect(computeDepositCents(perPerson, false, 4)).toBe(0);
  });

  it("is zero when there are no payment terms", () => {
    expect(computeDepositCents(null, true, 4)).toBe(0);
  });
});

describe("selectionFitsPricing", () => {
  it("accepts a valid flat selection", () => {
    expect(selectionFitsPricing(null, flatSelection)).toBe(true);
  });

  it("rejects a flat selection with zero travelers", () => {
    expect(selectionFitsPricing(null, { ...flatSelection, travelers: 0 })).toBe(false);
  });

  it("accepts a valid tier selection", () => {
    expect(selectionFitsPricing(tierPricing, tierSelection)).toBe(true);
  });

  it("rejects a tier selection with an out-of-range occupancy index", () => {
    expect(selectionFitsPricing(tierPricing, { ...tierSelection, occupancyIndex: 5 })).toBe(false);
  });

  it("rejects a tier selection with a negative child count", () => {
    expect(selectionFitsPricing(tierPricing, { ...tierSelection, childCounts: [-1] })).toBe(false);
  });
});

describe("buildPricingBreakdown", () => {
  const terms: PaymentTerms = {
    deposit_cents: 10_000,
    deposit_per: "person",
    deadline: null,
    final_note: "",
    methods: [],
  };

  it("includes the authoritative server total for tier pricing", () => {
    const breakdown = buildPricingBreakdown(tierPricing, 0, terms, true, tierSelection) as Record<
      string,
      unknown
    >;
    expect(breakdown.total_cents).toBe(600_000);
    expect(breakdown.deposit_cents).toBe(40_000);
    expect(breakdown.occupancy_label).toBe("Double");
    expect(breakdown.occupants).toBe(2);
  });

  it("includes total and deposit for flat pricing", () => {
    const breakdown = buildPricingBreakdown(null, 100_000, terms, true, flatSelection) as Record<
      string,
      unknown
    >;
    expect(breakdown.total_cents).toBe(300_000);
    expect(breakdown.deposit_cents).toBe(30_000); // 3 travelers * 10_000
  });
});
