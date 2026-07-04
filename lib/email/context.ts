import "server-only";

import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { SITE, SITE_URL } from "@/lib/seo";
import {
  DEFAULT_BUSINESS_CONTACT,
  resolveBlock,
  type BusinessContact,
} from "@/lib/site-content";
import { formatDate, formatPrice } from "@/lib/format";
import type { EmailTemplateRow } from "@/lib/database.types";
import type { EmailBrand, EmailVars } from "@/lib/email/render";
import {
  buildBookingDetailsHtml,
  buildSpecialRequestsHtml,
} from "@/lib/email/render";
import { buildAdminBookingUrl, buildTrackUrl } from "@/lib/email/urls";

export type BookingEmailContext = {
  vars: EmailVars;
  brand: EmailBrand;
  toEmail: string;
  bookingId: string;
};

export async function getEmailBrand(): Promise<EmailBrand> {
  let contact: BusinessContact = DEFAULT_BUSINESS_CONTACT;
  if (hasServiceRole) {
    try {
      const supabase = createAdminClient();
      const { data } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", "business_contact")
        .maybeSingle();
      if (data?.value) {
        contact = resolveBlock(
          { business_contact: data.value },
          "business_contact",
          DEFAULT_BUSINESS_CONTACT,
        );
      }
    } catch {
      // fall back to defaults
    }
  }

  const address = [contact.address_line1, contact.address_line2]
    .filter(Boolean)
    .join(", ");

  return {
    name: SITE.name,
    email: contact.email || SITE.email,
    phone: contact.phone || SITE.phone,
    address: address || contact.office,
    url: SITE_URL,
    whatsapp: contact.whatsapp_label,
  };
}

export async function getTemplateBySlug(
  slug: string,
): Promise<EmailTemplateRow | null> {
  if (!hasServiceRole) return null;
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("email_templates")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();
    return data as EmailTemplateRow | null;
  } catch {
    return null;
  }
}

type BuildContextOpts = {
  bookingId?: string;
  referenceCode?: string;
};

export async function buildBookingEmailContext(
  opts: BuildContextOpts,
): Promise<BookingEmailContext | null> {
  if (!hasServiceRole) return null;
  if (!opts.bookingId && !opts.referenceCode) return null;

  const supabase = createAdminClient();
  let query = supabase
    .from("booking_requests")
    .select(
      "id, reference_code, status, travel_date, travelers, total_cents, pricing_breakdown, contact_name, contact_email, contact_phone, special_requests, created_at, tours(title)",
    );

  if (opts.bookingId) {
    query = query.eq("id", opts.bookingId);
  } else {
    query = query.eq("reference_code", opts.referenceCode!);
  }

  const { data } = await query.maybeSingle();
  if (!data) return null;

  const row = data as unknown as {
    id: string;
    reference_code: string;
    status: string;
    travel_date: string | null;
    travelers: number;
    total_cents: number;
    pricing_breakdown: { deposit_cents?: number } | null;
    contact_name: string | null;
    contact_email: string | null;
    contact_phone: string | null;
    special_requests: string | null;
    created_at: string;
    tours: { title: string } | null;
  };

  if (!row.contact_email) return null;

  const brand = await getEmailBrand();
  const depositCents = row.pricing_breakdown?.deposit_cents ?? null;
  const tourTitle = row.tours?.title ?? "Tour";

  const bookingDetails = buildBookingDetailsHtml(
    {
      tourTitle,
      travelDate: row.travel_date,
      travelers: row.travelers,
      totalCents: row.total_cents,
      depositCents,
      referenceCode: row.reference_code,
      status: row.status,
    },
    formatPrice,
    formatDate,
  );

  const vars: EmailVars = {
    customer_name: row.contact_name ?? "Traveler",
    contact_email: row.contact_email,
    contact_phone: row.contact_phone ?? "",
    booking_reference: row.reference_code,
    booking_status: row.status,
    booking_total: formatPrice(row.total_cents),
    booking_date: formatDate(row.created_at.slice(0, 10)),
    tour_title: tourTitle,
    travelers: String(row.travelers),
    travel_date: row.travel_date ? formatDate(row.travel_date) : "",
    deposit_amount:
      depositCents && depositCents > 0 ? formatPrice(depositCents) : "",
    track_url: buildTrackUrl(row.reference_code),
    admin_url: buildAdminBookingUrl(row.id),
    site_name: brand.name,
    site_url: brand.url,
    site_phone: brand.phone,
    site_email: brand.email,
    site_address: brand.address,
    site_whatsapp: brand.whatsapp ?? "",
    booking_details: bookingDetails,
    special_requests: buildSpecialRequestsHtml(row.special_requests),
  };

  return {
    vars,
    brand,
    toEmail: row.contact_email,
    bookingId: row.id,
  };
}
