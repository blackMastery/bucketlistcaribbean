import Link from "next/link";
import { Eyebrow } from "@/components/ui";
import { Icon } from "@/components/icons";
import { BookingCard } from "@/components/account/BookingCard";
import { createClient } from "@/lib/supabase/server";
import { getAccountOverview } from "@/lib/account-queries";
import { nextUpcomingBooking } from "@/lib/account";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "My Account",
  description: "View your Mista Concierge Travel bookings and saved tours.",
  path: "/account",
  noIndex: true,
});

export default async function AccountOverviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { profile, bookings, favCount, referralStats } = await getAccountOverview(user.id);
  const firstName =
    profile?.full_name?.split(" ")[0] ??
    user.email?.split("@")[0] ??
    "traveler";
  const nextTrip = nextUpcomingBooking(bookings);

  return (
    <div>
      <h1 className="m-0 mb-8 font-serif text-[36px] font-bold text-ink max-[640px]:text-[28px]">
        Welcome back, {firstName}
      </h1>

      <div className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
        {[
          { label: "Trips", value: bookings.length, href: "/account/bookings" },
          { label: "Saved tours", value: favCount, href: "/account/saved" },
          {
            label: "Referrals",
            value: referralStats.count,
            href: "/account/refer",
          },
        ].map((stat) => (
          <Link
            key={stat.label}
            href={stat.href}
            className="rounded-xl bg-white p-5 no-underline shadow-[0_2px_8px_rgba(0,0,0,0.05)] transition-shadow hover:shadow-[0_4px_16px_rgba(27,122,92,0.1)]"
          >
            <div className="text-[12px] font-semibold uppercase tracking-[1px] text-muted">
              {stat.label}
            </div>
            <div className="mt-1 font-serif text-[28px] font-bold text-green">
              {stat.value}
            </div>
          </Link>
        ))}
      </div>

      {nextTrip ? (
        <div className="mb-10">
          <Eyebrow className="mb-4 block">Next trip</Eyebrow>
          <BookingCard booking={nextTrip} />
        </div>
      ) : (
        <div className="mb-10 rounded-2xl bg-white p-10 text-center shadow-[0_2px_8px_rgba(0,0,0,0.05)]">
          <div className="mb-3 flex justify-center text-green">
            <Icon name="compass" size={36} strokeWidth={1.5} />
          </div>
          <p className="m-0 mb-4 text-[15px] text-muted">
            No upcoming trips yet. Ready for your next escape?
          </p>
          <Link
            href="/tours"
            className="inline-block rounded-lg bg-green px-7 py-3 font-sans text-[14px] font-semibold text-white no-underline"
          >
            Browse tours
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Link
          href="/account/profile"
          className="rounded-xl bg-white p-5 no-underline shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
        >
          <div className="font-sans text-[15px] font-semibold text-ink">
            Update profile
          </div>
          <p className="m-0 mt-1 text-[13px] text-muted">
            Contact info and travel preferences
          </p>
        </Link>
        <Link
          href="/bookings/track"
          className="rounded-xl bg-white p-5 no-underline shadow-[0_2px_8px_rgba(0,0,0,0.05)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]"
        >
          <div className="font-sans text-[15px] font-semibold text-ink">
            Track a booking
          </div>
          <p className="m-0 mt-1 text-[13px] text-muted">
            Look up by reference without signing in
          </p>
        </Link>
      </div>
    </div>
  );
}
