"use client";

import Link from "next/link";

export function MobileBookBar({
  slug,
  priceLabel,
  spotsLeft,
}: {
  slug: string;
  priceLabel: string;
  spotsLeft: number | null;
}) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-[800] border-t border-ink/10 bg-white/95 px-[22px] py-3 shadow-[0_-4px_24px_rgba(0,0,0,0.12)] backdrop-blur-md min-[921px]:hidden pb-[max(12px,env(safe-area-inset-bottom))]">
      <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="font-sans text-[12px] text-muted">From</div>
          <div className="truncate font-serif text-[20px] font-bold text-green">
            {priceLabel}
          </div>
          {spotsLeft != null && spotsLeft < 10 && (
            <div className="text-[11px] font-semibold text-coral">
              Only {spotsLeft} spots left
            </div>
          )}
        </div>
        <Link
          href={`/tours/${slug}/book`}
          className="shrink-0 rounded-lg bg-green px-6 py-3.5 font-sans text-[15px] font-semibold text-white no-underline"
        >
          Book Now
        </Link>
      </div>
    </div>
  );
}
