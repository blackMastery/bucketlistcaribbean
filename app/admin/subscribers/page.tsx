import { requirePageAccess } from "@/lib/admin";
import { PageHeader, Card, EmptyState } from "@/components/admin/ui";
import { ExportSubscribersButton, SubscriberDelete } from "@/components/admin/LeadControls";
import { getAdminSubscribers } from "@/lib/admin-queries";

export default async function AdminSubscribersPage() {
  await requirePageAccess("subscribers");
  const subscribers = await getAdminSubscribers();
  return (
    <div>
      <PageHeader
        title="Newsletter subscribers"
        subtitle={`${subscribers.length} subscriber${subscribers.length === 1 ? "" : "s"}`}
        action={<ExportSubscribersButton rows={subscribers} />}
      />
      {subscribers.length === 0 ? (
        <EmptyState icon="at-sign" text="No subscribers yet." />
      ) : (
        <Card className="!p-0">
          <div className="divide-y divide-ink/[0.06]">
            {subscribers.map((s) => (
              <div key={s.id} className="flex items-center gap-4 px-5 py-3">
                <span className="min-w-0 flex-1 truncate font-body text-[14px] text-ink">{s.email}</span>
                <span className="text-[12.5px] text-muted">{new Date(s.created_at).toLocaleDateString()}</span>
                <SubscriberDelete id={s.id} />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
