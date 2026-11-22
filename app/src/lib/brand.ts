/**
 * Brand structure: Margokit is a product of VIT GLOBAL TECHNOLOGIES GROUP (the publishing company).
 * Margokit keeps its own name, logo and domain; the parent company is named, never merged in.
 * The legal publisher details (registered name, address) stay in LEGAL_ENTITY / LEGAL_ADDRESS.
 */
export const PRODUCT_NAME = 'Margokit';
export const PUBLISHER_NAME = 'VIT GLOBAL TECHNOLOGIES GROUP';

/** Optional link to the publisher's website (no link shown while it is not configured). */
export const publisherUrl = (): string | null => {
  const url = process.env.PUBLISHER_URL?.trim();
  return url && /^https:\/\//.test(url) ? url : null;
};

/** "Margokit, a VIT GLOBAL TECHNOLOGIES GROUP product" in the page language. */
export function publisherLine(lang: string): string {
  if (lang === 'fr') return `${PRODUCT_NAME}, une solution de ${PUBLISHER_NAME}`;
  if (lang === 'ar') return `${PRODUCT_NAME}، حل من ${PUBLISHER_NAME}`;
  return `${PRODUCT_NAME}, a ${PUBLISHER_NAME} product`;
}
