"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import {
  profileSchema,
  travelPreferencesSchema,
  bookingMessageSchema,
  reviewSchema,
  passwordSchema,
  emailUpdateSchema,
  claimBookingSchema,
  travelerPassportSchema,
} from "@/lib/schemas";
import { canUserReviewTour } from "@/lib/account-queries";
import {
  initialsFromName,
  reviewDateLabel,
  isReviewEligibleBooking,
  todayISO,
} from "@/lib/account";
import { validatePassportExpiry } from "@/lib/travelers";
import { signOut } from "@/app/actions";

export type AccountActionResult = { ok: boolean; error?: string; claimed?: number };

function firstZodError(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Please check your details.";
}

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return { supabase, user };
}

export async function claimGuestBookings(): Promise<AccountActionResult> {
  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("claim_guest_bookings");
  if (error) return { ok: false, error: "Could not link bookings." };
  const claimed = typeof data === "number" ? data : 0;
  if (claimed > 0) {
    revalidatePath("/account", "layout");
  }
  return { ok: true, claimed };
}

export async function claimBookingByReference(
  reference: string,
): Promise<AccountActionResult> {
  const parsed = claimBookingSchema.safeParse({ reference });
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const { supabase } = await requireUser();
  const { data, error } = await supabase.rpc("claim_booking_by_reference", {
    p_reference: parsed.data.reference,
  });
  if (error) return { ok: false, error: "Could not link booking." };
  if (!data) {
    return {
      ok: false,
      error: "No booking found with that reference for your email.",
    };
  }
  revalidatePath("/account", "layout");
  return { ok: true, claimed: 1 };
}

export async function updateProfile(input: {
  fullName: string;
  phone?: string;
}): Promise<AccountActionResult> {
  const parsed = profileSchema.safeParse({
    fullName: input.fullName,
    phone: input.phone,
  });
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({
      full_name: parsed.data.fullName,
      phone: parsed.data.phone || null,
    })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  await supabase.auth.updateUser({
    data: { full_name: parsed.data.fullName },
  });

  revalidatePath("/account", "layout");
  return { ok: true };
}

export async function updateTravelPreferences(
  prefs: Record<string, unknown>,
): Promise<AccountActionResult> {
  const parsed = travelPreferencesSchema.safeParse(prefs);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const { supabase, user } = await requireUser();
  const { error } = await supabase
    .from("profiles")
    .update({ travel_preferences: parsed.data })
    .eq("id", user.id);
  if (error) return { ok: false, error: error.message };

  revalidatePath("/account/profile");
  return { ok: true };
}

export async function sendBookingMessage(input: {
  bookingId: string;
  body: string;
}): Promise<AccountActionResult> {
  const parsed = bookingMessageSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const { supabase, user } = await requireUser();

  const { data: booking } = await supabase
    .from("booking_requests")
    .select("id")
    .eq("id", parsed.data.bookingId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (!booking) return { ok: false, error: "Booking not found." };

  const { error } = await supabase.from("booking_messages").insert({
    booking_id: parsed.data.bookingId,
    user_id: user.id,
    sender_role: "user",
    body: parsed.data.body,
  });
  if (error) return { ok: false, error: error.message };

  revalidatePath(`/account/bookings`);
  return { ok: true };
}

export async function submitReview(input: {
  tourId: string;
  bookingId?: string;
  rating: number;
  body: string;
}): Promise<AccountActionResult> {
  const parsed = reviewSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const { supabase, user } = await requireUser();
  const eligible = await canUserReviewTour(user.id, parsed.data.tourId);
  if (!eligible) {
    return { ok: false, error: "You are not eligible to review this tour." };
  }

  if (parsed.data.bookingId) {
    const { data: booking } = await supabase
      .from("booking_requests")
      .select("status, travel_date, tour_id")
      .eq("id", parsed.data.bookingId)
      .eq("user_id", user.id)
      .maybeSingle();
    if (!booking || (booking as { tour_id: string }).tour_id !== parsed.data.tourId) {
      return { ok: false, error: "Invalid booking." };
    }
    if (!isReviewEligibleBooking(booking as { status: string; travel_date: string | null }, todayISO())) {
      return { ok: false, error: "This trip is not yet eligible for review." };
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name")
    .eq("id", user.id)
    .maybeSingle();

  const fullName =
    (profile as { full_name: string | null } | null)?.full_name ??
    user.email?.split("@")[0] ??
    "Traveler";

  const { error } = await supabase.from("reviews").insert({
    tour_id: parsed.data.tourId,
    user_id: user.id,
    booking_id: parsed.data.bookingId ?? null,
    author_name: fullName,
    initials: initialsFromName(fullName),
    rating: parsed.data.rating,
    body: parsed.data.body,
    review_date: reviewDateLabel(),
    is_published: false,
  });
  if (error) {
    if (error.code === "23505") {
      return { ok: false, error: "You have already reviewed this tour." };
    }
    return { ok: false, error: error.message };
  }

  revalidatePath("/account/bookings");
  return { ok: true };
}

export async function updatePassword(input: {
  password: string;
  confirm: string;
}): Promise<AccountActionResult> {
  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const { supabase } = await requireUser();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function updateEmail(input: {
  email: string;
}): Promise<AccountActionResult> {
  const parsed = emailUpdateSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  const { supabase } = await requireUser();
  const { error } = await supabase.auth.updateUser({
    email: parsed.data.email,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function deleteAccount(): Promise<AccountActionResult> {
  const { user } = await requireUser();
  if (!hasServiceRole) {
    return {
      ok: false,
      error: "Account deletion is not available. Please contact support.",
    };
  }

  const admin = createAdminClient();
  const { error } = await admin.auth.admin.deleteUser(user.id);
  if (error) return { ok: false, error: error.message };

  await signOut();
  redirect("/");
}

export async function updateTravelerPassport(input: {
  travelerId: string;
  passportExpiry: string;
  nationality: string;
  referenceCode?: string;
  email?: string;
  travelDate?: string | null;
}): Promise<AccountActionResult> {
  const parsed = travelerPassportSchema.safeParse({
    travelerId: input.travelerId,
    passportExpiry: input.passportExpiry,
    nationality: input.nationality,
    referenceCode: input.referenceCode,
    email: input.email,
  });
  if (!parsed.success) return { ok: false, error: firstZodError(parsed.error) };

  if (input.travelDate) {
    const expiryError = validatePassportExpiry(
      parsed.data.passportExpiry,
      input.travelDate,
    );
    if (expiryError) return { ok: false, error: expiryError };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && (!parsed.data.referenceCode || !parsed.data.email)) {
    return { ok: false, error: "Please sign in or provide your booking reference." };
  }

  const { data, error } = await supabase.rpc("update_traveler_passport", {
    p_traveler_id: parsed.data.travelerId,
    p_passport_expiry: parsed.data.passportExpiry,
    p_nationality: parsed.data.nationality,
    p_reference: parsed.data.referenceCode ?? null,
    p_email: parsed.data.email ?? null,
  });

  if (error) return { ok: false, error: "Could not save passport details." };
  if (!data) return { ok: false, error: "Could not update this traveler." };

  revalidatePath("/account/bookings");
  revalidatePath("/bookings/track");
  return { ok: true };
}
