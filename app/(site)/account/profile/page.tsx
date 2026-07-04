import { createClient } from "@/lib/supabase/server";
import { getAccountProfile } from "@/lib/account-queries";
import type { TravelPreferences } from "@/lib/account";
import { ProfileForm } from "@/components/account/ProfileForm";
import { TravelPreferencesForm } from "@/components/account/TravelPreferencesForm";
import { buildPageMetadata } from "@/lib/seo";

export async function generateMetadata() {
  return buildPageMetadata({
    title: "Profile",
    description: "Manage your profile.",
    path: "/account/profile",
    noIndex: true,
  });
}

export default async function AccountProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const profile = await getAccountProfile(user.id);

  return (
    <div>
      <h1 className="m-0 mb-6 font-serif text-[30px] font-bold text-ink">
        Profile
      </h1>
      <div className="flex flex-col gap-6">
        <ProfileForm
          fullName={profile?.full_name ?? ""}
          phone={profile?.phone ?? ""}
          email={user.email ?? ""}
        />
        <TravelPreferencesForm
          preferences={(profile?.travel_preferences as TravelPreferences | null) ?? null}
        />
      </div>
    </div>
  );
}
