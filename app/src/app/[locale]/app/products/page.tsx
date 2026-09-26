import { getTranslations, setRequestLocale } from 'next-intl/server';
import { EmptyState, NewButton, SearchBox, escapeRegex } from '@/components/app/ListPage';
import { PageHeader } from '@/components/form/fields';
import { Link } from '@/i18n/navigation';
import { connectDb } from '@/lib/db';
import { formatMinor } from '@/lib/money';
import { requireUser } from '@/lib/session';
import { Product } from '@/models/Product';

export default async function ProductsPage({ params, searchParams }: PageProps<'/[locale]/app/products'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const t = await getTranslations('products');
  const tc = await getTranslations('catalog');
  const { q } = await searchParams;
  const query = typeof q === 'string' ? q.trim().slice(0, 100) : '';

  await connectDb();
  const filter = query ? { userId: user.id, name: { $regex: escapeRegex(query), $options: 'i' } } : { userId: user.id };
  const [products, total] = await Promise.all([Product.find(filter).sort({ name: 1 }).limit(200).lean(), Product.countDocuments({ userId: user.id })]);

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <PageHeader title={t('title')} subtitle={total ? t('countLabel', { count: total }) : undefined} action={total ? <NewButton href="/app/products/new" label={t('new')} /> : undefined} />
      {total === 0 ? (
        <EmptyState title={t('emptyTitle')} text={t('emptyText')} cta={t('new')} href="/app/products/new" />
      ) : (
        <>
          <SearchBox placeholder={t('title')} defaultValue={query} />
          {products.length === 0 ? (
            <p className="text-muted">{t('noResults')}</p>
          ) : (
            <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">
              {products.map((p) => (
                <li key={String(p._id)}>
                  <Link href={`/app/products/${p._id}`} className="flex items-center justify-between gap-4 px-5 py-4 hover:bg-bg">
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{p.name}</p>
                      <p className="truncate text-sm text-muted">{[tc(`kinds.${p.kind}`), p.vatCategory === 'S' ? `${p.taxRate} %` : tc(`vat.${p.vatCategory}`)].join(' · ')}</p>
                    </div>
                    <div className="text-end">
                      <p className="tabular font-semibold">{formatMinor(p.unitPrice, p.currency, locale)}</p>
                      <p className="text-xs text-muted">{t('perUnit', { unit: tc(`units.${p.unitCode}`).toLowerCase() })}</p>
                    </div>
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
