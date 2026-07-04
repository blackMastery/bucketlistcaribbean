import { buildPageMetadata } from "@/lib/seo";

// The track page itself is a client component, so its metadata lives here.
export async function generateMetadata() {
  return buildPageMetadata({
    title: "Track Your Booking",
    description: "Look up the status of your booking.",
    path: "/bookings/track",
    noIndex: true,
  });
}

export default function TrackBookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
