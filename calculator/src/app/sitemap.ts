import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  const languages = Object.fromEntries(routing.locales.map((l) => [l, `${site}/${l}`]));
  return routing.locales.map((locale) => ({
    url: `${site}/${locale}`,
    lastModified: new Date(),
    changeFrequency: 'monthly',
    priority: 1,
    alternates: { languages },
  }));
}
