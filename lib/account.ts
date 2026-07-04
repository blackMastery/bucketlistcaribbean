// Account helpers: trip grouping, review eligibility, initials.

export type TripBucket = "upcoming" | "pending" | "past";

export type AccountBooking = {
  id: string;
  reference_code: string;
  travel_date: string | null;
  travelers: number;
  insurance: boolean;
  total_cents: number;
  status: string;
  created_at: string;
  tours: { title: string; slug: string } | null;
};

export type TravelPreferences = {
  dietary?: string;
  mobility?: string;
  interests?: string[];
  room_preference?: string;
  notes?: string;
};

/** UTC date string YYYY-MM-DD for consistent comparisons. */
export function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

export function classifyBooking(
  booking: Pick<AccountBooking, "status" | "travel_date">,
  today: string = todayISO(),
): TripBucket {
  if (booking.status === "pending") return "pending";
  if (booking.status === "cancelled") return "past";
  if (booking.status === "confirmed") {
    if (!booking.travel_date || booking.travel_date >= today) return "upcoming";
    return "past";
  }
  return "past";
}

export function groupBookingsByBucket(
  bookings: AccountBooking[],
  today: string = todayISO(),
): Record<TripBucket, AccountBooking[]> {
  const groups: Record<TripBucket, AccountBooking[]> = {
    upcoming: [],
    pending: [],
    past: [],
  };
  for (const b of bookings) {
    groups[classifyBooking(b, today)].push(b);
  }
  return groups;
}

export function nextUpcomingBooking(
  bookings: AccountBooking[],
  today: string = todayISO(),
): AccountBooking | null {
  const upcoming = bookings
    .filter((b) => classifyBooking(b, today) === "upcoming")
    .sort((a, b) => {
      if (!a.travel_date) return 1;
      if (!b.travel_date) return -1;
      return a.travel_date.localeCompare(b.travel_date);
    });
  return upcoming[0] ?? null;
}

/** User may review after a confirmed trip whose travel date has passed (or is unset). */
export function isReviewEligibleBooking(
  booking: Pick<AccountBooking, "status" | "travel_date"> & { tour_id?: string },
  today: string = todayISO(),
): boolean {
  if (booking.status !== "confirmed") return false;
  if (!booking.travel_date) return true;
  return booking.travel_date < today;
}

export function initialsFromName(name: string | null | undefined): string {
  const parts = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export function reviewDateLabel(iso: string = new Date().toISOString()): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "long", year: "numeric" });
}
