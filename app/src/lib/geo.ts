import 'server-only';
import { headers } from 'next/headers';

/** Best guess of the visitor's country (Vercel sets x-vercel-ip-country), used only as a default. */
export async function guessCountry(locale: string): Promise<string> {
  const h = await headers();
  const fromEdge = h.get('x-vercel-ip-country');
  if (fromEdge && /^[A-Z]{2}$/.test(fromEdge)) return fromEdge;
  return locale === 'fr' ? 'FR' : 'US';
}
