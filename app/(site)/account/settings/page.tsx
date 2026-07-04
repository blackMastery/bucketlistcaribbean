import { createClient } from "@/lib/supabase/server";
import { AccountSettingsForm } from "@/components/account/AccountSettingsForm";
import { hasServiceRole } from "@/lib/supabase/admin";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Account Settings",
  description: "Manage your Mista Concierge Travel account settings.",
  path: "/account/settings",
  noIndex: true,
});

export default async function AccountSettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  return (
    <div>
      <h1 className="m-0 mb-6 font-serif text-[30px] font-bold text-ink">
        Settings
      </h1>
      <AccountSettingsForm email={user.email ?? ""} canDelete={hasServiceRole} />
    </div>
  );
}
