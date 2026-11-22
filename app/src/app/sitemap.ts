import type { MetadataRoute } from 'next';
import { routing } from '@/i18n/routing';
import { GUIDES } from '@/content/guides';
import { UPDATED as LEGAL_UPDATED } from '@/content/legal';

// Canonical production domain only (never the request host or localhost in production builds)
const site = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

/**
 * Public, indexable pages. Private areas (app, admin, activate, shared documents, sign-in) are
 * noindex and stay out. lastModified is only given where a real change date is known — never
 * "now" on every request, which tells search engines nothing.
 * Legal texts exist in English and French only; /ar/legal/* canonicalises to the English text.
 */
const pages: { path: string; locales: readonly string[]; lastModified?: string }[] = [
  { path: '', locales: routing.locales },
  { path: '/calculator', locales: routing.locales },
  { path: '/reviews', locales: routing.locales },
  { path: '/legal/terms', locales: ['en', 'fr'], lastModified: LEGAL_UPDATED },
  { path: '/legal/privacy', locales: ['en', 'fr'], lastModified: LEGAL_UPDATED },
];

export default function sitemap(): MetadataRoute.Sitemap {
  // Guides: French and English only, each language with its own slug
  const guides = GUIDES.flatMap((g) => {
    const languages = { fr: `${site}/fr/guides/${g.text.fr.slug}`, en: `${site}/en/guides/${g.text.en.slug}`, 'x-default': `${site}/en/guides/${g.text.en.slug}` };
    return (['fr', 'en'] as const).map((l) => ({ url: languages[l], lastModified: g.updated, alternates: { languages } }));
  });
  const index = (['fr', 'en'] as const).map((l) => ({ url: `${site}/${l}/guides`, alternates: { languages: { fr: `${site}/fr/guides`, en: `${site}/en/guides`, 'x-default': `${site}/en/guides` } } }));
  return [...pageEntries(), ...index, ...guides];
}

function pageEntries(): MetadataRoute.Sitemap {
  return pages.flatMap(({ path: page, locales, lastModified }) => {
    const languages = { ...Object.fromEntries(locales.map((l) => [l, `${site}/${l}${page}`])), 'x-default': `${site}/${routing.defaultLocale}${page}` };
    return locales.map((locale) => ({
      url: `${site}/${locale}${page}`,
      ...(lastModified ? { lastModified } : {}),
      alternates: { languages },
    }));
  });
}
