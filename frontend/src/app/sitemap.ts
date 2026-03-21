<<<<<<< HEAD
import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site-url";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = getSiteUrl();
  const now = new Date();

  return [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/login`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${base}/register`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.6,
    },
  ];
=======
import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://repolens.live';

  const routes = [
    '',
    '/login',
    '/register',
    '/dashboard',
    '/dashboard/analysis',
    '/dashboard/billing',
    '/dashboard/history',
    '/dashboard/repositories',
    '/dashboard/settings',
    '/dashboard/feedback',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: route === '' ? 1 : 0.8,
  }));
>>>>>>> 647ca3acb61a26f7b7c203fc75619c948eef87eb
}
