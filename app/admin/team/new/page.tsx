import { requirePageAccess } from "@/lib/admin";
import Link from "next/link";
import { PageHeader, Card } from "@/components/admin/ui";
import { TeamForm } from "@/components/admin/EntityForms";

export default async function NewTeamMemberPage() {
  await requirePageAccess("team");
  return (
    <div>
      <Link href="/admin/team" className="mb-4 inline-block font-sans text-[13px] font-semibold text-green no-underline">
        ← Team
      </Link>
      <PageHeader title="New team member" />
      <Card>
        <TeamForm mode="new" />
      </Card>
    </div>
  );
}
