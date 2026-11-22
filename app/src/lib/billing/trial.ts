import 'server-only';
import { Subscription } from '@/models/Subscription';

export const TRIAL_DAYS = 7;
const DAY = 86_400_000;

/** One free Pro trial per account, only for accounts that never had Pro (bought, code or trial). */
export async function trialAvailable(userId: string): Promise<boolean> {
  return !(await Subscription.exists({ userId }));
}

export type TrialResult = { ok: true; expiresAt: Date } | { ok: false; error: 'not_eligible' };

/**
 * Starts the 7-day trial. The upsert on {userId, provider: 'trial'} makes a second start (double
 * click, two tabs) find the existing trial instead of creating another one.
 * The 7-day "ends soon" email is pre-marked as sent: the trial is shorter than that window.
 */
export async function startTrial(userId: string, now = new Date()): Promise<TrialResult> {
  if (await Subscription.exists({ userId, provider: { $ne: 'trial' } })) return { ok: false, error: 'not_eligible' };
  const expiresAt = new Date(now.getTime() + TRIAL_DAYS * DAY);
  try {
    const res = await Subscription.findOneAndUpdate(
      { userId, provider: 'trial' },
      { $setOnInsert: { userId, plan: 'trial', provider: 'trial', status: 'active', startsAt: now, expiresAt, remindersSent: ['j7'] } },
      { upsert: true, returnDocument: 'after', includeResultMetadata: true },
    );
    if (res.lastErrorObject?.updatedExisting) return { ok: false, error: 'not_eligible' };
  } catch (e) {
    if ((e as { code?: number }).code === 11000) return { ok: false, error: 'not_eligible' };
    throw e;
  }
  return { ok: true, expiresAt };
}

/** A paid plan replaces the trial: end it so no "trial ends" email follows the purchase. */
export async function endTrial(userId: string, now = new Date()): Promise<void> {
  await Subscription.updateMany(
    { userId, provider: 'trial', status: 'active' },
    { $set: { status: 'expired', expiresAt: now }, $addToSet: { remindersSent: { $each: ['j7', 'j1', 'expired'] } } },
  );
}
