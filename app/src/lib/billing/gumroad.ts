import 'server-only';
import { evaluateLicense, type GumroadVerifyResponse, type LicenseStatus } from './gumroad-status';

const API = () => (process.env.GUMROAD_API_URL ?? 'https://api.gumroad.com').replace(/\/$/, '');

export const gumroadProducts = () => ({ monthly: process.env.GUMROAD_PRODUCT_ID_MONTHLY, lifetime: process.env.GUMROAD_PRODUCT_ID_LIFETIME });

/** Calls Gumroad's license verification for one product. Throws on network/server errors (never "invalid"). */
async function verifyFor(productId: string, licenseKey: string, incrementUses: boolean): Promise<GumroadVerifyResponse> {
  const res = await fetch(`${API()}/v2/licenses/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ product_id: productId, license_key: licenseKey, increment_uses_count: String(incrementUses) }),
    signal: AbortSignal.timeout(8000),
    cache: 'no-store',
  });
  // Gumroad answers 404 with { success: false } for unknown keys
  if (res.status === 404) return { success: false };
  if (!res.ok) throw new Error(`Gumroad ${res.status}`);
  return (await res.json()) as GumroadVerifyResponse;
}

/** Tries the key against both Margokit Pro products. */
export async function verifyGumroadLicense(licenseKey: string, { incrementUses = false } = {}): Promise<LicenseStatus> {
  const products = gumroadProducts();
  let last: LicenseStatus = { valid: false, reason: 'not_found' };
  for (const productId of [products.monthly, products.lifetime].filter(Boolean) as string[]) {
    const status = evaluateLicense(await verifyFor(productId, licenseKey.trim(), incrementUses), products);
    if (status.valid || status.reason !== 'not_found') return status;
    last = status;
  }
  return last;
}
