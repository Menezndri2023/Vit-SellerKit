'use client';

import { useActionState, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { submitReview } from '@/app/[locale]/(site)/reviews/actions';
import { keepValues } from '@/components/form/fields';
import type { FormState } from '@/lib/forms';
import { KITS, type Kit } from '@/lib/reviews-shared';

const control = 'w-full rounded-xl border border-line bg-bg px-3 text-base outline-none focus:border-primary-ink focus:ring-2 focus:ring-primary/40';

/** `signedInEmail`: when set, the review uses the account email and needs no email confirmation. */
export default function ReviewForm({ defaultKit, signedInEmail, defaultName }: { defaultKit: Kit; signedInEmail?: string; defaultName?: string }) {
  const t = useTranslations('reviews');
  const te = useTranslations('errors');
  const locale = useLocale();
  const [state, action, pending] = useActionState<FormState, FormData>(submitReview, {});
  const [rating, setRating] = useState(0);
  const err = (field: string) => {
    const key = state.errors?.[field];
    if (!key) return null;
    return <p className="mt-1 text-sm text-loss">{t.has(`errors.${key}`) ? t(`errors.${key}`) : te(key)}</p>;
  };

  if (state.ok) {
    return (
      <div role="status" className="rounded-2xl border border-line bg-surface p-6">
        <p className="font-display text-xl font-bold">{t('thanksTitle')}</p>
        <p className="mt-2 text-muted">{t(state.id === 'confirm' ? 'thanksConfirm' : 'thanksPending')}</p>
      </div>
    );
  }

  return (
    <form onSubmit={keepValues(action)} className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5 sm:p-6" noValidate>
      <input type="hidden" name="locale" value={locale} />
      <input name="website" type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t('form.kit')}
        <select id="review-kit" name="kit" defaultValue={defaultKit} className={`${control} h-12`}>
          {KITS.map((k) => (
            <option key={k} value={k}>
              {t(`kits.${k}.name`)}
            </option>
          ))}
        </select>
      </label>

      <fieldset>
        <legend className="text-sm font-medium">{t('form.rating')}</legend>
        <div className="mt-1.5 flex gap-1">
          {[1, 2, 3, 4, 5].map((n) => (
            <label key={n} className="cursor-pointer">
              <input type="radio" name="rating" value={n} className="peer sr-only" checked={rating === n} onChange={() => setRating(n)} aria-label={t('starsLabel', { rating: n })} />
              <svg aria-hidden viewBox="0 0 20 20" className={`size-9 rounded-md transition peer-focus-visible:ring-2 peer-focus-visible:ring-primary ${n <= rating ? 'text-amber-500' : 'text-line'}`}>
                <path fill="currentColor" d="M10 1.5 12.6 7l6 .6-4.5 4 1.3 5.9L10 14.5l-5.4 3 1.3-5.9-4.5-4 6-.6L10 1.5Z" />
              </svg>
            </label>
          ))}
        </div>
        {err('rating')}
      </fieldset>

      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t('form.comment')}
        <textarea id="review-comment" name="comment" rows={5} maxLength={1000} placeholder={t('form.commentPlaceholder')} className={`${control} py-3`} />
        {err('comment')}
      </label>

      <div className="grid gap-5 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {t('form.name')}
          <input id="review-name" name="name" maxLength={60} defaultValue={defaultName} autoComplete="name" className={`${control} h-12`} />
          <span className="text-xs font-normal text-muted">{t('form.nameHint')}</span>
          {err('name')}
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {t('form.location')}
          <input id="review-location" name="location" maxLength={60} placeholder={t('form.locationPlaceholder')} className={`${control} h-12`} />
          {err('location')}
        </label>
      </div>

      {signedInEmail ? (
        <p className="text-sm text-muted">{t('form.signedIn', { email: signedInEmail })}</p>
      ) : (
        <label className="flex flex-col gap-1.5 text-sm font-medium">
          {t('form.email')}
          <input id="review-email" name="email" type="email" maxLength={254} autoComplete="email" className={`${control} h-12`} />
          <span className="text-xs font-normal text-muted">{t('form.emailHint')}</span>
          {err('email')}
        </label>
      )}

      <label className="flex items-start gap-3 text-sm">
        <input id="review-consent" name="consent" type="checkbox" className="mt-0.5 size-5 accent-primary-ink" />
        <span>{t('form.consent')}</span>
      </label>
      {err('consent')}
      {err('_form')}

      <button type="submit" disabled={pending} className="h-12 rounded-xl bg-primary px-6 font-semibold text-on-primary hover:brightness-95 disabled:opacity-60 sm:self-start">
        {pending ? t('form.sending') : t('form.submit')}
      </button>
    </form>
  );
}
