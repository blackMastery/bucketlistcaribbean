import { createClient } from "@/lib/supabase/server";
import { getReferralStats } from "@/lib/account-queries";
import { ReferralPanel } from "@/components/account/ReferralPanel";
import { buildMetadata } from "@/lib/seo";

export const metadata = buildMetadata({
  title: "Refer a Friend",
  description: "Share Mista Concierge Travel with friends.",
  path: "/account/refer",
  noIndex: true,
});

export default async function AccountReferPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const stats = await getReferralStats(user.id);

  return (
    <div>
      <h1 className="m-0 mb-6 font-serif text-[30px] font-bold text-ink">
        Refer a friend
      </h1>
      <ReferralPanel referralCode={stats.referral_code} count={stats.count} />
    </div>
  );
}
