import { requirePageAccess } from "@/lib/admin";
import Link from "next/link";
import { PageHeader, Card, LinkButton, EmptyState, StatusBadge } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { getAdminDestinations } from "@/lib/admin-queries";
import { deleteDestination } from "@/app/admin/actions";

export default async function AdminDestinationsPage() {
  await requirePageAccess("destinations");
  const destinations = await getAdminDestinations();
  return (
    <div>
      <PageHeader
        title="Destinations"
        subtitle={`${destinations.length} islands`}
        action={<LinkButton href="/admin/destinations/new">+ New destination</LinkButton>}
      />
      {destinations.length === 0 ? (
        <EmptyState icon="map-pin" text="No destinations yet." />
      ) : (
        <Card className="!p-0">
          <div className="divide-y divide-ink/[0.06]">
            {destinations.map((d) => (
              <div key={d.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/destinations/${d.id}`} className="font-sans text-[15px] font-semibold text-ink no-underline hover:text-green">
                      {d.name}
                    </Link>
                    {d.is_featured && <StatusBadge status="published" />}
                  </div>
                  <div className="mt-0.5 text-[12.5px] text-muted">{d.tag}</div>
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  <Link href={`/admin/destinations/${d.id}`} className="rounded-lg border border-ink/15 px-3.5 py-2 font-sans text-[13px] font-semibold text-ink no-underline hover:border-green hover:text-green">
                    Edit
                  </Link>
                  <ConfirmButton
                    action={deleteDestination.bind(null, d.id)}
                    title="Delete destination?"
                    confirmText={`"${d.name}" will be permanently removed.`}
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
