import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';

const site = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const pages = ['', '/calculator', '/legal/terms', '/legal/privacy'];

export default function sitemap(): MetadataRoute.Sitemap {
  return pages.flatMap((page) => {
    const languages = Object.fromEntries(routing.locales.map((l) => [l, `${site}/${l}${page}`]));
    return routing.locales.map((locale) => ({
      url: `${site}/${locale}${page}`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: page === '' ? 1 : 0.8,
      alternates: { languages },
    }));
  });
}
