import { requirePageAccess } from "@/lib/admin";
import Link from "next/link";
import Image from "next/image";
import { PageHeader, Card, LinkButton, EmptyState } from "@/components/admin/ui";
import { ConfirmButton } from "@/components/admin/ConfirmButton";
import { getAdminTeam } from "@/lib/admin-queries";
import { deleteTeamMember } from "@/app/admin/actions";

export default async function AdminTeamPage() {
  await requirePageAccess("team");
  const team = await getAdminTeam();
  return (
    <div>
      <PageHeader
        title="Team"
        subtitle={`${team.length} members`}
        action={<LinkButton href="/admin/team/new">+ New member</LinkButton>}
      />
      {team.length === 0 ? (
        <EmptyState icon="smile" text="No team members yet." />
      ) : (
        <Card className="!p-0">
          <div className="divide-y divide-ink/[0.06]">
            {team.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-4 py-3.5 sm:gap-4 sm:px-5">
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-cream">
                  {m.photo_url && <Image src={m.photo_url} alt="" fill className="object-cover" sizes="40px" />}
                </span>
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/team/${m.id}`} className="font-sans text-[15px] font-semibold text-ink no-underline hover:text-green">
                    {m.name}
                  </Link>
                  <div className="mt-0.5 text-[12.5px] text-muted">{m.role}</div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Link href={`/admin/team/${m.id}`} className="rounded-lg border border-ink/15 px-3 py-2 font-sans text-[13px] font-semibold text-ink no-underline hover:border-green hover:text-green">
                    Edit
                  </Link>
                  <ConfirmButton
                    action={deleteTeamMember.bind(null, m.id)}
                    title="Delete team member?"
                    confirmText={`${m.name} will be permanently removed from the team page.`}
                  />
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
