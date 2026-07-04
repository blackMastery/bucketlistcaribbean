// Central SEO helpers: site config, URL resolution, per-page metadata builder,
// and JSON-LD structured-data builders. Keep page files terse by funneling all
// metadata through buildMetadata() and rendering JSON-LD via <JsonLd>.
import type { Metadata } from "next";
import type { TourDetail } from "@/lib/queries";

const FALLBACK_URL = "https://www.mistaconciergetravel.com";

// Single source of truth for the canonical base URL. Reads the env var first so
// it can be overridden per environment; falls back to the production domain.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") || FALLBACK_URL;

export const DEFAULT_TITLE =
  "Mista Concierge Travel — Luxury Caribbean Journeys";

// Branded social-share fallback, rendered by app/opengraph-image.tsx.
export const OG_IMAGE_PATH = "/opengraph-image";

export const SITE = {
  name: "Mista Concierge Travel",
  shortName: "Mista",
  description:
    "Bespoke luxury journeys across the Caribbean — from the Pitons of St. Lucia to the cays of the Bahamas, crafted by islanders who know every hidden cove.",
  locale: "en_US",
  email: "hello@mistatravel.com",
  phone: "+1 246 000 0000",
  // Social profiles — add URLs here to populate Organization `sameAs`.
  sameAs: [] as string[],
} as const;

/** Resolve a path (or pass through an already-absolute URL) to an absolute URL. */
export function absoluteUrl(path = "/"): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
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
}: BuildMetadataOpts): Metadata {
  const url = absoluteUrl(path);
  const desc = description ?? SITE.description;
  const fullTitle = title ? `${title} · ${SITE.name}` : DEFAULT_TITLE;
  // Per-page image (e.g. a tour photo) or the branded site-wide fallback. A
  // page that sets its own openGraph object does not inherit the file-based
  // opengraph-image, so we always set images explicitly here.
  const ogImageUrl = image || absoluteUrl(OG_IMAGE_PATH);
  const images = image
    ? [{ url: image }]
    : [{ url: ogImageUrl, width: 1200, height: 630, alt: SITE.name }];

  return {
    title,
    description: desc,
    alternates: { canonical: path },
    openGraph: {
      title: fullTitle,
      description: desc,
      url,
      siteName: SITE.name,
      locale: SITE.locale,
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

// --- JSON-LD structured data ----------------------------------------------

type JsonLd = Record<string, unknown>;

export function organizationJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    "@id": `${SITE_URL}/#organization`,
    name: SITE.name,
    url: SITE_URL,
    logo: absoluteUrl("/icon"),
    image: absoluteUrl("/opengraph-image"),
    description: SITE.description,
    email: SITE.email,
    telephone: SITE.phone,
    areaServed: "Caribbean",
    ...(SITE.sameAs.length ? { sameAs: SITE.sameAs } : {}),
  };
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    name: SITE.name,
    url: SITE_URL,
    description: SITE.description,
    publisher: { "@id": `${SITE_URL}/#organization` },
  };
}

export function tourJsonLd(tour: TourDetail): JsonLd {
  const url = absoluteUrl(`/tours/${tour.slug}`);
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: tour.title,
    description: tour.overview ?? SITE.description,
    image: tour.card_image_url,
    url,
    category: "Travel",
    brand: { "@type": "Brand", name: SITE.name },
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

export function breadcrumbJsonLd(items: { name: string; path: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}
