'use client';

import { useActionState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { createRecurrence, stopRecurrence, type RecurrenceState } from '@/app/[locale]/app/documents/actions';
import { Link } from '@/i18n/navigation';
import { fmtLocale } from '@/lib/intl';
import { Alert } from '../auth/ui';

type Active = { id: string; frequency: string; nextDate: string; createdCount: number } | null;

/** Invoice page: repeat this invoice (Pro). Each date creates a draft to review and issue. */
export default function RecurringPanel({ id, isPro, active, defaultStart }: { id: string; isPro: boolean; active: Active; defaultStart: string }) {
  const t = useTranslations('recurring');
  const locale = useLocale();
  const [state, action, pending] = useActionState<RecurrenceState, FormData>(createRecurrence.bind(null, id), {});
  const [stopping, start] = useTransition();
  const date = (iso: string) => new Intl.DateTimeFormat(fmtLocale(locale), { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(iso));
  const control = 'h-11 rounded-xl border border-line bg-surface px-3 text-base outline-none focus:border-primary-ink focus:ring-2 focus:ring-primary/40';
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6" aria-labelledby="recurring-title">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="recurring-title" className="font-display text-lg font-bold">
          {t('title')}
        </h2>
        <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-on-primary">Pro</span>
      </div>
      <p className="mt-1 text-sm text-muted">{t('intro')}</p>
      {active ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <p className="text-sm">
            <strong>{t(`every.${active.frequency as 'monthly'}`)}</strong> · {t('next', { date: date(active.nextDate) })} · {t('created', { count: active.createdCount })}
          </p>
          <button type="button" disabled={stopping} onClick={() => start(() => stopRecurrence(active.id))} className="text-sm font-medium text-loss hover:underline disabled:opacity-60">
            {t('stop')}
          </button>
        </div>
      ) : !isPro ? (
        <p className="mt-4 text-sm">
          {t('proOnly')}{' '}
          <Link href="/activate" className="font-semibold text-primary-ink underline">
            {t('goPro')}
          </Link>
        </p>
      ) : (
        <form action={action} className="mt-4 flex flex-wrap items-end gap-3">
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t('frequency')}
            <select name="frequency" defaultValue="monthly" className={control}>
              {(['monthly', 'quarterly', 'yearly'] as const).map((f) => (
                <option key={f} value={f}>
                  {t(`every.${f}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 text-sm font-medium">
            {t('start')}
            <input name="start" type="date" required defaultValue={defaultStart} className={control} />
          </label>
          <button type="submit" disabled={pending} className="h-11 rounded-xl bg-primary px-5 font-semibold text-on-primary hover:brightness-95 disabled:opacity-60">
            {pending ? '…' : t('create')}
          </button>
          {state.error && (
            <div className="w-full">
              <Alert tone="error">{t(`errors.${state.error}`)}</Alert>
            </div>
          )}
        </form>
      )}
    </section>
  );
}
