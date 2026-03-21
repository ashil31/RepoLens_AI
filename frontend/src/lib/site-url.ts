/**
 * Canonical site origin for metadata, sitemap, and robots.
 * Set NEXT_PUBLIC_SITE_URL on the server to your public origin (e.g. https://repolens.live).
 * If unset at build time, OG/Twitter absolute URLs may be wrong — use env in production.
 */
export function getSiteUrl(): string {
  const fromEnv = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  }
  return "http://localhost:3000";
}
