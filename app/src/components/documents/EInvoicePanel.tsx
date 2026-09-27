'use client';

import { useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { refreshPlatformStatus, sendToPlatform, type TransmitResult } from '@/app/[locale]/app/documents/actions';
import { fmtLocale } from '@/lib/intl';

type Event = { status: string; at: string; reason?: string };
const BAD = ['refused', 'rejected', 'disputed', 'suspended'];

export default function EInvoicePanel({ id, provider, lifecycle }: { id: string; provider: string; lifecycle: Event[] }) {
  const t = useTranslations('einvoice');
  const locale = useLocale();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<TransmitResult | null>(null);
  const sent = lifecycle.length > 0;
  const fmt = (iso: string) => new Intl.DateTimeFormat(fmtLocale(locale), { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(iso));

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-display text-lg font-bold">{t('title')}</h2>
        {sent ? (
          <button type="button" disabled={pending} onClick={() => start(() => refreshPlatformStatus(id))} className="h-10 rounded-xl border border-line px-4 text-sm font-medium hover:bg-bg disabled:opacity-60">
            {t('refresh')}
          </button>
        ) : (
          <button type="button" disabled={pending} onClick={() => start(async () => setResult(await sendToPlatform(id)))} className="h-11 rounded-xl bg-primary px-5 font-semibold text-on-primary hover:brightness-95 disabled:opacity-60">
            {pending ? t('sending') : t('send', { provider })}
          </button>
        )}
      </div>
      <p className="mt-1 text-sm text-muted">{sent ? t('sentHint', { provider }) : t('notSentHint')}</p>
      {result?.error && (
        <div role="alert" className="mt-3 rounded-xl bg-loss/10 p-3 text-sm text-loss">
          <p>{t(`errors.${result.error as 'invalid'}`)}</p>
          {result.details && (
            <ul className="mt-1 list-disc ps-5">
              {result.details.map((d) => (
                <li key={d}>{d}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      {sent && (
        <ol className="mt-4 flex flex-col gap-2 border-s-2 border-line ps-4">
          {lifecycle.map((e, i) => (
            <li key={`${e.status}-${i}`} className="text-sm">
              <span className={`font-semibold ${BAD.includes(e.status) ? 'text-loss' : e.status === 'cashed' || e.status === 'approved' ? 'text-profit' : ''}`}>{t(`statuses.${e.status as 'submitted'}`)}</span>
              <span className="text-muted"> · {fmt(e.at)}</span>
              {e.reason && <span className="block text-muted">{e.reason}</span>}
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
