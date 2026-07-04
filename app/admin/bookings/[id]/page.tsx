import { requirePageAccess } from "@/lib/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Card } from "@/components/admin/ui";
import { BookingStatusSelect } from "@/components/admin/LeadControls";
import { BookingNotesEditor } from "@/components/admin/BookingNotesEditor";
import { BookingEmailPanel } from "@/components/admin/BookingEmailPanel";
import { BookingMessagesPanel } from "@/components/admin/BookingMessagesPanel";
import { getAdminBookingById, getAdminBookingTravelers, getAdminEmailTemplates } from "@/lib/admin-queries";
import { getBookingMessages } from "@/lib/account-queries";
import { formatPrice, formatDate } from "@/lib/format";
import { countryLabel } from "@/lib/countries";

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-ink/[0.06] py-3 last:border-0">
      <dt className="text-[13px] text-muted">{label}</dt>
      <dd className="m-0 text-right text-[14px] font-medium text-ink">{children}</dd>
    </div>
  );
}

export default async function AdminBookingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageAccess("bookings");
  const { id } = await params;
  const [booking, emailTemplates, travelers] = await Promise.all([
    getAdminBookingById(id),
    getAdminEmailTemplates(),
    getAdminBookingTravelers(id),
  ]);
  if (!booking) notFound();

  const messages = booking.user_id
    ? await getBookingMessages(booking.id)
    : [];

  const templatesActive = Object.fromEntries(
    emailTemplates.map((t) => [t.slug, t.is_active]),
  );

  const breakdown = booking.pricing_breakdown as {
    occupancy_label?: string | null;
    adults?: number;
    tier_price_cents?: number | null;
    per_person_cents?: number | null;
    children?: { label: string; count: number; price_cents: number }[];
    deposit_cents?: number;
  } | null;

  const tierPriceCents =
    breakdown?.tier_price_cents ?? breakdown?.per_person_cents ?? null;

  return (
    <div>
      <PageHeader
        title={booking.reference_code}
        subtitle={booking.tours?.title ?? "Booking request"}
        action={
          <Link
            href="/admin/bookings"
            className="font-sans text-[14px] font-semibold text-green no-underline"
          >
            ← Back to bookings
          </Link>
        }
      />

      <div className="grid grid-cols-[1fr_320px] items-start gap-6 max-[900px]:grid-cols-1">
        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="m-0 mb-4 font-serif text-[20px] font-semibold text-ink">
              Trip details
            </h2>
            <dl>
              <DetailRow label="Tour">
                {booking.tours ? (
                  <Link
                    href={`/tours/${booking.tours.slug}`}
                    className="text-green no-underline hover:underline"
                    target="_blank"
                  >
                    {booking.tours.title}
                  </Link>
                ) : (
                  "—"
                )}
              </DetailRow>
              <DetailRow label="Travel date">
                {booking.travel_date ? formatDate(booking.travel_date) : "—"}
              </DetailRow>
              <DetailRow label="Travelers">{booking.travelers}</DetailRow>
              <DetailRow label="Total">{formatPrice(booking.total_cents)}</DetailRow>
              {breakdown?.deposit_cents != null && breakdown.deposit_cents > 0 && (
                <DetailRow label="Deposit">
                  {formatPrice(breakdown.deposit_cents)}
                </DetailRow>
              )}
              {booking.insurance && <DetailRow label="Insurance">Yes</DetailRow>}
              <DetailRow label="Requested">
                {new Date(booking.created_at).toLocaleString("en-US", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </DetailRow>
            </dl>
          </Card>

          {breakdown && (breakdown.occupancy_label || breakdown.adults) && (
            <Card>
              <h2 className="m-0 mb-4 font-serif text-[20px] font-semibold text-ink">
                Pricing breakdown
              </h2>
              <dl>
                {breakdown.occupancy_label && (
                  <DetailRow label="Room type">{breakdown.occupancy_label}</DetailRow>
                )}
                {tierPriceCents != null && tierPriceCents > 0 && (
                  <DetailRow label="Room price">{formatPrice(tierPriceCents)}</DetailRow>
                )}
                {breakdown.adults != null && (
                  <DetailRow label="Adults">{breakdown.adults}</DetailRow>
                )}
                {breakdown.children?.map((c) =>
                  c.count > 0 ? (
                    <DetailRow key={c.label} label={c.label}>
                      {c.count} × {formatPrice(c.price_cents)}
                    </DetailRow>
                  ) : null,
                )}
              </dl>
            </Card>
          )}

          {travelers.length > 0 && (
            <Card>
              <h2 className="m-0 mb-4 font-serif text-[20px] font-semibold text-ink">
                Traveler manifest
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] border-collapse text-left text-[13px]">
                  <thead>
                    <tr className="border-b border-ink/[0.08] text-muted">
                      <th className="py-2 pr-3 font-semibold">#</th>
                      <th className="py-2 pr-3 font-semibold">First</th>
                      <th className="py-2 pr-3 font-semibold">Last</th>
                      <th className="py-2 pr-3 font-semibold">Phone</th>
                      <th className="py-2 pr-3 font-semibold">Type</th>
                      <th className="py-2 pr-3 font-semibold">DOB</th>
                      <th className="py-2 pr-3 font-semibold">Gender</th>
                      <th className="py-2 pr-3 font-semibold">Passport</th>
                      <th className="py-2 pr-3 font-semibold">Expiry</th>
                      <th className="py-2 font-semibold">Nationality</th>
                    </tr>
                  </thead>
                  <tbody>
                    {travelers.map((t) => (
                        <tr key={t.id} className="border-b border-ink/[0.06]">
                          <td className="py-3 pr-3">{t.position}</td>
                          <td className="py-3 pr-3 font-medium">{t.first_name}</td>
                          <td className="py-3 pr-3 font-medium">{t.last_name}</td>
                          <td className="py-3 pr-3">{t.phone ?? "—"}</td>
                          <td className="py-3 pr-3 capitalize">
                            {t.traveler_type === "child"
                              ? t.child_tier_label ?? "Child"
                              : "Adult"}
                          </td>
                          <td className="py-3 pr-3">
                            {formatDate(t.date_of_birth)}
                          </td>
                          <td className="py-3 pr-3 capitalize">{t.gender}</td>
                          <td className="py-3 pr-3">
                            {t.passport_number ?? (
                              <span className="rounded-md bg-coral/[0.12] px-2 py-0.5 text-[11px] font-semibold text-coral">
                                Missing
                              </span>
                            )}
                          </td>
                          <td className="py-3 pr-3">
                            {t.passport_expiry ? (
                              formatDate(t.passport_expiry)
                            ) : (
                              <span className="rounded-md bg-gold/15 px-2 py-0.5 text-[11px] font-semibold text-gold-deep">
                                Needed
                              </span>
                            )}
                          </td>
                          <td className="py-3">
                            {t.nationality ? (
                              countryLabel(t.nationality)
                            ) : (
                              <span className="rounded-md bg-gold/15 px-2 py-0.5 text-[11px] font-semibold text-gold-deep">
                                Needed
                              </span>
                            )}
                          </td>
                        </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mb-0 mt-3 text-[12px] text-muted">
                Passport data is sensitive — handle in accordance with your
                privacy policy.
              </p>
            </Card>
          )}

          {booking.special_requests && (
            <Card>
              <h2 className="m-0 mb-3 font-serif text-[20px] font-semibold text-ink">
                Special requests
              </h2>
              <p className="m-0 whitespace-pre-wrap text-[14px] leading-[1.65] text-ink-soft">
                {booking.special_requests}
              </p>
            </Card>
          )}

          <Card>
            <h2 className="m-0 mb-4 font-serif text-[20px] font-semibold text-ink">
              Internal notes
            </h2>
            <BookingNotesEditor id={booking.id} initialNotes={booking.admin_notes} />
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <h2 className="m-0 mb-4 font-serif text-[20px] font-semibold text-ink">
              Status
            </h2>
            <BookingStatusSelect id={booking.id} status={booking.status} />
          </Card>

          <BookingEmailPanel
            bookingId={booking.id}
            contactEmail={booking.contact_email}
            templatesActive={templatesActive}
          />

          {booking.user_id && (
            <BookingMessagesPanel
              bookingId={booking.id}
              userId={booking.user_id}
              messages={messages}
            />
          )}

          <Card>
            <h2 className="m-0 mb-4 font-serif text-[20px] font-semibold text-ink">
              Guest contact
            </h2>
            <dl>
              <DetailRow label="Name">{booking.contact_name ?? "—"}</DetailRow>
              <DetailRow label="Email">
                {booking.contact_email ? (
                  <a
                    href={`mailto:${booking.contact_email}`}
                    className="text-green no-underline hover:underline"
                  >
                    {booking.contact_email}
                  </a>
                ) : (
                  "—"
                )}
              </DetailRow>
              <DetailRow label="Phone">
                {booking.contact_phone ? (
                  <a
                    href={`tel:${booking.contact_phone}`}
                    className="text-green no-underline hover:underline"
                  >
                    {booking.contact_phone}
                  </a>
                ) : (
                  "—"
                )}
              </DetailRow>
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
