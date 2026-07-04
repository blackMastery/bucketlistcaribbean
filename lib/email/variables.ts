// Pure variable catalogue for email templates (browser-safe).

export type EmailVariable = {
  key: string;
  label: string;
  description: string;
  sample: string;
  rawHtml?: boolean;
};

export const EMAIL_VARIABLES: EmailVariable[] = [
  {
    key: "customer_name",
    label: "Customer name",
    description: "Guest or traveler name",
    sample: "Jane Smith",
  },
  {
    key: "contact_email",
    label: "Contact email",
    description: "Guest email address",
    sample: "jane@example.com",
  },
  {
    key: "contact_phone",
    label: "Contact phone",
    description: "Guest phone number",
    sample: "+1 246 555 0100",
  },
  {
    key: "booking_reference",
    label: "Booking reference",
    description: "MC-XXXXXX reference code",
    sample: "MC-A1B2C3",
  },
  {
    key: "booking_status",
    label: "Booking status",
    description: "pending, confirmed, or cancelled",
    sample: "confirmed",
  },
  {
    key: "booking_total",
    label: "Booking total",
    description: "Formatted total price",
    sample: "$2,650 GYD",
  },
  {
    key: "booking_date",
    label: "Booking date",
    description: "Date the request was submitted",
    sample: "June 15, 2026",
  },
  {
    key: "tour_title",
    label: "Tour title",
    description: "Name of the booked tour",
    sample: "Pitons & Paradise — St. Lucia",
  },
  {
    key: "travelers",
    label: "Travelers",
    description: "Number of travelers",
    sample: "2",
  },
  {
    key: "travel_date",
    label: "Travel date",
    description: "Requested travel date",
    sample: "August 10, 2026",
  },
  {
    key: "deposit_amount",
    label: "Deposit amount",
    description: "Formatted deposit (empty if none)",
    sample: "$500 GYD",
  },
  {
    key: "track_url",
    label: "Track URL",
    description: "Link to booking status page",
    sample: "https://example.com/bookings/track?ref=MC-A1B2C3",
  },
  {
    key: "admin_url",
    label: "Admin URL",
    description: "Link to booking in admin",
    sample: "https://example.com/admin/bookings/abc-123",
  },
  {
    key: "site_name",
    label: "Site name",
    description: "Business name",
    sample: "Mista Concierge Travel",
  },
  {
    key: "site_url",
    label: "Site URL",
    description: "Website homepage URL",
    sample: "https://www.mistaconciergetravel.com",
  },
  {
    key: "site_phone",
    label: "Site phone",
    description: "Business phone number",
    sample: "+1 246 000 0000",
  },
  {
    key: "site_email",
    label: "Site email",
    description: "Business contact email",
    sample: "hello@mistatravel.com",
  },
  {
    key: "site_address",
    label: "Site address",
    description: "Business address",
    sample: "Hastings Main Road, Christ Church, Barbados",
  },
  {
    key: "site_whatsapp",
    label: "Site WhatsApp",
    description: "WhatsApp contact label",
    sample: "Message us anytime",
  },
  {
    key: "booking_details",
    label: "Booking details table",
    description: "HTML table with tour, dates, travelers, total",
    sample: "",
    rawHtml: true,
  },
  {
    key: "special_requests",
    label: "Special requests",
    description: "Optional special requests block",
    sample: "",
    rawHtml: true,
  },
];

const RAW_HTML_KEYS = new Set(
  EMAIL_VARIABLES.filter((v) => v.rawHtml).map((v) => v.key),
);

export function isRawHtmlKey(key: string): boolean {
  return RAW_HTML_KEYS.has(key);
}

export function buildSampleVars(
  formatPrice: (cents: number) => string,
): Record<string, string> {
  const details = `<table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
    <tr><td style="padding:8px 0;font-size:13px;color:#7A8A84;width:120px;">Tour</td>
    <td style="padding:8px 0;font-size:14px;color:#1A2E28;font-weight:600;">Pitons & Paradise — St. Lucia</td></tr>
    <tr><td style="padding:8px 0;font-size:13px;color:#7A8A84;">Travel date</td>
    <td style="padding:8px 0;font-size:14px;color:#1A2E28;font-weight:600;">August 10, 2026</td></tr>
    <tr><td style="padding:8px 0;font-size:13px;color:#7A8A84;">Travelers</td>
    <td style="padding:8px 0;font-size:14px;color:#1A2E28;font-weight:600;">2</td></tr>
    <tr><td style="padding:8px 0;font-size:13px;color:#7A8A84;">Total</td>
    <td style="padding:8px 0;font-size:14px;color:#1A2E28;font-weight:600;">${formatPrice(26500000)}</td></tr>
  </table>`;

  const requests = `<p style="margin:0 0 20px;font-size:14px;color:#3D524C;"><strong>Special requests:</strong> Vegetarian meals preferred.</p>`;

  const map: Record<string, string> = {};
  for (const v of EMAIL_VARIABLES) {
    if (v.rawHtml) {
      map[v.key] = v.key === "booking_details" ? details : requests;
    } else {
      map[v.key] = v.sample;
    }
  }
  return map;
}
