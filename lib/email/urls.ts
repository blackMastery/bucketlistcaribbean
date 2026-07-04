import { getSiteDomain } from "@/lib/site";

export function buildTrackUrl(referenceCode: string): string {
  return `${getSiteDomain("bucketlist")}/bookings/track?ref=${encodeURIComponent(referenceCode)}`;
}

export function buildAdminBookingUrl(bookingIdOrRef: string): string {
  const adminBase =
    process.env.MISTA_ADMIN_URL?.replace(/\/$/, "") ??
    getSiteDomain("mista");
  const isUuid =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      bookingIdOrRef,
    );
  if (isUuid) {
    return `${adminBase}/admin/bookings/${bookingIdOrRef}`;
  }
  return `${adminBase}/admin/bookings?q=${encodeURIComponent(bookingIdOrRef)}`;
}
