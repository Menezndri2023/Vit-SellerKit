'use client';

import { useTranslations } from 'next-intl';

export const inputClass =
  'h-12 w-full rounded-xl border border-line bg-bg px-4 text-base text-ink outline-none focus:border-primary-ink focus:ring-2 focus:ring-primary/40';

export function Field({ label, hint, ...props }: React.InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5 text-sm font-medium">
      {label}
      <input className={inputClass} {...props} />
      {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
    </label>
  );
}

export function SubmitButton({ children, pending }: { children: React.ReactNode; pending: boolean }) {
  return (
    <button type="submit" disabled={pending} className="h-12 w-full rounded-xl bg-primary font-semibold text-on-primary transition hover:brightness-95 disabled:opacity-60">
      {pending ? '…' : children}
    </button>
  );
}

type AuthError = { code?: string; status?: number } | null | undefined;

/** Maps Better Auth error codes to a translated message. */
export function useAuthError() {
  const t = useTranslations('auth.errors');
  return (error: AuthError) => {
    if (!error) return null;
    if (error.status === 429) return t('TOO_MANY_REQUESTS');
    const key = error.code as Parameters<typeof t>[0] | undefined;
    return key && t.has(key) ? t(key) : t('generic');
  };
}

export function Alert({ tone, children }: { tone: 'error' | 'success'; children: React.ReactNode }) {
  return (
    <p role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl px-4 py-3 text-sm ${tone === 'error' ? 'bg-loss/10 text-loss' : 'bg-profit/10 text-profit'}`}>
      {children}
    </p>
  );
}

export function GoogleButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <button type="button" onClick={onClick} className="flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-line bg-surface font-semibold hover:bg-bg">
      <svg aria-hidden viewBox="0 0 24 24" className="size-5">
        <path fill="#4285F4" d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.4h6.5a5.6 5.6 0 0 1-2.4 3.6v3h3.9c2.2-2.1 3.5-5.1 3.5-8.7Z" />
        <path fill="#34A853" d="M12 24c3.2 0 6-1.1 7.9-2.9l-3.9-3a7.2 7.2 0 0 1-10.7-3.8h-4v3.1A12 12 0 0 0 12 24Z" />
        <path fill="#FBBC05" d="M5.3 14.3a7.2 7.2 0 0 1 0-4.6V6.6h-4a12 12 0 0 0 0 10.8l4-3.1Z" />
        <path fill="#EA4335" d="M12 4.8c1.8 0 3.3.6 4.6 1.8l3.4-3.4A12 12 0 0 0 1.3 6.6l4 3.1A7.2 7.2 0 0 1 12 4.8Z" />
      </svg>
      {label}
    </button>
  );
}
