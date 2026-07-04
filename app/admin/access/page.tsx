import { requirePageAccess } from "@/lib/admin";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { PageHeader, Card } from "@/components/admin/ui";
import { TeamManager, type AdminMember } from "@/components/admin/TeamManager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Admins" };

export default async function AdminAccessPage() {
  await requirePageAccess("access");

  if (!hasServiceRole) {
    return (
      <div>
        <PageHeader
          title="Admins"
          subtitle="Manage admin accounts and section access."
        />
        <Card>
          <h2 className="m-0 font-serif text-[18px] font-bold text-ink">
            Service role key required
          </h2>
          <p className="mt-2 text-[14px] text-muted">
            Adding and managing admins needs a server-only Supabase service-role
            key. Set <code className="font-mono text-[13px]">SUPABASE_SERVICE_ROLE_KEY</code>{" "}
            in your environment (Project Settings → API), then reload this page.
          </p>
          <p className="mt-2 text-[14px] text-muted">
            To bootstrap your first super admin from SQL, run:
          </p>
          <pre className="mt-2 overflow-x-auto rounded-lg bg-ink/[0.04] p-3 font-mono text-[12.5px] text-ink">
            select make_admin(&apos;you@example.com&apos;, &apos;Your Name&apos;, &apos;super_admin&apos;);
          </pre>
        </Card>
      </div>
    );
  }

  const supabase = createAdminClient();
  const [{ data: users }, { data: grants }] = await Promise.all([
    supabase.from("admin_users").select("*").order("created_at", { ascending: true }),
    supabase.from("admin_user_pages").select("admin_user_id, page_key"),
  ]);

  const grantsByUser = new Map<string, string[]>();
  for (const grant of grants ?? []) {
    const list = grantsByUser.get(grant.admin_user_id) ?? [];
    list.push(grant.page_key);
    grantsByUser.set(grant.admin_user_id, list);
  }

  const members: AdminMember[] = (users ?? []).map((user) => ({
    ...user,
    pages: grantsByUser.get(user.id) ?? [],
  }));

  return (
    <div>
      <PageHeader
        title="Admins"
        subtitle={`${members.length} admin${members.length === 1 ? "" : "s"} · roles and section access`}
      />
      <TeamManager members={members} />
    </div>
  );
}
