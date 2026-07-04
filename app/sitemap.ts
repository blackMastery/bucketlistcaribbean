import type { MetadataRoute } from "next";
import { getAllTours } from "@/lib/queries";
import { absoluteUrl } from "@/lib/seo";

// Regenerate hourly so newly published tours appear without a full rebuild.
export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/tours"), lastModified: now, changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/destinations"), lastModified: now, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/about"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/contact"), lastModified: now, changeFrequency: "yearly", priority: 0.4 },
  ];

  const tours = await getAllTours();
  const tourRoutes: MetadataRoute.Sitemap = tours.map((tour) => ({
    url: absoluteUrl(`/tours/${tour.slug}`),
    lastModified: tour.created_at ? new Date(tour.created_at) : now,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  return [...staticRoutes, ...tourRoutes];
}
