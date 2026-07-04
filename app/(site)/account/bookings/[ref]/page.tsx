import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getBookingDetailByReference,
  getBookingMessages,
  canUserReviewTour,
} from "@/lib/account-queries";
import { BookingDetailView } from "@/components/account/BookingDetailView";
import { BookingMessageThread } from "@/components/account/BookingMessageThread";
import { TravelerPassportPanel } from "@/components/account/TravelerPassportPanel";
import { ReviewForm } from "@/components/account/ReviewForm";
import { buildMetadata } from "@/lib/seo";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  return buildMetadata({
    title: `Booking ${ref}`,
    path: `/account/bookings/${ref}`,
    noIndex: true,
  });
}

export default async function AccountBookingDetailPage({
  params,
}: {
  params: Promise<{ ref: string }>;
}) {
  const { ref } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const booking = await getBookingDetailByReference(ref);
  if (!booking) notFound();

  const [messages, canReview] = await Promise.all([
    getBookingMessages(booking.id),
    canUserReviewTour(user.id, booking.tour_id),
  ]);

  return (
    <div>
      <Link
        href="/account/bookings"
        className="mb-6 inline-block font-sans text-[14px] font-semibold text-green no-underline"
      >
        ← Back to trips
      </Link>

      <div className="flex flex-col gap-6">
        <BookingDetailView booking={booking} variant="account" />
        <TravelerPassportPanel
          travelers={booking.travelers_detail}
          travelDate={booking.travel_date}
          status={booking.status}
        />
        <BookingMessageThread bookingId={booking.id} messages={messages} />
        {canReview && (
          <ReviewForm tourId={booking.tour_id} bookingId={booking.id} />
        )}
      </div>
    </div>
  );
}
