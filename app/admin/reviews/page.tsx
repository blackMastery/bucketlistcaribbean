import { requirePageAccess } from "@/lib/admin";
import { PageHeader, Card, EmptyState, StatusBadge } from "@/components/admin/ui";
import { StarRating } from "@/components/icons";
import { ReviewControls } from "@/components/admin/LeadControls";
import { getAdminReviews } from "@/lib/admin-queries";

export default async function AdminReviewsPage() {
  await requirePageAccess("reviews");
  const reviews = await getAdminReviews();

  return (
    <div>
      <PageHeader
        title="Reviews"
        subtitle={`${reviews.length} review${reviews.length === 1 ? "" : "s"} · only published reviews show on the site`}
      />
      {reviews.length === 0 ? (
        <EmptyState icon="star" text="No reviews yet." />
      ) : (
        <div className="flex flex-col gap-3">
          {reviews.map((r) => (
            <Card key={r.id} className="!p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-sans text-[15px] font-semibold text-ink">{r.author_name}</span>
                    <StarRating rating={r.rating} />
                    <StatusBadge status={r.is_published ? "published" : "hidden"} />
                  </div>
                  <div className="mt-0.5 text-[12.5px] text-muted">
                    {r.tours?.title ?? "—"} · {r.review_date}
                  </div>
                  <p className="m-0 mt-2 text-[14px] leading-[1.6] text-ink-soft">{r.body}</p>
                </div>
                <div className="sm:shrink-0">
                  <ReviewControls id={r.id} isPublished={r.is_published} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
