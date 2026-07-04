import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/admin/ui";
import { EmailTemplateForm } from "@/components/admin/email/EmailTemplateForm";
import { TestSendForm } from "@/components/admin/email/TestSendForm";
import { AuditInfo } from "@/components/admin/email/AuditInfo";
import {
  getAdminEmailTemplateById,
  getProfileLabels,
} from "@/lib/admin-queries";
import { getEmailBrand } from "@/lib/email/context";

export default async function EditEmailTemplatePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [template, brand] = await Promise.all([
    getAdminEmailTemplateById(id),
    getEmailBrand(),
  ]);
  if (!template) notFound();

  const profileIds = [template.created_by, template.modified_by].filter(
    (v): v is string => !!v,
  );
  const labels = await getProfileLabels(profileIds);

  return (
    <div>
      <Link
        href="/admin/email-templates"
        className="mb-4 inline-block font-sans text-[13px] font-semibold text-green no-underline"
      >
        ← Email templates
      </Link>
      <PageHeader
        title={template.name}
        subtitle={template.is_system ? "System template" : `Custom · ${template.slug}`}
      />

      <div className="flex flex-col gap-6">
        <EmailTemplateForm mode="edit" template={template} brand={brand} />
        <TestSendForm slug={template.slug} />
        <AuditInfo
          createdAt={template.created_at}
          updatedAt={template.updated_at}
          createdByLabel={
            template.created_by ? labels[template.created_by] : null
          }
          modifiedByLabel={
            template.modified_by ? labels[template.modified_by] : null
          }
        />
      </div>
    </div>
  );
}
