import { requirePageAccess } from "@/lib/admin";
import Link from "next/link";
import { PageHeader, Card, LinkButton, EmptyState, StatusBadge } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { TourStatusSelect } from "@/components/admin/LeadControls";
import { getAdminTours } from "@/lib/admin-queries";
import { deleteTour } from "@/app/admin/actions";
import { formatPrice } from "@/lib/format";

export default async function AdminToursPage() {
  await requirePageAccess("tours");
  const tours = await getAdminTours();

  return (
    <div>
      <PageHeader
        title="Tours"
        subtitle={`${tours.length} tour${tours.length === 1 ? "" : "s"}`}
        action={<LinkButton href="/admin/tours/new">+ New tour</LinkButton>}
      />

      {tours.length === 0 ? (
        <EmptyState icon="sparkles" text="No tours yet. Create your first one." />
      ) : (
        <Card className="!p-0">
          <div className="divide-y divide-ink/[0.06]">
            {tours.map((t) => (
              <div
                key={t.id}
                className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/tours/${t.id}`}
                      className="font-sans text-[15px] font-semibold text-ink no-underline hover:text-green"
                    >
                      {t.title}
                    </Link>
                    <StatusBadge status={t.is_published ? "published" : "draft"} />
                    {t.is_featured && (
                      <span className="font-sans text-[11px] font-semibold uppercase tracking-wide text-muted">
                        Featured
                      </span>
                    )}
                  </div>
                  <div className="mt-0.5 text-[12.5px] text-muted">
                    {t.destinations?.name ?? "—"} · {formatPrice(t.price_cents)} · {t.duration_label}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                  <TourStatusSelect id={t.id} isPublished={t.is_published} />
                  <Link
                    href={`/admin/tours/${t.id}`}
                    className="rounded-lg border border-ink/15 px-3.5 py-2 font-sans text-[13px] font-semibold text-ink no-underline hover:border-green hover:text-green"
                  >
                    Edit
                  </Link>
                  <ConfirmButton
                    action={deleteTour.bind(null, t.id)}
                    title="Delete tour?"
                    confirmText={`"${t.title}" and all of its images, itinerary, and reviews will be permanently removed.`}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
