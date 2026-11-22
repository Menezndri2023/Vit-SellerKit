'use client';

import { useActionState } from 'react';
import { useTranslations } from 'next-intl';
import { giveConsent, type ConsentState } from '@/app/[locale]/(auth)/consent/actions';
import { Link, useRouter } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { Alert, SubmitButton } from './ui';

export default function ConsentForm({ locale, next }: { locale: string; next: string }) {
  const t = useTranslations('consent');
  const router = useRouter();
  const [state, action, pending] = useActionState<ConsentState, FormData>(giveConsent, {});
  const termsLink = (chunks: React.ReactNode) => (
    <Link href="/legal/terms" target="_blank" className="font-semibold text-primary-ink underline">
      {chunks}
    </Link>
  );
  const privacyLink = (chunks: React.ReactNode) => (
    <Link href="/legal/privacy" target="_blank" className="font-semibold text-primary-ink underline">
      {chunks}
    </Link>
  );
  async function signOut() {
    await authClient.signOut();
    router.push('/');
  }
  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="next" value={next} />
      <label className="flex gap-3 text-sm leading-relaxed">
        <input type="checkbox" name="terms" required className="mt-1 size-5 shrink-0 accent-[var(--primary-ink)]" />
        <span>{t.rich('terms', { terms: termsLink, privacy: privacyLink })}</span>
      </label>
      <label className="flex gap-3 text-sm leading-relaxed">
        <input type="checkbox" name="transfer" required className="mt-1 size-5 shrink-0 accent-[var(--primary-ink)]" />
        <span>{t.rich('transfer', { privacy: privacyLink })}</span>
      </label>
      {state.error && <Alert tone="error">{t('required')}</Alert>}
      <SubmitButton pending={pending}>{t('submit')}</SubmitButton>
      <p className="text-xs text-muted">{t('why')}</p>
      <button type="button" onClick={signOut} className="self-start text-sm text-muted underline hover:text-ink">
        {t('signOut')}
      </button>
    </form>
  );
}
