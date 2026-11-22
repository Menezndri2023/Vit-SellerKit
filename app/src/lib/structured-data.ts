import { PRODUCT_NAME, PUBLISHER_NAME } from './brand';

/**
 * Schema.org data for the home page. Only facts shown on the page: publisher = VIT GLOBAL
 * TECHNOLOGIES GROUP, software = Margokit, offers = the prices of the pricing section (USD).
 * No rating/review markup (self-served reviews are not eligible and must not be invented),
 * no FAQPage (Google limits FAQ rich results to authoritative government/health sites).
 */
export function homeJsonLd({ site, locale, description, publisherUrl, annualUsd = null }: { site: string; locale: string; description: string; publisherUrl: string | null; annualUsd?: number | null }) {
  const orgId = `${site}/#publisher`;
  return {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Organization', '@id': orgId, name: PUBLISHER_NAME, ...(publisherUrl ? { url: publisherUrl } : {}), ...(process.env.PUBLISHER_EMAIL ? { email: process.env.PUBLISHER_EMAIL } : {}) },
      { '@type': 'WebSite', '@id': `${site}/#website`, url: site, name: PRODUCT_NAME, inLanguage: ['en', 'fr', 'ar'], publisher: { '@id': orgId } },
      {
        '@type': 'SoftwareApplication',
        name: PRODUCT_NAME,
        url: `${site}/${locale}`,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description,
        inLanguage: locale,
        publisher: { '@id': orgId },
        offers: [
          { '@type': 'Offer', name: 'Free', price: '0', priceCurrency: 'USD' },
          { '@type': 'Offer', name: 'Pro Monthly', price: '5', priceCurrency: 'USD' },
          ...(annualUsd ? [{ '@type': 'Offer', name: 'Pro Annual', price: String(annualUsd), priceCurrency: 'USD' }] : []),
          { '@type': 'Offer', name: 'Pro Lifetime', price: '99', priceCurrency: 'USD' },
        ],
      },
    ],
  };
}

/** Serialises JSON-LD safely inside a <script> tag (no "</script>" breakout). */
export const jsonLdString = (data: unknown) => JSON.stringify(data).replace(/</g, '\\u003c');
