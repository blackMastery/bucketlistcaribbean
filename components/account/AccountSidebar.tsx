"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Icon, type IconName } from "@/components/icons";

const NAV: { href: string; label: string; icon: IconName }[] = [
  { href: "/account", label: "Overview", icon: "layout-dashboard" },
  { href: "/account/bookings", label: "My trips", icon: "compass" },
  { href: "/account/saved", label: "Saved tours", icon: "heart" },
  { href: "/account/profile", label: "Profile", icon: "users" },
  { href: "/account/refer", label: "Refer a friend", icon: "sparkles" },
  { href: "/account/settings", label: "Settings", icon: "pencil" },
];

const ADMIN_ITEM: { href: string; label: string; icon: IconName } = {
  href: "/admin",
  label: "Admin panel",
  icon: "shield",
};

function isActive(pathname: string, href: string) {
  if (href === "/account") return pathname === "/account";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AccountSidebar({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? [...NAV, ADMIN_ITEM] : NAV;

  return (
    <nav className="flex flex-col gap-1">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 font-sans text-[14px] font-medium no-underline transition-colors ${
              active
                ? "bg-green/[0.12] text-green"
                : "text-muted hover:bg-white hover:text-ink"
            }`}
          >
            <Icon name={item.icon} size={16} strokeWidth={2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AccountMobileNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const items = isAdmin ? [...NAV, ADMIN_ITEM] : NAV;

  return (
    <div className="mb-6 flex gap-2 overflow-x-auto pb-1 lg:hidden">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`shrink-0 rounded-full px-4 py-2 font-sans text-[13px] font-semibold no-underline ${
              active
                ? "bg-green text-white"
                : "bg-white text-muted shadow-[0_1px_4px_rgba(0,0,0,0.06)]"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </div>
  );
}
