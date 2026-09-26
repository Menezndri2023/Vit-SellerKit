import 'server-only';
import { headers } from 'next/headers';

/**
 * Public origin of the current request (works on preview deployments and custom domains).
 * Falls back to the configured site URL outside a request.
 */
export async function siteUrl(): Promise<string> {
  try {
    const h = await headers();
    const host = h.get('x-forwarded-host') ?? h.get('host');
    if (host) {
      const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') || host.startsWith('127.') ? 'http' : 'https');
      return `${proto}://${host}`;
    }
  } catch {
    // outside a request (scripts, cron)
  }
  return (process.env.SITE_URL ?? process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
}
