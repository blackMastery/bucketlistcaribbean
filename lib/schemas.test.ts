import { describe, it, expect } from "vitest";
import { bookingSchema, contactSchema, newsletterEmailSchema, travelerBasicSchema, travelerPassportSchema } from "@/lib/schemas";
import { computeBookingTotalCents } from "@/lib/pricing";
import type { TourPricing } from "@/lib/database.types";

const validBookingInput = {
  tourId: "123e4567-e89b-12d3-a456-426614174000",
  travelDate: "2030-01-01",
  occupancyIndex: null,
  childCounts: [],
  travelers: 2,
  insurance: false,
  contactName: "Jane Traveler",
  contactEmail: "jane@example.com",
  contactPhone: "+1 246 000 0000",
};

describe("bookingSchema", () => {
  it("accepts a valid selection", () => {
    const result = bookingSchema.safeParse(validBookingInput);
    expect(result.success).toBe(true);
  });

  it("strips a client-supplied total_cents — a tampered price cannot reach the server", () => {
    const tampered = { ...validBookingInput, total_cents: 0, totalCents: 0, pricingBreakdown: { total_cents: 1 } };
    const result = bookingSchema.parse(tampered);
    expect(result).not.toHaveProperty("total_cents");
    expect(result).not.toHaveProperty("totalCents");
    expect(result).not.toHaveProperty("pricingBreakdown");
  });

  it("the server recomputes the real total regardless of what a client claims", () => {
    const pricing: TourPricing = {
      occupancy: [{ occupants: 2, label: "Double", price_cents: 500_000 }],
      children: [],
    };
    const parsed = bookingSchema.parse({
      ...validBookingInput,
      occupancyIndex: 0,
      total_cents: 1, // attacker claims the trip costs 1 cent
    });
    const serverTotal = computeBookingTotalCents(pricing, 0, {
      occupancyIndex: parsed.occupancyIndex,
      childCounts: parsed.childCounts,
      travelers: parsed.travelers,
    });
    expect(serverTotal).toBe(500_000);
  });

  it("rejects a bad email", () => {
    expect(bookingSchema.safeParse({ ...validBookingInput, contactEmail: "nope" }).success).toBe(false);
  });

  it("rejects a missing tour id", () => {
    expect(bookingSchema.safeParse({ ...validBookingInput, tourId: "not-a-uuid" }).success).toBe(false);
  });

  it("accepts optional traveler details for tiered bookings", () => {
    const result = bookingSchema.safeParse({
      ...validBookingInput,
      occupancyIndex: 0,
      childCounts: [0],
      travelerDetails: [
        {
          firstName: "Jane",
          lastName: "Traveler",
          phone: "+1 246 000 0000",
          passportNumber: "P1234567",
          dateOfBirth: "1990-01-01",
          gender: "female",
        },
        {
          firstName: "John",
          lastName: "Traveler",
          phone: "+1 246 000 0001",
          passportNumber: "P7654321",
          dateOfBirth: "1992-03-15",
          gender: "male",
        },
      ],
    });
    expect(result.success).toBe(true);
  });
});

describe("travelerBasicSchema", () => {
  const validTraveler = {
    firstName: "Jane",
    lastName: "Traveler",
    phone: "+1 246 000 0000",
    passportNumber: "P1234567",
    dateOfBirth: "1990-01-01",
    gender: "female" as const,
  };

  it("requires all checkout traveler fields", () => {
    expect(
      travelerBasicSchema.safeParse({ ...validTraveler, firstName: "" }).success,
    ).toBe(false);
    expect(travelerBasicSchema.safeParse(validTraveler).success).toBe(true);
  });
});

describe("travelerPassportSchema", () => {
  it("requires expiry and nationality only", () => {
    expect(
      travelerPassportSchema.safeParse({
        travelerId: "123e4567-e89b-12d3-a456-426614174000",
        passportExpiry: "2031-01-01",
        nationality: "US",
      }).success,
    ).toBe(true);
  });
});

describe("contactSchema", () => {
  it("requires name, email and message", () => {
    expect(contactSchema.safeParse({ name: "", email: "x", message: "" }).success).toBe(false);
  });

  it("accepts a complete message", () => {
    const r = contactSchema.safeParse({
      name: "Jane",
      email: "jane@example.com",
      message: "Hello there",
    });
    expect(r.success).toBe(true);
  });
});

describe("newsletterEmailSchema", () => {
  it("lowercases and trims a valid email", () => {
    expect(newsletterEmailSchema.parse("  Jane@Example.COM ")).toBe("jane@example.com");
  });

  it("rejects an invalid email", () => {
    expect(newsletterEmailSchema.safeParse("nope").success).toBe(false);
  });
});
