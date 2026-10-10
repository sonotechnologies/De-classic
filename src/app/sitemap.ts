import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";
import { getPublishedBranches, getVisibleRooms } from "@/lib/site-data";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl();
  const pages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/rooms`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/book`, changeFrequency: "monthly", priority: 0.9 },
    { url: `${base}/bar`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/offers`, changeFrequency: "daily", priority: 0.7 },
    { url: `${base}/gallery`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/locations`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.2 },
  ];
  try {
    const branches = await getPublishedBranches();
    for (const b of branches) pages.push({ url: `${base}/locations/${b.slug}`, changeFrequency: "monthly", priority: 0.8 });
    // Room pages are listed for the default branch, which is what /rooms/[slug] serves without a branch cookie.
    if (branches[0]) {
      for (const r of await getVisibleRooms(branches[0].id)) pages.push({ url: `${base}/rooms/${r.slug}`, changeFrequency: "weekly", priority: 0.8 });
    }
  } catch {
    /* database unavailable at build: static pages only */
  }
  return pages;
}
