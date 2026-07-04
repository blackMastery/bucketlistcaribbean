import { Card } from "@/components/admin/ui";

export function AuditInfo({
  createdAt,
  updatedAt,
  createdByLabel,
  modifiedByLabel,
}: {
  createdAt: string;
  updatedAt: string;
  createdByLabel?: string | null;
  modifiedByLabel?: string | null;
}) {
  return (
    <Card>
      <h2 className="m-0 mb-4 font-serif text-[18px] font-semibold text-ink">Audit</h2>
      <dl className="m-0 grid gap-2 text-[13.5px]">
        <div className="flex justify-between gap-4 border-b border-ink/[0.06] py-2">
          <dt className="text-muted">Created</dt>
          <dd className="m-0 text-right text-ink">
            {new Date(createdAt).toLocaleString()}
            {createdByLabel && (
              <span className="block text-[12px] text-muted">by {createdByLabel}</span>
            )}
          </dd>
        </div>
        <div className="flex justify-between gap-4 py-2">
          <dt className="text-muted">Last updated</dt>
          <dd className="m-0 text-right text-ink">
            {new Date(updatedAt).toLocaleString()}
            {modifiedByLabel && (
              <span className="block text-[12px] text-muted">by {modifiedByLabel}</span>
            )}
          </dd>
        </div>
      </dl>
    </Card>
  );
}
