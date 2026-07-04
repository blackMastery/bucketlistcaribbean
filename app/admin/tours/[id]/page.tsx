import { requirePageAccess } from "@/lib/admin";
import Link from "next/link";
import { Icon } from "@/components/icons";
import { notFound } from "next/navigation";
import { PageHeader, Card, StatusBadge } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { TourStatusSelect } from "@/components/admin/LeadControls";
import { TourForm } from "@/components/admin/TourForm";
import {
  TourImagesEditor,
  TourHighlightsEditor,
  TourItineraryEditor,
  TourInclusionsEditor,
  TourActivitiesEditor,
} from "@/components/admin/TourSubEditors";
import {
  getAdminTourById,
  getDestinationOptions,
  getActivityTypeOptions,
} from "@/lib/admin-queries";
import { getDefaultPaymentTerms } from "@/lib/queries";
import { deleteTour } from "@/app/admin/actions";

export default async function EditTourPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageAccess("tours");
  const { id } = await params;
  const [tour, destinations, activityOptions, defaultPaymentTerms] = await Promise.all([
    getAdminTourById(id),
    getDestinationOptions(),
    getActivityTypeOptions(),
    getDefaultPaymentTerms(),
  ]);
  if (!tour) notFound();

  return (
    <div>
      <Link href="/admin/tours" className="mb-4 inline-block font-sans text-[13px] font-semibold text-green no-underline">
        ← Tours
      </Link>
      <PageHeader
        title={tour.title}
        subtitle={`/tours/${tour.slug}`}
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge status={tour.is_published ? "published" : "draft"} />
            <TourStatusSelect id={tour.id} isPublished={tour.is_published} />
            {tour.is_published && (
              <Link
                href={`/tours/${tour.slug}`}
                target="_blank"
                className="inline-flex items-center gap-1 rounded-lg border border-ink/15 px-4 py-2.5 font-sans text-[13px] font-semibold text-ink no-underline hover:border-green hover:text-green"
              >
                View live <Icon name="external-link" size={13} />
              </Link>
            )}
            <ConfirmButton
              action={deleteTour.bind(null, tour.id)}
              title="Delete tour?"
              confirmText={`"${tour.title}" and all of its images, itinerary, and reviews will be permanently removed.`}
            />
          </div>
        }
      />

      <div className="flex flex-col gap-6">
        <Card>
          <TourForm
            mode="edit"
            tour={tour}
            destinations={destinations}
            defaultPaymentTerms={defaultPaymentTerms}
          />
        </Card>

        <TourActivitiesEditor
          tourId={tour.id}
          options={activityOptions}
          selected={tour.tour_activities.map((a) => a.activity_type_id)}
        />
        <TourImagesEditor tourId={tour.id} images={tour.tour_images} />
        <TourHighlightsEditor tourId={tour.id} highlights={tour.tour_highlights} />
        <TourItineraryEditor tourId={tour.id} days={tour.tour_itinerary} />
        <TourInclusionsEditor tourId={tour.id} inclusions={tour.tour_inclusions} />
      </div>
    </div>
  );
}
