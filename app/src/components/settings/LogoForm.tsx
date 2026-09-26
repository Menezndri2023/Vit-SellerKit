'use client';

import { useActionState, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { deleteLogo, uploadLogo } from '@/app/[locale]/app/settings/actions';
import type { FormState } from '@/lib/forms';

export default function LogoForm({ logoKey, disabled }: { logoKey?: string; disabled: boolean }) {
  const t = useTranslations('settings');
  const te = useTranslations('errors');
  const [state, action, pending] = useActionState<FormState, FormData>(uploadLogo, {});
  const formRef = useRef<HTMLFormElement>(null);
  const error = state.errors?.logo;

  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold">{t('logo')}</h2>
      <p className="mt-1 text-sm text-muted">{disabled ? te('profileFirst') : t('logoHint')}</p>
      <div className="mt-5 flex flex-wrap items-center gap-4">
        <div className="grid h-20 w-40 place-items-center overflow-hidden rounded-xl border border-dashed border-line bg-bg">
          {logoKey ? (
            // eslint-disable-next-line @next/next/no-img-element -- small user logo served by our API
            <img src={`/api/logo/${logoKey}`} alt="" className="max-h-full max-w-full object-contain" />
          ) : (
            <span className="font-display text-2xl font-extrabold text-muted">M</span>
          )}
        </div>
        <form ref={formRef} action={action}>
          <label className={`inline-grid h-11 cursor-pointer place-items-center rounded-xl border border-line px-5 font-semibold hover:bg-bg ${disabled || pending ? 'pointer-events-none opacity-50' : ''}`}>
            {pending ? '…' : t('logoUpload')}
            <input
              type="file"
              name="logo"
              accept="image/png,image/jpeg,image/webp"
              className="sr-only"
              disabled={disabled || pending}
              onChange={() => formRef.current?.requestSubmit()}
            />
          </label>
        </form>
        {logoKey && (
          <form action={deleteLogo}>
            <button type="submit" className="h-11 rounded-xl px-4 text-sm font-medium text-muted hover:bg-bg hover:text-loss">
              {t('logoRemove')}
            </button>
          </form>
        )}
      </div>
      {error && <p className="mt-3 text-sm text-loss">{te.has(error as Parameters<typeof te>[0]) ? te(error as Parameters<typeof te>[0]) : te('generic')}</p>}
    </section>
  );
}
