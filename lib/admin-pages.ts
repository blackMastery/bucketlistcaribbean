// Canonical registry of admin panel sections — the single source of truth for
// both sidebar navigation and page-level permission checks. Keep this module
// pure (no server-only imports) so client components can import it too.
//
// `key` is what gets stored in admin_user_pages.page_key. Nested routes can
// share a key (e.g. /admin/tours and /admin/tours/[id] both map to "tours").

import type { IconName } from "@/components/icons";

export type AdminPage = {
  key: string;
  label: string;
  href: string;
  icon?: IconName;
  superAdminOnly?: boolean;
};

// Dashboard is always allowed for any active admin and is never stored as a grant.
export const DASHBOARD_KEY = "dashboard";

export const ADMIN_PAGES: AdminPage[] = [
  { key: "dashboard", label: "Dashboard", href: "/admin", icon: "layout-dashboard" },
  { key: "tours", label: "Tours", href: "/admin/tours", icon: "sparkles" },
  { key: "destinations", label: "Destinations", href: "/admin/destinations", icon: "map-pin" },
  { key: "testimonials", label: "Testimonials", href: "/admin/testimonials", icon: "quote" },
  { key: "team", label: "Team", href: "/admin/team", icon: "smile" },
  { key: "reviews", label: "Reviews", href: "/admin/reviews", icon: "star" },
  { key: "content", label: "Site Content", href: "/admin/content", icon: "pencil" },
  { key: "bookings", label: "Bookings", href: "/admin/bookings", icon: "compass" },
  { key: "messages", label: "Messages", href: "/admin/messages", icon: "mail" },
  { key: "chatbot", label: "Chatbot", href: "/admin/chatbot", icon: "message-circle" },
  { key: "email-templates", label: "Email templates", href: "/admin/email-templates", icon: "mails" },
  { key: "subscribers", label: "Subscribers", href: "/admin/subscribers", icon: "at-sign" },
  { key: "access", label: "Admins", href: "/admin/access", icon: "users", superAdminOnly: true },
];

// Pages that can be granted to a regular admin: everything except the always-on
// dashboard and any super-admin-only section, de-duped by key.
export const GRANTABLE_PAGES: AdminPage[] = ADMIN_PAGES.filter(
  (page, index, all) =>
    page.key !== DASHBOARD_KEY &&
    !page.superAdminOnly &&
    all.findIndex((p) => p.key === page.key) === index,
);

export const GRANTABLE_KEYS: Set<string> = new Set(
  GRANTABLE_PAGES.map((page) => page.key),
);

export function isSuperAdminOnlyKey(key: string): boolean {
  return ADMIN_PAGES.some((page) => page.key === key && page.superAdminOnly);
}

// Resolve a pathname to its page key by longest matching href prefix, so
// /admin/products/import resolves to the parent section. Dashboard ("/admin")
// is matched on an exact path only, so unknown subpaths don't silently resolve
// to it.
export function resolvePageKey(pathname: string): string | null {
  const match = ADMIN_PAGES.filter((page) => {
    if (page.href === "/admin") return pathname === "/admin";
    return pathname === page.href || pathname.startsWith(page.href + "/");
  }).sort((a, b) => b.href.length - a.href.length)[0];

  return match?.key ?? null;
}
