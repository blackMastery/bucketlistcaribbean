import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/lib/database.types";
import type { BookingTravelerDetail } from "@/lib/database.types";
import type { AccountBooking, TravelPreferences } from "@/lib/account";
import { isReviewEligibleBooking, todayISO } from "@/lib/account";

export type AccountProfile = {
  id: string;
  full_name: string | null;
  phone: string | null;
  travel_preferences: TravelPreferences | null;
  referral_code: string;
};

export type BookingDetail = {
  id: string;
  reference_code: string;
  tour_id: string;
  tour_title: string;
  tour_slug: string;
  travel_date: string | null;
  travelers: number;
  insurance: boolean;
  total_cents: number;
  status: string;
  pricing_breakdown: Json | null;
  special_requests: string | null;
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  travelers_detail: BookingTravelerDetail[];
  created_at: string;
};

export type BookingMessage = {
  id: string;
  booking_id: string;
  user_id: string;
  sender_role: "user" | "admin";
  body: string;
  created_at: string;
};

const BOOKING_LIST_SELECT =
  "id, reference_code, travel_date, travelers, insurance, total_cents, status, created_at, tour_id, tours(title, slug)";

export async function getAccountProfile(userId: string): Promise<AccountProfile | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name, phone, travel_preferences, referral_code")
    .eq("id", userId)
    .maybeSingle();
  return data as AccountProfile | null;
}

export async function getUserBookings(userId: string): Promise<AccountBooking[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("booking_requests")
    .select(BOOKING_LIST_SELECT)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return (data ?? []) as unknown as AccountBooking[];
}

export async function getBookingDetailByReference(
  reference: string,
): Promise<BookingDetail | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_own_booking_by_reference", {
    p_reference: reference,
  });
  if (error || !data?.length) return null;
  const row = data[0] as BookingDetail & { travelers_detail?: BookingTravelerDetail[] | null };
  return {
    ...row,
    travelers_detail: Array.isArray(row.travelers_detail) ? row.travelers_detail : [],
  };
}

export async function getBookingMessages(bookingId: string): Promise<BookingMessage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("booking_messages")
    .select("id, booking_id, user_id, sender_role, body, created_at")
    .eq("booking_id", bookingId)
    .order("created_at", { ascending: true });
  return (data ?? []) as BookingMessage[];
}

export async function getReferralStats(userId: string): Promise<{
  referral_code: string;
  count: number;
}> {
  const supabase = await createClient();
  const [{ data: profile }, { count }] = await Promise.all([
    supabase.from("profiles").select("referral_code").eq("id", userId).maybeSingle(),
    supabase
      .from("referrals")
      .select("*", { count: "exact", head: true })
      .eq("referrer_id", userId),
  ]);
  return {
    referral_code: (profile as { referral_code: string } | null)?.referral_code ?? "",
    count: count ?? 0,
  };
}

export async function canUserReviewTour(
  userId: string,
  tourId: string,
): Promise<boolean> {
  const supabase = await createClient();
  const today = todayISO();

  const [{ data: existing }, { data: bookings }] = await Promise.all([
    supabase
      .from("reviews")
      .select("id")
      .eq("user_id", userId)
      .eq("tour_id", tourId)
      .maybeSingle(),
    supabase
      .from("booking_requests")
      .select("status, travel_date, tour_id")
      .eq("user_id", userId)
      .eq("tour_id", tourId),
  ]);

  if (existing) return false;

  const rows = (bookings ?? []) as {
    status: string;
    travel_date: string | null;
    tour_id: string;
  }[];

  return rows.some((b) => isReviewEligibleBooking(b, today));
}

export async function getAccountOverview(userId: string) {
  const [profile, bookings, favCount, referralStats] = await Promise.all([
    getAccountProfile(userId),
    getUserBookings(userId),
    getFavoriteCount(userId),
    getReferralStats(userId),
  ]);

  return { profile, bookings, favCount, referralStats };
}

async function getFavoriteCount(userId: string): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("favorites")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}

export async function getUserFavorites(userId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("favorites")
    .select("tours(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return ((data ?? []) as unknown as { tours: Record<string, unknown> | null }[])
    .map((r) => r.tours)
    .filter(Boolean);
}
