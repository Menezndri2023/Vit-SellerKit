'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { track } from '@vercel/analytics';

export default function SubscribeForm() {
  const t = useTranslations('subscribe');
  const locale = useLocale();
  const [state, setState] = useState<'idle' | 'sending' | 'success' | 'invalid' | 'error'>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setState('sending');
    const res = await fetch('/api/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: form.get('email'), website: form.get('website'), locale, source: 'calculator' }),
    }).catch(() => null);
    if (res?.ok) {
      setState('success');
      track('subscribe');
    } else {
      setState(res?.status === 400 ? 'invalid' : 'error');
    }
  }

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-8">
      <h2 className="font-display text-2xl font-bold">{t('title')}</h2>
      <p className="mt-2 text-muted">{t('text')}</p>
      {state === 'success' ? (
        <p className="mt-5 rounded-xl bg-profit/10 px-4 py-3 font-medium text-profit">{t('success')}</p>
      ) : (
        <form onSubmit={onSubmit} className="mt-5 flex flex-col gap-3 sm:flex-row" noValidate>
          <label htmlFor="email" className="sr-only">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder={t('placeholder')}
            className="h-12 flex-1 rounded-xl border border-line bg-bg px-4 text-base outline-none focus:border-primary-ink focus:ring-2 focus:ring-primary/40"
          />
          {/* Honeypot: humans never see it, bots fill it */}
          <input name="website" type="text" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
          <button
            type="submit"
            disabled={state === 'sending'}
            className="h-12 rounded-xl bg-ink px-6 font-semibold text-bg transition hover:opacity-90 disabled:opacity-60"
          >
            {t('button')}
          </button>
        </form>
      )}
      {state === 'invalid' && <p className="mt-2 text-sm text-loss">{t('invalid')}</p>}
      {state === 'error' && <p className="mt-2 text-sm text-loss">{t('error')}</p>}
      <p className="mt-3 text-xs text-muted">{t('privacy')}</p>
    </section>
  );
}
