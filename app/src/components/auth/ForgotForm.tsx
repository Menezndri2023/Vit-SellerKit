'use client';

import { useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { Alert, Field, SubmitButton } from './ui';

export default function ForgotForm() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    setPending(true);
    // Same answer whether the account exists or not (no account enumeration)
    await authClient.requestPasswordReset({ email: String(form.get('email')), redirectTo: `/${locale}/reset-password` }).catch(() => null);
    setPending(false);
    setSent(true);
  }

  return (
    <div className="flex flex-col gap-5">
      {sent ? (
        <Alert tone="success">{t('forgotSent')}</Alert>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-4">
          <Field label={t('email')} name="email" type="email" autoComplete="email" required />
          <SubmitButton pending={pending}>{t('forgotSubmit')}</SubmitButton>
        </form>
      )}
      <Link href="/login" className="text-center text-sm font-semibold text-primary-ink hover:underline">
        {t('backToLogin')}
      </Link>
    </div>
  );
}
