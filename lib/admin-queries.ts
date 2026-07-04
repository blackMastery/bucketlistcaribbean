import { createClient } from "@/lib/supabase/server";
import { withAssembledPricing } from "@/lib/tour-pricing";
import type {
  Tour,
  Destination,
  Testimonial,
  TeamMember,
  TourImage,
  TourHighlight,
  TourItinerary,
  TourInclusion,
  TourPricingRow,
  EmailTemplateRow,
  EmailLogRow,
  Faq,
  FaqCategory,
  ChatbotConversation,
} from "@/lib/database.types";

// All admin reads run as the signed-in admin; RLS grants full visibility
// (including unpublished reviews and every lead). The admin layout guards
// access, so these assume an authenticated admin.

export type AdminTourRow = Tour & { destinations: { name: string } | null };

export async function getAdminTours(): Promise<AdminTourRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tours")
    .select("*, destinations(name), tour_pricing(*)")
    .order("sort_order", { ascending: false });
  type Raw = Omit<AdminTourRow, "pricing"> & { tour_pricing: TourPricingRow[] };
  return ((data as unknown as Raw[]) ?? []).map(
    (row) => withAssembledPricing(row) as AdminTourRow,
  );
}

export type AdminTourDetail = Tour & {
  tour_images: TourImage[];
  tour_highlights: TourHighlight[];
  tour_itinerary: TourItinerary[];
  tour_inclusions: TourInclusion[];
  tour_activities: { activity_type_id: string }[];
};

export async function getAdminTourById(id: string): Promise<AdminTourDetail | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("tours")
    .select(
      "*, tour_images(*), tour_highlights(*), tour_itinerary(*), tour_inclusions(*), tour_activities(activity_type_id), tour_pricing(*)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!data) return null;
  type Raw = Omit<AdminTourDetail, "pricing"> & { tour_pricing: TourPricingRow[] };
  const d = withAssembledPricing(data as unknown as Raw) as AdminTourDetail;
  d.tour_images = [...d.tour_images].sort((a, b) => a.position - b.position);
  d.tour_highlights = [...d.tour_highlights].sort((a, b) => a.position - b.position);
  d.tour_itinerary = [...d.tour_itinerary].sort((a, b) => a.day_number - b.day_number);
  d.tour_inclusions = [...d.tour_inclusions].sort((a, b) => a.position - b.position);
  return d;
}

export async function getDestinationOptions(): Promise<
  { id: string; name: string }[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("destinations")
    .select("id, name")
    .order("sort_order");
  return data ?? [];
}

export async function getActivityTypeOptions(): Promise<
  { id: string; name: string }[]
> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("activity_types")
    .select("id, name")
    .order("sort_order");
  return data ?? [];
}

export async function getAdminDestinations(): Promise<Destination[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("destinations").select("*").order("sort_order");
  return data ?? [];
}

export async function getAdminDestinationById(id: string): Promise<Destination | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("destinations").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function getAdminTestimonials(): Promise<Testimonial[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("testimonials").select("*").order("sort_order");
  return data ?? [];
}

export async function getAdminTestimonialById(id: string): Promise<Testimonial | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("testimonials").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function getAdminTeam(): Promise<TeamMember[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("team_members").select("*").order("sort_order");
  return data ?? [];
}

export async function getAdminTeamById(id: string): Promise<TeamMember | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("team_members").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export type AdminReview = {
  id: string;
  tour_id: string;
  author_name: string;
  initials: string;
  rating: number;
  body: string;
  review_date: string;
  is_published: boolean;
  created_at: string;
  tours: { title: string } | null;
};

export async function getAdminReviews(): Promise<AdminReview[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("reviews")
    .select("*, tours(title)")
    .order("created_at", { ascending: false });
  return (data as unknown as AdminReview[]) ?? [];
}

export type AdminBooking = {
  id: string;
  user_id: string | null;
  travelers: number;
  travel_date: string | null;
  insurance: boolean;
  total_cents: number;
  status: "pending" | "confirmed" | "cancelled";
  contact_name: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  reference_code: string;
  special_requests: string | null;
  admin_notes: string | null;
  pricing_breakdown: import("@/lib/database.types").Json | null;
  created_at: string;
  tours: { title: string; slug: string } | null;
};

export async function getAdminBookings(): Promise<AdminBooking[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("booking_requests")
    .select("*, tours(title, slug)")
    .order("created_at", { ascending: false });
  return (data as unknown as AdminBooking[]) ?? [];
}

export async function getAdminBookingById(
  id: string,
): Promise<AdminBooking | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("booking_requests")
    .select("*, tours(title, slug)")
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as AdminBooking) ?? null;
}

export async function getAdminBookingTravelers(bookingId: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("booking_travelers")
    .select("*")
    .eq("booking_id", bookingId)
    .order("position", { ascending: true });
  return data ?? [];
}

export type AdminMessage = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  interest: string | null;
  message: string;
  status: "new" | "read" | "archived";
  created_at: string;
};

export async function getAdminMessages(): Promise<AdminMessage[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as unknown as AdminMessage[]) ?? [];
}

export type AdminSubscriber = { id: string; email: string; created_at: string };

export async function getAdminSubscribers(): Promise<AdminSubscriber[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("created_at", { ascending: false });
  return (data as unknown as AdminSubscriber[]) ?? [];
}

export type DashboardCounts = {
  tours: number;
  destinations: number;
  pendingBookings: number;
  newMessages: number;
  subscribers: number;
};

export async function getDashboardCounts(): Promise<DashboardCounts> {
  const supabase = await createClient();
  const head = { count: "exact" as const, head: true };
  const [tours, destinations, pendingBookings, newMessages, subscribers] =
    await Promise.all([
      supabase.from("tours").select("*", head),
      supabase.from("destinations").select("*", head),
      supabase.from("booking_requests").select("*", head).eq("status", "pending"),
      supabase.from("contact_messages").select("*", head).eq("status", "new"),
      supabase.from("newsletter_subscribers").select("*", head),
    ]);
  return {
    tours: tours.count ?? 0,
    destinations: destinations.count ?? 0,
    pendingBookings: pendingBookings.count ?? 0,
    newMessages: newMessages.count ?? 0,
    subscribers: subscribers.count ?? 0,
  };
}

export async function getAdminEmailTemplates(): Promise<EmailTemplateRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("email_templates")
    .select("*")
    .order("is_system", { ascending: false })
    .order("name", { ascending: true });
  return (data as EmailTemplateRow[]) ?? [];
}

export async function getAdminEmailLog(limit = 25): Promise<EmailLogRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("email_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data as EmailLogRow[]) ?? [];
}

export async function getAdminEmailTemplateById(
  id: string,
): Promise<EmailTemplateRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("email_templates")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data as EmailTemplateRow | null;
}

export async function getProfileLabels(
  ids: string[],
): Promise<Record<string, string>> {
  const unique = [...new Set(ids.filter(Boolean))];
  if (unique.length === 0) return {};
  const supabase = await createClient();
  const { data } = await supabase
    .from("profiles")
    .select("id, full_name")
    .in("id", unique);
  const map: Record<string, string> = {};
  for (const row of data ?? []) {
    const p = row as { id: string; full_name: string | null };
    map[p.id] = p.full_name?.trim() || `${p.id.slice(0, 8)}…`;
  }
  return map;
}

// --- Chatbot: FAQs, categories, conversation log -----------------------------

export type AdminFaq = Faq & { category_name: string | null };

export async function getAdminFaqs(): Promise<AdminFaq[]> {
  const supabase = await createClient();
  // Categories fetched separately and joined in memory — the hand-maintained
  // Database types declare no relationships, so embedded selects don't type.
  const [{ data: faqs }, { data: categories }] = await Promise.all([
    supabase.from("faqs").select("*").order("created_at", { ascending: false }),
    supabase.from("faq_categories").select("id, name"),
  ]);
  const names = new Map((categories ?? []).map((c) => [c.id, c.name]));
  return (faqs ?? []).map((f) => ({
    ...f,
    category_name: f.category_id ? (names.get(f.category_id) ?? null) : null,
  }));
}

export async function getAdminFaqById(id: string): Promise<Faq | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("faqs").select("*").eq("id", id).maybeSingle();
  return data ?? null;
}

export async function getFaqCategories(): Promise<FaqCategory[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("faq_categories")
    .select("*")
    .order("sort_order");
  return data ?? [];
}

export type AdminConversation = ChatbotConversation & {
  matched_faq_question: string | null;
};

export async function getAdminChatbotConversations(
  q?: string,
): Promise<AdminConversation[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("chatbot_conversations")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  let rows = data ?? [];
  if (q?.trim()) {
    const needle = q.trim().toLowerCase();
    rows = rows.filter((c) =>
      `${c.session_id} ${c.user_message} ${c.bot_response}`.toLowerCase().includes(needle),
    );
  }
  const faqIds = [...new Set(rows.map((c) => c.matched_faq_id).filter(Boolean))] as string[];
  const questions = new Map<string, string>();
  if (faqIds.length > 0) {
    const { data: faqs } = await supabase.from("faqs").select("id, question").in("id", faqIds);
    for (const f of faqs ?? []) questions.set(f.id, f.question);
  }
  return rows.map((c) => ({
    ...c,
    matched_faq_question: c.matched_faq_id
      ? (questions.get(c.matched_faq_id) ?? null)
      : null,
  }));
}
