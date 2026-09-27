'use client';

import { useActionState, useState, useTransition } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { getShareLink, sendDocumentEmail } from '@/app/[locale]/app/documents/actions';
import { keepValues } from '@/components/form/fields';
import type { FormState } from '@/lib/forms';

type Props = { id: string; isDraft: boolean; exportable?: boolean; docLang: 'en' | 'fr'; buyerEmail?: string; buyerPhone?: string; emailMessage: string; whatsappTemplate: string };

const btn = 'inline-flex h-11 items-center justify-center rounded-xl border border-line bg-surface px-4 font-medium hover:bg-bg disabled:opacity-60';
const control = 'w-full rounded-xl border border-line bg-surface px-3 text-base outline-none focus:border-primary-ink focus:ring-2 focus:ring-primary/40';

export default function SharePanel({ id, isDraft, exportable, docLang, buyerEmail, buyerPhone, emailMessage, whatsappTemplate }: Props) {
  const t = useTranslations('docShare');
  const te = useTranslations('errors');
  const locale = useLocale();
  const [pending, start] = useTransition();
  const [copied, setCopied] = useState(false);
  const [showEmail, setShowEmail] = useState(false);
  const [exportErrors, setExportErrors] = useState<string[] | null>(null);
  const [state, action, sending] = useActionState<FormState, FormData>(sendDocumentEmail.bind(null, id), {});

  if (isDraft) {
    return (
      <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-line bg-surface p-4">
        <a href={`/api/documents/${id}/pdf`} target="_blank" rel="noopener" className={btn}>
          {t('previewPdf')}
        </a>
        <p className="text-sm text-muted">{t('draftHint')}</p>
      </section>
    );
  }

  const withLink = (fn: (url: string) => void, regenerate = false) =>
    start(async () => {
      const url = await getShareLink(id, docLang, regenerate);
      if (url) fn(url);
    });

  const error = state.errors ? Object.values(state.errors)[0] : null;

  async function download(kind: 'facturx' | 'ubl') {
    setExportErrors(null);
    const res = await fetch(`/api/documents/${id}/${kind}`);
    if (!res.ok) {
      const body = await res.json().catch(() => ({ errors: [String(res.status)] }));
      setExportErrors(body.errors ?? [String(res.status)]);
      return;
    }
    const name = /filename="([^"]+)"/.exec(res.headers.get('content-disposition') ?? '')?.[1] ?? `${kind}`;
    const url = URL.createObjectURL(await res.blob());
    Object.assign(document.createElement('a'), { href: url, download: name }).click();
    URL.revokeObjectURL(url);
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-5">
      <h2 className="font-display text-lg font-bold">{t('title')}</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        <a href={`/api/documents/${id}/pdf?download`} className={`${btn} border-transparent bg-ink text-bg hover:bg-ink hover:opacity-90`}>
          {t('pdf')}
        </a>
        <button type="button" disabled={pending} className={btn} onClick={() => withLink(async (url) => (await navigator.clipboard.writeText(url), setCopied(true), setTimeout(() => setCopied(false), 2000)))}>
          {copied ? t('copied') : t('copyLink')}
        </button>
        <button
          type="button"
          disabled={pending}
          className={btn}
          onClick={() =>
            withLink((url) => {
              const phone = (buyerPhone ?? '').replace(/[^\d]/g, '');
              window.open(`https://wa.me/${phone}?text=${encodeURIComponent(whatsappTemplate.replace('{url}', url))}`, '_blank', 'noopener');
            })
          }
        >
          {t('whatsapp')}
        </button>
        <button type="button" className={btn} onClick={() => setShowEmail((v) => !v)}>
          {t('email')}
        </button>
      </div>
      {exportable && (
        <div className="mt-4 border-t border-line pt-4">
          <div className="flex flex-wrap gap-2">
            <button type="button" className={btn} onClick={() => void download('facturx')}>
              {t('facturx')}
            </button>
            <button type="button" className={btn} onClick={() => void download('ubl')}>
              {t('ubl')}
            </button>
          </div>
          <p className="mt-2 text-xs text-muted">{t('einvoiceHint')}</p>
          {exportErrors && (
            <div role="alert" className="mt-2 rounded-xl bg-loss/10 p-3 text-sm text-loss">
              <p className="font-semibold">{t('einvoiceError')}</p>
              <ul className="mt-1 list-disc ps-5">
                {exportErrors.map((e) => (
                  <li key={e}>{e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
      <p className="mt-3 text-xs text-muted">
        {t('linkHint')}{' '}
        <button type="button" disabled={pending} className="font-medium text-primary-ink hover:underline" onClick={() => withLink(() => undefined, true)}>
          {t('regenerate')}
        </button>
      </p>

      {showEmail && (
        <form onSubmit={keepValues(action)} className="mt-4 flex flex-col gap-3" noValidate>
          <label className="text-sm font-medium">
            {t('emailTo')}
            <input name="to" type="email" defaultValue={buyerEmail} className={`${control} mt-1 h-11`} required />
          </label>
          <label className="text-sm font-medium">
            {t('emailMessage')}
            <textarea name="message" rows={6} defaultValue={emailMessage} maxLength={3000} className={`${control} mt-1 py-2`} />
          </label>
          {error && <p className="text-sm text-loss">{te.has(error as 'invalid') ? te(error as 'invalid') : te('generic')}</p>}
          {state.ok && <p className="text-sm text-profit">{t('emailSent')}</p>}
          <button type="submit" disabled={sending} className="h-11 self-end rounded-xl bg-primary px-6 font-semibold text-on-primary hover:brightness-95 disabled:opacity-60" lang={locale}>
            {sending ? '…' : t('emailSend')}
          </button>
        </form>
      )}
    </section>
  );
}
