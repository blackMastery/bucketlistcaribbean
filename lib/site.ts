// Site registry for multi-brand frontends sharing one Supabase project.
// Only site_content is scoped per site; catalog and leads data is shared.

export type SiteSlug = "mista" | "bucketlist";

export type SiteConfig = {
  id: string;
  slug: SiteSlug;
  name: string;
  domain: string;
};

export const SITES: readonly SiteConfig[] = [
  {
    id: "a0000000-0000-4000-8000-000000000001",
    slug: "mista",
    name: "Mista Concierge Travel",
    domain: "https://www.mistaconciergetravel.com",
  },
  {
    id: "a0000000-0000-4000-8000-000000000002",
    slug: "bucketlist",
    name: "Bucketlist Vacation",
    domain: "https://www.bucketlistcaribbean.com",
  },
] as const;

export const DEFAULT_SITE_SLUG: SiteSlug = "mista";

export const ADMIN_CONTENT_SITE_COOKIE = "admin_content_site_id";

export function getSiteBySlug(slug: string): SiteConfig | undefined {
  return SITES.find((s) => s.slug === slug);
}

export function getSiteById(id: string): SiteConfig | undefined {
  return SITES.find((s) => s.id === id);
}

export function resolveSiteSlug(raw?: string | null): SiteSlug {
  const slug = raw?.trim().toLowerCase();
  if (slug === "bucketlist") return "bucketlist";
  return "mista";
}

/** Current frontend site from SITE_ID env (defaults to mista). */
export function getCurrentSiteSlug(): SiteSlug {
  return resolveSiteSlug(process.env.SITE_ID);
}

export function getCurrentSiteId(): string {
  return getSiteBySlug(getCurrentSiteSlug())!.id;
}

export function getCurrentSite(): SiteConfig {
  return getSiteBySlug(getCurrentSiteSlug())!;
}

export function getSiteDomain(slug: SiteSlug): string {
  if (slug === "bucketlist") {
    return (
      process.env.BUCKETLIST_SITE_URL?.replace(/\/$/, "") ??
      getSiteBySlug("bucketlist")!.domain
    );
  }
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? getSiteBySlug("mista")!.domain;
}
