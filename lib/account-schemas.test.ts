import { describe, it, expect } from "vitest";
import {
  profileSchema,
  reviewSchema,
  bookingMessageSchema,
  claimBookingSchema,
} from "@/lib/schemas";

describe("profileSchema", () => {
  it("requires full name", () => {
    const r = profileSchema.safeParse({ fullName: "" });
    expect(r.success).toBe(false);
  });

  it("accepts valid profile", () => {
    const r = profileSchema.safeParse({ fullName: "Jane Doe", phone: "+1 246 000 0000" });
    expect(r.success).toBe(true);
  });
});

describe("reviewSchema", () => {
  it("rejects short body", () => {
    const r = reviewSchema.safeParse({
      tourId: "00000000-0000-4000-8000-000000000001",
      rating: 5,
      body: "Short",
    });
    expect(r.success).toBe(false);
  });

  it("accepts valid review", () => {
    const r = reviewSchema.safeParse({
      tourId: "00000000-0000-4000-8000-000000000001",
      rating: 5,
      body: "An amazing trip from start to finish.",
    });
    expect(r.success).toBe(true);
  });
});

describe("bookingMessageSchema", () => {
  it("rejects empty body", () => {
    const r = bookingMessageSchema.safeParse({
      bookingId: "00000000-0000-4000-8000-000000000001",
      body: "",
    });
    expect(r.success).toBe(false);
  });
});

describe("claimBookingSchema", () => {
  it("requires reference", () => {
    const r = claimBookingSchema.safeParse({ reference: "" });
    expect(r.success).toBe(false);
  });
});
