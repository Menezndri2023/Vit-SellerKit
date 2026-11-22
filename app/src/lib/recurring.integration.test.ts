import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';

const sent: { to: string; subject: string; html: string }[] = [];
vi.mock('./email', async (orig) => ({ ...(await orig<typeof import('./email')>()), sendEmail: async (e: (typeof sent)[number]) => void sent.push(e) }));

import { startTestDb, stopTestDb } from '@/test/db';
import { mongoClient } from './db';
import { runRecurring } from './recurring';
import { BusinessProfile } from '@/models/BusinessProfile';
import { Document } from '@/models/Document';
import { Recurrence } from '@/models/Recurrence';
import { Subscription } from '@/models/Subscription';

const NOW = new Date('2026-11-22T07:00:00Z');
const d = (iso: string) => new Date(`${iso}T00:00:00Z`);
let userId = '';
let sourceId = '';

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(async () => {
  sent.length = 0;
  await Promise.all([Document.deleteMany({}), Recurrence.deleteMany({}), BusinessProfile.deleteMany({}), Subscription.deleteMany({}), mongoClient().db().collection('user').deleteMany({})]);
  const { insertedId } = await mongoClient().db().collection('user').insertOne({ email: 'owner@example.com', uiLocale: 'fr' });
  userId = String(insertedId);
  await BusinessProfile.create({ userId, legalName: 'Atelier Nour', address: { line1: 'x', city: 'Casablanca', country: 'MA' }, paymentTermsDays: 15 });
  await Subscription.create({ userId, plan: 'manual', provider: 'manual', status: 'active', expiresAt: null });
  const src = await Document.create({
    userId, type: 'invoice', status: 'sent', number: 'F-2026-010', currency: 'MAD', docLocale: 'fr', clientId: 'c1', issueDate: d('2026-10-22'),
    lines: [{ description: 'Maintenance mensuelle', qty: 1, unitPrice: 50000, vatCategory: 'S', taxRate: 20, net: 50000 }],
    totals: { totalExclTax: 50000, totalTax: 10000, totalInclTax: 60000, taxBreakdown: [] }, buyer: { kind: 'business', name: 'Client SARL', address: { line1: 'x', city: 'Rabat', country: 'MA' } },
  });
  sourceId = String(src._id);
});

describe('recurring invoices', () => {
  it('creates a draft on the date, advances to the next one, emails the owner', async () => {
    const r = await Recurrence.create({ userId, sourceId, frequency: 'monthly', nextDate: d('2026-11-22') });
    expect(await runRecurring('https://margokit.com', NOW)).toBe(1);
    expect(await runRecurring('https://margokit.com', NOW)).toBe(0);
    const draft = (await Document.findOne({ recurrenceId: String(r._id) }).lean())!;
    expect(draft).toMatchObject({ status: 'draft', type: 'invoice', currency: 'MAD', clientId: 'c1', amountDue: 60000 });
    expect(draft.number).toBeUndefined();
    expect(draft.issueDate.toISOString().slice(0, 10)).toBe('2026-11-22');
    expect(draft.dueDate!.toISOString().slice(0, 10)).toBe('2026-12-07'); // payment terms: 15 days
    expect((await Recurrence.findById(r._id).lean())!).toMatchObject({ createdCount: 1, nextDate: d('2026-12-22') });
    expect(sent[0]).toMatchObject({ to: 'owner@example.com', subject: 'Ta facture récurrente est prête à émettre' });
    expect(sent[0].html).toContain(`https://margokit.com/fr/app/documents/${draft._id}`);
  });

  it('waits without Pro, stops when the source invoice is gone, ignores future dates', async () => {
    await Recurrence.create({ userId, sourceId, frequency: 'monthly', nextDate: d('2026-12-01') });
    expect(await runRecurring('https://x', NOW)).toBe(0);
    const r = await Recurrence.create({ userId, sourceId, frequency: 'monthly', nextDate: d('2026-11-20') });
    await Subscription.updateMany({}, { $set: { status: 'expired' } });
    expect(await runRecurring('https://x', NOW)).toBe(0);
    expect((await Recurrence.findById(r._id).lean())!.nextDate).toEqual(d('2026-11-20'));
    await Subscription.updateMany({}, { $set: { status: 'active' } });
    await Document.deleteOne({ _id: sourceId });
    expect(await runRecurring('https://x', NOW)).toBe(0);
    expect((await Recurrence.findById(r._id).lean())!.active).toBe(false);
  });

  it('two runs at the same time create one draft', async () => {
    await Recurrence.create({ userId, sourceId, frequency: 'monthly', nextDate: d('2026-11-22') });
    const [a, b] = await Promise.all([runRecurring('https://x', NOW), runRecurring('https://x', NOW)]);
    expect(a + b).toBe(1);
    expect(await Document.countDocuments({ status: 'draft' })).toBe(1);
  });
});
