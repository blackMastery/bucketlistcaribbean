import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isCurrentUserAdmin } from "@/lib/admin";
import { SignOutButton } from "@/components/SignOutButton";
import {
  AccountSidebar,
  AccountMobileNav,
} from "@/components/account/AccountSidebar";
import { ClaimGuestBookingsOnMount } from "@/components/account/ClaimGuestBookingsOnMount";

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) redirect("/login");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login?redirect=/account");
  const isAdmin = await isCurrentUserAdmin();

  return (
    <div className="bg-sand">
      <ClaimGuestBookingsOnMount />
      <section className="mx-auto max-w-[1280px] px-8 py-[72px] max-[640px]:px-[22px]">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <span className="font-sans text-[13px] font-semibold uppercase tracking-[2px] text-gold">
              Your Account
            </span>
          </div>
          <SignOutButton />
        </div>

        <AccountMobileNav isAdmin={isAdmin} />

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_1fr]">
          <aside className="hidden lg:block">
            <AccountSidebar isAdmin={isAdmin} />
          </aside>
          <div>{children}</div>
        </div>
      </section>
    </div>
  );
}
