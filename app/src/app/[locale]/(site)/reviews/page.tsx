import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ReviewCard from '@/components/reviews/ReviewCard';
import ReviewForm from '@/components/reviews/ReviewForm';
import Stars from '@/components/reviews/Stars';
import { Link } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';
import { approvedReviews, reviewSummaries } from '@/lib/reviews';
import { isKit, KITS } from '@/lib/reviews-shared';
import { getSession } from '@/lib/session';

export async function generateMetadata({ params }: PageProps<'/[locale]/reviews'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'reviews' });
  const languages = Object.fromEntries(routing.locales.map((l) => [l, `/${l}/reviews`]));
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical: `/${locale}/reviews`, languages: { ...languages, 'x-default': `/${routing.defaultLocale}/reviews` } },
  };
}

export default async function ReviewsPage({ params, searchParams }: PageProps<'/[locale]/reviews'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('reviews');
  const sp = await searchParams;
  const kit = isKit(sp.kit) ? sp.kit : undefined;
  const [summaries, reviews, session] = await Promise.all([reviewSummaries(), approvedReviews({ kit }), getSession()]);
  const user = session?.user;
  const fmt = (n: number) => new Intl.NumberFormat(locale === 'ar' ? 'ar-u-nu-latn' : locale, { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(n);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-28 pt-4 sm:px-6 lg:pb-12">
      <section className="max-w-3xl">
        <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{t('title')}</h1>
        <p className="mt-4 text-lg text-muted">{t('subtitle')}</p>
        <a href="#write" className="mt-6 inline-grid h-12 place-items-center rounded-xl bg-primary px-6 font-semibold text-on-primary hover:brightness-95">
          {t('write')}
        </a>
      </section>

      <section aria-label={t('summaryLabel')} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KITS.map((k) => {
          const s = summaries[k];
          return (
            <Link
              key={k}
              href={{ pathname: '/reviews', query: kit === k ? {} : { kit: k } }}
              scroll={false}
              aria-current={kit === k ? 'true' : undefined}
              className={`flex flex-col gap-2 rounded-2xl border p-5 transition ${kit === k ? 'border-primary-ink bg-primary-soft' : 'border-line bg-surface hover:border-primary-ink'}`}
            >
              <span className="font-display text-lg font-bold">{t(`kits.${k}.name`)}</span>
              <span className="text-sm text-muted">{t(`kits.${k}.what`)}</span>
              <span className="mt-auto flex items-center gap-2 pt-2 text-sm">
                {s.average !== null ? (
                  <>
                    <Stars value={s.average} label={t('averageLabel', { average: fmt(s.average) })} />
                    <strong className="tabular">{fmt(s.average)}</strong>
                    <span className="text-muted">· {t('count', { count: s.count })}</span>
                  </>
                ) : (
                  <span className="text-muted">{t('noneYet')}</span>
                )}
              </span>
            </Link>
          );
        })}
      </section>

      <section>
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <h2 className="font-display text-2xl font-bold">{kit ? t('listFor', { kit: t(`kits.${kit}.name`) }) : t('listAll')}</h2>
          {kit && (
            <Link href="/reviews" scroll={false} className="text-sm font-medium text-primary-ink hover:underline">
              {t('showAll')}
            </Link>
          )}
        </div>
        {reviews.length ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((r) => (
              <ReviewCard key={r.id} review={r} locale={locale} showKit={!kit} />
            ))}
          </div>
        ) : (
          <p className="mt-4 rounded-2xl border border-dashed border-line p-6 text-muted">{t('empty')}</p>
        )}
      </section>

      <section id="write" className="grid scroll-mt-6 gap-8 lg:grid-cols-[1fr_1.4fr]">
        <div>
          <h2 className="font-display text-2xl font-bold">{t('formTitle')}</h2>
          <p className="mt-2 text-muted">{t('formText')}</p>
          <ul className="mt-5 flex flex-col gap-2 text-sm text-muted">
            <li>✓ {t('rule1')}</li>
            <li>✓ {t('rule2')}</li>
            <li>✓ {t('rule3')}</li>
          </ul>
        </div>
        <ReviewForm defaultKit={kit ?? 'calculator'} signedInEmail={user?.emailVerified ? user.email : undefined} defaultName={user?.name} />
      </section>
    </div>
  );
}
