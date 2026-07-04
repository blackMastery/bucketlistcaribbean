// Central SEO helpers: site config, URL resolution, per-page metadata builder,
// and JSON-LD structured-data builders. Brand copy is resolved from site_content
// (key "seo") merged with business_contact and social_links.
import { cache } from "react";
import type { Metadata } from "next";
import type { TourDetail } from "@/lib/queries";
import { getSiteContent } from "@/lib/queries";
import { getCurrentSite, getCurrentSiteSlug, getSiteDomain } from "@/lib/site";
import {
  getDefaultsForSite,
  resolveBlock,
  resolveList,
  type SeoContent,
} from "@/lib/site-content";

export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
  getSiteDomain(getCurrentSiteSlug());

export const OG_IMAGE_PATH = "/opengraph-image";

export type SeoConfig = {
  name: string;
  shortName: string;
  description: string;
  defaultTitle: string;
  titleTemplate: string;
  locale: string;
  keywords: string[];
  email: string;
  phone: string;
  sameAs: string[];
  url: string;
};

function toSeoConfig(
  seo: SeoContent,
  contact: { email: string; phone: string },
  sameAs: string[],
  url: string,
): SeoConfig {
  const site = getCurrentSite();
  return {
    name: seo.name || site.name,
    shortName: seo.short_name,
    description: seo.description,
    defaultTitle: seo.default_title,
    titleTemplate: seo.title_template,
    locale: seo.locale,
    keywords: seo.keywords,
    email: contact.email,
    phone: contact.phone,
    sameAs,
    url,
  };
}

/** Resolve SEO config from a site_content map (sync — uses code defaults for missing keys). */
export function resolveSeoConfig(content: Record<string, unknown> = {}): SeoConfig {
  const defaults = getDefaultsForSite();
  const seo = resolveBlock(content, "seo", defaults.seo);
  const contact = resolveBlock(content, "business_contact", defaults.business_contact);
  const social = resolveList(content, "social_links", defaults.social_links);
  const sameAs = social.map((s) => s.href).filter((href) => href && href !== "#");
  return toSeoConfig(seo, contact, sameAs, SITE_URL);
}

/** Load SEO config from site_content (deduped per request via React cache). */
export const getSeoConfig = cache(async (): Promise<SeoConfig> => {
  const content = await getSiteContent();
  return resolveSeoConfig(content);
});

const STATIC_SITE = resolveSeoConfig({});

/** @deprecated Prefer `getSeoConfig()` — kept for sync call sites that use code defaults. */
export const SITE = {
  name: STATIC_SITE.name,
  shortName: STATIC_SITE.shortName,
  description: STATIC_SITE.description,
  locale: STATIC_SITE.locale,
  email: STATIC_SITE.email,
  phone: STATIC_SITE.phone,
  sameAs: STATIC_SITE.sameAs,
} as const;

/** @deprecated Prefer `getSeoConfig()` — kept for sync call sites that use code defaults. */
export const DEFAULT_TITLE = STATIC_SITE.defaultTitle;

/** Resolve a path (or pass through an already-absolute URL) to an absolute URL. */
export function absoluteUrl(path = "/", baseUrl = SITE_URL): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
}

type OgType = "website" | "article";

type BuildMetadataOpts = {
  title?: string;
  description?: string;
  /** Route path beginning with "/" — used for canonical + OG url. */
  path: string;
  /** Absolute image URL (e.g. a tour photo). Omit to use the site-wide OG fallback. */
  image?: string | null;
  type?: OgType;
  noIndex?: boolean;
  site?: SeoConfig;
};

/**
 * Build a page Metadata object with canonical URL, Open Graph, and Twitter card.
 * When `image` is omitted the file-based app/opengraph-image is used as the
 * social-share fallback.
 */
export function buildMetadata({
  title,
  description,
  path,
  image,
  type = "website",
  noIndex = false,
  site = STATIC_SITE,
}: BuildMetadataOpts): Metadata {
  const url = absoluteUrl(path, site.url);
  const desc = description ?? site.description;
  const fullTitle = title ? `${title} · ${site.name}` : site.defaultTitle;
  const ogImageUrl = image || absoluteUrl(OG_IMAGE_PATH, site.url);
  const images = image
    ? [{ url: image }]
    : [{ url: ogImageUrl, width: 1200, height: 630, alt: site.name }];

  return {
    title,
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description: desc,
      url,
      siteName: site.name,
      locale: site.locale,
      type,
      images,
    } as Metadata["openGraph"],
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description: desc,
      images: [ogImageUrl],
    },
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
  };
}

/** Async wrapper — loads live site_content before building page metadata. */
export async function buildPageMetadata(
  opts: Omit<BuildMetadataOpts, "site">,
): Promise<Metadata> {
  const site = await getSeoConfig();
  return buildMetadata({ ...opts, site });
}

/** Root layout metadata (icons, manifest, robots) from live site_content. */
export function buildRootMetadata(site: SeoConfig): Metadata {
  return {
    metadataBase: new URL(site.url),
    title: {
      default: site.defaultTitle,
      template: site.titleTemplate,
    },
    description: site.description,
    applicationName: site.name,
    manifest: "/site.webmanifest",
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "any" },
        { url: "/favicon-32x32.png", type: "image/png", sizes: "32x32" },
        { url: "/favicon-16x16.png", type: "image/png", sizes: "16x16" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
    },
    keywords: site.keywords,
    openGraph: {
      type: "website",
      siteName: site.name,
      locale: site.locale,
      url: site.url,
      title: site.defaultTitle,
      description: site.description,
      images: [{ url: OG_IMAGE_PATH, width: 1200, height: 630, alt: site.name }],
    },
    twitter: {
      card: "summary_large_image",
      title: site.defaultTitle,
      description: site.description,
      images: [OG_IMAGE_PATH],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
        "max-video-preview": -1,
      },
    },
  };
}

// --- JSON-LD structured data ----------------------------------------------

type JsonLd = Record<string, unknown>;

export function organizationJsonLd(site: SeoConfig = STATIC_SITE): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${site.url}/#organization`,
    name: site.name,
    url: site.url,
    logo: absoluteUrl("/icon", site.url),
    image: absoluteUrl("/opengraph-image", site.url),
    description: site.description,
    email: site.email,
    telephone: site.phone,
    areaServed:
      getCurrentSiteSlug() === "bucketlist" ? ["Guyana", "Caribbean"] : "Caribbean",
    ...(site.sameAs.length ? { sameAs: site.sameAs } : {}),
  };
}

export function websiteJsonLd(site: SeoConfig = STATIC_SITE): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${site.url}/#website`,
    name: site.name,
    url: site.url,
    description: site.description,
    publisher: { "@id": `${site.url}/#organization` },
  };
}

export function tourJsonLd(tour: TourDetail, site: SeoConfig = STATIC_SITE): JsonLd {
  const url = absoluteUrl(`/tours/${tour.slug}`, site.url);
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: tour.title,
    description: tour.overview ?? site.description,
    image: tour.card_image_url,
    url,
    category: "Travel",
    brand: { "@type": "Brand", name: site.name },
  };

  if (tour.price_cents > 0) {
    data.offers = {
      "@type": "Offer",
      price: (tour.price_cents / 100).toFixed(2),
      priceCurrency: "GYD",
      availability: "https://schema.org/InStock",
      url,
    };
  }

  if (tour.reviews_count > 0 && tour.rating > 0) {
    data.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: tour.rating.toFixed(1),
      reviewCount: tour.reviews_count,
      bestRating: "5",
      worstRating: "1",
    };
  }

  return data;
}

export function breadcrumbJsonLd(
  items: { name: string; path: string }[],
  site: SeoConfig = STATIC_SITE,
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path, site.url),
    })),
  };
}
