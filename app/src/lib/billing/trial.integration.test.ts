import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({ headers: async () => new Headers() }));

import { startTestDb, stopTestDb } from '@/test/db';
import { getPlan, hasActivePro } from '@/lib/plan';
import { Subscription } from '@/models/Subscription';
import { endTrial, startTrial, trialAvailable } from './trial';

const NOW = new Date('2026-11-22T10:00:00Z');

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(() => Subscription.deleteMany({}));

describe('Pro trial', () => {
  it('starts once, for 7 days, and gives Pro', async () => {
    expect(await trialAvailable('u1')).toBe(true);
    const first = await startTrial('u1', NOW);
    expect(first).toEqual({ ok: true, expiresAt: new Date('2026-11-29T10:00:00Z') });
    expect(await startTrial('u1', NOW)).toEqual({ ok: false, error: 'not_eligible' });
    expect(await Subscription.countDocuments({ userId: 'u1' })).toBe(1);
    expect(await trialAvailable('u1')).toBe(false);
    expect(await hasActivePro('u1', NOW)).toBe(true);
    const sub = await Subscription.findOne({ userId: 'u1' }).lean();
    expect(sub?.remindersSent).toEqual(['j7']);
  });

  it('two simultaneous starts create a single trial', async () => {
    const results = await Promise.all([startTrial('u2', NOW), startTrial('u2', NOW)]);
    expect(results.filter((r) => r.ok)).toHaveLength(1);
    expect(await Subscription.countDocuments({ userId: 'u2' })).toBe(1);
  });

  it('is refused to accounts that already had Pro, even expired', async () => {
    await Subscription.create({ userId: 'u3', plan: 'monthly', provider: 'gumroad', status: 'expired' });
    expect(await trialAvailable('u3')).toBe(false);
    expect(await startTrial('u3', NOW)).toEqual({ ok: false, error: 'not_eligible' });
  });

  it('a paid plan wins over the trial and ends it', async () => {
    await startTrial('u4');
    await Subscription.create({ userId: 'u4', plan: 'lifetime', provider: 'manual', status: 'active', expiresAt: null });
    const plan = await getPlan('u4');
    expect(plan.subscription?.plan).toBe('lifetime');
    expect(plan.trial).toBe(false);
    await endTrial('u4');
    const trial = await Subscription.findOne({ userId: 'u4', provider: 'trial' }).lean();
    expect(trial?.status).toBe('expired');
    expect(trial?.remindersSent).toEqual(expect.arrayContaining(['j1', 'expired']));
  });

  it('getPlan reports the trial and the offer', async () => {
    const free = await getPlan('u5');
    expect(free).toMatchObject({ plan: 'free', trial: false, trialAvailable: true });
    await startTrial('u5');
    expect(await getPlan('u5')).toMatchObject({ plan: 'pro', trial: true, trialAvailable: false });
  });
});
