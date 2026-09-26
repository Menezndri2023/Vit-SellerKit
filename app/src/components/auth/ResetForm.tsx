'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { Alert, Field, SubmitButton, useAuthError } from './ui';

export default function ResetForm({ token }: { token: string | null }) {
  const t = useTranslations('auth');
  const message = useAuthError();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(token ? null : t('resetInvalid'));
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!token) return;
    const form = new FormData(e.currentTarget);
    setPending(true);
    setError(null);
    const { error } = await authClient.resetPassword({ newPassword: String(form.get('password')), token });
    setPending(false);
    if (error) return setError(error.code === 'INVALID_TOKEN' ? t('resetInvalid') : message(error));
    setDone(true);
  }

  if (done) {
    return (
      <div className="flex flex-col gap-4">
        <Alert tone="success">{t('resetDone')}</Alert>
        <Link href="/login" className="grid h-12 place-items-center rounded-xl bg-primary font-semibold text-on-primary">
          {t('loginLink')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <Field label={t('password')} name="password" type="password" autoComplete="new-password" required minLength={8} maxLength={128} hint={t('passwordHint')} disabled={!token} />
      {error && <Alert tone="error">{error}</Alert>}
      {token ? (
        <SubmitButton pending={pending}>{t('resetSubmit')}</SubmitButton>
      ) : (
        <Link href="/forgot-password" className="text-center text-sm font-semibold text-primary-ink hover:underline">
          {t('forgotSubmit')}
        </Link>
      )}
    </form>
  );
}
