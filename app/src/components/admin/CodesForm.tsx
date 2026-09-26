'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { createCodes, type CodesState } from '@/app/[locale]/admin/actions';

const control = 'h-11 rounded-xl border border-line bg-surface px-3 text-base outline-none focus:border-primary-ink';

export default function CodesForm() {
  const t = useTranslations('admin.codes');
  const [state, action, pending] = useActionState<CodesState, FormData>(createCodes, {});
  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-display text-lg font-bold">{t('generate')}</h2>
      <form action={action} className="mt-4 grid gap-3 sm:grid-cols-[100px_160px_1fr_auto] sm:items-end">
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          {t('count')}
          <input name="count" type="number" min={1} max={100} defaultValue={1} className={control} />
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          {t('duration')}
          <select name="duration" defaultValue="30" className={control}>
            <option value="30">{t('days30')}</option>
            <option value="365">{t('days365')}</option>
            <option value="lifetime">{t('lifetime')}</option>
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium text-muted">
          {t('note')}
          <input name="note" maxLength={200} className={control} />
        </label>
        <button type="submit" disabled={pending} className="h-11 rounded-xl bg-primary px-5 font-semibold text-on-primary hover:brightness-95 disabled:opacity-60">
          {t('create')}
        </button>
      </form>
      {state.codes && (
        <div className="mt-4 rounded-xl bg-primary-soft p-4">
          <p className="text-sm font-semibold text-primary-ink">{t('newCodes')}</p>
          <pre className="mt-2 select-all whitespace-pre-wrap font-mono text-base">{state.codes.join('\n')}</pre>
        </div>
      )}
    </section>
  );
}
