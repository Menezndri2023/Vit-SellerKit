import { getTranslations, setRequestLocale } from 'next-intl/server';
import ReviewModeration from '@/components/admin/ReviewModeration';
import Stars from '@/components/reviews/Stars';
import { Link } from '@/i18n/navigation';
import { connectDb } from '@/lib/db';
import { fmtLocale } from '@/lib/intl';
import { REVIEW_STATUSES, type ReviewStatus } from '@/lib/reviews-shared';
import { Review } from '@/models/Review';

export default async function AdminReviews({ params, searchParams }: PageProps<'/[locale]/admin/reviews'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('admin.reviews');
  const tr = await getTranslations('reviews');
  const sp = await searchParams;
  const status: ReviewStatus = REVIEW_STATUSES.includes(sp.status as ReviewStatus) ? (sp.status as ReviewStatus) : 'pending';
  await connectDb();
  const [counts, reviews] = await Promise.all([
    Review.aggregate<{ _id: ReviewStatus; n: number }>([{ $group: { _id: '$status', n: { $sum: 1 } } }]),
    Review.find({ status }).sort({ updatedAt: -1 }).limit(200).lean(),
  ]);
  const count = (s: ReviewStatus) => counts.find((c) => c._id === s)?.n ?? 0;
  const date = (d?: Date | null) => (d ? new Intl.DateTimeFormat(fmtLocale(locale), { dateStyle: 'medium', timeStyle: 'short' }).format(d) : '');

  return (
    <div className="flex flex-col gap-6">
      <nav className="flex flex-wrap gap-2" aria-label={t('filter')}>
        {(['pending', 'approved', 'rejected', 'unconfirmed'] as const).map((s) => (
          <Link
            key={s}
            href={{ pathname: '/admin/reviews', query: { status: s } }}
            aria-current={s === status ? 'page' : undefined}
            className={`rounded-full border px-3 py-1.5 text-sm font-medium ${s === status ? 'border-ink bg-ink text-bg' : 'border-line bg-surface text-muted hover:text-ink'}`}
          >
            {t(`status.${s}`)} · {count(s)}
          </Link>
        ))}
      </nav>
      {status === 'unconfirmed' && <p className="text-sm text-muted">{t('unconfirmedHelp')}</p>}

      {reviews.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-line p-6 text-muted">{t('none')}</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {reviews.map((r) => (
            <li key={String(r._id)} className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm">
                <span className="rounded-full bg-bg px-2.5 py-0.5 font-semibold">{tr(`kits.${r.kit}.name`)}</span>
                <Stars value={r.rating} label={tr('starsLabel', { rating: r.rating })} />
                {r.verified ? (
                  <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary-ink">{tr(r.verified === 'purchase' ? 'verifiedPurchase' : 'verifiedUser')}</span>
                ) : (
                  <span className="text-xs text-muted">{t('notVerified')}</span>
                )}
                <span className="text-muted">{date(r.updatedAt)}</span>
              </div>
              <p className="whitespace-pre-line">{r.comment}</p>
              <p className="text-sm text-muted">
                <strong className="text-ink">{r.name}</strong>
                {r.location ? ` · ${r.location}` : ''} · {r.email} · {r.locale}
                {r.userId ? ` · ${t('account')}` : ''}
              </p>
              <ReviewModeration id={String(r._id)} status={r.status} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
