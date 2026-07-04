import { requirePageAccess } from "@/lib/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Card } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { DestinationForm } from "@/components/admin/EntityForms";
import { getAdminDestinationById } from "@/lib/admin-queries";
import { deleteDestination } from "@/app/admin/actions";

export default async function EditDestinationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageAccess("destinations");
  const { id } = await params;
  const destination = await getAdminDestinationById(id);
  if (!destination) notFound();

  return (
    <div>
      <Link href="/admin/destinations" className="mb-4 inline-block font-sans text-[13px] font-semibold text-green no-underline">
        ← Destinations
      </Link>
      <PageHeader
        title={destination.name}
        action={
          <ConfirmButton
            action={deleteDestination.bind(null, destination.id)}
            title="Delete destination?"
            confirmText={`"${destination.name}" will be permanently removed.`}
          />
        }
      />
      <Card>
        <DestinationForm mode="edit" destination={destination} />
      </Card>
    </div>
  );
}
