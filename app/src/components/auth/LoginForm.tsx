'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { Alert, Field, GoogleButton, SubmitButton, useAuthError } from './ui';

export default function LoginForm({ google, googleError = false }: { google: boolean; googleError?: boolean }) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const message = useAuthError();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<'password' | 'code'>('password');
  const [backup, setBackup] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    const { data, error } = await authClient.signIn.email({
      email: String(form.get('email')),
      password: String(form.get('password')),
      callbackURL: `/${locale}/app`,
    });
    setPending(false);
    if (error) return setError(message(error));
    // Two-factor authentication on: ask the code from the authenticator app
    if (data && 'twoFactorRedirect' in data && data.twoFactorRedirect) return setStep('code');
    router.push('/app');
    router.refresh();
  }

  async function onCode(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const code = String(form.get('code')).replace(/\s/g, '');
    const trustDevice = form.get('trust') === 'on';
    setPending(true);
    setError(null);
    const { error } = backup ? await authClient.twoFactor.verifyBackupCode({ code, trustDevice }) : await authClient.twoFactor.verifyTotp({ code, trustDevice });
    setPending(false);
    if (error) return setError(message(error));
    router.push('/app');
    router.refresh();
  }

  if (step === 'code') {
    return (
      <form onSubmit={onCode} className="flex flex-col gap-4">
        <p className="text-sm text-muted">{backup ? t('twoFactorBackupHint') : t('twoFactorHint')}</p>
        <Field
          key={backup ? 'backup' : 'totp'}
          label={backup ? t('twoFactorBackupLabel') : t('twoFactorLabel')}
          name="code"
          autoComplete="one-time-code"
          inputMode={backup ? 'text' : 'numeric'}
          required
          autoFocus
        />
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="trust" className="size-4" />
          {t('twoFactorTrust')}
        </label>
        {error && <Alert tone="error">{error}</Alert>}
        <SubmitButton pending={pending}>{t('twoFactorSubmit')}</SubmitButton>
        <button type="button" onClick={() => { setBackup(!backup); setError(null); }} className="self-start text-sm text-primary-ink hover:underline">
          {backup ? t('twoFactorUseApp') : t('twoFactorUseBackup')}
        </button>
      </form>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {google && (
        <>
          <GoogleButton label={t('google')} onClick={() => authClient.signIn.social({ provider: 'google', callbackURL: `/${locale}/app`, errorCallbackURL: `/${locale}/login?error=google` })} />
          <div className="flex items-center gap-3 text-xs uppercase text-muted">
            <span className="h-px flex-1 bg-line" />
            {t('or')}
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}
      {googleError && <Alert tone="error">{t('googleFailed')}</Alert>}
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label={t('email')} name="email" type="email" autoComplete="email" required />
        <Field label={t('password')} name="password" type="password" autoComplete="current-password" required />
        <Link href="/forgot-password" className="-mt-2 self-end text-sm text-primary-ink hover:underline">
          {t('forgotLink')}
        </Link>
        {error && <Alert tone="error">{error}</Alert>}
        <SubmitButton pending={pending}>{t('loginSubmit')}</SubmitButton>
      </form>
      <p className="text-center text-sm text-muted">
        {t('noAccount')}{' '}
        <Link href="/signup" className="font-semibold text-primary-ink hover:underline">
          {t('signupLink')}
        </Link>
      </p>
    </div>
  );
}
