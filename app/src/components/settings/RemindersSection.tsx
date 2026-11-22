'use client';

import { useState, useTransition } from 'react';
import { useTranslations } from 'next-intl';
import { setAutoReminders, type ReminderSettingState } from '@/app/[locale]/app/settings/reminder-actions';
import { Link } from '@/i18n/navigation';
import { Alert } from '../auth/ui';

/** Settings: automatic reminders of overdue invoices (Pro). */
export default function RemindersSection({ enabled, isPro }: { enabled: boolean; isPro: boolean }) {
  const t = useTranslations('reminders');
  const [pending, start] = useTransition();
  const [state, setState] = useState<ReminderSettingState>({});
  const toggle = () => start(async () => setState(await setAutoReminders(!enabled)));
  return (
    <section id="reminders" className="scroll-mt-6 rounded-2xl border border-line bg-surface p-5 sm:p-6" aria-labelledby="reminders-title">
      <div className="flex flex-wrap items-center gap-2">
        <h2 id="reminders-title" className="font-display text-lg font-bold">
          {t('title')}
        </h2>
        <span className="rounded-full bg-primary px-2.5 py-0.5 text-xs font-semibold text-on-primary">Pro</span>
      </div>
      <p className="mt-1 text-sm text-muted">{t('intro')}</p>
      <ul className="mt-3 list-disc ps-5 text-sm text-muted">
        <li>{t('schedule')}</li>
        <li>{t('replyTo')}</li>
        <li>{t('perInvoice')}</li>
      </ul>
      {state.error && (
        <div className="mt-3">
          <Alert tone="error">{t(`errors.${state.error}`)}</Alert>
        </div>
      )}
      {isPro ? (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className={`inline-flex h-11 items-center rounded-xl px-4 text-sm font-semibold ${enabled ? 'bg-profit/10 text-profit' : 'bg-bg text-muted'}`}>{enabled ? `✓ ${t('on')}` : t('off')}</span>
          <button type="button" onClick={toggle} disabled={pending} className={`h-11 rounded-xl px-5 font-semibold disabled:opacity-60 ${enabled ? 'border border-line hover:bg-bg' : 'bg-primary text-on-primary hover:brightness-95'}`}>
            {pending ? '…' : enabled ? t('turnOff') : t('turnOn')}
          </button>
        </div>
      ) : (
        <p className="mt-4 text-sm">
          {t('proOnly')}{' '}
          <Link href="/activate" className="font-semibold text-primary-ink underline">
            {t('goPro')}
          </Link>
        </p>
      )}
    </section>
  );
}
