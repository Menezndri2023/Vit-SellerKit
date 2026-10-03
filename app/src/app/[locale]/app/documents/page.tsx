import { getTranslations, setRequestLocale } from 'next-intl/server';
import { EmptyState, SearchBox, escapeRegex } from '@/components/app/ListPage';
import StatusBadge from '@/components/documents/StatusBadge';
import { PageHeader } from '@/components/form/fields';
import { Link } from '@/i18n/navigation';
import { connectDb } from '@/lib/db';
import { todayIn } from '@/lib/documents/service';
import { displayStatus } from '@/lib/documents/status';
import { formatMinor } from '@/lib/money';
import { requireUser } from '@/lib/session';
import { Client } from '@/models/Client';
import { Document } from '@/models/Document';
import { fmtLocale } from '@/lib/intl';

const TABS = ['all', 'quote', 'invoice', 'credit_note'] as const;
const FILTERS = ['all', 'draft', 'unpaid', 'overdue', 'paid'] as const;

export default async function DocumentsPage({ params, searchParams }: PageProps<'/[locale]/app/documents'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const t = await getTranslations('documents');
  const sp = await searchParams;
  const tab = TABS.find((x) => x === sp.type) ?? 'all';
  const filter = FILTERS.find((x) => x === sp.status) ?? 'all';
  const q = typeof sp.q === 'string' ? sp.q.trim().slice(0, 100) : '';
  const today = todayIn((user as { timeZone?: string }).timeZone);

  await connectDb();
  const total = await Document.countDocuments({ userId: user.id });
  const query: Record<string, unknown> = { userId: user.id };
  if (tab !== 'all') query.type = tab === 'invoice' ? { $in: ['invoice', 'deposit_invoice'] } : tab;
  if (filter === 'draft') query.status = 'draft';
  if (filter === 'paid') query.status = 'paid';
  if (filter === 'unpaid') Object.assign(query, { type: { $in: ['invoice', 'deposit_invoice'] }, status: { $in: ['issued', 'sent'] } });
  if (filter === 'overdue') Object.assign(query, { type: { $in: ['invoice', 'deposit_invoice'] }, status: { $in: ['issued', 'sent'] }, dueDate: { $lt: today }, amountDue: { $gt: 0 } });
  if (q) {
    const rx = { $regex: escapeRegex(q), $options: 'i' };
    const clientIds = (await Client.find({ userId: user.id, name: rx }).select('_id').limit(100).lean()).map((c) => String(c._id));
    query.$or = [{ number: rx }, { 'buyer.name': rx }, { clientId: { $in: clientIds } }];
  }
  const docs = await Document.find(query).sort({ issueDate: -1, createdAt: -1 }).limit(200).lean();
  const names = new Map((await Client.find({ userId: user.id, _id: { $in: docs.map((d) => d.clientId).filter(Boolean) } }).select('name').lean()).map((c) => [String(c._id), c.name]));
  const dateFmt = new Intl.DateTimeFormat(fmtLocale(locale), { timeZone: 'UTC', dateStyle: 'medium' });
  const href = (patch: Record<string, string>) => {
    const p = new URLSearchParams({ ...(tab !== 'all' && { type: tab }), ...(filter !== 'all' && { status: filter }), ...(q && { q }), ...patch });
    for (const [k, v] of [...p]) if (v === 'all') p.delete(k);
    const s = p.toString();
    return `/app/documents${s ? `?${s}` : ''}`;
  };

  const newButtons = (
    <div className="flex gap-2">
      <Link href="/app/documents/new?type=quote" className="grid h-11 place-items-center rounded-xl border border-line bg-surface px-4 font-semibold hover:bg-bg">
        {t('newQuote')}
      </Link>
      <Link href="/app/documents/new?type=invoice" className="grid h-11 place-items-center rounded-xl bg-primary px-4 font-semibold text-on-primary hover:brightness-95">
        {t('newInvoice')}
      </Link>
    </div>
  );

  if (total === 0) {
    return (
      <div className="mx-auto flex max-w-5xl flex-col gap-6">
        <PageHeader title={t('title')} />
        <EmptyState title={t('emptyTitle')} text={t('emptyText')} cta={t('newInvoice')} href="/app/documents/new?type=invoice" />
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-5">
      <PageHeader title={t('title')} subtitle={t('countLabel', { count: total })} action={newButtons} />
      <nav className="flex gap-1 overflow-x-auto border-b border-line">
        {TABS.map((x) => (
          <Link key={x} href={href({ type: x })} className={`whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium ${tab === x ? 'border-primary-ink text-ink' : 'border-transparent text-muted hover:text-ink'}`}>
            {t(`tabs.${x}`)}
          </Link>
        ))}
      </nav>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          {FILTERS.map((x) => (
            <Link key={x} href={href({ status: x })} className={`rounded-full px-3 py-1.5 text-sm font-medium ${filter === x ? 'bg-ink text-bg' : 'bg-surface text-muted ring-1 ring-line hover:text-ink'}`}>
              {t(`filters.${x}`)}
            </Link>
          ))}
        </div>
        <SearchBox placeholder={t('title')} defaultValue={q} />
      </div>
      {docs.length === 0 ? (
        <p className="text-muted">{t('noResults')}</p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
          {docs.map((d) => (
            <li key={String(d._id)}>
              <Link href={`/app/documents/${d._id}`} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-5 py-4 hover:bg-bg sm:grid-cols-[160px_1fr_auto_auto]">
                <p className="font-semibold">
                  <span className="me-2 text-xs font-medium uppercase text-muted">{t(`types.${d.type}`)}</span>
                  <span className="block whitespace-nowrap sm:inline">{d.number ?? t('draftLabel')}</span>
                </p>
                <p className="tabular text-end font-semibold sm:order-3">{formatMinor(d.totals?.totalInclTax ?? 0, d.currency, locale)}</p>
                <p className="truncate text-sm text-muted sm:order-2">
                  {d.buyer?.name ?? names.get(d.clientId ?? '') ?? t('noClient')} · {dateFmt.format(d.issueDate)}
                </p>
                <span className="justify-self-end sm:order-4">
                  <StatusBadge status={displayStatus(d, today)} />
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
