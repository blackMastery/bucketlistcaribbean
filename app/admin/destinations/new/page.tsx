import { requirePageAccess } from "@/lib/admin";
import Link from "next/link";
import { PageHeader, Card } from "@/components/admin/ui";
import { DestinationForm } from "@/components/admin/EntityForms";

export default async function NewDestinationPage() {
  await requirePageAccess("destinations");
  return (
    <div>
      <Link href="/admin/destinations" className="mb-4 inline-block font-sans text-[13px] font-semibold text-green no-underline">
        ← Destinations
      </Link>
      <PageHeader title="New destination" />
      <Card>
        <DestinationForm mode="new" />
      </Card>
    </div>
  );
}
