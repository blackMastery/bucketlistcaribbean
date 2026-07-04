import { describe, it, expect } from "vitest";
import {
  classifyBooking,
  groupBookingsByBucket,
  nextUpcomingBooking,
  isReviewEligibleBooking,
  initialsFromName,
} from "@/lib/account";
import type { AccountBooking } from "@/lib/account";

const base = (overrides: Partial<AccountBooking>): AccountBooking => ({
  id: "1",
  reference_code: "MC-TEST01",
  travel_date: null,
  travelers: 2,
  insurance: false,
  total_cents: 100000,
  status: "pending",
  created_at: "2026-01-01T00:00:00Z",
  tours: { title: "Test Tour", slug: "test" },
  ...overrides,
});

describe("classifyBooking", () => {
  it("classifies pending bookings", () => {
    expect(classifyBooking(base({ status: "pending" }), "2026-06-15")).toBe(
      "pending",
    );
  });

  it("classifies cancelled as past", () => {
    expect(classifyBooking(base({ status: "cancelled" }), "2026-06-15")).toBe(
      "past",
    );
  });

  it("classifies confirmed future trips as upcoming", () => {
    expect(
      classifyBooking(
        base({ status: "confirmed", travel_date: "2026-12-01" }),
        "2026-06-15",
      ),
    ).toBe("upcoming");
  });

  it("classifies confirmed past trips as past", () => {
    expect(
      classifyBooking(
        base({ status: "confirmed", travel_date: "2026-01-01" }),
        "2026-06-15",
      ),
    ).toBe("past");
  });

  it("classifies confirmed without date as upcoming", () => {
    expect(
      classifyBooking(base({ status: "confirmed", travel_date: null }), "2026-06-15"),
    ).toBe("upcoming");
  });
});

describe("groupBookingsByBucket", () => {
  it("groups bookings into buckets", () => {
    const bookings = [
      base({ id: "1", status: "pending" }),
      base({ id: "2", status: "confirmed", travel_date: "2026-12-01" }),
      base({ id: "3", status: "cancelled" }),
    ];
    const groups = groupBookingsByBucket(bookings, "2026-06-15");
    expect(groups.pending).toHaveLength(1);
    expect(groups.upcoming).toHaveLength(1);
    expect(groups.past).toHaveLength(1);
  });
});

describe("nextUpcomingBooking", () => {
  it("returns earliest upcoming trip", () => {
    const bookings = [
      base({ id: "1", status: "confirmed", travel_date: "2026-12-01" }),
      base({ id: "2", status: "confirmed", travel_date: "2026-08-01" }),
    ];
    expect(nextUpcomingBooking(bookings, "2026-06-15")?.id).toBe("2");
  });
});

describe("isReviewEligibleBooking", () => {
  it("allows confirmed past trips", () => {
    expect(
      isReviewEligibleBooking(
        { status: "confirmed", travel_date: "2026-01-01" },
        "2026-06-15",
      ),
    ).toBe(true);
  });

  it("rejects pending trips", () => {
    expect(
      isReviewEligibleBooking({ status: "pending", travel_date: "2026-01-01" }),
    ).toBe(false);
  });

  it("allows confirmed with no travel date", () => {
    expect(
      isReviewEligibleBooking({ status: "confirmed", travel_date: null }),
    ).toBe(true);
  });
});

describe("initialsFromName", () => {
  it("builds initials from full name", () => {
    expect(initialsFromName("Jane Doe")).toBe("JD");
    expect(initialsFromName("Prince")).toBe("PR");
  });
});
