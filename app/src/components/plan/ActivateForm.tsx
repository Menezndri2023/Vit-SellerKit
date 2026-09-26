'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { activate, type ActivateState } from '@/app/[locale]/activate/actions';

export default function ActivateForm() {
  const t = useTranslations('plan');
  const [state, action, pending] = useActionState<ActivateState, FormData>(activate, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <label htmlFor="key" className="text-sm font-medium">
        {t('keyLabel')}
      </label>
      <input
        id="key"
        name="key"
        required
        autoComplete="off"
        spellCheck={false}
        maxLength={100}
        placeholder="XXXXXXXX-XXXXXXXX-XXXXXXXX-XXXXXXXX / MK-XXXX-XXXX-XXXX"
        className="h-12 rounded-xl border border-line bg-bg px-4 font-mono text-base outline-none focus:border-primary-ink focus:ring-2 focus:ring-primary/40"
      />
      {state.error && (
        <p role="alert" className="rounded-xl bg-loss/10 px-4 py-3 text-sm text-loss">
          {t(`errors.${state.error as 'invalid'}`)}
        </p>
      )}
      {state.ok && (
        <p role="status" className="rounded-xl bg-profit/10 px-4 py-3 text-sm font-medium text-profit">
          {t('success')}
        </p>
      )}
      <button type="submit" disabled={pending} className="h-12 rounded-xl bg-primary font-semibold text-on-primary hover:brightness-95 disabled:opacity-60">
        {pending ? '…' : t('activate')}
      </button>
    </form>
  );
}
