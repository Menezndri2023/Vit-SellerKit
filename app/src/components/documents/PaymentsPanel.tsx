'use client';

import { useActionState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { addPayment, removePayment } from '@/app/[locale]/app/documents/actions';
import { keepValues } from '@/components/form/fields';
import type { FormState } from '@/lib/forms';
import { formatMinor, toInput } from '@/lib/money';

type Payment = { _id: string; amount: number; date: string; method: string; reference?: string };

const control = 'h-11 w-full rounded-xl border border-line bg-surface px-3 text-base outline-none focus:border-primary-ink focus:ring-2 focus:ring-primary/40';
const METHODS = ['transfer', 'card', 'cash', 'cheque', 'mobile', 'other'] as const;

export default function PaymentsPanel({ id, currency, payments, amountDue, canAdd, today }: { id: string; currency: string; payments: Payment[]; amountDue: number; canAdd: boolean; today: string }) {
  const t = useTranslations('documents.payments');
  const te = useTranslations('errors');
  const locale = useLocale();
  const [state, action, pending] = useActionState<FormState, FormData>(addPayment.bind(null, id), {});
  const money = (m: number) => formatMinor(m, currency, locale);
  const error = state.errors ? Object.values(state.errors)[0] : null;

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <div className="flex items-baseline justify-between">
        <h2 className="font-display text-lg font-bold">{t('title')}</h2>
        <p className="text-sm">
          {t('due')} : <strong className="tabular">{money(amountDue)}</strong>
        </p>
      </div>
      {payments.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{t('none')}</p>
      ) : (
        <ul className="mt-3 divide-y divide-line text-sm">
          {payments.map((p) => (
            <li key={p._id} className="flex items-center justify-between gap-3 py-2">
              <span>
                <strong className="tabular">{money(p.amount)}</strong> · {new Intl.DateTimeFormat(locale, { timeZone: 'UTC', dateStyle: 'medium' }).format(new Date(p.date))} · {t(`methods.${p.method as 'transfer'}`)}
                {p.reference ? ` · ${p.reference}` : ''}
              </span>
              <button type="button" className="text-xs text-muted hover:text-loss" onClick={() => void removePayment(id, p._id)}>
                {t('remove')}
              </button>
            </li>
          ))}
        </ul>
      )}
      {canAdd && amountDue > 0 && (
        <form onSubmit={keepValues(action)} className="mt-4 grid gap-3 sm:grid-cols-4" noValidate>
          <label className="text-xs font-medium text-muted">
            {t('amount')}
            <input name="amount" inputMode="decimal" className={control} defaultValue={toInput(amountDue, currency, locale)} />
          </label>
          <label className="text-xs font-medium text-muted">
            {t('date')}
            <input name="date" type="date" className={control} defaultValue={today} />
          </label>
          <label className="text-xs font-medium text-muted">
            {t('method')}
            <select name="method" className={control} defaultValue="transfer">
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {t(`methods.${m}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="text-xs font-medium text-muted">
            {t('reference')}
            <input name="reference" maxLength={100} className={control} />
          </label>
          {error && <p className="text-sm text-loss sm:col-span-4">{te.has(error as 'invalid') ? te(error as 'invalid') : te('invalid')}</p>}
          <button type="submit" disabled={pending} className="h-11 rounded-xl bg-ink px-5 font-semibold text-bg hover:opacity-90 disabled:opacity-60 sm:col-span-4 sm:justify-self-end">
            {t('add')}
          </button>
        </form>
      )}
    </section>
  );
}
