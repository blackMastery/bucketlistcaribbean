import Link from "next/link";
import { PageHeader } from "@/components/admin/ui";
import { EmailTemplateForm } from "@/components/admin/email/EmailTemplateForm";
import { getEmailBrand } from "@/lib/email/context";

export default async function NewEmailTemplatePage() {
  const brand = await getEmailBrand();

  return (
    <div>
      <Link
        href="/admin/email-templates"
        className="mb-4 inline-block font-sans text-[13px] font-semibold text-green no-underline"
      >
        ← Email templates
      </Link>
      <PageHeader title="New template" subtitle="Create a custom email template" />
      <EmailTemplateForm mode="new" brand={brand} />
    </div>
  );
}
