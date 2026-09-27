import { getTranslations, setRequestLocale } from 'next-intl/server';
import { EmptyState, NewButton, SearchBox, escapeRegex } from '@/components/app/ListPage';
import { PageHeader } from '@/components/form/fields';
import { Link } from '@/i18n/navigation';
import { countryOptions } from '@/lib/countries';
import { connectDb } from '@/lib/db';
import { requireUser } from '@/lib/session';
import { Client } from '@/models/Client';

export default async function ClientsPage({ params, searchParams }: PageProps<'/[locale]/app/clients'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const t = await getTranslations('clients');
  const { q } = await searchParams;
  const query = typeof q === 'string' ? q.trim().slice(0, 100) : '';

  await connectDb();
  const filter = query ? { userId: user.id, $or: [{ name: { $regex: escapeRegex(query), $options: 'i' } }, { email: { $regex: escapeRegex(query), $options: 'i' } }] } : { userId: user.id };
  const [clients, total] = await Promise.all([Client.find(filter).sort({ name: 1 }).limit(200).lean(), Client.countDocuments({ userId: user.id })]);
  const countryName = new Map(countryOptions(locale).map((c) => [c.code, c.name]));

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader title={t('title')} subtitle={total ? t('countLabel', { count: total }) : undefined} action={total ? <NewButton href="/app/clients/new" label={t('new')} /> : undefined} />
      {total === 0 ? (
        <EmptyState title={t('emptyTitle')} text={t('emptyText')} cta={t('new')} href="/app/clients/new" />
      ) : (
        <>
          <SearchBox placeholder={t('title')} defaultValue={query} />
          {clients.length === 0 ? (
            <p className="text-muted">{t('noResults')}</p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              {clients.map((c) => (
                <li key={String(c._id)}>
                  <Link href={`/app/clients/${c._id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-bg">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{c.name}</p>
                      <p className="truncate text-sm text-muted">{[c.email, c.address?.city, countryName.get(c.address?.country ?? '')].filter(Boolean).join(' · ')}</p>
                    </div>
                    <span aria-hidden className="inline-block text-muted rtl:-scale-x-100">›</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
