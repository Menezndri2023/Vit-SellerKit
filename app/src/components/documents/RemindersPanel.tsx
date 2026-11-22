'use client';

import { useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { setDocumentReminders } from '@/app/[locale]/app/documents/actions';
import { Link } from '@/i18n/navigation';
import { fmtLocale } from '@/lib/intl';

type Props = {
  id: string;
  isPro: boolean;
  accountEnabled: boolean;
  disabled: boolean;
  hasClientEmail: boolean;
  open: boolean;
  sent: { step: number; at: string; to: string }[];
  next: string | null;
};

/** Invoice page: automatic reminders state, history and per-invoice switch. */
export default function RemindersPanel({ id, isPro, accountEnabled, disabled, hasClientEmail, open, sent, next }: Props) {
  const t = useTranslations('reminders');
  const locale = useLocale();
  const [pending, start] = useTransition();
  const date = (iso: string) => new Intl.DateTimeFormat(fmtLocale(locale), { dateStyle: 'medium', timeZone: 'UTC' }).format(new Date(iso));
  let status: React.ReactNode;
  if (!isPro) status = <>{t('proOnly')} <Link href="/activate" className="font-semibold text-primary-ink underline">{t('goPro')}</Link></>;
  else if (!accountEnabled) status = <>{t('accountOff')} <Link href="/app/settings" className="font-semibold text-primary-ink underline">{t('openSettings')}</Link></>;
  else if (!hasClientEmail) status = t('noClientEmail');
  else if (disabled) status = t('invoiceOff');
  else if (!open) status = t('closed');
  else status = next ? t('nextOn', { date: date(next) }) : t('allSent');
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6" aria-labelledby="doc-reminders">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="doc-reminders" className="font-display text-lg font-bold">
          {t('title')}
        </h2>
        {isPro && accountEnabled && open && (
          <button type="button" disabled={pending} onClick={() => start(() => setDocumentReminders(id, !disabled))} className="text-sm font-medium text-primary-ink hover:underline disabled:opacity-60">
            {disabled ? t('enableForInvoice') : t('disableForInvoice')}
          </button>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">{status}</p>
      {sent.length > 0 && (
        <ul className="mt-3 divide-y divide-line text-sm">
          {sent.map((s) => (
            <li key={s.step} className="py-2">
              {t(`step${s.step as 1}`)} · {date(s.at)} · {s.to}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
