import { requirePageAccess } from "@/lib/admin";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader, Card } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { TeamForm } from "@/components/admin/EntityForms";
import { getAdminTeamById } from "@/lib/admin-queries";
import { deleteTeamMember } from "@/app/admin/actions";

export default async function EditTeamMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requirePageAccess("team");
  const { id } = await params;
  const member = await getAdminTeamById(id);
  if (!member) notFound();

  return (
    <div>
      <Link href="/admin/team" className="mb-4 inline-block font-sans text-[13px] font-semibold text-green no-underline">
        ← Team
      </Link>
      <PageHeader
        title={member.name}
        action={
          <ConfirmButton
            action={deleteTeamMember.bind(null, member.id)}
            title="Delete team member?"
            confirmText={`${member.name} will be permanently removed from the team page.`}
          />
        }
      />
      <Card>
        <TeamForm mode="edit" member={member} />
      </Card>
    </div>
  );
}
