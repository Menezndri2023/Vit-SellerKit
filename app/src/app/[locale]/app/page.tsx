import { getTranslations, setRequestLocale } from 'next-intl/server';
import StatusBadge from '@/components/documents/StatusBadge';
import { Link } from '@/i18n/navigation';
import { connectDb } from '@/lib/db';
import { todayIn } from '@/lib/documents/service';
import { displayStatus } from '@/lib/documents/status';
import { formatMinor } from '@/lib/money';
import { requireUser } from '@/lib/session';
import { BusinessProfile } from '@/models/BusinessProfile';
import { Document } from '@/models/Document';

const ISSUED = ['issued', 'sent', 'paid', 'accepted'];

/** Sums per currency — amounts in different currencies are never added together. */
function byCurrency(rows: { _id: string; total: number }[], locale: string) {
  return rows.filter((r) => r.total !== 0).map((r) => formatMinor(r.total, r._id, locale));
}

export default async function Dashboard({ params }: PageProps<'/[locale]/app'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const t = await getTranslations('app');
  const td = await getTranslations('dashboard');
  const tDocs = await getTranslations('documents');
  await connectDb();

  const today = todayIn((user as { timeZone?: string }).timeZone);
  const monthStart = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), 1));
  const [hasProfile, invoiced, unpaid, overdueCount, recent] = await Promise.all([
    BusinessProfile.exists({ userId: user.id }),
    Document.aggregate<{ _id: string; total: number }>([
      { $match: { userId: user.id, type: { $in: ['invoice', 'deposit_invoice', 'credit_note'] }, status: { $in: [...ISSUED, 'cancelled'] }, issueDate: { $gte: monthStart } } },
      { $group: { _id: '$currency', total: { $sum: { $cond: [{ $eq: ['$type', 'credit_note'] }, { $multiply: ['$totals.totalExclTax', -1] }, '$totals.totalExclTax'] } } } },
    ]),
    Document.aggregate<{ _id: string; total: number }>([
      { $match: { userId: user.id, type: { $in: ['invoice', 'deposit_invoice'] }, status: { $in: ['issued', 'sent'] } } },
      { $group: { _id: '$currency', total: { $sum: '$amountDue' } } },
    ]),
    Document.countDocuments({ userId: user.id, type: { $in: ['invoice', 'deposit_invoice'] }, status: { $in: ['issued', 'sent'] }, dueDate: { $lt: today }, amountDue: { $gt: 0 } }),
    Document.find({ userId: user.id }).sort({ updatedAt: -1 }).limit(5).lean(),
  ]);

  const invoicedTexts = byCurrency(invoiced, locale);
  const unpaidTexts = byCurrency(unpaid, locale);
  const tiles = [
    { label: td('revenueMonth'), value: invoicedTexts.length ? invoicedTexts : [td('none')], hint: td('exclTax'), href: '/app/documents?type=invoice' },
    { label: td('unpaid'), value: unpaidTexts.length ? unpaidTexts : [td('none')], href: '/app/documents?status=unpaid' },
    { label: td('overdue'), value: [td('overdueCount', { count: overdueCount })], href: '/app/documents?status=overdue', alert: overdueCount > 0 },
  ];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold">{t('welcome', { name: user.name.split(' ')[0] })}</h1>
          <p className="mt-1 text-muted">{t('dashboardSubtitle')}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/app/documents/new?type=quote" className="grid h-11 place-items-center rounded-xl border border-line bg-surface px-4 font-semibold hover:bg-bg">
            {tDocs('newQuote')}
          </Link>
          <Link href="/app/documents/new?type=invoice" className="grid h-11 place-items-center rounded-xl bg-primary px-4 font-semibold text-on-primary hover:brightness-95">
            {tDocs('newInvoice')}
          </Link>
        </div>
      </div>

      {!hasProfile && (
        <section className="rounded-2xl border border-dashed border-line bg-surface p-6 sm:p-8">
          <h2 className="font-display text-xl font-bold">{t('setupTitle')}</h2>
          <p className="mt-2 max-w-xl text-muted">{t('setupText')}</p>
          <Link href="/app/settings" className="mt-5 inline-grid h-12 place-items-center rounded-xl bg-primary px-6 font-semibold text-on-primary hover:brightness-95">
            {t('setupCta')}
          </Link>
        </section>
      )}

      <section className="grid gap-4 sm:grid-cols-3">
        {tiles.map((tile) => (
          <Link key={tile.label} href={tile.href} className="rounded-2xl border border-line bg-surface p-5 hover:border-primary-ink">
            <p className="text-sm text-muted">{tile.label}</p>
            {tile.value.map((v) => (
              <p key={v} className={`tabular mt-1 font-display text-2xl font-extrabold ${tile.alert ? 'text-loss' : ''}`}>
                {v}
              </p>
            ))}
            {tile.hint && <p className="text-xs text-muted">{tile.hint}</p>}
          </Link>
        ))}
      </section>

      {recent.length > 0 && (
        <section className="rounded-2xl border border-line bg-surface">
          <div className="flex items-center justify-between px-5 py-4">
            <h2 className="font-display text-lg font-bold">{td('recent')}</h2>
            <Link href="/app/documents" className="text-sm font-medium text-primary-ink hover:underline">
              {td('seeAll')}
            </Link>
          </div>
          <ul className="divide-y divide-line border-t border-line">
            {recent.map((d) => (
              <li key={String(d._id)}>
                <Link href={`/app/documents/${d._id}`} className="flex items-center justify-between gap-4 px-5 py-3 hover:bg-bg">
                  <span className="min-w-0 truncate">
                    <span className="text-xs font-medium uppercase text-muted">{tDocs(`types.${d.type}`)}</span> <strong>{d.number ?? tDocs('draftLabel')}</strong>
                    {d.buyer?.name ? <span className="text-muted"> · {d.buyer.name}</span> : null}
                  </span>
                  <span className="flex items-center gap-3">
                    <span className="tabular font-semibold">{formatMinor(d.totals?.totalInclTax ?? 0, d.currency, locale)}</span>
                    <StatusBadge status={displayStatus(d, today)} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
