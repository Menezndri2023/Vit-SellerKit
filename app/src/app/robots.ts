import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

const site = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

// Private areas are also noindex; robots.txt only saves crawl budget. Pages that must be *seen*
// as noindex (sign-in, activate) are not blocked here, otherwise crawlers can't read the tag.
const PRIVATE = ['/app', '/admin', '/d/'];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/api/', ...routing.locales.flatMap((l) => PRIVATE.map((p) => `/${l}${p}`))] },
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
