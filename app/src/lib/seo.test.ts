import { beforeAll, describe, expect, it } from 'vitest';
import { homeJsonLd, jsonLdString } from './structured-data';
import { publisherLine } from './brand';

beforeAll(() => {
  process.env.NEXT_PUBLIC_SITE_URL = 'https://margokit.com';
});

describe('sitemap and robots', () => {
  it('lists only canonical public URLs, with hreflang alternates and no fake dates', async () => {
    const { default: sitemap } = await import('@/app/sitemap');
    const entries = sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls.every((u) => u.startsWith('https://margokit.com/'))).toBe(true);
    expect(new Set(urls).size).toBe(urls.length);
    expect(urls).toContain('https://margokit.com/ar/calculator');
    expect(urls).not.toContain('https://margokit.com/ar/legal/terms'); // canonicalised to /en
    expect(urls.some((u) => /\/(app|admin|activate|login|signup|d)(\/|$)/.test(u))).toBe(false);
    const home = entries.find((e) => e.url === 'https://margokit.com/fr')!;
    expect(home.lastModified).toBeUndefined();
    expect(home.alternates?.languages).toMatchObject({ en: 'https://margokit.com/en', ar: 'https://margokit.com/ar', 'x-default': 'https://margokit.com/en' });
    expect(entries.find((e) => e.url.endsWith('/fr/legal/privacy'))!.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    // Guides: French + English, each with its own slug and real modification date
    const guide = entries.find((e) => e.url === 'https://margokit.com/fr/guides/facture-maroc-mentions-obligatoires')!;
    expect(guide.lastModified).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(guide.alternates?.languages).toMatchObject({ en: 'https://margokit.com/en/guides/morocco-invoice-requirements' });
    expect(urls.some((u) => u.includes('/ar/guides'))).toBe(false);
  });

  it('blocks API and private areas, points to the sitemap', async () => {
    const { default: robots } = await import('@/app/robots');
    const r = robots();
    const rules = Array.isArray(r.rules) ? r.rules[0] : r.rules;
    expect(rules.disallow).toEqual(expect.arrayContaining(['/api/', '/fr/app', '/ar/admin', '/en/d/']));
    expect(rules.disallow).not.toContain('/fr/login'); // must stay crawlable to see its noindex
    expect(r.sitemap).toBe('https://margokit.com/sitemap.xml');
  });
});

describe('structured data and brand', () => {
  it('names VIT GLOBAL TECHNOLOGIES GROUP as publisher of Margokit, without ratings', () => {
    const ld = homeJsonLd({ site: 'https://margokit.com', locale: 'fr', description: 'd', publisherUrl: null });
    const json = jsonLdString(ld);
    expect(json).toContain('"name":"VIT GLOBAL TECHNOLOGIES GROUP"');
    expect(json).toContain('"@type":"SoftwareApplication","name":"Margokit"');
    expect(json).not.toMatch(/aggregateRating|review/i);
    expect(jsonLdString({ x: '</script><script>' })).not.toContain('</script>');
  });
  it('publisher line per language', () => {
    expect(publisherLine('fr')).toBe('Margokit, une solution de VIT GLOBAL TECHNOLOGIES GROUP');
    expect(publisherLine('en')).toBe('Margokit, a VIT GLOBAL TECHNOLOGIES GROUP product');
  });
});
