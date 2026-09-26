'use client';

import { startTransition, useId } from 'react';
import { useTranslations } from 'next-intl';

type Errors = Record<string, string> | undefined;

const control =
  'w-full rounded-xl border bg-surface px-4 text-base text-ink outline-none transition focus:border-primary-ink focus:ring-2 focus:ring-primary/40 disabled:opacity-60';

function useError(errors: Errors, name: string) {
  const t = useTranslations('errors');
  const code = errors?.[name];
  if (!code) return null;
  return t.has(code as Parameters<typeof t>[0]) ? t(code as Parameters<typeof t>[0]) : t('invalid');
}

function Wrapper({ id, label, hint, error, optional, children, className = '' }: { id: string; label: string; hint?: string; error: string | null; optional?: boolean; children: React.ReactNode; className?: string }) {
  const t = useTranslations('common');
  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <label htmlFor={id} className="text-sm font-medium">
        {label} {optional && <span className="font-normal text-muted">({t('optional')})</span>}
      </label>
      {children}
      {error ? (
        <p id={`${id}-msg`} className="text-xs text-loss">
          {error}
        </p>
      ) : (
        hint && (
          <p id={`${id}-msg`} className="text-xs text-muted">
            {hint}
          </p>
        )
      )}
    </div>
  );
}

type InputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name'> & { name: string; label: string; hint?: string; errors?: Errors; optional?: boolean; wrapperClass?: string };

export function Input({ name, label, hint, errors, optional, wrapperClass, ...props }: InputProps) {
  const id = useId();
  const error = useError(errors, name);
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} optional={optional} className={wrapperClass}>
      <input id={id} name={name} aria-invalid={Boolean(error)} aria-describedby={`${id}-msg`} className={`${control} h-12 ${error ? 'border-loss' : 'border-line'}`} {...props} />
    </Wrapper>
  );
}

type SelectProps = Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'name'> & { name: string; label: string; hint?: string; errors?: Errors; options: { value: string; label: string }[]; wrapperClass?: string; optional?: boolean };

export function Select({ name, label, hint, errors, options, wrapperClass, optional, ...props }: SelectProps) {
  const id = useId();
  const error = useError(errors, name);
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} optional={optional} className={wrapperClass}>
      <select id={id} name={name} aria-invalid={Boolean(error)} className={`${control} h-12 ${error ? 'border-loss' : 'border-line'}`} {...props}>
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Wrapper>
  );
}

type TextareaProps = Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'name'> & { name: string; label: string; hint?: string; errors?: Errors; optional?: boolean; wrapperClass?: string };

export function Textarea({ name, label, hint, errors, optional, wrapperClass, ...props }: TextareaProps) {
  const id = useId();
  const error = useError(errors, name);
  return (
    <Wrapper id={id} label={label} hint={hint} error={error} optional={optional} className={wrapperClass}>
      <textarea id={id} name={name} rows={3} aria-invalid={Boolean(error)} className={`${control} py-3 ${error ? 'border-loss' : 'border-line'}`} {...props} />
    </Wrapper>
  );
}

export function Checkbox({ name, label, hint, ...props }: Omit<React.InputHTMLAttributes<HTMLInputElement>, 'name' | 'type'> & { name: string; label: string; hint?: string }) {
  return (
    <label className="flex items-start gap-3 text-sm">
      <input type="checkbox" name={name} className="mt-0.5 size-5 shrink-0 accent-[var(--primary-ink)]" {...props} />
      <span>
        <span className="font-medium">{label}</span>
        {hint && <span className="block text-xs text-muted">{hint}</span>}
      </span>
    </label>
  );
}

export function Section({ title, description, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
      <h2 className="font-display text-lg font-bold">{title}</h2>
      {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      <div className="mt-5 grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}

/** Sticky save bar with status. */
export function SaveBar({ pending, saved, hasErrors, extra }: { pending: boolean; saved?: boolean; hasErrors?: boolean; extra?: React.ReactNode }) {
  const t = useTranslations('common');
  return (
    <div className="sticky bottom-20 z-10 flex items-center justify-end gap-3 rounded-2xl border border-line bg-surface/95 p-3 shadow-sm backdrop-blur lg:bottom-4">
      <p role="status" className={`me-auto text-sm ${hasErrors ? 'text-loss' : 'text-profit'}`}>
        {hasErrors ? t('formHasErrors') : saved ? t('saved') : ''}
      </p>
      {extra}
      <button type="submit" disabled={pending} className="h-11 rounded-xl bg-primary px-6 font-semibold text-on-primary transition hover:brightness-95 disabled:opacity-60">
        {pending ? t('saving') : t('save')}
      </button>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-bold">{title}</h1>
        {subtitle && <p className="mt-1 text-muted">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/**
 * React 19 resets a <form action={…}> after every submission — including failed validation,
 * which would wipe what the user typed. Submitting through onSubmit keeps the fields.
 */
export function keepValues(action: (data: FormData) => void) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    startTransition(() => action(data));
  };
}
