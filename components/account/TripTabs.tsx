"use client";

import { useState, useTransition } from "react";
import type { AccountBooking, TripBucket } from "@/lib/account";
import { groupBookingsByBucket } from "@/lib/account";
import { BookingCard } from "@/components/account/BookingCard";
import { ClaimBookingForm } from "@/components/account/ClaimBookingForm";

const TABS: { key: TripBucket; label: string }[] = [
  { key: "upcoming", label: "Upcoming" },
  { key: "pending", label: "Pending" },
  { key: "past", label: "Past" },
];

export function TripTabs({ bookings }: { bookings: AccountBooking[] }) {
  const groups = groupBookingsByBucket(bookings);
  const defaultTab =
    groups.upcoming.length > 0
      ? "upcoming"
      : groups.pending.length > 0
        ? "pending"
        : "past";
  const [tab, setTab] = useState<TripBucket>(defaultTab);
  const list = groups[tab];

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setTab(t.key)}
            className={`rounded-lg px-4 py-2 font-sans text-[13px] font-semibold transition-colors ${
              tab === t.key
                ? "bg-green text-white"
                : "bg-white text-muted shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
            }`}
          >
            {t.label} ({groups[t.key].length})
          </button>
        ))}
      </div>

      {list.length > 0 ? (
        <div className="flex flex-col gap-3.5">
          {list.map((b) => (
            <BookingCard key={b.id} booking={b} />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl bg-white p-10 text-center shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <p className="m-0 text-[15px] text-muted">No {tab} trips.</p>
        </div>
      )}

      <div className="mt-10">
        <ClaimBookingForm />
      </div>
    </div>
  );
}
