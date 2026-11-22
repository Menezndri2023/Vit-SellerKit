'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';
import { Alert, inputClass, useAuthError } from '../auth/ui';

type Props = { enabled: boolean; hasPassword: boolean; isAdmin: boolean; required: boolean };

/** Two-factor authentication (authenticator app + backup codes). Mandatory for admins. */
export default function TwoFactorSection({ enabled, hasPassword, isAdmin, required }: Props) {
  const t = useTranslations('twoFactor');
  const message = useAuthError();
  const router = useRouter();
  const [step, setStep] = useState<'idle' | 'password' | 'scan' | 'codes' | 'disable'>('idle');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totpURI, setTotpURI] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [codes, setCodes] = useState<string[]>([]);

  useEffect(() => {
    if (totpURI) QRCode.toDataURL(totpURI, { margin: 1, width: 220 }).then(setQr);
  }, [totpURI]);
  const secret = totpURI ? new URL(totpURI).searchParams.get('secret') : null;

  async function run<T>(fn: () => Promise<{ data?: T | null; error?: { code?: string; status?: number } | null }>) {
    setPending(true);
    setError(null);
    const res = await fn();
    setPending(false);
    if (res.error) {
      setError(message(res.error));
      return null;
    }
    return res.data ?? null;
  }

  async function start(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get('password'));
    const data = await run(() => authClient.twoFactor.enable({ password, method: 'totp' }));
    if (data && 'totpURI' in data) {
      setTotpURI(data.totpURI);
      setCodes(data.backupCodes ?? []);
      setStep('scan');
    }
  }

  async function confirm(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const code = String(new FormData(e.currentTarget).get('code')).replace(/\s/g, '');
    const data = await run(() => authClient.twoFactor.verifyTotp({ code }));
    if (data) {
      setStep('codes');
      router.refresh();
    }
  }

  async function newCodes(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get('password'));
    const data = await run(() => authClient.twoFactor.generateBackupCodes({ password }));
    if (data?.backupCodes) {
      setCodes(data.backupCodes);
      setStep('codes');
    }
  }

  async function disable(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const password = String(new FormData(e.currentTarget).get('password'));
    const data = await run(() => authClient.twoFactor.disable({ password }));
    if (data) {
      setStep('idle');
      router.refresh();
    }
  }

  const passwordForm = (onSubmit: (e: React.FormEvent<HTMLFormElement>) => void, submit: string, danger = false) => (
    <form onSubmit={onSubmit} className="mt-4 flex max-w-sm flex-col gap-3">
      <label className="flex flex-col gap-1.5 text-sm font-medium">
        {t('password')}
        <input name="password" type="password" autoComplete="current-password" required className={inputClass} />
      </label>
      {error && <Alert tone="error">{error}</Alert>}
      <div className="flex gap-2">
        <button type="submit" disabled={pending} className={`h-11 rounded-xl px-5 font-semibold disabled:opacity-60 ${danger ? 'bg-loss text-surface' : 'bg-primary text-on-primary'}`}>
          {pending ? '…' : submit}
        </button>
        <button type="button" onClick={() => { setStep('idle'); setError(null); }} className="h-11 rounded-xl border border-line px-4 font-medium hover:bg-bg">
          {t('cancel')}
        </button>
      </div>
    </form>
  );

  return (
    <section id="security" className="scroll-mt-6 rounded-2xl border border-line bg-surface p-5 sm:p-6" aria-labelledby="security-title">
      <h2 id="security-title" className="font-display text-lg font-bold">
        {t('title')}
      </h2>
      {required && !enabled && <div className="mt-3"><Alert tone="error">{t('requiredForAdmin')}</Alert></div>}
      <p className="mt-1 text-sm text-muted">{enabled ? t('enabledText') : t('intro')}</p>
      {isAdmin && <p className="mt-1 text-sm text-muted">{t('adminNote')}</p>}

      {!hasPassword ? (
        <p className="mt-4 text-sm text-muted">{t('needsPassword')}</p>
      ) : step === 'scan' ? (
        <div className="mt-4 flex flex-col gap-4">
          <ol className="list-decimal ps-5 text-sm">
            <li>{t('scanStep1')}</li>
            <li>{t('scanStep2')}</li>
          </ol>
          {/* eslint-disable-next-line @next/next/no-img-element -- QR code generated in the browser */}
          {qr && <img src={qr} alt={t('qrAlt')} width={220} height={220} className="rounded-xl border border-line bg-white p-2" />}
          {secret && (
            <p className="text-sm">
              {t('manualKey')} <code data-testid="totp-secret" className="break-all rounded bg-bg px-2 py-1 font-mono">{secret}</code>
            </p>
          )}
          <form onSubmit={confirm} className="flex max-w-sm flex-col gap-3">
            <label className="flex flex-col gap-1.5 text-sm font-medium">
              {t('code')}
              <input name="code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9 ]{6,7}" required className={inputClass} />
            </label>
            {error && <Alert tone="error">{error}</Alert>}
            <button type="submit" disabled={pending} className="h-11 self-start rounded-xl bg-primary px-5 font-semibold text-on-primary disabled:opacity-60">
              {pending ? '…' : t('confirm')}
            </button>
          </form>
        </div>
      ) : step === 'codes' ? (
        <div className="mt-4 flex flex-col gap-3">
          <Alert tone="success">{t('backupIntro')}</Alert>
          <ul data-testid="backup-codes" className="grid max-w-sm grid-cols-2 gap-2 font-mono text-sm">
            {codes.map((c) => (
              <li key={c} className="rounded-lg bg-bg px-3 py-2">
                {c}
              </li>
            ))}
          </ul>
          <div className="flex gap-2">
            <button type="button" onClick={() => navigator.clipboard?.writeText(codes.join('\n'))} className="h-11 rounded-xl border border-line px-4 font-medium hover:bg-bg">
              {t('copy')}
            </button>
            <button type="button" onClick={() => setStep('idle')} className="h-11 rounded-xl bg-primary px-5 font-semibold text-on-primary">
              {t('done')}
            </button>
          </div>
        </div>
      ) : step === 'password' ? (
        passwordForm(start, t('continue'))
      ) : step === 'disable' ? (
        <>
          {isAdmin && <div className="mt-4"><Alert tone="error">{t('disableAdminWarning')}</Alert></div>}
          {passwordForm(disable, t('disable'), true)}
        </>
      ) : enabled ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="inline-flex h-11 items-center rounded-xl bg-profit/10 px-4 text-sm font-semibold text-profit">✓ {t('on')}</span>
          <details className="w-full">
            <summary className="cursor-pointer text-sm font-medium text-primary-ink">{t('newCodes')}</summary>
            {passwordForm(newCodes, t('generate'))}
          </details>
          <button type="button" onClick={() => setStep('disable')} className="text-sm font-medium text-loss hover:underline">
            {t('disable')}
          </button>
        </div>
      ) : (
        <button type="button" onClick={() => setStep('password')} className="mt-4 h-11 rounded-xl bg-primary px-5 font-semibold text-on-primary hover:brightness-95">
          {t('enable')}
        </button>
      )}
    </section>
  );
}
