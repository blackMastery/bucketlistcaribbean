"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { Json, BookingTravelerDetail } from "@/lib/database.types";
import { isValidEmail } from "@/lib/validation";
import { contactSchema, newsletterEmailSchema, bookingSchema } from "@/lib/schemas";
import { getBookingPricingContext } from "@/lib/queries";
import {
  computeBookingTotalCents,
  computePeopleCount,
  buildPricingBreakdown,
  selectionFitsPricing,
  hasTierPricing,
  type BookingSelection,
} from "@/lib/pricing";
import {
  expandTravelerSlots,
  validateTravelerAgeForSlot,
} from "@/lib/travelers";
import {
  sendBookingEmail,
  sendBookingAdminEmail,
} from "@/lib/email";

function firstZodError(error: { issues: { message: string }[] }): string {
  return error.issues[0]?.message ?? "Please check your details and try again.";
}

export type ActionResult = { ok: boolean; error?: string; referenceCode?: string };

function generateBookingReference(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let suffix = "";
  for (let i = 0; i < 6; i++) {
    suffix += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return `MC-${suffix}`;
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------
export async function signOut(): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) return { ok: false, error: error.message };
  revalidatePath("/", "layout");
  revalidatePath("/account");
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Favorites (auth required)
// ---------------------------------------------------------------------------
export async function toggleFavorite(
  tourId: string,
): Promise<{ ok: boolean; favorited: boolean; needsAuth?: boolean; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { ok: false, favorited: false, needsAuth: true };

  const { data: existing } = await supabase
    .from("favorites")
    .select("tour_id")
    .eq("user_id", user.id)
    .eq("tour_id", tourId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("favorites")
      .delete()
      .eq("user_id", user.id)
      .eq("tour_id", tourId);
    if (error) return { ok: false, favorited: true, error: error.message };
    revalidatePath("/account");
    return { ok: true, favorited: false };
  }

  const { error } = await supabase
    .from("favorites")
    .insert({ user_id: user.id, tour_id: tourId });
  if (error) return { ok: false, favorited: false, error: error.message };
  revalidatePath("/account");
  return { ok: true, favorited: true };
}

// ---------------------------------------------------------------------------
// Newsletter
// ---------------------------------------------------------------------------
export async function subscribeNewsletter(email: string): Promise<ActionResult> {
  const parsed = newsletterEmailSchema.safeParse(email);
  if (!parsed.success) {
    return { ok: false, error: "Please enter a valid email address." };
  }
  const clean = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase
    .from("newsletter_subscribers")
    .insert({ email: clean });
  // Unique-violation means already subscribed — treat as success.
  if (error && error.code !== "23505") {
    return { ok: false, error: "Something went wrong. Please try again." };
  }
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------
export type ContactInput = {
  name: string;
  email: string;
  phone?: string;
  interest?: string;
  message: string;
};

export async function submitContact(input: ContactInput): Promise<ActionResult> {
  const parsed = contactSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }
  const { name, email, phone, interest, message } = parsed.data;
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").insert({
    name,
    email,
    phone: phone || null,
    interest: interest || null,
    message,
  });
  if (error) return { ok: false, error: "Could not send your message." };
  return { ok: true };
}

// ---------------------------------------------------------------------------
// Booking request
// ---------------------------------------------------------------------------
// The client sends the customer's *selection*, never a price. The server
// recomputes the authoritative total from the tour's stored pricing.
export type BookingInput = {
  tourId: string;
  travelDate: string;
  occupancyIndex: number | null;
  childCounts: number[];
  travelers: number;
  insurance: boolean;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  specialRequests?: string;
  travelerDetails?: {
    firstName: string;
    lastName: string;
    phone: string;
    passportNumber: string;
    dateOfBirth: string;
    gender: "male" | "female" | "unspecified";
  }[];
};

export type BookingStatusResult = {
  ok: boolean;
  error?: string;
  booking?: {
    id: string;
    reference_code: string;
    tour_title: string;
    tour_slug: string;
    travel_date: string | null;
    travelers: number;
    total_cents: number;
    status: string;
    pricing_breakdown: Json | null;
    travelers_detail: BookingTravelerDetail[];
    created_at: string;
  };
};

export async function createBookingRequest(
  input: BookingInput,
): Promise<ActionResult> {
  const parsed = bookingSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: firstZodError(parsed.error) };
  }
  const data = parsed.data;

  const contactName = data.contactName;
  const contactEmail = data.contactEmail.toLowerCase();
  let contactPhone = data.contactPhone;
  const travelDate = data.travelDate;
  const specialRequests = data.specialRequests || null;

  const todayISO = new Date().toISOString().slice(0, 10);
  if (travelDate < todayISO) {
    return { ok: false, error: "Travel date must be today or later." };
  }

  // Load the tour's authoritative pricing and recompute the total server-side.
  // The browser never gets to set the price.
  const ctx = await getBookingPricingContext(data.tourId);
  if (!ctx) {
    return { ok: false, error: "This tour is not available for booking." };
  }

  const selection: BookingSelection = {
    occupancyIndex: data.occupancyIndex,
    childCounts: data.childCounts,
    travelers: data.travelers,
  };
  if (!selectionFitsPricing(ctx.pricing, selection)) {
    return { ok: false, error: "Please review your selection and try again." };
  }

  const people = computePeopleCount(ctx.pricing, selection);
  if (people < 1) {
    return { ok: false, error: "Please select at least one traveler." };
  }

  const totalCents = computeBookingTotalCents(
    ctx.pricing,
    ctx.basePriceCents,
    selection,
  );
  const pricingBreakdown = buildPricingBreakdown(
    ctx.pricing,
    ctx.basePriceCents,
    ctx.paymentTerms,
    ctx.depositOpen,
    selection,
  );

  const tiered = hasTierPricing(ctx.pricing);
  const slots = tiered ? expandTravelerSlots(ctx.pricing, selection) : [];

  if (tiered) {
    const details = data.travelerDetails ?? [];
    if (details.length !== people) {
      return {
        ok: false,
        error: "Please enter details for every traveler in your party.",
      };
    }
    for (let i = 0; i < slots.length; i++) {
      const ageError = validateTravelerAgeForSlot(
        slots[i],
        details[i].dateOfBirth,
        travelDate,
      );
      if (ageError) return { ok: false, error: ageError };
    }
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let resolvedName = contactName;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, phone")
      .eq("id", user.id)
      .maybeSingle();
    const row = profile as { full_name: string | null; phone: string | null } | null;
    if (!resolvedName.trim()) {
      resolvedName = row?.full_name?.trim() || contactName;
    }
    if (!contactPhone.trim() && row?.phone) {
      contactPhone = row.phone;
    }
  }

  const insertPayload = {
    tour_id: data.tourId,
    user_id: user?.id ?? null,
    travel_date: travelDate,
    travelers: people,
    insurance: data.insurance,
    total_cents: totalCents,
    pricing_breakdown: pricingBreakdown as Json,
    contact_name: resolvedName,
    contact_email: contactEmail,
    contact_phone: contactPhone,
    special_requests: specialRequests,
  };

  let referenceCode = "";
  let bookingId: string | null = null;

  if (tiered && slots.length > 0) {
    const travelersJson = slots.map((slot, i) => ({
      position: slot.position,
      is_primary: slot.position === 1,
      traveler_type: slot.travelerType,
      child_tier_key: slot.childTierKey,
      child_tier_label: slot.childTierLabel,
      first_name: data.travelerDetails![i].firstName,
      last_name: data.travelerDetails![i].lastName,
      phone: data.travelerDetails![i].phone,
      passport_number: data.travelerDetails![i].passportNumber,
      date_of_birth: data.travelerDetails![i].dateOfBirth,
      gender: data.travelerDetails![i].gender,
    }));

    const { data: created, error } = await supabase.rpc(
      "create_booking_with_travelers",
      {
        p_tour_id: data.tourId,
        p_user_id: user?.id ?? null,
        p_travel_date: travelDate,
        p_travelers_count: people,
        p_insurance: data.insurance,
        p_total_cents: totalCents,
        p_pricing_breakdown: pricingBreakdown as Json,
        p_contact_name: resolvedName,
        p_contact_email: contactEmail,
        p_contact_phone: contactPhone,
        p_special_requests: specialRequests,
        p_travelers: travelersJson as Json,
      },
    );

    if (error || !created?.length) {
      console.error("[booking] RPC insert failed:", error?.message);
      return { ok: false, error: "Could not submit your request." };
    }

    bookingId = created[0].id;
    referenceCode = created[0].reference_code;
  } else {
    // Flat pricing — existing insert path (no per-traveler manifest).
    for (let attempt = 0; attempt < 5; attempt++) {
      referenceCode = generateBookingReference();
      const row = { ...insertPayload, reference_code: referenceCode };

      if (user) {
        const { data: inserted, error } = await supabase
          .from("booking_requests")
          .insert(row)
          .select("id, reference_code")
          .single();
        if (!error && inserted) {
          bookingId = (inserted as { id: string; reference_code: string }).id;
          referenceCode = (inserted as { id: string; reference_code: string })
            .reference_code;
          break;
        }
        if (error?.code === "23505") continue;
        console.error("[booking] insert failed:", error?.message);
        return { ok: false, error: "Could not submit your request." };
      }

      const { error } = await supabase.from("booking_requests").insert(row);
      if (!error) break;
      if (error.code === "23505") continue;
      console.error("[booking] insert failed:", error.message);
      return { ok: false, error: "Could not submit your request." };
    }
  }

  if (!referenceCode) {
    return { ok: false, error: "Could not submit your request." };
  }

  void sendBookingEmail({
    bookingId: bookingId ?? undefined,
    referenceCode: bookingId ? undefined : referenceCode,
    slug: "booking_confirmation",
  }).catch((err) => console.error("[booking] email failed:", err));

  void sendBookingAdminEmail({
    bookingId: bookingId ?? undefined,
    referenceCode: bookingId ? undefined : referenceCode,
    slug: "booking_confirmation_admin",
  }).catch((err) => console.error("[booking] admin email failed:", err));

  if (user) revalidatePath("/account");
  return { ok: true, referenceCode };
}

export async function trackBooking(
  reference: string,
  email: string,
): Promise<BookingStatusResult> {
  const ref = reference.trim();
  const cleanEmail = email.trim().toLowerCase();
  if (!ref || !isValidEmail(cleanEmail)) {
    return { ok: false, error: "Please enter your reference and email." };
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_booking_status", {
    p_reference: ref,
    p_email: cleanEmail,
  });

  if (error) {
    return { ok: false, error: "Could not look up your booking." };
  }

  const rows = (data ?? []) as BookingStatusResult["booking"][];
  const raw = rows[0];
  if (!raw) {
    return {
      ok: false,
      error: "No booking found with that reference and email.",
    };
  }

  const booking = {
    ...raw,
    travelers_detail: Array.isArray(raw.travelers_detail)
      ? raw.travelers_detail
      : [],
  };

  return { ok: true, booking };
}
