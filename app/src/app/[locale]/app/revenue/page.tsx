import { getTranslations, setRequestLocale } from 'next-intl/server';
import { EmptyState } from '@/components/app/ListPage';
import { PageHeader } from '@/components/form/fields';
import { Link } from '@/i18n/navigation';
import { connectDb } from '@/lib/db';
import { todayIn } from '@/lib/documents/service';
import { fmtLocale } from '@/lib/intl';
import { formatMinor } from '@/lib/money';
import { getRevenue } from '@/lib/revenue';
import { requireUser } from '@/lib/session';
import { BusinessProfile } from '@/models/BusinessProfile';

export default async function RevenuePage({ params, searchParams }: PageProps<'/[locale]/app/revenue'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const t = await getTranslations('revenue');
  const sp = await searchParams;
  const year = Number(typeof sp.year === 'string' ? sp.year : '') || undefined;
  const currency = typeof sp.currency === 'string' ? sp.currency.toUpperCase().slice(0, 3) : undefined;

  await connectDb();
  const profile = await BusinessProfile.findOne({ userId: user.id }).select('defaultCurrency').lean();
  const today = todayIn((user as { timeZone?: string }).timeZone);
  const r = await getRevenue(user.id, { year, currency, defaultCurrency: profile?.defaultCurrency ?? undefined, today });

  if (!r) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <PageHeader title={t('title')} />
        <EmptyState title={t('emptyTitle')} text={t('emptyText')} cta={t('emptyCta')} href="/app/documents/new?type=invoice" />
      </div>
    );
  }

  const money = (v: number) => formatMinor(v, r.currency, locale);
  const monthNames = Array.from({ length: 12 }, (_, m) => new Intl.DateTimeFormat(fmtLocale(locale), { month: 'short', timeZone: 'UTC' }).format(new Date(Date.UTC(2026, m, 1))));
  const max = Math.max(1, ...r.invoiced, ...r.collected);
  const pct = (v: number, sign = false) => new Intl.NumberFormat(fmtLocale(locale), { style: 'percent', maximumFractionDigits: 0, ...(sign ? { signDisplay: 'exceptZero' as const } : {}) }).format(v);
  const change = r.invoicedPrevious > 0 ? (r.invoicedTotal - r.invoicedPrevious) / r.invoicedPrevious : null;
  const href = (q: { year?: number; currency?: string }) => ({ pathname: '/app/revenue', query: { year: String(q.year ?? r.year), currency: q.currency ?? r.currency } });
  const pill = (active: boolean) => `rounded-full border px-3 py-1 text-sm font-medium ${active ? 'border-primary-ink bg-primary-soft text-primary-ink' : 'border-line bg-surface text-muted hover:text-ink'}`;

  const tiles = [
    { label: t('invoiced', { year: r.year }), value: money(r.invoicedTotal), hint: change === null ? t('exclTax') : t('vsLastYear', { change: pct(change, true) }), tone: change !== null && change < 0 ? 'text-loss' : '' },
    { label: t('collected', { year: r.year }), value: money(r.collectedTotal), hint: t('collectedHint') },
    { label: t('outstanding'), value: money(r.outstanding), hint: r.overdue > 0 ? t('overdueHint', { amount: money(r.overdue) }) : t('outstandingHint'), tone: r.overdue > 0 ? 'text-loss' : '' },
    { label: t('average'), value: r.invoiceCount ? money(Math.round(r.invoicedTotal / r.invoiceCount)) : '—', hint: r.averageDaysToPay === null ? t('invoiceCount', { count: r.invoiceCount }) : t('daysToPay', { days: r.averageDaysToPay }) },
  ];

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />

      <nav aria-label={t('filters')} className="flex flex-wrap items-center gap-2">
        {r.years.map((y) => (
          <Link key={y} href={href({ year: y })} className={pill(y === r.year)} aria-current={y === r.year ? 'page' : undefined}>
            {y}
          </Link>
        ))}
        {r.currencies.length > 1 && <span aria-hidden className="mx-1 h-5 border-s border-line" />}
        {r.currencies.length > 1 &&
          r.currencies.map((c) => (
            <Link key={c} href={href({ currency: c })} className={pill(c === r.currency)} aria-current={c === r.currency ? 'page' : undefined}>
              {c}
            </Link>
          ))}
      </nav>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.label} className="rounded-2xl border border-line bg-surface p-5">
            <p className="text-sm text-muted">{tile.label}</p>
            <p className="tabular mt-1 font-display text-2xl font-extrabold">{tile.value}</p>
            <p className={`text-xs text-muted ${tile.tone}`}>{tile.hint}</p>
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5" aria-labelledby="by-month">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="by-month" className="font-display text-lg font-bold">
            {t('byMonth')}
          </h2>
          <p className="flex gap-4 text-xs text-muted" aria-hidden>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-primary" /> {t('legendInvoiced')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="size-3 rounded-sm bg-profit" /> {t('legendCollected')}
            </span>
          </p>
        </div>
        {/* Visual chart; the same figures are in the table below for screen readers */}
        <div aria-hidden className="mt-5 grid h-48 grid-cols-12 items-end gap-1 sm:gap-2">
          {monthNames.map((name, m) => (
            <div key={name} className="flex h-full flex-col justify-end">
              <div className="flex flex-1 items-end justify-center gap-0.5">
                <div className="w-1/2 max-w-4 rounded-t bg-primary" style={{ height: `${(Math.max(0, r.invoiced[m]) / max) * 100}%` }} title={`${name} · ${money(r.invoiced[m])}`} />
                <div className="w-1/2 max-w-4 rounded-t bg-profit" style={{ height: `${(r.collected[m] / max) * 100}%` }} title={`${name} · ${money(r.collected[m])}`} />
              </div>
              <span className="mt-1 truncate text-center text-[10px] text-muted sm:text-xs">{name}</span>
            </div>
          ))}
        </div>
        <details className="mt-4 text-sm">
          <summary className="cursor-pointer text-muted hover:text-ink">{t('table')}</summary>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-muted">
                <th scope="col" className="py-1 text-start font-medium">{t('month')}</th>
                <th scope="col" className="py-1 text-end font-medium">{t('legendInvoiced')}</th>
                <th scope="col" className="py-1 text-end font-medium">{t('legendCollected')}</th>
              </tr>
            </thead>
            <tbody className="tabular">
              {monthNames.map((name, m) => (
                <tr key={name} className="border-t border-line">
                  <th scope="row" className="py-1 text-start font-normal">{name}</th>
                  <td className="py-1 text-end">{money(r.invoiced[m])}</td>
                  <td className="py-1 text-end">{money(r.collected[m])}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </details>
      </section>

      <section className="rounded-2xl border border-line bg-surface" aria-labelledby="top-clients">
        <h2 id="top-clients" className="px-5 py-4 font-display text-lg font-bold">
          {t('topClients', { year: r.year })}
        </h2>
        {r.topClients.length === 0 ? (
          <p className="border-t border-line px-5 py-4 text-sm text-muted">{t('noClients')}</p>
        ) : (
          <ul className="divide-y divide-line border-t border-line">
            {r.topClients.map((c) => (
              <li key={c.name} className="flex items-center gap-4 px-5 py-3">
                <span className="min-w-0 flex-1 truncate font-medium">{c.name}</span>
                <span className="hidden w-32 sm:block" aria-hidden>
                  <span className="block h-2 rounded-full bg-primary" style={{ width: `${r.invoicedTotal > 0 ? Math.min(100, (c.total / r.invoicedTotal) * 100) : 0}%` }} />
                </span>
                <span className="tabular w-12 text-end text-sm text-muted">{r.invoicedTotal > 0 ? pct(c.total / r.invoicedTotal) : ''}</span>
                <span className="tabular font-semibold">{money(c.total)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
      <p className="text-xs text-muted">{t('note')}</p>
    </div>
  );
}
