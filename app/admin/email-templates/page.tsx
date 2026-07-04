import Link from "next/link";
import { requirePageAccess } from "@/lib/admin";
import {
  PageHeader,
  Card,
  LinkButton,
  EmptyState,
  StatusBadge,
} from "@/components/admin/ui";
import { DeleteTemplateButton } from "@/components/admin/email/DeleteTemplateButton";
import {
  getAdminEmailTemplates,
  getAdminEmailLog,
} from "@/lib/admin-queries";
import { getEmailDeliveryMode } from "@/lib/email/send";

function EmailStatusBadge({ status }: { status: string }) {
  const tones: Record<string, string> = {
    sent: "bg-green/[0.12] text-green",
    logged: "bg-gold/15 text-gold-deep",
    failed: "bg-coral/[0.12] text-coral",
  };
  return (
    <span
      className={`inline-block rounded-md px-2.5 py-1 font-sans text-[12px] font-semibold capitalize ${
        tones[status] ?? "bg-ink/[0.08] text-muted"
      }`}
    >
      {status}
    </span>
  );
}

export default async function EmailTemplatesPage() {
  await requirePageAccess("email-templates");
  const [templates, log] = await Promise.all([
    getAdminEmailTemplates(),
    getAdminEmailLog(25),
  ]);
  const deliveryMode = getEmailDeliveryMode();

  return (
    <div>
      <PageHeader
        title="Email templates"
        subtitle={`${templates.length} template${templates.length === 1 ? "" : "s"}`}
        action={<LinkButton href="/admin/email-templates/new">+ New template</LinkButton>}
      />

      {deliveryMode === "disabled" && (
        <div className="mb-6 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-[13px] text-gold-deep">
          Email delivery is disabled — set <code className="text-[12px]">SUPABASE_SERVICE_ROLE_KEY</code> to enable template reads and send logging.
        </div>
      )}
      {deliveryMode === "log-only" && (
        <div className="mb-6 rounded-xl border border-gold/30 bg-gold/10 px-4 py-3 text-[13px] text-gold-deep">
          Log-only mode — emails are recorded in the send log but not delivered. Set <code className="text-[12px]">RESEND_API_KEY</code> for live delivery.
        </div>
      )}

      {templates.length === 0 ? (
        <EmptyState icon="mails" text="No templates yet. Run migration 0011_email_templates.sql to seed system templates." />
      ) : (
        <Card className="mb-8 !p-0">
          <div className="border-b border-ink/[0.06] px-5 py-3">
            <h2 className="m-0 font-serif text-[18px] font-semibold text-ink">Templates</h2>
          </div>
          <div className="divide-y divide-ink/[0.06]">
            {templates.map((t) => (
              <div
                key={t.id}
                className="flex flex-col gap-3 px-4 py-3.5 sm:flex-row sm:items-center sm:gap-4 sm:px-5"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link
                      href={`/admin/email-templates/${t.id}/edit`}
                      className="font-sans text-[15px] font-semibold text-ink no-underline hover:text-green"
                    >
                      {t.name}
                    </Link>
                    <StatusBadge status={t.is_system ? "published" : "draft"} />
                    {!t.is_active && <StatusBadge status="hidden" />}
                  </div>
                  <div className="mt-0.5 truncate text-[12.5px] text-muted">
                    <span className="font-mono text-[12px]">{t.slug}</span>
                    {" · "}
                    {t.subject}
                  </div>
                  <div className="mt-0.5 text-[12px] text-muted-light">
                    {t.is_system ? "System" : "Custom"}
                    {t.is_system ? " · editable, not deletable" : ""}
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2 sm:shrink-0">
                  <Link
                    href={`/admin/email-templates/${t.id}/edit`}
                    className="rounded-lg border border-ink/15 px-3.5 py-2 font-sans text-[13px] font-semibold text-ink no-underline hover:border-green hover:text-green"
                  >
                    Edit
                  </Link>
                  {!t.is_system && <DeleteTemplateButton id={t.id} name={t.name} />}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Card className="!p-0">
        <div className="border-b border-ink/[0.06] px-5 py-3">
          <h2 className="m-0 font-serif text-[18px] font-semibold text-ink">Recent emails</h2>
          <p className="m-0 mt-1 text-[12.5px] text-muted">Last 25 send attempts</p>
        </div>
        {log.length === 0 ? (
          <div className="px-5 py-8 text-center text-[14px] text-muted">
            No emails sent yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left">
              <thead>
                <tr className="border-b border-ink/[0.06] text-[12px] font-semibold uppercase tracking-wide text-muted">
                  <th className="px-5 py-2.5">When</th>
                  <th className="px-5 py-2.5">To</th>
                  <th className="px-5 py-2.5">Template</th>
                  <th className="px-5 py-2.5">Subject</th>
                  <th className="px-5 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink/[0.06]">
                {log.map((row) => (
                  <tr key={row.id} className="text-[13.5px]">
                    <td className="whitespace-nowrap px-5 py-3 text-muted">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-3">{row.to_email}</td>
                    <td className="px-5 py-3 font-mono text-[12px] text-muted">
                      {row.template_slug ?? "—"}
                    </td>
                    <td className="max-w-[200px] truncate px-5 py-3">{row.subject}</td>
                    <td className="px-5 py-3">
                      <EmailStatusBadge status={row.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
