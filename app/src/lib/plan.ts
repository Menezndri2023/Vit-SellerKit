import 'server-only';
import type { ClientSession } from 'mongoose';
import { nextSeq } from '@/models/Counter';
import { Document } from '@/models/Document';
import { Subscription, type SubscriptionDoc } from '@/models/Subscription';
import { recheckSubscription } from './billing/activate';

export const FREE_MONTHLY_LIMIT = 3;
const DAY = 86_400_000;

export type PlanInfo = {
  plan: 'free' | 'pro';
  subscription: (SubscriptionDoc & { _id: unknown }) | null;
  /** Documents issued this calendar month (UTC) */
  used: number;
  limit: number | null;
  expiresAt: Date | null;
  expiringSoon: boolean;
};

const monthStart = () => {
  const n = new Date();
  return new Date(Date.UTC(n.getUTCFullYear(), n.getUTCMonth(), 1));
};

/** Has access now: active or cancelled-but-paid, and not past its end date. */
export const grantsAccess = (s: Pick<SubscriptionDoc, 'status' | 'expiresAt'>, now = new Date()) =>
  (s.status === 'active' || s.status === 'cancelled') && (!s.expiresAt || new Date(s.expiresAt) > now);

export async function getPlan(userId: string): Promise<PlanInfo> {
  const subs = await Subscription.find({ userId, status: { $in: ['active', 'cancelled'] } }).lean();
  // Monthly Gumroad subscriptions are re-verified at most once a day (cancellations, failed payments)
  for (const s of subs) {
    if (s.provider === 'gumroad' && (s.plan === 'monthly' || s.plan === 'annual') && (!s.lastCheckedAt || Date.now() - new Date(s.lastCheckedAt).getTime() > DAY)) {
      await recheckSubscription(String(s._id)).catch(() => undefined);
    }
  }
  const fresh = subs.length ? await Subscription.find({ userId, status: { $in: ['active', 'cancelled'] } }).lean() : [];
  const active = fresh.filter((s) => grantsAccess(s));
  // Prefer no end date (lifetime/renewing), then the latest end date
  active.sort((a, b) => (a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity) - (b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity)).reverse();
  const best = active[0] ?? null;
  const used = await Document.countDocuments({ userId, issuedAt: { $gte: monthStart() } });
  const expiresAt = best?.expiresAt ? new Date(best.expiresAt) : null;
  return {
    plan: best ? 'pro' : 'free',
    subscription: best,
    used,
    limit: best ? null : FREE_MONTHLY_LIMIT,
    expiresAt,
    expiringSoon: Boolean(expiresAt && expiresAt.getTime() - Date.now() < 7 * DAY),
  };
}

/**
 * Free plan, inside the issue transaction: re-counts this month's issued documents and throws
 * PLAN_LIMIT when the quota is used. The per-user monthly counter is written first so that two
 * concurrent issues of the same user conflict (MongoDB write conflict → the transaction retries
 * and then sees the other document): the limit can't be bypassed by issuing several drafts at once.
 */
export async function enforceFreeQuota(userId: string, session: ClientSession, now = new Date()): Promise<void> {
  const start = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
  await nextSeq(`quota:${userId}:${start.toISOString().slice(0, 7)}`, session);
  const used = await Document.countDocuments({ userId, issuedAt: { $gte: start } }).session(session);
  if (used >= FREE_MONTHLY_LIMIT) throw new Error('PLAN_LIMIT');
}

/** Active Pro right now (no network call: for cron jobs and lists). */
export async function hasActivePro(userId: string, now = new Date()): Promise<boolean> {
  return Boolean(await Subscription.exists({ userId, status: { $in: ['active', 'cancelled'] }, $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }));
}

export type PlanCheck = { allowed: boolean; watermark: boolean; used: number; limit: number | null };

/** Free plan: 3 issued documents per month, with the "Made with Margokit" watermark. */
export async function checkIssueAllowed(userId: string): Promise<PlanCheck> {
  const p = await getPlan(userId);
  if (p.plan === 'pro') return { allowed: true, watermark: false, used: p.used, limit: null };
  return { allowed: p.used < FREE_MONTHLY_LIMIT, watermark: true, used: p.used, limit: FREE_MONTHLY_LIMIT };
}
