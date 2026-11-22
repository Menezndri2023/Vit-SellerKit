import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const sent: { to: string; subject: string; html: string; headers?: Record<string, string> }[] = [];
vi.mock('./email', async (orig) => ({ ...(await orig<typeof import('./email')>()), sendEmail: async (e: (typeof sent)[number]) => void sent.push(e) }));

import { startTestDb, stopTestDb } from '@/test/db';
import { mongoClient } from './db';
import { dueOnboarding, runOnboarding, unsubscribeToken } from './onboarding';
import { GET, POST } from '@/app/api/email/unsubscribe/route';
import { Document } from '@/models/Document';
import { Subscription } from '@/models/Subscription';

const DAY = 86_400_000;
const NOW = new Date('2026-11-22T07:00:00Z');
const daysAgo = (d: number) => new Date(NOW.getTime() - d * DAY);
const users = () => mongoClient().db().collection('user');

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(async () => {
  sent.length = 0;
  await Promise.all([users().deleteMany({}), Document.deleteMany({}), Subscription.deleteMany({})]);
});

describe('dueOnboarding', () => {
  const u = (age: number, extra = {}) => ({ _id: 'x', email: 'a@b.c', emailVerified: true, createdAt: daysAgo(age), ...extra });
  const free = { issued: false, pro: false };
  it('follows the day-1 / day-4 / day-8 schedule', () => {
    expect(dueOnboarding(u(0.5), free, NOW)).toBeNull();
    expect(dueOnboarding(u(1.2), free, NOW)).toBe('first');
    expect(dueOnboarding(u(4.1, { onboardingSent: ['first'] }), free, NOW)).toBe('share');
    expect(dueOnboarding(u(8.5, { onboardingSent: ['first', 'share'] }), free, NOW)).toBe('pro');
  });
  it('skips what no longer applies, opt-outs, unverified and old accounts', () => {
    expect(dueOnboarding(u(1.2), { issued: true, pro: false }, NOW)).toBeNull(); // already issued
    expect(dueOnboarding(u(8.5, { onboardingSent: ['first', 'share'] }), { issued: true, pro: true }, NOW)).toBeNull(); // already Pro
    expect(dueOnboarding(u(1.2, { emailOptOut: true }), free, NOW)).toBeNull();
    expect(dueOnboarding(u(1.2, { emailVerified: false }), free, NOW)).toBeNull();
    expect(dueOnboarding(u(60), free, NOW)).toBeNull(); // no retroactive series
  });
});

describe('runOnboarding + unsubscribe', () => {
  it('sends once per step, in the user language, with one-click unsubscribe', async () => {
    const { insertedId } = await users().insertOne({ email: 'salma@example.com', emailVerified: true, createdAt: daysAgo(1.5), uiLocale: 'fr' });
    await users().insertOne({ email: 'old@example.com', emailVerified: true, createdAt: daysAgo(90) });
    await users().insertOne({ email: 'new@example.com', emailVerified: true, createdAt: daysAgo(0.2) });
    expect(await runOnboarding('https://margokit.com', NOW)).toBe(1);
    expect(await runOnboarding('https://margokit.com', NOW)).toBe(0); // same day again: nothing new
    expect(sent).toHaveLength(1);
    expect(sent[0]).toMatchObject({ to: 'salma@example.com', subject: 'Ta première facture en 2 minutes' });
    expect(sent[0].html).toContain('https://margokit.com/fr/app?utm_source=email');
    expect(sent[0].headers?.['List-Unsubscribe']).toContain(`u=${insertedId}&t=${unsubscribeToken(String(insertedId))}`);
    expect((await users().findOne({ _id: insertedId }))?.onboardingSent).toEqual(['first']);
  });

  it('unsubscribe: GET only asks, POST with a valid token opts out, a forged token does nothing', async () => {
    const { insertedId } = await users().insertOne({ email: 'x@example.com', emailVerified: true, createdAt: daysAgo(1.5) });
    const id = String(insertedId);
    const url = `https://margokit.com/api/email/unsubscribe?u=${id}&t=${unsubscribeToken(id)}&l=fr`;
    expect((await GET(new Request(url))).status).toBe(200);
    expect((await users().findOne({ _id: insertedId }))?.emailOptOut).toBeUndefined();
    expect((await POST(new Request(url.replace(/t=[^&]+/, 't=forged'), { method: 'POST' }))).status).toBe(400);
    expect((await POST(new Request(url, { method: 'POST' }))).status).toBe(200);
    expect((await users().findOne({ _id: insertedId }))?.emailOptOut).toBe(true);
    expect(await runOnboarding('https://margokit.com', NOW)).toBe(0);
  });
});
