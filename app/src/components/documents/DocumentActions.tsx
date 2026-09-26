'use client';

import { useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import {
  convertToInvoice,
  createCreditNote,
  deleteDraft,
  duplicateDocument,
  issueDocument,
  markSent,
  setQuoteOutcome,
  type IssueResult,
} from '@/app/[locale]/app/documents/actions';

const primary = 'h-11 rounded-xl bg-primary px-5 font-semibold text-on-primary hover:brightness-95 disabled:opacity-60';
const secondary = 'h-11 rounded-xl border border-line bg-surface px-4 font-medium hover:bg-bg disabled:opacity-60';

type Props = { id: string; type: string; status: string; typeLabel: string };

export default function DocumentActions({ id, type, status, typeLabel }: Props) {
  const t = useTranslations('documents.view');
  const tc = useTranslations('documents.compliance');
  const te = useTranslations('errors');
  const locale = useLocale();
  const [pending, start] = useTransition();
  const [result, setResult] = useState<IssueResult | null>(null);
  const run = (fn: () => Promise<unknown>) => start(async () => void (await fn()));
  const payable = type === 'invoice' || type === 'deposit_invoice';

  const errors = result?.issues?.filter((i) => i.severity === 'error') ?? [];
  const warnings = result?.issues?.filter((i) => i.severity === 'warning') ?? [];

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-2">
        {status === 'draft' && (
          <>
            <button
              type="button"
              disabled={pending}
              className={primary}
              onClick={() => {
                if (!confirm(t('issueConfirm'))) return;
                start(async () => setResult(await issueDocument(id, locale)));
              }}
            >
              {t('issue', { type: typeLabel.toLowerCase() })}
            </button>
            <button type="button" disabled={pending} className={secondary} onClick={() => confirm(t('deleteDraft') + ' ?') && run(() => deleteDraft(id, locale))}>
              {t('deleteDraft')}
            </button>
          </>
        )}
        {status === 'issued' && (
          <button type="button" disabled={pending} className={primary} onClick={() => run(() => markSent(id))}>
            {t('markSent')}
          </button>
        )}
        {type === 'quote' && ['issued', 'sent', 'declined'].includes(status) && (
          <button type="button" disabled={pending} className={secondary} onClick={() => run(() => setQuoteOutcome(id, 'accepted'))}>
            {t('accept')}
          </button>
        )}
        {type === 'quote' && ['issued', 'sent', 'accepted'].includes(status) && (
          <button type="button" disabled={pending} className={secondary} onClick={() => run(() => setQuoteOutcome(id, 'declined'))}>
            {t('decline')}
          </button>
        )}
        {type === 'quote' && status !== 'declined' && (
          <button type="button" disabled={pending} className={status === 'draft' ? secondary : primary} onClick={() => run(() => convertToInvoice(id, locale))}>
            {t('convert')}
          </button>
        )}
        {payable && ['issued', 'sent', 'paid'].includes(status) && (
          <button type="button" disabled={pending} className={secondary} onClick={() => run(() => createCreditNote(id, locale))}>
            {t('creditNote')}
          </button>
        )}
        <button type="button" disabled={pending} className={secondary} onClick={() => run(() => duplicateDocument(id, locale))}>
          {t('duplicate')}
        </button>
      </div>
      {status === 'draft' && <p className="text-xs text-muted">{t('issueHint')}</p>}

      {result?.error && <p className="rounded-xl bg-loss/10 px-4 py-3 text-sm text-loss">{te.has(result.error as 'locked') ? te(result.error as 'locked') : te('generic')}</p>}
      {errors.length > 0 && (
        <div role="alert" className="rounded-xl border border-loss/30 bg-loss/10 p-4">
          <p className="font-semibold text-loss">{t('checksTitle')}</p>
          <ul className="mt-2 list-disc ps-5 text-sm text-loss">
            {errors.map((i) => (
              <li key={i.code}>{tc(i.code as 'noLines')}</li>
            ))}
          </ul>
        </div>
      )}
      {warnings.length > 0 && (
        <div className="rounded-xl border border-warn/30 bg-warn/10 p-4">
          <p className="font-semibold text-warn">{t('warningsTitle')}</p>
          <ul className="mt-2 list-disc ps-5 text-sm text-warn">
            {warnings.map((i) => (
              <li key={i.code}>{tc(i.code as 'noLines')}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
