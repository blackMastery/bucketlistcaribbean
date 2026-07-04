import { requirePageAccess } from "@/lib/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Card } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { TestimonialForm } from "@/components/admin/EntityForms";
import { getAdminTestimonialById } from "@/lib/admin-queries";
import { deleteTestimonial } from "@/app/admin/actions";

export default async function EditTestimonialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageAccess("testimonials");
  const { id } = await params;
  const testimonial = await getAdminTestimonialById(id);
  if (!testimonial) notFound();

  return (
    <div>
      <Link href="/admin/testimonials" className="mb-4 inline-block font-sans text-[13px] font-semibold text-green no-underline">
        ← Testimonials
      </Link>
      <PageHeader
        title={testimonial.name}
        action={
          <ConfirmButton
            action={deleteTestimonial.bind(null, testimonial.id)}
            title="Delete testimonial?"
            confirmText="This testimonial will be permanently removed."
          />
        }
      />
      <Card>
        <TestimonialForm mode="edit" testimonial={testimonial} />
      </Card>
    </div>
  );
}
