// Types, defaults, and merge helpers for site_content jsonb blocks.

import { getCurrentSiteSlug, type SiteSlug } from "@/lib/site";

export type PageHeroContent = {
  eyebrow: string;
  headline: string;
  description: string;
};

export type BusinessContact = {
  phone: string;
  phone_href: string;
  email: string;
  whatsapp_href: string;
  whatsapp_label: string;
  whatsapp_short_label: string;
  whatsapp_footer_label: string;
  office: string;
  address_line1: string;
  address_line2: string;
  map_label: string;
  hours: string;
};

export type SocialLink = {
  label: string;
  icon: string;
  href: string;
};

export type FooterContent = {
  tagline: string;
  copyright: string;
  terms_label: string;
  terms_href: string;
  privacy_label: string;
  privacy_href: string;
  sitemap_label: string;
  sitemap_href: string;
};

export type ContactPageContent = PageHeroContent & {
  info_heading: string;
  hours_heading: string;
};

export type AboutPageContent = {
  hero_eyebrow: string;
  hero_headline: string;
  hero_description: string;
  story_eyebrow: string;
  story_headline: string;
  story_p1: string;
  story_p2: string;
  values_eyebrow: string;
  values_headline: string;
  team_eyebrow: string;
  team_headline: string;
  certs_label: string;
};

export type DestinationsPageContent = {
  hero_eyebrow: string;
  hero_headline: string;
  hero_description: string;
  grid_headline: string;
  cta_headline: string;
  cta_description: string;
  cta_label: string;
  cta_href: string;
};

export type ToursPageContent = PageHeroContent;

export type HomeSectionContent = {
  eyebrow: string;
  headline: string;
  description?: string;
  cta_label?: string;
  cta_href?: string;
  link_label?: string;
  link_href?: string;
};

export const DEFAULT_BUSINESS_CONTACT: BusinessContact = {
  phone: "+1 246 000 0000",
  phone_href: "tel:+12460000000",
  email: "hello@mistatravel.com",
  whatsapp_href: "https://wa.me/12460000000",
  whatsapp_label: "Message us anytime",
  whatsapp_short_label: "WhatsApp us",
  whatsapp_footer_label: "WhatsApp: Message us",
  office: "Hastings Main Road, Christ Church, Barbados",
  address_line1: "Hastings Main Road, Christ Church",
  address_line2: "Barbados, Caribbean",
  map_label: "Hastings, Christ Church · Barbados",
  hours: "Mon–Fri · 8:00 AM – 7:00 PM\nSaturday · 9:00 AM – 4:00 PM\nSunday · By appointment",
};

export const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  { label: "Instagram", icon: "instagram", href: "#" },
  { label: "Facebook", icon: "facebook", href: "#" },
  { label: "TripAdvisor", icon: "map-pin", href: "#" },
];

export const DEFAULT_FOOTER: FooterContent = {
  tagline:
    "Bespoke luxury journeys across the Caribbean — from the Pitons of St. Lucia to the cays of the Bahamas, crafted by islanders who know every hidden cove.",
  copyright: "© 2026 Mista Concierge Travel. All rights reserved.",
  terms_label: "Terms",
  terms_href: "#",
  privacy_label: "Privacy",
  privacy_href: "#",
  sitemap_label: "Sitemap",
  sitemap_href: "#",
};

export const DEFAULT_CONTACT_PAGE: ContactPageContent = {
  eyebrow: "Contact Us",
  headline: "Let's plan your escape",
  description:
    "Tell us your dream and our concierge team will design it. We respond within 24 hours.",
  info_heading: "Get in touch",
  hours_heading: "Hours of operation",
};

export const DEFAULT_ABOUT_PAGE: AboutPageContent = {
  hero_eyebrow: "About Us",
  hero_headline: "Your gateway to unforgettable Caribbean experiences",
  hero_description:
    "We don't sell trips. We craft the journeys you'll talk about for the rest of your life.",
  story_eyebrow: "Our Story",
  story_headline: "Born on the islands, built for travelers",
  story_p1:
    "Mista Concierge Travel began in 2014 with a simple belief: the Caribbean deserves to be experienced, not just visited. Founder Marcus \"Mista\" Alleyne grew up sailing between the islands, and watched too many visitors leave having seen only a resort wall.",
  story_p2:
    "Today our team of islanders crafts bespoke journeys across fifteen destinations — opening doors to private chefs, hidden coves and family-run estates that no booking site can reach. Every itinerary is one of one.",
  values_eyebrow: "What We Stand For",
  values_headline: "Our core values",
  team_eyebrow: "The People",
  team_headline: "Meet our team",
  certs_label: "Trusted & Recognized",
};

export const DEFAULT_DESTINATIONS_PAGE: DestinationsPageContent = {
  hero_eyebrow: "Where We Go",
  hero_headline: "Discover the Caribbean's finest islands",
  hero_description:
    "Six signature destinations, each with its own rhythm. Find the one that calls to you — then let us craft the journey around it.",
  grid_headline: "Every island, beautifully covered",
  cta_headline: "Can't decide? Let us help.",
  cta_description:
    "Tell us how you like to travel and our concierge team will match you to the perfect island and itinerary.",
  cta_label: "Plan My Journey",
  cta_href: "/contact",
};

export const DEFAULT_TOURS_PAGE: ToursPageContent = {
  eyebrow: "Tours & Experiences",
  headline: "All Tours & Experiences",
  description:
    "Handcrafted journeys across the Caribbean's most beautiful islands. Filter to find the escape that fits you.",
};

export const DEFAULT_HOME_FEATURED_TOURS: HomeSectionContent = {
  eyebrow: "Curated Experiences",
  headline: "Featured Tours",
  description:
    "Our most-loved journeys, each one a seamless blend of wild adventure and quiet luxury.",
  cta_label: "View All Tours",
  cta_href: "/tours",
};

export const DEFAULT_HOME_WHY_CHOOSE: HomeSectionContent = {
  eyebrow: "The Mista Difference",
  headline: "Why Choose Mista Concierge",
};

export const DEFAULT_HOME_DESTINATIONS: HomeSectionContent = {
  eyebrow: "Where We Go",
  headline: "Discover the islands",
  link_label: "All destinations →",
  link_href: "/destinations",
};

export const DEFAULT_HOME_TESTIMONIALS: HomeSectionContent = {
  eyebrow: "Traveler Stories",
  headline: "Loved by adventurers worldwide",
};

export function resolveBlock<T extends object>(
  content: Record<string, unknown>,
  key: string,
  defaults: T,
): T {
  return { ...defaults, ...(content[key] as Partial<T> | undefined) };
}

export function resolveList<T>(
  content: Record<string, unknown>,
  key: string,
  defaults: T[],
): T[] {
  const stored = content[key] as T[] | undefined;
  return stored?.length ? stored : defaults;
}

export type SiteContentDefaults = {
  business_contact: BusinessContact;
  social_links: SocialLink[];
  footer: FooterContent;
  contact_page: ContactPageContent;
  about_page: AboutPageContent;
  destinations_page: DestinationsPageContent;
  tours_page: ToursPageContent;
  home_featured_tours: HomeSectionContent;
  home_why_choose: HomeSectionContent;
  home_destinations: HomeSectionContent;
  home_testimonials: HomeSectionContent;
};

const BUCKETLIST_FOOTER: FooterContent = {
  ...DEFAULT_FOOTER,
  copyright: "© 2026 Bucketlist Vacation. All rights reserved.",
};

const BUCKETLIST_HOME_WHY_CHOOSE: HomeSectionContent = {
  eyebrow: "The Bucketlist Difference",
  headline: "Why Choose Bucketlist Vacation",
};

const MISTA_DEFAULTS: SiteContentDefaults = {
  business_contact: DEFAULT_BUSINESS_CONTACT,
  social_links: DEFAULT_SOCIAL_LINKS,
  footer: DEFAULT_FOOTER,
  contact_page: DEFAULT_CONTACT_PAGE,
  about_page: DEFAULT_ABOUT_PAGE,
  destinations_page: DEFAULT_DESTINATIONS_PAGE,
  tours_page: DEFAULT_TOURS_PAGE,
  home_featured_tours: DEFAULT_HOME_FEATURED_TOURS,
  home_why_choose: DEFAULT_HOME_WHY_CHOOSE,
  home_destinations: DEFAULT_HOME_DESTINATIONS,
  home_testimonials: DEFAULT_HOME_TESTIMONIALS,
};

const BUCKETLIST_DEFAULTS: SiteContentDefaults = {
  ...MISTA_DEFAULTS,
  footer: BUCKETLIST_FOOTER,
  home_why_choose: BUCKETLIST_HOME_WHY_CHOOSE,
};

export function getDefaultsForSite(slug?: SiteSlug): SiteContentDefaults {
  const resolved = slug ?? getCurrentSiteSlug();
  return resolved === "bucketlist" ? BUCKETLIST_DEFAULTS : MISTA_DEFAULTS;
}

export type ContactChannel = {
  icon: string;
  label: string;
  value: string;
  href: string;
};

export function contactChannels(biz: BusinessContact): ContactChannel[] {
  return [
    { icon: "phone", label: "Phone", value: biz.phone, href: biz.phone_href },
    { icon: "mail", label: "Email", value: biz.email, href: `mailto:${biz.email}` },
    { icon: "message-circle", label: "WhatsApp", value: biz.whatsapp_label, href: biz.whatsapp_href },
    { icon: "map-pin", label: "Office", value: biz.office, href: "#" },
  ];
}
