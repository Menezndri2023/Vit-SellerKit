import 'server-only';
import { Document } from '@/models/Document';

const ISSUED = ['issued', 'sent', 'paid', 'accepted'];
const INVOICES = ['invoice', 'deposit_invoice'] as ('invoice' | 'deposit_invoice')[];
const DAY = 86_400_000;

export type Revenue = {
  year: number;
  currency: string;
  /** Currencies and years the user has invoices in (for the selectors) */
  currencies: string[];
  years: number[];
  /** Per month (index 0 = January), minor units */
  invoiced: number[];
  collected: number[];
  invoicedTotal: number;
  collectedTotal: number;
  /** Same months of the previous year (whole year for a past year) — for the change in % */
  invoicedPrevious: number;
  invoiceCount: number;
  /** Still to collect, all years, and the part already past due */
  outstanding: number;
  overdue: number;
  /** Days between the invoice date and the last payment, paid invoices of the year */
  averageDaysToPay: number | null;
  topClients: { name: string; total: number }[];
};

const yearRange = (y: number) => ({ $gte: new Date(Date.UTC(y, 0, 1)), $lt: new Date(Date.UTC(y + 1, 0, 1)) });

/**
 * Revenue of one year in one currency (amounts in different currencies are never added together).
 * Invoiced = invoices and deposit invoices excl. tax minus credit notes, by issue date (same rule
 * as the dashboard tile). Collected = payments recorded, by payment date.
 */
export async function getRevenue(userId: string, opts: { year?: number; currency?: string; defaultCurrency?: string; today: Date }): Promise<Revenue | null> {
  const base = { userId, type: { $in: [...INVOICES, 'credit_note'] }, status: { $in: [...ISSUED, 'cancelled'] } };
  const [currencyRows, yearRows] = await Promise.all([
    Document.aggregate<{ _id: string; n: number }>([{ $match: base }, { $group: { _id: '$currency', n: { $sum: 1 } } }, { $sort: { n: -1 } }]),
    Document.aggregate<{ _id: number }>([{ $match: base }, { $group: { _id: { $year: '$issueDate' } } }, { $sort: { _id: -1 } }]),
  ]);
  if (!currencyRows.length) return null;

  const currencies = currencyRows.map((r) => r._id);
  const currency =
    opts.currency && currencies.includes(opts.currency) ? opts.currency : opts.defaultCurrency && currencies.includes(opts.defaultCurrency) ? opts.defaultCurrency : currencies[0];
  const thisYear = opts.today.getUTCFullYear();
  const years = [...new Set([thisYear, ...yearRows.map((r) => r._id)])].sort((a, b) => b - a);
  const year = opts.year && years.includes(opts.year) ? opts.year : thisYear;
  const match = { ...base, currency };
  const signed = { $cond: [{ $eq: ['$type', 'credit_note'] }, { $multiply: ['$totals.totalExclTax', -1] }, '$totals.totalExclTax'] };

  const [byMonth, payments, open, paidRows, clients] = await Promise.all([
    Document.aggregate<{ _id: { y: number; m: number }; total: number; count: number }>([
      { $match: { ...match, issueDate: { $gte: new Date(Date.UTC(year - 1, 0, 1)), $lt: new Date(Date.UTC(year + 1, 0, 1)) } } },
      { $group: { _id: { y: { $year: '$issueDate' }, m: { $month: '$issueDate' } }, total: { $sum: signed }, count: { $sum: { $cond: [{ $in: ['$type', INVOICES] }, 1, 0] } } } },
    ]),
    Document.aggregate<{ _id: number; total: number }>([
      { $match: { userId, currency, type: { $in: INVOICES }, status: { $ne: 'draft' }, 'payments.date': yearRange(year) } },
      { $unwind: '$payments' },
      { $match: { 'payments.date': yearRange(year) } },
      { $group: { _id: { $month: '$payments.date' }, total: { $sum: '$payments.amount' } } },
    ]),
    Document.aggregate<{ _id: null; outstanding: number; overdue: number }>([
      { $match: { userId, currency, type: { $in: INVOICES }, status: { $in: ['issued', 'sent'] }, amountDue: { $gt: 0 } } },
      { $group: { _id: null, outstanding: { $sum: '$amountDue' }, overdue: { $sum: { $cond: [{ $lt: ['$dueDate', opts.today] }, '$amountDue', 0] } } } },
    ]),
    Document.find({ userId, currency, type: { $in: INVOICES }, status: 'paid', issueDate: yearRange(year), 'payments.0': { $exists: true } }).select('issueDate payments.date').lean<{ issueDate: Date; payments?: { date: Date }[] }[]>(),
    Document.aggregate<{ _id: string; total: number }>([
      { $match: { ...match, issueDate: yearRange(year) } },
      { $group: { _id: { $ifNull: ['$buyer.name', '—'] }, total: { $sum: signed } } },
      { $match: { total: { $gt: 0 } } },
      { $sort: { total: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const invoiced = Array<number>(12).fill(0);
  const previous = Array<number>(12).fill(0);
  let invoiceCount = 0;
  for (const r of byMonth) {
    if (r._id.y === year) {
      invoiced[r._id.m - 1] = r.total;
      invoiceCount += r.count;
    } else previous[r._id.m - 1] = r.total;
  }
  const collected = Array<number>(12).fill(0);
  for (const r of payments) collected[r._id - 1] = r.total;

  // Current year: compare with the same months last year, not with a full year
  const months = year === thisYear ? opts.today.getUTCMonth() + 1 : 12;
  const sum = (a: number[]) => a.reduce((s, v) => s + v, 0);
  const delays = paidRows.map((d) => {
    const last = Math.max(...(d.payments ?? []).map((p) => new Date(p.date).getTime()));
    return Math.max(0, Math.round((last - new Date(d.issueDate).getTime()) / DAY));
  });

  return {
    year,
    currency,
    currencies,
    years,
    invoiced,
    collected,
    invoicedTotal: sum(invoiced),
    collectedTotal: sum(collected),
    invoicedPrevious: sum(previous.slice(0, months)),
    invoiceCount,
    outstanding: open[0]?.outstanding ?? 0,
    overdue: open[0]?.overdue ?? 0,
    averageDaysToPay: delays.length ? Math.round(delays.reduce((s, v) => s + v, 0) / delays.length) : null,
    topClients: clients.map((c) => ({ name: c._id, total: c.total })),
  };
}
