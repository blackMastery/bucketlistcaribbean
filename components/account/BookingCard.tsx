import Link from "next/link";
import type { AccountBooking } from "@/lib/account";
import { formatPrice } from "@/lib/format";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-gold/15 text-gold-deep",
  confirmed: "bg-green/[0.12] text-green",
  cancelled: "bg-coral/[0.12] text-coral",
};

export function BookingCard({ booking }: { booking: AccountBooking }) {
  const tour = booking.tours;

  return (
    <Link
      href={`/account/bookings/${booking.reference_code}`}
      className="flex flex-wrap items-center justify-between gap-4 rounded-xl bg-white p-5 px-6 no-underline shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_4px_16px_rgba(27,122,92,0.12)]"
    >
      <div>
        <div className="font-sans text-[16px] font-semibold text-ink">
          {tour?.title ?? "Tour"}
        </div>
        <div className="mt-1 text-[13px] text-muted">
          <span className="font-mono text-[12px] font-semibold text-green">
            {booking.reference_code}
          </span>
          {" · "}
          {booking.travelers} {booking.travelers === 1 ? "traveler" : "travelers"}
          {booking.travel_date ? ` · ${booking.travel_date}` : ""}
          {booking.insurance ? " · insured" : ""}
        </div>
      </div>
      <div className="flex items-center gap-4">
        <span className="font-serif text-[18px] font-bold text-green">
          {formatPrice(booking.total_cents)}
        </span>
        <span
          className={`rounded-md px-3 py-1 font-sans text-[12px] font-semibold capitalize ${
            STATUS_STYLES[booking.status] ?? "bg-cream text-muted"
          }`}
        >
          {booking.status}
        </span>
      </div>
    </Link>
  );
}
