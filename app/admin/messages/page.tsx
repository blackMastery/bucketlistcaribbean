import { requirePageAccess } from "@/lib/admin";
import { PageHeader, Card, EmptyState, StatusBadge } from "@/components/admin/ui";
import { MessageActions } from "@/components/admin/LeadControls";
import { getAdminMessages } from "@/lib/admin-queries";

export default async function AdminMessagesPage() {
  await requirePageAccess("messages");
  const messages = await getAdminMessages();
  return (
    <div>
      <PageHeader title="Messages" subtitle={`${messages.length} contact submissions`} />
      {messages.length === 0 ? (
        <EmptyState icon="mail" text="No messages yet." />
      ) : (
        <div className="flex flex-col gap-3">
          {messages.map((m) => (
            <Card key={m.id} className="!p-5">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-sans text-[15px] font-semibold text-ink">{m.name}</span>
                    <StatusBadge status={m.status} />
                  </div>
                  <div className="mt-0.5 text-[12.5px] text-muted">
                    <a href={`mailto:${m.email}`} className="text-green no-underline">{m.email}</a>
                    {m.phone ? ` · ${m.phone}` : ""}
                    {m.interest ? ` · interested in ${m.interest}` : ""}
                    {" · "}
                    {new Date(m.created_at).toLocaleDateString()}
                  </div>
                  <p className="m-0 mt-2 max-w-[640px] text-[14px] leading-[1.6] text-ink-soft">{m.message}</p>
                </div>
                <MessageActions id={m.id} status={m.status} />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
