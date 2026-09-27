'use client';

import { useActionState, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { deleteAccount, type DeleteState } from '@/app/[locale]/app/settings/account-actions';

export default function AccountSection({ email }: { email: string }) {
  const t = useTranslations('account');
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<DeleteState, FormData>(deleteAccount, {});
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold">{t('title')}</h2>
      <p className="mt-1 text-sm text-muted">{t('exportText')}</p>
      <a href="/api/account/export" download className="mt-4 inline-flex h-11 items-center rounded-xl border border-line px-4 font-medium hover:bg-bg">
        {t('export')}
      </a>
      <div className="mt-6 border-t border-line pt-5">
        {!open ? (
          <button type="button" onClick={() => setOpen(true)} className="text-sm font-medium text-loss hover:underline">
            {t('delete')}
          </button>
        ) : (
          <form action={action} className="flex flex-col gap-3">
            <input type="hidden" name="locale" value={locale} />
            <p className="rounded-xl bg-loss/10 px-4 py-3 text-sm text-loss">{t('deleteWarning')}</p>
            <label className="text-sm font-medium">
              {t('deleteConfirm', { email })}
              <input name="confirm" autoComplete="off" className="mt-1 h-11 w-full rounded-xl border border-line bg-bg px-4 text-base outline-none focus:border-loss" />
            </label>
            {state.error && <p className="text-sm text-loss">{t('deleteMismatch')}</p>}
            <button type="submit" disabled={pending} className="h-11 self-start rounded-xl bg-loss px-5 font-semibold text-white hover:opacity-90 disabled:opacity-60">
              {t('deleteButton')}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
