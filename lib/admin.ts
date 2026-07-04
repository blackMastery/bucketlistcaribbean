import { cache } from "react";
import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { AdminRole } from "@/lib/database.types";
import { DASHBOARD_KEY, isSuperAdminOnlyKey } from "@/lib/admin-pages";

const hasEnv = !!(
  process.env.NEXT_PUBLIC_SUPABASE_URL &&
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export type { AdminRole };

export type AdminContext = {
  user: User;
  via: "db" | "env-bootstrap";
  role: AdminRole;
  isFullAccess: boolean; // super_admin OR env-bootstrap
  allowedPages: Set<string>; // grants for regular admins (empty/ignored for full access)
};

// Emails treated as full-access super admins before a DB row exists, so the
// first owner is never locked out. Comma-separated in ADMIN_ALLOWED_EMAILS.
function bootstrapEmails(): Set<string> {
  return new Set(
    (process.env.ADMIN_ALLOWED_EMAILS ?? "")
      .split(",")
      .map((email) => email.trim().toLowerCase())
      .filter(Boolean),
  );
}

// Resolve the current admin context for the signed-in user, or null when there
// is no session or the user is not an admin. Wrapped in cache() so the layout
// and the page (via requirePageAccess) share a single auth + DB lookup per request.
export const getAdminContext = cache(async (): Promise<AdminContext | null> => {
  if (!hasEnv) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: adminRow } = await supabase
    .from("admin_users")
    .select("role, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (adminRow?.is_active) {
    const role = adminRow.role as AdminRole;
    if (role === "super_admin") {
      return { user, via: "db", role, isFullAccess: true, allowedPages: new Set() };
    }
    const { data: grants } = await supabase
      .from("admin_user_pages")
      .select("page_key")
      .eq("admin_user_id", user.id);
    return {
      user,
      via: "db",
      role,
      isFullAccess: false,
      allowedPages: new Set((grants ?? []).map((g) => g.page_key)),
    };
  }

  // Bootstrap fallback: env allow-list grants full access until a DB row exists.
  if (user.email && bootstrapEmails().has(user.email.toLowerCase())) {
    return {
      user,
      via: "env-bootstrap",
      role: "super_admin",
      isFullAccess: true,
      allowedPages: new Set(),
    };
  }

  return null;
});

// Returns the signed-in user if they are an admin, otherwise null.
export async function getAdminUser(): Promise<User | null> {
  const ctx = await getAdminContext();
  return ctx?.user ?? null;
}

// Guards admin server components and actions: redirects non-admins away.
export async function requireAdmin(): Promise<AdminContext> {
  if (!hasEnv) redirect("/login?redirect=/admin");
  const ctx = await getAdminContext();
  if (!ctx) {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    // No session → send to login; signed in but not an admin → home.
    redirect(user ? "/" : "/login?redirect=/admin");
  }
  return ctx;
}

// Guards a specific admin section. Full-access admins pass everything; regular
// admins need the matching grant (dashboard is always allowed).
export async function requirePageAccess(pageKey: string): Promise<AdminContext> {
  const ctx = await requireAdmin();
  if (ctx.isFullAccess) return ctx;
  if (isSuperAdminOnlyKey(pageKey)) redirect("/admin?error=forbidden");
  if (pageKey === DASHBOARD_KEY || ctx.allowedPages.has(pageKey)) return ctx;
  redirect("/admin?error=forbidden");
}

// Cheap check for the public Header (no redirect).
export async function isCurrentUserAdmin(): Promise<boolean> {
  return (await getAdminContext()) !== null;
}
