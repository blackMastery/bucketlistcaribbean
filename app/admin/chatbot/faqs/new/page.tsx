import { requirePageAccess } from "@/lib/admin";
import Link from "next/link";
import { PageHeader, Card } from "@/components/admin/ui";
import { FaqForm } from "@/components/admin/FaqForm";
import { getFaqCategories } from "@/lib/admin-queries";

export default async function NewFaqPage() {
  await requirePageAccess("chatbot");
  const categories = await getFaqCategories();
  return (
    <div>
      <Link
        href="/admin/chatbot"
        className="mb-4 inline-block font-sans text-[13px] font-semibold text-green no-underline"
      >
        ← Chatbot
      </Link>
      <PageHeader title="New FAQ" />
      <Card>
        <FaqForm mode="new" categories={categories} />
      </Card>
    </div>
  );
}
