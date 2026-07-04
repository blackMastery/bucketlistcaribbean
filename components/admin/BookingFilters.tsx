"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

const tabCls = (active: boolean) =>
  `rounded-lg px-3.5 py-2 font-sans text-[13px] font-semibold no-underline transition-colors ${
    active
      ? "bg-green text-white"
      : "bg-white text-ink border border-ink/15 hover:border-green hover:text-green"
  }`;

export function BookingFilters({
  counts,
}: {
  counts: { all: number; pending: number; confirmed: number; cancelled: number };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const status = searchParams.get("status") ?? "all";
  const [query, setQuery] = useState(searchParams.get("q") ?? "");
  const [, startTransition] = useTransition();

  function apply(nextStatus: string, nextQuery?: string) {
    const params = new URLSearchParams();
    if (nextStatus !== "all") params.set("status", nextStatus);
    const q = (nextQuery ?? query).trim();
    if (q) params.set("q", q);
    const qs = params.toString();
    startTransition(() => {
      router.push(qs ? `/admin/bookings?${qs}` : "/admin/bookings");
    });
  }

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3">
      <div className="flex flex-wrap gap-2">
        <button type="button" className={tabCls(status === "all")} onClick={() => apply("all")}>
          All ({counts.all})
        </button>
        <button type="button" className={tabCls(status === "pending")} onClick={() => apply("pending")}>
          Pending ({counts.pending})
        </button>
        <button type="button" className={tabCls(status === "confirmed")} onClick={() => apply("confirmed")}>
          Confirmed ({counts.confirmed})
        </button>
        <button type="button" className={tabCls(status === "cancelled")} onClick={() => apply("cancelled")}>
          Cancelled ({counts.cancelled})
        </button>
      </div>
      <form
        className="ml-auto flex min-w-[220px] flex-1 gap-2 max-[640px]:w-full max-[640px]:ml-0"
        onSubmit={(e) => {
          e.preventDefault();
          apply(status);
        }}
      >
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search reference, email, tour…"
          className="w-full rounded-lg border border-ink/15 bg-white px-3.5 py-2 font-body text-[14px] text-ink outline-none focus:border-green"
        />
        <button
          type="submit"
          className="rounded-lg border border-ink/15 bg-white px-4 py-2 font-sans text-[13px] font-semibold text-ink hover:border-green hover:text-green"
        >
          Search
        </button>
      </form>
    </div>
  );
}