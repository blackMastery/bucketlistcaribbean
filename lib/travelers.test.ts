import { describe, it, expect } from "vitest";
import {
  expandTravelerSlots,
  ageAtTravel,
  validateTravelerAgeForSlot,
  validatePassportExpiry,
  maskPassportNumber,
  formatTravelerName,
  splitFullName,
} from "@/lib/travelers";
import type { TourPricing } from "@/lib/database.types";

const tieredPricing: TourPricing = {
  occupancy: [
    { occupants: 2, label: "Double occupancy", price_cents: 500_000 },
    { occupants: 1, label: "Solo", price_cents: 350_000 },
  ],
  children: [
    { key: "child", label: "Child (2–11)", price_cents: 50_000 },
  ],
};

describe("expandTravelerSlots", () => {
  it("expands adults and children from tiered selection", () => {
    const slots = expandTravelerSlots(tieredPricing, {
      occupancyIndex: 0,
      childCounts: [1],
      travelers: 0,
    });
    expect(slots).toHaveLength(3);
    expect(slots[0]).toMatchObject({ position: 1, travelerType: "adult", label: "Adult 1" });
    expect(slots[1]).toMatchObject({ position: 2, travelerType: "adult", label: "Adult 2" });
    expect(slots[2]).toMatchObject({
      position: 3,
      travelerType: "child",
      childTierKey: "child",
      label: "Child (2–11)",
    });
  });

  it("returns empty array for flat pricing", () => {
    expect(
      expandTravelerSlots(null, {
        occupancyIndex: null,
        childCounts: [],
        travelers: 3,
      }),
    ).toEqual([]);
  });
});

describe("ageAtTravel", () => {
  it("computes age on travel date", () => {
    expect(ageAtTravel("2010-06-15", "2030-01-01")).toBe(19);
    expect(ageAtTravel("2018-06-15", "2030-01-01")).toBe(11);
  });
});

describe("validateTravelerAgeForSlot", () => {
  const adultSlot = {
    position: 1,
    travelerType: "adult" as const,
    childTierKey: null,
    childTierLabel: null,
    label: "Adult 1",
  };
  const childSlot = {
    position: 2,
    travelerType: "child" as const,
    childTierKey: "child",
    childTierLabel: "Child (2–11)",
    label: "Child (2–11)",
  };

  it("requires adults to be at least 12", () => {
    expect(
      validateTravelerAgeForSlot(adultSlot, "2019-06-01", "2030-06-01"),
    ).toMatch(/at least 12/);
    expect(
      validateTravelerAgeForSlot(adultSlot, "2010-01-01", "2030-06-01"),
    ).toBeNull();
  });

  it("requires children to be 17 or younger", () => {
    expect(
      validateTravelerAgeForSlot(childSlot, "2010-01-01", "2030-06-01"),
    ).toMatch(/17 years old or younger/);
    expect(
      validateTravelerAgeForSlot(childSlot, "2018-01-01", "2030-06-01"),
    ).toBeNull();
  });
});

describe("validatePassportExpiry", () => {
  it("requires expiry at least 6 months past travel", () => {
    expect(validatePassportExpiry("2030-06-01", "2030-01-15")).toMatch(
      /6 months/,
    );
    expect(validatePassportExpiry("2031-01-01", "2030-01-15")).toBeNull();
  });
});

describe("maskPassportNumber", () => {
  it("masks all but last four characters", () => {
    expect(maskPassportNumber("AB1234567")).toBe("•••4567");
  });
});

describe("formatTravelerName", () => {
  it("joins first and last name", () => {
    expect(formatTravelerName("Jane", "Traveler")).toBe("Jane Traveler");
  });
});

describe("splitFullName", () => {
  it("splits on first space", () => {
    expect(splitFullName("Jane Marie Traveler")).toEqual({
      firstName: "Jane",
      lastName: "Marie Traveler",
    });
  });

  it("handles single name", () => {
    expect(splitFullName("Jane")).toEqual({ firstName: "Jane", lastName: "" });
  });
});
