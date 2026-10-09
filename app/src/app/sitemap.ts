import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
// Legal texts exist in English and French only; /ar/legal/* shows the English text
const pages = [
  { path: '', locales: routing.locales },
  { path: '/calculator', locales: routing.locales },
  { path: '/legal/terms', locales: ['en', 'fr'] },
  { path: '/legal/privacy', locales: ['en', 'fr'] },
] as const;

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.flatMap(({ path: page, locales }) => {
    const languages = Object.fromEntries(locales.map((l) => [l, `${site}/${l}${page}`]));
    return locales.map((locale) => ({
      url: `${site}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: page === '' ? 1 : 0.8,
      alternates: { languages },
    }));
  });
}
