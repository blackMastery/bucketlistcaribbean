import { requirePageAccess } from "@/lib/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Card } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { FaqForm } from "@/components/admin/FaqForm";
import { getAdminFaqById, getFaqCategories } from "@/lib/admin-queries";
import { deleteFaq } from "@/app/admin/chatbot/actions";

export default async function EditFaqPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageAccess("chatbot");
  const { id } = await params;
  const [faq, categories] = await Promise.all([
    getAdminFaqById(id),
    getFaqCategories(),
  ]);
  if (!faq) notFound();

  return (
    <div>
      <Link
        href="/admin/chatbot"
        className="mb-4 inline-block font-sans text-[13px] font-semibold text-green no-underline"
      >
        ← Chatbot
      </Link>
      <PageHeader
        title="Edit FAQ"
        subtitle={`Used ${faq.usage_count}× by the chatbot`}
        action={
          <ConfirmButton
            action={deleteFaq.bind(null, faq.id)}
            title="Delete FAQ?"
            confirmText="This FAQ will be permanently removed. Logged conversations that matched it are kept."
          />
        }
      />
      <Card>
        <FaqForm mode="edit" faq={faq} categories={categories} />
      </Card>
    </div>
  );
}
