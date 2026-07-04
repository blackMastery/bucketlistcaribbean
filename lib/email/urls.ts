import { SITE_URL } from "@/lib/seo";

export function buildTrackUrl(referenceCode: string): string {
  return `${SITE_URL}/bookings/track?ref=${encodeURIComponent(referenceCode)}`;
}

export function buildAdminBookingUrl(bookingIdOrRef: string): string {
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      bookingIdOrRef,
    );
  if (isUuid) {
    return `${SITE_URL}/admin/bookings/${bookingIdOrRef}`;
  }
  return `${SITE_URL}/admin/bookings?q=${encodeURIComponent(bookingIdOrRef)}`;
}
