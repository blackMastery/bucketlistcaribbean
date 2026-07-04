"use client";

import Link from "next/link";
import type { Json } from "@/lib/database.types";
import type { BookingDetail as BookingDetailType } from "@/lib/account-queries";
import { formatPrice, formatDate } from "@/lib/format";
import { maskPassportNumber, formatTravelerName } from "@/lib/travelers";
import { countryLabel } from "@/lib/countries";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-gold/15 text-gold-deep",
  confirmed: "bg-green/[0.12] text-green",
  cancelled: "bg-coral/[0.12] text-coral",
};

type Breakdown = {
  deposit_cents?: number;
  occupancy_label?: string | null;
  tier_price_cents?: number | null;
  per_person_cents?: number | null;
  adults?: number;
  children?: { label: string; count: number; price_cents: number }[];
};

export function BookingDetailView({
  booking,
  variant = "account",
}: {
  booking: BookingDetailType;
  variant?: "account" | "track";
}) {
  const breakdown = booking.pricing_breakdown as Breakdown | null;
  const tierPriceCents =
    breakdown?.tier_price_cents ?? breakdown?.per_person_cents ?? null;
  const showPaymentFields = variant === "track";

  return (
    <div className="rounded-2xl bg-white p-8 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="text-[12px] font-semibold uppercase tracking-[1px] text-muted">
            Reference
          </div>
          <div className="font-serif text-[24px] font-bold text-green">
            {booking.reference_code}
          </div>
        </div>
        <span
          className={`rounded-md px-3 py-1 font-sans text-[12px] font-semibold capitalize ${
            STATUS_STYLES[booking.status] ?? "bg-cream text-muted"
          }`}
        >
          {booking.status}
        </span>
      </div>

      <Link
        href={`/tours/${booking.tour_slug}`}
        className="font-sans text-[18px] font-semibold text-ink no-underline hover:text-green"
      >
        {booking.tour_title}
      </Link>

      <dl className="mt-5 grid gap-3 border-t border-ink/[0.06] pt-5">
        {booking.travel_date && (
          <div className="flex justify-between gap-4 text-[14px]">
            <dt className="text-muted">Travel date</dt>
            <dd className="m-0 font-semibold text-ink">
              {formatDate(booking.travel_date)}
            </dd>
          </div>
        )}
        <div className="flex justify-between gap-4 text-[14px]">
          <dt className="text-muted">Travelers</dt>
          <dd className="m-0 font-semibold text-ink">{booking.travelers}</dd>
        </div>
        {booking.travelers_detail.length > 0 && (
          <div className="border-t border-ink/[0.06] pt-3">
            <dt className="mb-2 text-[12px] font-semibold uppercase tracking-[1px] text-muted">
              Traveler manifest
            </dt>
            <dd className="m-0">
              <ul className="m-0 list-none space-y-2 p-0">
                {booking.travelers_detail.map((t) => (
                  <li
                    key={t.id}
                    className="rounded-lg bg-cream/50 px-3 py-2 text-[13px]"
                  >
                    <div className="font-semibold text-ink">
                      {formatTravelerName(t.first_name, t.last_name)}
                    </div>
                    <div className="text-muted">
                      {t.traveler_type === "child"
                        ? t.child_tier_label ?? "Child"
                        : "Adult"}
                      {" · "}
                      DOB {formatDate(t.date_of_birth)}
                      {t.phone ? ` · ${t.phone}` : ""}
                      {t.passport_number && (
                        <>
                          {" · "}
                          Passport {maskPassportNumber(t.passport_number)}
                          {t.nationality ? ` (${countryLabel(t.nationality)})` : ""}
                        </>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </dd>
          </div>
        )}
        {booking.insurance && (
          <div className="flex justify-between gap-4 text-[14px]">
            <dt className="text-muted">Travel insurance</dt>
            <dd className="m-0 font-semibold text-ink">Included</dd>
          </div>
        )}
        <div className="flex justify-between gap-4 text-[14px]">
          <dt className="text-muted">Total</dt>
          <dd className="m-0 font-serif text-[18px] font-bold text-green">
            {formatPrice(booking.total_cents)}
          </dd>
        </div>
        {showPaymentFields &&
          breakdown?.deposit_cents != null &&
          breakdown.deposit_cents > 0 && (
            <div className="flex justify-between gap-4 text-[14px]">
              <dt className="text-muted">Deposit</dt>
              <dd className="m-0 font-semibold text-ink">
                {formatPrice(breakdown.deposit_cents)}
              </dd>
            </div>
          )}
        {breakdown?.occupancy_label && (
          <div className="flex justify-between gap-4 text-[14px]">
            <dt className="text-muted">Room type</dt>
            <dd className="m-0 font-semibold text-ink">{breakdown.occupancy_label}</dd>
          </div>
        )}
        {tierPriceCents != null && tierPriceCents > 0 && (
          <div className="flex justify-between gap-4 text-[14px]">
            <dt className="text-muted">Room price</dt>
            <dd className="m-0 font-semibold text-ink">{formatPrice(tierPriceCents)}</dd>
          </div>
        )}
        {breakdown?.children?.map((c) =>
          c.count > 0 ? (
            <div key={c.label} className="flex justify-between gap-4 text-[14px]">
              <dt className="text-muted">{c.label}</dt>
              <dd className="m-0 font-semibold text-ink">
                {c.count} × {formatPrice(c.price_cents)}
              </dd>
            </div>
          ) : null,
        )}
        <div className="flex justify-between gap-4 text-[14px]">
          <dt className="text-muted">Requested</dt>
          <dd className="m-0 font-semibold text-ink">
            {new Date(booking.created_at).toLocaleDateString("en-US", {
              month: "long",
              day: "numeric",
              year: "numeric",
            })}
          </dd>
        </div>
      </dl>

      {booking.special_requests && (
        <div className="mt-5 border-t border-ink/[0.06] pt-5">
          <div className="mb-1.5 text-[12px] font-semibold uppercase tracking-[1px] text-muted">
            Special requests
          </div>
          <p className="m-0 text-[14px] leading-[1.6] text-ink-soft">
            {booking.special_requests}
          </p>
        </div>
      )}

      {booking.status === "pending" && (
        <p className="mt-5 mb-0 text-[13px] leading-[1.6] text-muted">
          Your concierge is reviewing availability. You&apos;ll receive an email when
          your booking is confirmed.
        </p>
      )}
    </div>
  );
}

// Re-export for track page compatibility
export type { BookingDetailType };
