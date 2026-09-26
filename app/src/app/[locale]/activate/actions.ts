'use server';

import { refresh } from 'next/cache';
import { activateLicense, redeemCode } from '@/lib/billing/activate';
import { looksLikeCode } from '@/lib/billing/codes';
import { connectDb } from '@/lib/db';
import { clientIp, rateLimit } from '@/lib/rate-limit';
import { actionUser } from '@/lib/session';
import { audit } from '@/models/AuditLog';

export type ActivateState = { ok?: boolean; error?: string };

export async function activate(_prev: ActivateState, form: FormData): Promise<ActivateState> {
  const user = await actionUser();
  const input = String(form.get('key') ?? '').trim().slice(0, 100);
  if (!input) return { error: 'invalid' };
  // Brute-force protection on keys and codes
  const [byUser, byIp] = await Promise.all([rateLimit('activate-user', user.id, 5, 900), rateLimit('activate-ip', await clientIp(), 10, 900)]);
  if (!byUser || !byIp) return { error: 'rateLimited' };

  await connectDb();
  const result = looksLikeCode(input) ? await redeemCode(user.id, input) : await activateLicense(user.id, input);
  await audit({ userId: user.id, actorId: user.id, action: result.ok ? 'plan.activate' : 'plan.activate.failed', targetType: 'user', targetId: user.id, details: { method: looksLikeCode(input) ? 'code' : 'license', ...(result.ok ? { plan: result.plan } : { error: result.error }) } });
  if (!result.ok) return { error: result.error };
  refresh();
  return { ok: true };
}
