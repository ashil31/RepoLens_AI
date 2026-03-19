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
}
