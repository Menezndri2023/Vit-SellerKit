import { getTranslations, setRequestLocale } from 'next-intl/server';
import { connectDb } from '@/lib/db';
import { BillingEvent } from '@/models/BillingEvent';

export default async function AdminSales({ params }: PageProps<'/[locale]/admin/sales'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin.sales');
  await connectDb();
  const events = await BillingEvent.find().sort({ receivedAt: -1 }).limit(200).lean();
  const date = (d: Date) => new Intl.DateTimeFormat(locale, { dateStyle: 'short', timeStyle: 'short' }).format(d);
  const money = (cents?: number | null, currency?: string | null) => (cents ? new Intl.NumberFormat(locale, { style: 'currency', currency: currency || 'USD' }).format(cents / 100) : '');

  if (!events.length) return <p className="rounded-2xl border border-dashed border-line p-6 text-muted">{t('none')}</p>;
  return (
    <section className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="tabular w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-line text-xs uppercase text-muted">
            {[t('date'), t('type'), t('product'), t('email'), t('amount'), t('country'), t('verified')].map((h) => (
              <th key={h} className="px-4 py-3 text-start font-semibold">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.map((e) => (
            <tr key={String(e._id)} className="border-b border-line last:border-0">
              <td className="px-4 py-3 whitespace-nowrap">{date(e.receivedAt)}</td>
              <td className="px-4 py-3">
                {e.type} {e.isTest && <span className="rounded bg-warn/15 px-1.5 text-xs text-warn">{t('test')}</span>}
              </td>
              <td className="px-4 py-3">{e.productName ?? e.productId}</td>
              <td className="px-4 py-3">{e.email}</td>
              <td className="px-4 py-3 whitespace-nowrap">{money(e.amount, e.currency)}</td>
              <td className="px-4 py-3">{e.country}</td>
              <td className="px-4 py-3">{e.verified ? '✓' : ''}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
