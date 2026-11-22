import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import mongoose from 'mongoose';
import { startTestDb, stopTestDb } from '@/test/db';
import { applyCreditNote } from './service';
import { enforceFreeQuota, FREE_MONTHLY_LIMIT } from '../plan';
import { Counter, nextSeq } from '@/models/Counter';
import { Document } from '@/models/Document';

beforeAll(startTestDb);
afterAll(stopTestDb);
beforeEach(async () => {
  await Promise.all([Document.deleteMany({}), Counter.deleteMany({})]);
});

const base = { userId: 'u1', currency: 'EUR', issueDate: new Date('2026-11-01T00:00:00Z') };
const totals = (ttc: number) => ({ totalExclTax: ttc, totalTax: 0, totalInclTax: ttc, taxBreakdown: [] });

/** Same steps as the issue action: quota (free plan) + number + lock, in one transaction. */
async function issue(id: unknown, free = true) {
  const session = await mongoose.connection.startSession();
  try {
    await session.withTransaction(async () => {
      if (free) await enforceFreeQuota('u1', session);
      const seq = await nextSeq('u1:invoice:2026', session);
      const res = await Document.updateOne({ _id: id, status: 'draft' }, { $set: { status: 'issued', number: `F-2026-${seq}`, issuedAt: new Date() } }, { session });
      if (!res.matchedCount) throw new Error('LOCKED');
    });
    return 'ok';
  } catch (e) {
    return (e as Error).message;
  } finally {
    await session.endSession();
  }
}

describe('numbering', () => {
  it('gives unique, gap-free numbers under concurrency', async () => {
    const seqs = await Promise.all(Array.from({ length: 25 }, () => nextSeq('u1:invoice:2026')));
    expect([...seqs].sort((a, b) => a - b)).toEqual(Array.from({ length: 25 }, (_, i) => i + 1));
  });

  it('issuing the same draft twice at once only numbers it once', async () => {
    const d = await Document.create({ ...base, type: 'invoice', status: 'draft' });
    const r = await Promise.all([issue(d._id, false), issue(d._id, false)]);
    expect(r.filter((x) => x === 'ok')).toHaveLength(1);
    expect(await Document.countDocuments({ number: { $type: 'string' } })).toBe(1);
  });
});

describe('free plan quota', () => {
  it(`never lets more than ${FREE_MONTHLY_LIMIT} documents be issued in a month, even concurrently`, async () => {
    const drafts = await Document.insertMany(Array.from({ length: 6 }, () => ({ ...base, type: 'invoice', status: 'draft' })));
    const results = await Promise.all(drafts.map((d) => issue(d._id)));
    expect(results.filter((r) => r === 'ok')).toHaveLength(FREE_MONTHLY_LIMIT);
    expect(results.filter((r) => r === 'PLAN_LIMIT')).toHaveLength(6 - FREE_MONTHLY_LIMIT);
    expect(await Document.countDocuments({ status: 'issued' })).toBe(FREE_MONTHLY_LIMIT);
  });

  it('counts by calendar month (UTC): last month’s documents do not use this month’s quota', async () => {
    const lastMonth = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 0, 23, 59));
    await Document.insertMany(Array.from({ length: 3 }, (_, i) => ({ ...base, type: 'invoice', status: 'issued', number: `OLD-${i}`, issuedAt: lastMonth })));
    const d = await Document.create({ ...base, type: 'invoice', status: 'draft' });
    expect(await issue(d._id)).toBe('ok');
  });
});

describe('credit notes', () => {
  async function invoice(ttc: number) {
    return Document.create({ ...base, type: 'invoice', status: 'issued', number: 'F-1', issuedAt: new Date(), totals: totals(ttc), amountDue: ttc });
  }
  const credit = async (orig: { _id: unknown }, ttc: number) => {
    const cn = await Document.create({ ...base, type: 'credit_note', status: 'draft', totals: totals(ttc), precedingInvoice: { id: String(orig._id), number: 'F-1' } });
    const session = await mongoose.connection.startSession();
    try {
      await session.withTransaction(async () => {
        await applyCreditNote('u1', cn, session);
        await Document.updateOne({ _id: cn._id }, { $set: { status: 'issued' } }, { session });
      });
      return 'ok';
    } catch (e) {
      return (e as Error).message;
    } finally {
      await session.endSession();
    }
  };

  it('partial credit notes add up; the invoice is cancelled when fully credited; over-crediting is refused', async () => {
    const inv = await invoice(10_000);
    expect(await credit(inv, 4_000)).toBe('ok');
    expect((await Document.findById(inv._id).lean())!.status).toBe('issued');
    expect(await credit(inv, 7_000)).toBe('CREDIT_EXCEEDS');
    expect(await credit(inv, 6_000)).toBe('ok');
    expect((await Document.findById(inv._id).lean())!).toMatchObject({ status: 'cancelled', amountDue: 0 });
    expect(await credit(inv, 1)).toBe('CREDIT_EXCEEDS');
  });

  it('two concurrent credit notes can’t both pass the check', async () => {
    const inv = await invoice(10_000);
    const r = await Promise.all([credit(inv, 8_000), credit(inv, 8_000)]);
    expect(r.filter((x) => x === 'ok')).toHaveLength(1);
  });

  it('ignores another user’s invoice', async () => {
    const other = await Document.create({ ...base, userId: 'u2', type: 'invoice', status: 'issued', number: 'X', totals: totals(100) });
    expect(await credit(other, 100)).toBe('ok');
    expect((await Document.findById(other._id).lean())!.status).toBe('issued');
  });
});

describe('payments', () => {
  it('two payments saved from the same stale read can’t both succeed (optimistic concurrency)', async () => {
    const inv = await Document.create({ ...base, type: 'invoice', status: 'issued', number: 'F-9', totals: totals(1000), amountDue: 1000 });
    const [a, b] = await Promise.all([Document.findById(inv._id), Document.findById(inv._id)]);
    a!.payments.push({ amount: 1000, date: new Date() });
    b!.payments.push({ amount: 1000, date: new Date() });
    await a!.save();
    await expect(b!.save()).rejects.toThrow(/version|No matching document/i);
    expect((await Document.findById(inv._id).lean())!.payments).toHaveLength(1);
  });
});
