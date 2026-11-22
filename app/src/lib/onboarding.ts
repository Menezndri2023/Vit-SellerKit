import 'server-only';
import { ObjectId } from 'mongodb';
import { hmac, safeEqual } from './crypto';
import { mongoClient } from './db';
import { onboardingEmail, sendEmail, type OnboardingKind } from './email';
import { Document } from '@/models/Document';
import { Subscription } from '@/models/Subscription';

const DAY = 86_400_000;

/** The series: day after sign-up, and the condition for sending (nothing is sent twice). */
export const ONBOARDING: { kind: OnboardingKind; day: number; when: (f: { issued: boolean; pro: boolean }) => boolean }[] = [
  { kind: 'first', day: 1, when: (f) => !f.issued },
  { kind: 'share', day: 4, when: () => true },
  { kind: 'pro', day: 8, when: (f) => !f.pro },
];
/** An email is only sent within this many days after its due day (no retroactive series for old accounts). */
const GRACE_DAYS = 3;

type UserRow = { _id: unknown; email?: string; emailVerified?: boolean; createdAt?: Date; uiLocale?: string; emailOptOut?: boolean; onboardingSent?: string[] };

/** Which email (if any) a user should get now. Pure: unit-tested. */
export function dueOnboarding(user: UserRow, facts: { issued: boolean; pro: boolean }, now = new Date()): OnboardingKind | null {
  if (!user.email || !user.emailVerified || user.emailOptOut || !user.createdAt) return null;
  const age = (now.getTime() - new Date(user.createdAt).getTime()) / DAY;
  for (const step of ONBOARDING) {
    if (user.onboardingSent?.includes(step.kind)) continue;
    if (age >= step.day && age < step.day + GRACE_DAYS && step.when(facts)) return step.kind;
  }
  return null;
}

export const unsubscribeToken = (userId: string) => hmac(`unsubscribe:${userId}`).slice(0, 32);
export const isValidUnsubscribe = (userId: string, token: string) => ObjectId.isValid(userId) && safeEqual(token, unsubscribeToken(userId));
export const unsubscribeUrl = (site: string, userId: string, lang: string) => `${site}/api/email/unsubscribe?u=${userId}&t=${unsubscribeToken(userId)}&l=${lang}`;

/** Daily cron: sends at most one onboarding email per user per day. */
export async function runOnboarding(site: string, now = new Date(), limit = 200): Promise<number> {
  const users = mongoClient().db().collection<UserRow>('user');
  const lastDay = Math.max(...ONBOARDING.map((s) => s.day)) + GRACE_DAYS;
  const candidates = await users
    .find({ emailVerified: true, emailOptOut: { $ne: true }, createdAt: { $gte: new Date(now.getTime() - lastDay * DAY), $lte: new Date(now.getTime() - DAY) } })
    .project<UserRow>({ email: 1, emailVerified: 1, createdAt: 1, uiLocale: 1, emailOptOut: 1, onboardingSent: 1 })
    .limit(limit)
    .toArray();
  let sent = 0;
  for (const u of candidates) {
    const id = String(u._id);
    const [issued, pro] = await Promise.all([
      Document.exists({ userId: id, issuedAt: { $exists: true } }).then(Boolean),
      Subscription.exists({ userId: id, status: { $in: ['active', 'cancelled'] }, $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }).then(Boolean),
    ]);
    const kind = dueOnboarding(u, { issued, pro }, now);
    if (!kind) continue;
    const lang = u.uiLocale === 'fr' || u.uiLocale === 'ar' ? u.uiLocale : 'en';
    try {
      await sendEmail(onboardingEmail(kind, lang, u.email!, site, unsubscribeUrl(site, id, lang)));
      await users.updateOne({ _id: u._id } as never, { $addToSet: { onboardingSent: kind } });
      sent++;
    } catch (e) {
      console.error(`[onboarding] ${kind} not sent:`, (e as Error).message);
    }
  }
  return sent;
}

export async function optOut(userId: string): Promise<void> {
  await mongoClient()
    .db()
    .collection('user')
    .updateOne({ _id: new ObjectId(userId) } as never, { $set: { emailOptOut: true, emailOptOutAt: new Date() } });
}
