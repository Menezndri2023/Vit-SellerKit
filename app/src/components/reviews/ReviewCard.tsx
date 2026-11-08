import { getTranslations } from 'next-intl/server';
import { fmtLocale } from '@/lib/intl';
import type { PublicReview } from '@/lib/reviews';
import Stars from './Stars';

export default async function ReviewCard({ review, locale, showKit = false }: { review: PublicReview; locale: string; showKit?: boolean }) {
  const t = await getTranslations('reviews');
  const date = new Intl.DateTimeFormat(fmtLocale(locale), { dateStyle: 'medium' }).format(review.date);
  return (
    <figure className="flex flex-col gap-3 rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <Stars value={review.rating} label={t('starsLabel', { rating: review.rating })} />
        {review.verified && (
          <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary-ink">{t(review.verified === 'purchase' ? 'verifiedPurchase' : 'verifiedUser')}</span>
        )}
      </div>
      <blockquote className="whitespace-pre-line text-ink">{review.comment}</blockquote>
      <figcaption className="mt-auto text-sm text-muted">
        <strong className="text-ink">{review.name}</strong>
        {review.location ? ` · ${review.location}` : ''} · {date}
        {showKit ? ` · ${t(`kits.${review.kit}.name`)}` : ''}
      </figcaption>
    </figure>
  );
}
