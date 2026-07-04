import Link from "next/link";
import { PageHeader, Card, StatusBadge } from "@/components/admin/ui";
import {
  getDashboardCounts,
  getAdminBookings,
  getAdminMessages,
} from "@/lib/admin-queries";
import { formatPrice } from "@/lib/format";
import { requireAdmin } from "@/lib/admin";

export default async function AdminDashboard({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  await requireAdmin();
  const { error } = await searchParams;
  const [counts, bookings, messages] = await Promise.all([
    getDashboardCounts(),
    getAdminBookings(),
    getAdminMessages(),
  ]);

  const stats = [
    { label: "Tours", value: counts.tours, href: "/admin/tours" },
    { label: "Destinations", value: counts.destinations, href: "/admin/destinations" },
    { label: "Pending bookings", value: counts.pendingBookings, href: "/admin/bookings" },
    { label: "New messages", value: counts.newMessages, href: "/admin/messages" },
    { label: "Subscribers", value: counts.subscribers, href: "/admin/subscribers" },
  ];

  return (
    <div>
      <PageHeader title="Dashboard" subtitle="Overview of content and recent activity." />

      {error === "forbidden" && (
        <div className="mb-6 rounded-lg border border-coral/30 bg-coral/[0.08] px-4 py-3 font-sans text-[13.5px] font-medium text-coral">
          You don&apos;t have access to that section. Ask a super admin to grant it.
        </div>
      )}

      <div className="mb-10 grid grid-cols-5 gap-4 max-[900px]:grid-cols-2 max-[480px]:grid-cols-1">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="no-underline">
            <Card className="!p-5 transition-shadow hover:shadow-[0_8px_24px_rgba(27,122,92,0.12)]">
              <div className="font-serif text-[32px] font-bold text-green">{s.value}</div>
              <div className="mt-1 font-sans text-[12.5px] font-semibold uppercase tracking-[0.5px] text-muted-light">
                {s.label}
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-6 max-[820px]:grid-cols-1">
        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="m-0 font-serif text-[20px] font-semibold text-ink">Recent bookings</h2>
            <Link href="/admin/bookings" className="font-sans text-[13px] font-semibold text-green no-underline">View all →</Link>
          </div>
          {bookings.slice(0, 6).map((b) => (
            <Link
              key={b.id}
              href={`/admin/bookings/${b.id}`}
              className="flex items-center justify-between border-b border-ink/[0.06] py-2.5 last:border-0 no-underline hover:bg-green/[0.03]"
            >
              <div className="min-w-0">
                <div className="truncate font-sans text-[14px] font-medium text-ink">
                  {b.reference_code} · {b.tours?.title ?? "Tour"}
                </div>
                <div className="text-[12px] text-muted">
                  {b.travelers} pax · {formatPrice(b.total_cents)}
                </div>
              </div>
              <StatusBadge status={b.status} />
            </Link>
          ))}
          {bookings.length === 0 && <p className="m-0 text-[13px] text-muted-light">No bookings yet.</p>}
        </Card>

        <Card>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="m-0 font-serif text-[20px] font-semibold text-ink">Recent messages</h2>
            <Link href="/admin/messages" className="font-sans text-[13px] font-semibold text-green no-underline">View all →</Link>
          </div>
          {messages.slice(0, 6).map((m) => (
            <div key={m.id} className="flex items-center justify-between border-b border-ink/[0.06] py-2.5 last:border-0">
              <div className="min-w-0">
                <div className="truncate font-sans text-[14px] font-medium text-ink">{m.name}</div>
                <div className="truncate text-[12px] text-muted">{m.email}</div>
              </div>
              <StatusBadge status={m.status} />
            </div>
          ))}
          {messages.length === 0 && <p className="m-0 text-[13px] text-muted-light">No messages yet.</p>}
        </Card>
      </div>
    </div>
  );
}
