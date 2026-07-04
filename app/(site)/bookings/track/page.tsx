"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState, useTransition, Suspense } from "react";
import { trackBooking } from "@/app/actions";
import { Eyebrow } from "@/components/ui";
import { TravelerPassportPanel } from "@/components/account/TravelerPassportPanel";
import { formatPrice, formatDate } from "@/lib/format";
import type { BookingTravelerDetail, Json } from "@/lib/database.types";

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-gold/15 text-gold-deep",
  confirmed: "bg-green/[0.12] text-green",
  cancelled: "bg-coral/[0.12] text-coral",
};

type BookingResult = {
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

function TrackForm() {
  const searchParams = useSearchParams();
  const [reference, setReference] = useState(searchParams.get("ref") ?? "");
  const [email, setEmail] = useState("");
  const [booking, setBooking] = useState<BookingResult | null>(null);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const labelCls =
    "mb-1.5 block font-sans text-[12px] font-semibold text-muted";
  const fieldCls =
    "w-full rounded-lg border-[1.5px] border-ink/15 px-3.5 py-3 font-body text-[14px] text-ink outline-none focus:border-green";

  function lookup() {
    setError("");
    setBooking(null);
    startTransition(async () => {
      const res = await trackBooking(reference, email);
      if (res.ok && res.booking) {
        setBooking(res.booking);
      } else {
        setError(res.error ?? "Booking not found.");
      }
    });
  }

  function refreshBooking() {
    if (!reference.trim() || !email.trim()) return;
    startTransition(async () => {
      const res = await trackBooking(reference, email);
      if (res.ok && res.booking) setBooking(res.booking);
    });
  }

  const breakdown = booking?.pricing_breakdown as {
    deposit_cents?: number;
    occupancy_label?: string | null;
    tier_price_cents?: number | null;
    per_person_cents?: number | null;
    adults?: number;
    children?: { label: string; count: number; price_cents: number }[];
  } | null;

  const tierPriceCents =
    breakdown?.tier_price_cents ?? breakdown?.per_person_cents ?? null;

  return (
    <div className="mx-auto max-w-[520px]">
      <div className="rounded-2xl bg-white p-8 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
        <div className="flex flex-col gap-3.5">
          <div>
            <label className={labelCls}>Booking reference</label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value.toUpperCase())}
              className={fieldCls}
              placeholder="MC-A7F3B2"
              autoComplete="off"
            />
          </div>
          <div>
            <label className={labelCls}>Email used when booking</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={fieldCls}
              placeholder="you@email.com"
              autoComplete="email"
            />
          </div>
          {error && (
            <p className="m-0 rounded-lg bg-coral/[0.1] px-3.5 py-2.5 text-[13px] text-coral" role="alert">
              {error}
            </p>
          )}
          <button
            type="button"
            onClick={lookup}
            disabled={pending}
            className="w-full rounded-lg bg-green py-3.5 font-sans text-[15px] font-semibold text-sand disabled:opacity-70"
          >
            {pending ? "Looking up…" : "Track booking"}
          </button>
        </div>
      </div>

      {booking && (
        <div className="mt-6 rounded-2xl bg-white p-8 shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
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
            <div className="flex justify-between gap-4 text-[14px]">
              <dt className="text-muted">Total</dt>
              <dd className="m-0 font-serif text-[18px] font-bold text-green">
                {formatPrice(booking.total_cents)}
              </dd>
            </div>
            {breakdown?.deposit_cents != null && breakdown.deposit_cents > 0 && (
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

          {booking.status === "pending" && (
            <p className="mt-5 mb-0 text-[13px] leading-[1.6] text-muted">
              Your concierge is reviewing availability. You&apos;ll receive an email when your booking is confirmed.
            </p>
          )}
        </div>
      )}

      {booking && booking.travelers_detail.length > 0 && (
        <div className="mt-6">
          <TravelerPassportPanel
            travelers={booking.travelers_detail}
            travelDate={booking.travel_date}
            status={booking.status}
            referenceCode={booking.reference_code}
            email={email}
            onRefresh={refreshBooking}
          />
        </div>
      )}
    </div>
  );
}

export default function TrackBookingPage() {
  return (
    <div className="bg-sand">
      <section className="mx-auto max-w-[1280px] px-8 py-[72px] max-[640px]:px-[22px]">
        <div className="mb-10 text-center">
          <Eyebrow>Your booking</Eyebrow>
          <h1 className="m-0 mt-2.5 font-serif text-[42px] font-bold text-ink max-[640px]:text-[32px]">
            Track your request
          </h1>
          <p className="mx-auto mt-3 max-w-[480px] text-[15px] leading-[1.65] text-muted">
            Enter the reference from your confirmation email and the email you used when booking.
          </p>
        </div>
        <Suspense fallback={<div className="text-center text-muted">Loading…</div>}>
          <TrackForm />
        </Suspense>
      </section>
    </div>
  );
}
