import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

/**
 * robots.txt — crawlers and sitemap location.
 * Dashboard routes are disallowed (auth-gated; avoid indexing private UI).
 */
export default function robots(): MetadataRoute.Robots {
  const base = getSiteUrl();

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard/"],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
