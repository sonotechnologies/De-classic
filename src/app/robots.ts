import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/seo";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: "*", allow: "/", disallow: ["/admin", "/api", "/b/", "/book/sent"] }],
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
