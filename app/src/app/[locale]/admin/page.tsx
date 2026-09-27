import { getTranslations, setRequestLocale } from 'next-intl/server';
import { connectDb, mongoClient } from '@/lib/db';
import { Subscription } from '@/models/Subscription';
import { BillingEvent } from '@/models/BillingEvent';
import { fmtLocale } from '@/lib/intl';

function Table({ head, rows, empty }: { head: string[]; rows: (string | number)[][]; empty: string }) {
  if (!rows.length) return <p className="text-sm text-muted">{empty}</p>;
  return (
    <table className="tabular w-full text-sm">
      <thead>
        <tr className="border-b border-line text-start text-xs uppercase text-muted">
          {head.map((h, i) => (
            <th key={h} className={`py-2 font-semibold ${i ? 'text-end' : 'text-start'}`}>
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.join('|')} className="border-b border-line last:border-0">
            {r.map((c, i) => (
              <td key={i} className={`py-2 ${i ? 'text-end' : ''}`}>
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default async function AdminStats({ params }: PageProps<'/[locale]/admin'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin.stats');
  await connectDb();
  const users = mongoClient().db().collection('user');
  const now = new Date();
  const sixMonths = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5, 1));
  const ninetyDays = new Date(now.getTime() - 90 * 86_400_000);

  const [total, verified, proUsers, signups, revenue, countries] = await Promise.all([
    users.countDocuments(),
    users.countDocuments({ emailVerified: true }),
    Subscription.distinct('userId', { status: { $in: ['active', 'cancelled'] }, $or: [{ expiresAt: null }, { expiresAt: { $gt: now } }] }),
    users.aggregate<{ _id: string; n: number }>([{ $match: { createdAt: { $gte: sixMonths } } }, { $group: { _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }, n: { $sum: 1 } } }, { $sort: { _id: -1 } }]).toArray(),
    BillingEvent.aggregate<{ _id: { m: string; c: string }; total: number; n: number }>([
      { $match: { type: 'sale', isTest: { $ne: true }, receivedAt: { $gte: sixMonths }, amount: { $gt: 0 } } },
      { $group: { _id: { m: { $dateToString: { format: '%Y-%m', date: '$receivedAt' } }, c: '$currency' }, total: { $sum: '$amount' }, n: { $sum: 1 } } },
      { $sort: { '_id.m': -1 } },
    ]),
    BillingEvent.aggregate<{ _id: string; n: number }>([{ $match: { type: 'sale', isTest: { $ne: true }, receivedAt: { $gte: ninetyDays } } }, { $group: { _id: '$country', n: { $sum: 1 } } }, { $sort: { n: -1 } }, { $limit: 15 }]),
  ]);

  // Gumroad sends prices in cents
  const money = (cents: number, currency: string) => new Intl.NumberFormat(fmtLocale(locale), { style: 'currency', currency: currency || 'USD' }).format(cents / 100);
  const conversion = verified ? proUsers.length / verified : 0;
  const tiles = [
    { label: t('users'), value: String(total), hint: `${verified} ${t('verified')}` },
    { label: t('pro'), value: String(proUsers.length) },
    { label: t('conversion'), value: new Intl.NumberFormat(fmtLocale(locale), { style: 'percent', maximumFractionDigits: 1 }).format(conversion) },
  ];

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 sm:grid-cols-3">
        {tiles.map((x) => (
          <div key={x.label} className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-sm text-muted">{x.label}</p>
            <p className="tabular mt-1 font-display text-3xl font-extrabold">{x.value}</p>
            {x.hint && <p className="text-xs text-muted">{x.hint}</p>}
          </div>
        ))}
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-3 font-display text-lg font-bold">{t('signups')}</h2>
          <Table head={[t('month'), t('count')]} rows={signups.map((s) => [s._id, s.n])} empty={t('none')} />
        </section>
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-3 font-display text-lg font-bold">{t('revenue')}</h2>
          <Table head={[t('month'), t('sales'), t('amount')]} rows={revenue.map((r) => [r._id.m, r.n, money(r.total, r._id.c)])} empty={t('none')} />
          <p className="mt-2 text-xs text-muted">{t('testExcluded')}</p>
        </section>
        <section className="rounded-2xl border border-line bg-surface p-5">
          <h2 className="mb-3 font-display text-lg font-bold">{t('countries')}</h2>
          <Table head={[t('country'), t('sales')]} rows={countries.map((c) => [c._id || '—', c.n])} empty={t('none')} />
        </section>
      </div>
    </div>
  );
}
