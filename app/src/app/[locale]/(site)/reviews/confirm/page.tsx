import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { confirmReview } from '../actions';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function ConfirmReviewPage({ params, searchParams }: PageProps<'/[locale]/reviews/confirm'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('reviews.confirm');
  const sp = await searchParams;
  const token = typeof sp.token === 'string' ? sp.token : '';
  const state = sp.done ? 'done' : sp.error || !token ? 'error' : 'ask';

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-5 px-4 pb-28 pt-10 sm:px-6">
      <h1 className="font-display text-3xl font-extrabold">{t(`${state}Title`)}</h1>
      <p className="text-muted">{t(`${state}Text`)}</p>
      {state === 'ask' ? (
        <form action={confirmReview}>
          <input type="hidden" name="token" value={token} />
          <input type="hidden" name="locale" value={locale} />
          <button type="submit" className="h-12 rounded-xl bg-primary px-6 font-semibold text-on-primary hover:brightness-95">
            {t('button')}
          </button>
        </form>
      ) : (
        <Link href="/reviews" className="font-medium text-primary-ink hover:underline">
          {t('back')}
        </Link>
      )}
    </div>
  );
}
