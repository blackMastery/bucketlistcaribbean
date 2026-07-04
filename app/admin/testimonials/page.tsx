import { requirePageAccess } from "@/lib/admin";
import Link from "next/link";
import { PageHeader, Card, LinkButton, EmptyState } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { getAdminTestimonials } from "@/lib/admin-queries";
import { deleteTestimonial } from "@/app/admin/actions";

export default async function AdminTestimonialsPage() {
  await requirePageAccess("testimonials");
  const items = await getAdminTestimonials();
  return (
    <div>
      <PageHeader
        title="Testimonials"
        subtitle={`${items.length} on the homepage`}
        action={<LinkButton href="/admin/testimonials/new">+ New testimonial</LinkButton>}
      />
      {items.length === 0 ? (
        <EmptyState icon="quote" text="No testimonials yet." />
      ) : (
        <Card className="!p-0">
          <div className="divide-y divide-ink/[0.06]">
            {items.map((t) => (
              <div key={t.id} className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5">
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/testimonials/${t.id}`} className="font-sans text-[15px] font-semibold text-ink no-underline hover:text-green">
                    {t.name}
                  </Link>
                  <div className="mt-0.5 truncate text-[12.5px] text-muted">{t.trip} — &ldquo;{t.quote}&rdquo;</div>
                </div>
                <div className="flex items-center gap-2 sm:shrink-0">
                  <Link href={`/admin/testimonials/${t.id}`} className="rounded-lg border border-ink/15 px-3.5 py-2 font-sans text-[13px] font-semibold text-ink no-underline hover:border-green hover:text-green">
                    Edit
                  </Link>
                  <ConfirmButton
                    action={deleteTestimonial.bind(null, t.id)}
                    title="Delete testimonial?"
                    confirmText={`The testimonial from ${t.name} will be permanently removed.`}
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
