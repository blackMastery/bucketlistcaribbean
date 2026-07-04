import { buildMetadata } from "@/lib/seo";

// The track page itself is a client component, so its metadata lives here.
export const metadata = buildMetadata({
  title: "Track Your Booking",
  description: "Look up the status of your Mista Concierge Travel booking.",
  path: "/bookings/track",
  noIndex: true,
});

export default function TrackBookingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
