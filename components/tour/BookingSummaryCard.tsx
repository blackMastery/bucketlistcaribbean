import Link from "next/link";
import { formatPrice, formatDate } from "@/lib/format";
import type { TourPricing, PaymentTerms } from "@/lib/database.types";

export function BookingSummaryCard({
  slug,
  basePriceCents,
  spotsLeft,
  pricing,
  paymentTerms,
  depositOpen,
}: {
  slug: string;
  basePriceCents: number;
  spotsLeft: number | null;
  pricing: TourPricing | null;
  paymentTerms: PaymentTerms | null;
  depositOpen: boolean;
}) {
  const occupancy = pricing?.occupancy ?? [];
  const hasTiers = occupancy.length > 0;
  const fromCents = hasTiers
    ? Math.min(...occupancy.map((t) => t.price_cents).filter((c) => c > 0))
    : basePriceCents;

  return (
    <div className="rounded-2xl border border-gold/25 bg-white p-[26px] shadow-[0_8px_32px_rgba(27,122,92,0.12)]">
      <div className="mb-1.5 flex items-baseline justify-between">
        <span className="text-[13px] text-muted-light">From</span>
        {spotsLeft != null && (
          <span className="font-sans text-[12px] font-semibold text-coral">
            Only {spotsLeft} spots left
          </span>
        )}
      </div>
      <div className="mb-5 font-serif text-[36px] font-bold text-gold">
        {formatPrice(Number.isFinite(fromCents) ? fromCents : basePriceCents)}
        {!hasTiers && (
          <span className="font-body text-[14px] font-normal text-muted-light">
            {" "}
            / person
          </span>
        )}
      </div>

      {paymentTerms && depositOpen && paymentTerms.deposit_cents > 0 && (
        <p className="m-0 mb-5 text-[13px] leading-[1.55] text-ink-soft">
          Deposit{" "}
          <strong className="text-ink">
            {formatPrice(paymentTerms.deposit_cents)}
          </strong>
          {paymentTerms.deposit_per === "person" ? " per person" : ""} to secure
          your spot
          {paymentTerms.deadline
            ? ` by ${formatDate(paymentTerms.deadline)}`
            : ""}
          .
        </p>
      )}

      <Link
        href={`/tours/${slug}/book`}
        className="mb-3 block w-full rounded-lg bg-green py-4 text-center font-sans text-[16px] font-semibold text-sand no-underline shadow-[0_6px_20px_rgba(27,122,92,0.3)] transition-all hover:-translate-y-px hover:bg-green-dark"
      >
        Book now
      </Link>
      <Link
        href="/contact"
        className="block w-full rounded-lg border-2 border-gold py-3 text-center font-sans text-[15px] font-semibold text-green no-underline hover:bg-gold hover:text-white"
      >
        Contact a Concierge
      </Link>
    </div>
  );
}
