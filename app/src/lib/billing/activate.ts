import 'server-only';
import { ActivationCode } from '@/models/ActivationCode';
import { Subscription } from '@/models/Subscription';
import { decrypt, encrypt, hmac, sha256 } from '../crypto';
import { normalizeCode } from './codes';
import { verifyGumroadLicense } from './gumroad';
import type { LicenseStatus } from './gumroad-status';

const DAY = 86_400_000;

export type ActivationResult =
  | { ok: true; plan: 'monthly' | 'annual' | 'lifetime' | 'manual'; expiresAt: Date | null }
  | { ok: false; error: 'invalid' | 'refunded' | 'ended' | 'payment_failed' | 'already_used' | 'unavailable' };

function statusFields(s: Extract<LicenseStatus, { valid: true }>) {
  return {
    plan: s.plan,
    status: s.status,
    expiresAt: s.endsAt,
    external: { productId: undefined as string | undefined, saleId: s.saleId, subscriptionId: s.subscriptionId, email: s.email },
    lastCheckedAt: new Date(),
  };
}

/** Links a Gumroad license key to a user after verifying it with Gumroad's API. */
export async function activateLicense(userId: string, rawKey: string, { incrementUses = true } = {}): Promise<ActivationResult> {
  const key = rawKey.trim();
  if (!/^[A-Za-z0-9-]{16,64}$/.test(key)) return { ok: false, error: 'invalid' };

  let status: LicenseStatus;
  try {
    status = await verifyGumroadLicense(key, { incrementUses });
  } catch {
    return { ok: false, error: 'unavailable' };
  }
  if (!status.valid) return { ok: false, error: status.reason === 'not_found' || status.reason === 'wrong_product' ? 'invalid' : status.reason };

  const keyHash = sha256(key);
  const fields = statusFields(status);
  // Atomic claim: the filter includes the user, so a key already linked to another account never
  // matches and the upsert hits the unique index on licenseKeyHash instead of re-assigning the key.
  // (A separate "find then update" let two accounts activating the same key at once both succeed.)
  try {
    await Subscription.updateOne(
      { licenseKeyHash: keyHash, userId },
      { $set: { ...fields, provider: 'gumroad', licenseKeyEnc: encrypt(key) }, $setOnInsert: { startsAt: new Date() } },
      { upsert: true },
    );
  } catch (e) {
    if ((e as { code?: number }).code === 11000) return { ok: false, error: 'already_used' };
    throw e;
  }
  return { ok: true, plan: status.plan, expiresAt: status.endsAt };
}

/**
 * Re-verifies a Gumroad subscription (cancellation, failed payment, refund).
 * Only an explicit answer from Gumroad removes access: network/server errors throw (state kept),
 * and "unknown key / other product" — which for a key that was valid at activation points to a
 * configuration problem (product ID changed or missing), not to a refund — keeps the current state.
 */
export async function recheckSubscription(subscriptionId: string): Promise<void> {
  const sub = await Subscription.findById(subscriptionId).select('+licenseKeyEnc');
  if (!sub || sub.provider !== 'gumroad' || !sub.licenseKeyEnc) return;
  const status = await verifyGumroadLicense(decrypt(sub.licenseKeyEnc));
  if (status.valid) {
    Object.assign(sub, statusFields(status));
  } else if (status.reason === 'not_found' || status.reason === 'wrong_product') {
    console.warn(`[billing] Gumroad no longer recognises the key of subscription ${subscriptionId} (${status.reason}); access unchanged — check GUMROAD_PRODUCT_ID_*`);
    sub.lastCheckedAt = new Date();
  } else {
    sub.status = status.reason === 'refunded' ? 'refunded' : 'expired';
    sub.lastCheckedAt = new Date();
  }
  await sub.save();
}

/** Redeems a manual activation code (sold through WhatsApp). Each code works once. */
export async function redeemCode(userId: string, rawCode: string): Promise<ActivationResult> {
  const code = normalizeCode(rawCode);
  if (!code) return { ok: false, error: 'invalid' };
  // Atomic claim: two people typing the same code at the same time can't both succeed
  const claimed = await ActivationCode.findOneAndUpdate(
    { codeHash: hmac(code), usedBy: { $exists: false }, revokedAt: { $exists: false } },
    { $set: { usedBy: userId, usedAt: new Date() } },
    { returnDocument: 'after' },
  ).lean();
  if (!claimed) {
    const known = await ActivationCode.exists({ codeHash: hmac(code) });
    return { ok: false, error: known ? 'already_used' : 'invalid' };
  }

  const now = new Date();
  const current = await Subscription.findOne({ userId, provider: 'manual', status: { $in: ['active', 'cancelled'] } }).sort({ expiresAt: -1 });
  const lifetime = claimed.durationDays === null || claimed.durationDays === undefined;
  if (current && (current.expiresAt === null || !current.expiresAt)) return { ok: true, plan: 'manual', expiresAt: null };

  const from = current?.expiresAt && current.expiresAt > now ? current.expiresAt : now;
  const expiresAt = lifetime ? null : new Date(from.getTime() + claimed.durationDays! * DAY);
  if (current) {
    current.expiresAt = expiresAt;
    current.status = 'active';
    current.activationCodeId = String(claimed._id);
    current.remindersSent = [];
    await current.save();
  } else {
    await Subscription.create({ userId, plan: 'manual', provider: 'manual', status: 'active', expiresAt, activationCodeId: String(claimed._id) });
  }
  return { ok: true, plan: 'manual', expiresAt };
}
