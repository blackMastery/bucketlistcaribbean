import { createClient } from "@/lib/supabase/server";
import { getUserBookings } from "@/lib/account-queries";
import { TripTabs } from "@/components/account/TripTabs";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildPageMetadata({
    title: "My Trips",
    description: "View your booking requests.",
    path: "/account/bookings",
    noIndex: true,
  });
}

export default async function AccountBookingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const bookings = await getUserBookings(user.id);

  return (
    <div>
      <h1 className="m-0 mb-6 font-serif text-[30px] font-bold text-ink">
        My trips
      </h1>
      <TripTabs bookings={bookings} />
    </div>
  );
}
