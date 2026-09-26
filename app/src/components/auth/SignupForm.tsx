'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { Alert, Field, GoogleButton, SubmitButton, useAuthError } from './ui';

export default function SignupForm({ google }: { google: boolean }) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const message = useAuthError();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  const callbackURL = `/${locale}/app`;

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const email = String(form.get('email'));
    setPending(true);
    setError(null);
    const { error } = await authClient.signUp.email({
      name: String(form.get('name')),
      email,
      password: String(form.get('password')),
      uiLocale: locale,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      callbackURL,
    });
    setPending(false);
    if (error) return setError(message(error));
    setSentTo(email);
  }

  if (sentTo) {
    return (
      <div className="flex flex-col gap-4 text-center">
        <h2 className="font-display text-xl font-bold">{t('checkTitle')}</h2>
        <p className="text-muted">{t('checkText', { email: sentTo })}</p>
        {resent ? (
          <Alert tone="success">{t('resent')}</Alert>
        ) : (
          <button
            type="button"
            className="text-sm font-semibold text-primary-ink hover:underline"
            onClick={async () => {
              await authClient.sendVerificationEmail({ email: sentTo, callbackURL });
              setResent(true);
            }}
          >
            {t('resend')}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      {google && (
        <>
          <GoogleButton label={t('google')} onClick={() => authClient.signIn.social({ provider: 'google', callbackURL })} />
          <div className="flex items-center gap-3 text-xs uppercase text-muted">
            <span className="h-px flex-1 bg-line" />
            {t('or')}
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <Field label={t('name')} name="name" autoComplete="name" required maxLength={100} />
        <Field label={t('email')} name="email" type="email" autoComplete="email" required />
        <Field label={t('password')} name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} hint={t('passwordHint')} />
        {error && <Alert tone="error">{error}</Alert>}
        <SubmitButton pending={pending}>{t('signupSubmit')}</SubmitButton>
        <p className="text-center text-xs text-muted">{t('terms')}</p>
      </form>
      <p className="text-center text-sm text-muted">
        {t('haveAccount')}{' '}
        <Link href="/login" className="font-semibold text-primary-ink hover:underline">
          {t('loginLink')}
        </Link>
      </p>
    </div>
  );
}
