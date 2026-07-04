import { requirePageAccess } from "@/lib/admin";
import Link from "next/link";
import { PageHeader, Card } from "@/components/admin/ui";
import { TourForm } from "@/components/admin/TourForm";
import { getDestinationOptions } from "@/lib/admin-queries";
import { getDefaultPaymentTerms } from "@/lib/queries";

export default async function NewTourPage() {
  await requirePageAccess("tours");
  const [destinations, defaultPaymentTerms] = await Promise.all([
    getDestinationOptions(),
    getDefaultPaymentTerms(),
  ]);

  return (
    <div>
      <Link href="/admin/tours" className="mb-4 inline-block font-sans text-[13px] font-semibold text-green no-underline">
        ← Tours
      </Link>
      <PageHeader title="New tour" subtitle="Create the tour, then add images and itinerary on the next screen." />
      <Card>
        <TourForm
          mode="new"
          destinations={destinations}
          defaultPaymentTerms={defaultPaymentTerms}
        />
      </Card>
    </div>
  );
}
