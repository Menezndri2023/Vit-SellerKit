import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('next/headers', () => ({ headers: async () => new Headers() }));
const sent: { to: string; subject: string; replyTo?: string; html: string }[] = [];
vi.mock('./email', async (orig) => ({ ...(await orig<typeof import('./email')>()), sendEmail: async (e: (typeof sent)[number]) => void sent.push(e) }));

import { ObjectId } from 'mongodb';
import { startTestDb, stopTestDb } from '@/test/db';
import { mongoClient } from './db';
import { runReminders } from './reminders';
import { BusinessProfile } from '@/models/BusinessProfile';
import { Document } from '@/models/Document';
import { Subscription } from '@/models/Subscription';

const NOW = new Date('2026-11-22T07:00:00Z');
const DAY = 86_400_000;
let userId = '';

beforeAll(async () => {
  process.env.NEXT_PUBLIC_SITE_URL = 'https://margokit.com';
  await startTestDb();
});
afterAll(stopTestDb);
beforeEach(async () => {
  sent.length = 0;
  await Promise.all([Document.deleteMany({}), BusinessProfile.deleteMany({}), Subscription.deleteMany({}), mongoClient().db().collection('user').deleteMany({})]);
  const { insertedId } = await mongoClient().db().collection('user').insertOne({ email: 'seller@example.com', timeZone: 'Africa/Casablanca' });
  userId = String(insertedId);
  await BusinessProfile.create({ userId, legalName: 'Atelier Nour SARL', tradeName: 'Atelier Nour', email: 'contact@nour.example', address: { line1: '1 rue', city: 'Casablanca', country: 'MA' }, reminders: { enabled: true } });
  await Subscription.create({ userId, plan: 'lifetime', provider: 'manual', status: 'active', expiresAt: null });
});

let n = 0;
const invoice = (daysLate: number, extra: Record<string, unknown> = {}) =>
  Document.create({
    userId, type: 'invoice', status: 'issued', number: `F-${++n}`, currency: 'MAD', docLocale: 'fr',
    issueDate: new Date(NOW.getTime() - (daysLate + 30) * DAY), dueDate: new Date(Date.UTC(2026, 10, 22) - daysLate * DAY),
    totals: { totalExclTax: 100000, totalTax: 20000, totalInclTax: 120000, taxBreakdown: [] }, amountDue: 120000,
    buyer: { kind: 'business', name: 'Client SARL', email: 'client@example.com', address: { line1: 'x', city: 'Rabat', country: 'MA' } },
    ...extra,
  });

describe('automatic overdue reminders', () => {
  it('sends the due reminder once, in the invoice language, replying to the seller', async () => {
    const inv = await invoice(2);
    expect(await runReminders(NOW)).toBe(1);
    expect(await runReminders(NOW)).toBe(0); // same day again
    expect(sent[0]).toMatchObject({ to: 'client@example.com', subject: 'Rappel : facture F-1 — Atelier Nour', replyTo: 'contact@nour.example' });
    expect(sent[0].html).toContain('1');
    expect(sent[0].html).toMatch(/https:\/\/margokit\.com\/fr\/d\/[A-Za-z0-9_-]{43}/);
    const after = (await Document.findById(inv._id).lean())!;
    expect(after.reminders?.sent?.map((s) => s.step)).toEqual([1]);
  });

  it('a very late invoice gets only its latest reminder', async () => {
    await invoice(40);
    expect(await runReminders(NOW)).toBe(1);
    expect(sent[0].subject).toMatch(/^Dernier rappel/);
  });

  it('skips: not overdue, paid, cancelled, opted out, no client email, reminders off, not Pro', async () => {
    await invoice(0); // due today
    await invoice(5, { status: 'paid', amountDue: 0 });
    await invoice(5, { status: 'cancelled' });
    await invoice(5, { reminders: { disabled: true, sent: [] } });
    await invoice(5, { buyer: { kind: 'business', name: 'No mail', address: { line1: 'x', city: 'Rabat', country: 'MA' } } });
    await invoice(5, { type: 'quote' });
    expect(await runReminders(NOW)).toBe(0);
    await invoice(5);
    await BusinessProfile.updateOne({ userId }, { $set: { 'reminders.enabled': false } });
    expect(await runReminders(NOW)).toBe(0);
    await BusinessProfile.updateOne({ userId }, { $set: { 'reminders.enabled': true } });
    await Subscription.updateMany({ userId }, { $set: { status: 'expired' } });
    expect(await runReminders(NOW)).toBe(0);
    expect(sent).toHaveLength(0);
  });

  it('two runs at the same time never send the same reminder twice', async () => {
    await invoice(3);
    await invoice(9);
    const [a, b] = await Promise.all([runReminders(NOW), runReminders(NOW)]);
    expect(a + b).toBe(2);
    expect(sent).toHaveLength(2);
  });

  it('other users’ invoices are never touched', async () => {
    const other = new ObjectId().toHexString();
    await Document.create({ userId: other, type: 'invoice', status: 'issued', number: 'X-1', currency: 'EUR', issueDate: NOW, dueDate: new Date(NOW.getTime() - 5 * DAY), amountDue: 100, buyer: { kind: 'business', name: 'B', email: 'b@example.com', address: { line1: 'x', city: 'y', country: 'FR' } } });
    expect(await runReminders(NOW)).toBe(0);
  });
});
