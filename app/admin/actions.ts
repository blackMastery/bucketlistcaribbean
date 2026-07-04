"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requirePageAccess } from "@/lib/admin";
import type { Json, TourPricing, PaymentTerms } from "@/lib/database.types";
import { tourPricingToRows } from "@/lib/tour-pricing";
import { sendBookingEmail } from "@/lib/email";

export type Result = { ok: boolean; error?: string };

// Revalidate the public pages that read this content so edits show immediately.
function revalidatePublic() {
  revalidatePath("/");
  revalidatePath("/tours");
  revalidatePath("/destinations");
  revalidatePath("/about");
  revalidatePath("/contact");
}

// ===========================================================================
// TOURS
// ===========================================================================
export type TourInput = {
  slug: string;
  title: string;
  destination_id: string;
  location: string;
  price_cents: number;
  rating: number;
  reviews_count: number;
  duration_days: number;
  duration_label: string;
  badge: string | null;
  badge_color: string;
  card_image_url: string;
  overview: string | null;
  is_featured: boolean;
  spots_left: number | null;
  booked_last_24h: number | null;
  sort_order: number;
  pricing: TourPricing | null;
  payment_terms: PaymentTerms | null;
};

async function syncTourPricing(
  supabase: Awaited<ReturnType<typeof createClient>>,
  tourId: string,
  pricing: TourPricing | null,
) {
  const { error: delErr } = await supabase
    .from("tour_pricing")
    .delete()
    .eq("tour_id", tourId);
  if (delErr) throw new Error(delErr.message);

  if (!pricing) return;

  const rows = tourPricingToRows(tourId, pricing);
  if (!rows.length) return;

  const { error } = await supabase.from("tour_pricing").insert(rows);
  if (error) throw new Error(error.message);
}

export async function createTour(input: TourInput): Promise<void> {
  await requirePageAccess("tours");
  const supabase = await createClient();
  const { pricing, ...tourFields } = input;
  const { data, error } = await supabase
    .from("tours")
    .insert({ ...tourFields, is_published: false })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  await syncTourPricing(supabase, data.id, pricing);
  revalidatePublic();
  revalidatePath("/admin/tours");
  redirect(`/admin/tours/${data.id}`);
}

export async function updateTour(id: string, input: TourInput): Promise<Result> {
  await requirePageAccess("tours");
  const supabase = await createClient();
  const { pricing, ...tourFields } = input;
  const { error } = await supabase.from("tours").update(tourFields).eq("id", id);
  if (error) return { ok: false, error: error.message };
  try {
    await syncTourPricing(supabase, id, pricing);
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Failed to save pricing" };
  }
  revalidatePublic();
  revalidatePath(`/tours/${input.slug}`);
  revalidatePath(`/admin/tours/${id}`);
  return { ok: true };
}

export async function deleteTour(id: string): Promise<void> {
  await requirePageAccess("tours");
  const supabase = await createClient();
  await supabase.from("tours").delete().eq("id", id);
  revalidatePublic();
  revalidatePath("/admin/tours");
  redirect("/admin/tours");
}

export async function setTourPublished(
  id: string,
  isPublished: boolean,
): Promise<Result> {
  await requirePageAccess("tours");
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("tours")
    .update({ is_published: isPublished })
    .eq("id", id)
    .select("slug")
    .single();
  if (error) return { ok: false, error: error.message };
  revalidatePublic();
  revalidatePath("/admin/tours");
  revalidatePath(`/admin/tours/${id}`);
  if (data?.slug) revalidatePath(`/tours/${data.slug}`);
  return { ok: true };
}

// --- Tour sub-resources ----------------------------------------------------
export async function addTourImage(
  tourId: string,
  url: string,
  inCarousel: boolean,
): Promise<Result> {
  await requirePageAccess("tours");
  const supabase = await createClient();
  const { count } = await supabase
    .from("tour_images")
    .select("*", { count: "exact", head: true })
    .eq("tour_id", tourId);
  const { error } = await supabase.from("tour_images").insert({
    tour_id: tourId,
    url,
    in_carousel: inCarousel,
    position: count ?? 0,
  });
  if (error) return { ok: false, error: error.message };
  revalidatePublic();
  return { ok: true };
}

export async function deleteTourImage(id: string): Promise<Result> {
  await requirePageAccess("tours");
  const supabase = await createClient();
  const { error } = await supabase.from("tour_images").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePublic();
  return { ok: true };
}

export async function addHighlight(tourId: string, text: string): Promise<Result> {
  await requirePageAccess("tours");
  const supabase = await createClient();
  const { count } = await supabase
    .from("tour_highlights")
    .select("*", { count: "exact", head: true })
    .eq("tour_id", tourId);
  const { error } = await supabase
    .from("tour_highlights")
    .insert({ tour_id: tourId, text, position: count ?? 0 });
  if (error) return { ok: false, error: error.message };
  revalidatePublic();
  return { ok: true };
}

export async function deleteHighlight(id: string): Promise<Result> {
  await requirePageAccess("tours");
  const supabase = await createClient();
  const { error } = await supabase.from("tour_highlights").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePublic();
  return { ok: true };
}

export async function addItineraryDay(
  tourId: string,
  title: string,
  body: string,
): Promise<Result> {
  await requirePageAccess("tours");
  const supabase = await createClient();
  const { count } = await supabase
    .from("tour_itinerary")
    .select("*", { count: "exact", head: true })
    .eq("tour_id", tourId);
  const { error } = await supabase
    .from("tour_itinerary")
    .insert({ tour_id: tourId, title, body, day_number: (count ?? 0) + 1 });
  if (error) return { ok: false, error: error.message };
  revalidatePublic();
  return { ok: true };
}

export async function deleteItineraryDay(id: string): Promise<Result> {
  await requirePageAccess("tours");
  const supabase = await createClient();
  const { error } = await supabase.from("tour_itinerary").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePublic();
  return { ok: true };
}

export async function addInclusion(
  tourId: string,
  kind: "included" | "excluded",
  text: string,
): Promise<Result> {
  await requirePageAccess("tours");
  const supabase = await createClient();
  const { count } = await supabase
    .from("tour_inclusions")
    .select("*", { count: "exact", head: true })
    .eq("tour_id", tourId)
    .eq("kind", kind);
  const { error } = await supabase
    .from("tour_inclusions")
    .insert({ tour_id: tourId, kind, text, position: count ?? 0 });
  if (error) return { ok: false, error: error.message };
  revalidatePublic();
  return { ok: true };
}

export async function deleteInclusion(id: string): Promise<Result> {
  await requirePageAccess("tours");
  const supabase = await createClient();
  const { error } = await supabase.from("tour_inclusions").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePublic();
  return { ok: true };
}

export async function setTourActivities(
  tourId: string,
  activityIds: string[],
): Promise<Result> {
  await requirePageAccess("tours");
  const supabase = await createClient();
  await supabase.from("tour_activities").delete().eq("tour_id", tourId);
  if (activityIds.length) {
    const rows = activityIds.map((activity_type_id) => ({
      tour_id: tourId,
      activity_type_id,
    }));
    const { error } = await supabase.from("tour_activities").insert(rows);
    if (error) return { ok: false, error: error.message };
  }
  revalidatePublic();
  return { ok: true };
}

// ===========================================================================
// DESTINATIONS
// ===========================================================================
export type DestinationInput = {
  slug: string;
  name: string;
  tag: string;
  description: string;
  long_description: string | null;
  hero_image_url: string;
  is_featured: boolean;
  avg_temp: string | null;
  best_season: string | null;
  signature_tours: number;
  sort_order: number;
};

export async function createDestination(input: DestinationInput): Promise<void> {
  await requirePageAccess("destinations");
  const supabase = await createClient();
  const { error } = await supabase.from("destinations").insert(input);
  if (error) throw new Error(error.message);
  revalidatePublic();
  redirect("/admin/destinations");
}

export async function updateDestination(
  id: string,
  input: DestinationInput,
): Promise<Result> {
  await requirePageAccess("destinations");
  const supabase = await createClient();
  const { error } = await supabase.from("destinations").update(input).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePublic();
  return { ok: true };
}

export async function deleteDestination(id: string): Promise<void> {
  await requirePageAccess("destinations");
  const supabase = await createClient();
  await supabase.from("destinations").delete().eq("id", id);
  revalidatePublic();
  redirect("/admin/destinations");
}

// ===========================================================================
// TESTIMONIALS
// ===========================================================================
export type TestimonialInput = {
  quote: string;
  initials: string;
  name: string;
  trip: string;
  rating: number;
  sort_order: number;
};

export async function createTestimonial(input: TestimonialInput): Promise<void> {
  await requirePageAccess("testimonials");
  const supabase = await createClient();
  const { error } = await supabase.from("testimonials").insert(input);
  if (error) throw new Error(error.message);
  revalidatePublic();
  redirect("/admin/testimonials");
}

export async function updateTestimonial(
  id: string,
  input: TestimonialInput,
): Promise<Result> {
  await requirePageAccess("testimonials");
  const supabase = await createClient();
  const { error } = await supabase.from("testimonials").update(input).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePublic();
  return { ok: true };
}

export async function deleteTestimonial(id: string): Promise<void> {
  await requirePageAccess("testimonials");
  const supabase = await createClient();
  await supabase.from("testimonials").delete().eq("id", id);
  revalidatePublic();
  redirect("/admin/testimonials");
}

// ===========================================================================
// TEAM
// ===========================================================================
export type TeamInput = {
  name: string;
  role: string;
  bio: string;
  photo_url: string;
  sort_order: number;
};

export async function createTeamMember(input: TeamInput): Promise<void> {
  await requirePageAccess("team");
  const supabase = await createClient();
  const { error } = await supabase.from("team_members").insert(input);
  if (error) throw new Error(error.message);
  revalidatePublic();
  redirect("/admin/team");
}

export async function updateTeamMember(id: string, input: TeamInput): Promise<Result> {
  await requirePageAccess("team");
  const supabase = await createClient();
  const { error } = await supabase.from("team_members").update(input).eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePublic();
  return { ok: true };
}

export async function deleteTeamMember(id: string): Promise<void> {
  await requirePageAccess("team");
  const supabase = await createClient();
  await supabase.from("team_members").delete().eq("id", id);
  revalidatePublic();
  redirect("/admin/team");
}

// ===========================================================================
// REVIEWS
// ===========================================================================
export async function setReviewPublished(
  id: string,
  isPublished: boolean,
): Promise<Result> {
  await requirePageAccess("reviews");
  const supabase = await createClient();
  const { error } = await supabase
    .from("reviews")
    .update({ is_published: isPublished })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePublic();
  revalidatePath("/admin/reviews");
  return { ok: true };
}

export async function deleteReview(id: string): Promise<Result> {
  await requirePageAccess("reviews");
  const supabase = await createClient();
  const { error } = await supabase.from("reviews").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePublic();
  revalidatePath("/admin/reviews");
  return { ok: true };
}

// ===========================================================================
// SITE CONTENT (jsonb blocks)
// ===========================================================================
export async function updateSiteContent(key: string, value: Json): Promise<Result> {
  await requirePageAccess("content");
  const supabase = await createClient();
  const { error } = await supabase
    .from("site_content")
    .upsert({ key, value }, { onConflict: "key" });
  if (error) return { ok: false, error: error.message };
  revalidatePublic();
  return { ok: true };
}

// ===========================================================================
// LEADS: bookings, messages, subscribers
// ===========================================================================
export async function updateBookingStatus(
  id: string,
  status: "pending" | "confirmed" | "cancelled",
): Promise<Result> {
  const ctx = await requirePageAccess("bookings");
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("booking_requests")
    .select("status, reference_code, contact_name, contact_email, tours(title)")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase
    .from("booking_requests")
    .update({ status })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };

  const row = existing as {
    status: string;
    reference_code: string;
    contact_name: string | null;
    contact_email: string | null;
    tours: { title: string } | null;
  } | null;

  if (
    row &&
    row.status !== status &&
    (status === "confirmed" || status === "cancelled") &&
    row.contact_email
  ) {
    const slug =
      status === "confirmed" ? "booking_confirmed" : "booking_cancelled";
    void sendBookingEmail({
      bookingId: id,
      slug,
      sentBy: ctx.user.id,
    }).catch((err) => console.error("[booking] status email failed:", err));
  }

  revalidatePath("/admin/email-templates");

  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${id}`);
  revalidatePath("/admin");
  return { ok: true };
}

export async function resendBookingEmail(
  bookingId: string,
  slug: string,
): Promise<Result & { message?: string }> {
  const ctx = await requirePageAccess("bookings");
  const allowed = ["booking_confirmation", "booking_confirmed", "booking_cancelled"];
  if (!allowed.includes(slug)) {
    return { ok: false, error: "Invalid template." };
  }

  const result = await sendBookingEmail({
    bookingId,
    slug,
    sentBy: ctx.user.id,
  });

  revalidatePath("/admin/email-templates");
  revalidatePath(`/admin/bookings/${bookingId}`);

  if (result.status === "failed") {
    return { ok: false, error: result.message };
  }
  return { ok: true, message: result.message };
}

export async function updateBookingNotes(
  id: string,
  adminNotes: string,
): Promise<Result> {
  await requirePageAccess("bookings");
  const supabase = await createClient();
  const { error } = await supabase
    .from("booking_requests")
    .update({ admin_notes: adminNotes.trim() || null })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath(`/admin/bookings/${id}`);
  return { ok: true };
}

export async function setMessageStatus(
  id: string,
  status: "new" | "read" | "archived",
): Promise<Result> {
  await requirePageAccess("messages");
  const supabase = await createClient();
  const { error } = await supabase
    .from("contact_messages")
    .update({ status })
    .eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  return { ok: true };
}

export async function deleteMessage(id: string): Promise<Result> {
  await requirePageAccess("messages");
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/messages");
  return { ok: true };
}

export async function deleteSubscriber(id: string): Promise<Result> {
  await requirePageAccess("subscribers");
  const supabase = await createClient();
  const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);
  if (error) return { ok: false, error: error.message };
  revalidatePath("/admin/subscribers");
  return { ok: true };
}
