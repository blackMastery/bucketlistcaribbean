import { requirePageAccess } from "@/lib/admin";
import { Suspense } from "react";
import Link from "next/link";
import { PageHeader, Card, EmptyState } from "@/components/admin/ui";
import { BookingStatusSelect } from "@/components/admin/LeadControls";
import { BookingFilters } from "@/components/admin/BookingFilters";
import { getAdminBookings } from "@/lib/admin-queries";
import { formatPrice } from "@/lib/format";

function filterBookings(
  bookings: Awaited<ReturnType<typeof getAdminBookings>>,
  status: string,
  query: string,
) {
  let rows = bookings;
  if (status !== "all") {
    rows = rows.filter((b) => b.status === status);
  }
  const q = query.trim().toLowerCase();
  if (q) {
    rows = rows.filter((b) => {
      const haystack = [
        b.reference_code,
        b.contact_name,
        b.contact_email,
        b.tours?.title,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(q);
    });
  }
  return rows;
}

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string }>;
}) {
  await requirePageAccess("bookings");
  const { status = "all", q = "" } = await searchParams;
  const allBookings = await getAdminBookings();
  const bookings = filterBookings(allBookings, status, q);

  const counts = {
    all: allBookings.length,
    pending: allBookings.filter((b) => b.status === "pending").length,
    confirmed: allBookings.filter((b) => b.status === "confirmed").length,
    cancelled: allBookings.filter((b) => b.status === "cancelled").length,
  };

  return (
    <div>
      <PageHeader
        title="Booking requests"
        subtitle={`${allBookings.length} total`}
      />
      <Suspense fallback={null}>
        <BookingFilters counts={counts} />
      </Suspense>
      {bookings.length === 0 ? (
        <EmptyState
          icon="compass"
          text={
            status !== "all" || q
              ? "No bookings match your filters."
              : "No booking requests yet."
          }
        />
      ) : (
        <Card className="!p-0">
          <div className="divide-y divide-ink/[0.06]">
            {bookings.map((b) => (
              <div
                key={b.id}
                className="flex flex-wrap items-center gap-4 px-5 py-3.5 hover:bg-green/[0.03]"
              >
                <Link
                  href={`/admin/bookings/${b.id}`}
                  className="min-w-0 flex-1 text-inherit no-underline"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[12px] font-semibold text-green">
                      {b.reference_code}
                    </span>
                    <span className="font-sans text-[15px] font-semibold text-ink">
                      {b.tours?.title ?? "Tour"}
                    </span>
                  </div>
                  <div className="mt-0.5 text-[12.5px] text-muted">
                    {b.contact_name ? `${b.contact_name} · ` : ""}
                    {b.travelers} {b.travelers === 1 ? "traveler" : "travelers"}
                    {b.travel_date ? ` · ${b.travel_date}` : ""}
                    {b.contact_email ? ` · ${b.contact_email}` : ""}
                    {" · "}
                    {new Date(b.created_at).toLocaleDateString()}
                  </div>
                </Link>
                <span className="font-serif text-[17px] font-bold text-green">
                  {formatPrice(b.total_cents)}
                </span>
                <BookingStatusSelect id={b.id} status={b.status} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
