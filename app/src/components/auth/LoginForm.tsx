'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link, useRouter } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { Alert, Field, GoogleButton, SubmitButton, useAuthError } from './ui';

export default function LoginForm({ google }: { google: boolean }) {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const message = useAuthError();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    const { error } = await authClient.signIn.email({
      email: String(form.get('email')),
      password: String(form.get('password')),
      callbackURL: `/${locale}/app`,
    });
    setPending(false);
    if (error) return setError(message(error));
    router.push('/app');
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-5">
      {google && (
        <>
          <GoogleButton label={t('google')} onClick={() => authClient.signIn.social({ provider: 'google', callbackURL: `/${locale}/app` })} />
          <div className="flex items-center gap-3 text-xs uppercase text-muted">
            <span className="h-px flex-1 bg-line" />
            {t('or')}
            <span className="h-px flex-1 bg-line" />
          </div>
        </>
      )}
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
