import type { Metadata } from "next";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { requireAdmin } from "@/lib/admin";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Mista Admin" },
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const ctx = await requireAdmin();

  return (
    <div className="min-h-screen bg-sand lg:flex">
      <AdminSidebar
        email={ctx.user.email ?? "admin"}
        isFullAccess={ctx.isFullAccess}
        allowedPages={[...ctx.allowedPages]}
      />
      <div className="min-w-0 flex-1">
        <div className="mx-auto max-w-[1100px] px-6 py-8 max-[640px]:px-4">
          {children}
        </div>
      </div>
    </div>
  );
}
