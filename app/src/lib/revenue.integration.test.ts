import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { startTestDb, stopTestDb } from '@/test/db';
import { Document } from '@/models/Document';
import { getRevenue } from './revenue';

const TODAY = new Date(Date.UTC(2026, 10, 22)); // 22 Nov 2026
const userId = 'u1';
let n = 0;

const doc = (extra: Record<string, unknown>) =>
  Document.create({
    userId, type: 'invoice', status: 'issued', number: `F-${++n}`, currency: 'EUR', issueDate: new Date(Date.UTC(2026, 0, 10)),
    totals: { totalExclTax: 10000, totalTax: 2000, totalInclTax: 12000, taxBreakdown: [] }, amountDue: 12000,
    buyer: { kind: 'business', name: 'Alpha', address: { line1: 'x', city: 'Paris', country: 'FR' } },
    ...extra,
  });

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(() => Document.deleteMany({}));

describe('getRevenue', () => {
  it('returns null without any issued invoice', async () => {
    await doc({ status: 'draft', number: undefined });
    expect(await getRevenue(userId, { today: TODAY })).toBeNull();
  });

  it('sums invoiced per month minus credit notes, payments by payment date, outstanding and top clients', async () => {
    // January: paid invoice (paid in February, 31 days later)
    await doc({ status: 'paid', amountDue: 0, paid: 12000, payments: [{ amount: 12000, date: new Date(Date.UTC(2026, 1, 10)) }] });
    // March: open invoice past due, other client
    await doc({ issueDate: new Date(Date.UTC(2026, 2, 5)), dueDate: new Date(Date.UTC(2026, 3, 5)), totals: { totalExclTax: 50000, totalTax: 0, totalInclTax: 50000, taxBreakdown: [] }, amountDue: 50000, buyer: { kind: 'business', name: 'Beta', address: { line1: 'x', city: 'Lyon', country: 'FR' } } });
    // March: credit note on Alpha
    await doc({ type: 'credit_note', issueDate: new Date(Date.UTC(2026, 2, 20)), totals: { totalExclTax: 4000, totalTax: 800, totalInclTax: 4800, taxBreakdown: [] }, amountDue: 0 });
    // Ignored: draft, other currency, other user
    await doc({ status: 'draft', number: undefined, issueDate: new Date(Date.UTC(2026, 4, 1)) });
    await doc({ currency: 'MAD', issueDate: new Date(Date.UTC(2026, 4, 1)) });
    await doc({ userId: 'u2' });
    // Previous year, same period (Jan–Nov) and December (not compared)
    await doc({ issueDate: new Date(Date.UTC(2025, 5, 1)), status: 'paid', amountDue: 0 });
    await doc({ issueDate: new Date(Date.UTC(2025, 11, 15)), status: 'paid', amountDue: 0 });

    const r = (await getRevenue(userId, { today: TODAY, defaultCurrency: 'EUR' }))!;
    expect(r.currency).toBe('EUR');
    expect(r.currencies.sort()).toEqual(['EUR', 'MAD']);
    expect(r.years).toEqual([2026, 2025]);
    expect(r.invoiced[0]).toBe(10000);
    expect(r.invoiced[2]).toBe(46000);
    expect(r.invoicedTotal).toBe(56000);
    expect(r.invoiceCount).toBe(2);
    expect(r.collected[1]).toBe(12000);
    expect(r.collectedTotal).toBe(12000);
    expect(r.outstanding).toBe(50000);
    expect(r.overdue).toBe(50000);
    expect(r.averageDaysToPay).toBe(31);
    expect(r.invoicedPrevious).toBe(10000);
    expect(r.topClients).toEqual([
      { name: 'Beta', total: 50000 },
      { name: 'Alpha', total: 6000 },
    ]);

    const mad = (await getRevenue(userId, { today: TODAY, currency: 'MAD' }))!;
    expect(mad.invoicedTotal).toBe(10000);
    const last = (await getRevenue(userId, { today: TODAY, year: 2025 }))!;
    expect(last.invoicedTotal).toBe(20000);
    expect(last.invoicedPrevious).toBe(0);
  });
});
