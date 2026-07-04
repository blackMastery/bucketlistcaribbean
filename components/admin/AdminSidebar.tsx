"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "@/components/SignOutButton";
import { Icon } from "@/components/icons";
import { ADMIN_PAGES, DASHBOARD_KEY } from "@/lib/admin-pages";

function active(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(href + "/");
}

export function AdminSidebar({
  email,
  isFullAccess,
  allowedPages,
}: {
  email: string;
  isFullAccess: boolean;
  allowedPages: string[];
}) {
  const pathname = usePathname();

  const granted = new Set(allowedPages);
  const seen = new Set<string>();
  const nav = ADMIN_PAGES.filter((page) => {
    if (seen.has(page.key)) return false;
    seen.add(page.key);
    if (page.key === DASHBOARD_KEY) return true;
    if (page.superAdminOnly) return isFullAccess;
    return isFullAccess || granted.has(page.key);
  });

  return (
    <aside className="flex shrink-0 flex-col border-r border-gold/15 bg-[#0A0D0C] lg:h-screen lg:w-[244px] lg:sticky lg:top-0">
      <div className="flex items-center gap-2.5 border-b border-gold/15 px-5 py-[18px]">
        <span className="relative h-9 w-9 overflow-hidden rounded-full border border-gold/60">
          <Image src="/logo-mark.png" alt="Mista" fill className="object-cover" />
        </span>
        <div className="leading-tight">
          <div className="text-gold-gradient font-serif text-[15px] font-bold">
            Mista Admin
          </div>
          <div className="font-sans text-[10px] uppercase tracking-[1.5px] text-[#C9A24A]">
            Content Studio
          </div>
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto px-3 py-3 lg:flex-1 lg:flex-col lg:overflow-y-auto">
        {nav.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`flex shrink-0 items-center gap-2.5 rounded-lg px-3 py-2.5 font-sans text-[13.5px] font-medium no-underline transition-colors ${
              active(pathname, item.href)
                ? "bg-green/20 text-gold-light"
                : "text-[#C9CFCB] hover:bg-white/[0.05] hover:text-sand"
            }`}
          >
            <span className="flex w-4 shrink-0 items-center justify-center text-gold">
              {item.icon && <Icon name={item.icon} size={15} strokeWidth={2} />}
            </span>
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="border-t border-gold/15 px-4 py-4">
        <div className="mb-3 truncate font-sans text-[12px] text-[#9AA39E]" title={email}>
          {email}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1 rounded-lg border border-gold/30 px-3 py-2 font-sans text-[12.5px] font-semibold text-gold-light no-underline transition-colors hover:bg-gold hover:text-[#0A0D0C]"
          >
            View site <Icon name="external-link" size={13} />
          </Link>
          <SignOutButton />
        </div>
      </div>
    </aside>
  );
}
