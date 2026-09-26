'use client';

import { useId, useState } from 'react';
import { useLocale } from 'next-intl';

type Props = {
  label: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  /** Shown inside the field, e.g. "$" or "%" */
  suffix?: string;
  max?: number;
};

/** Accepts "6.5" and "6,5" (French keyboards), keeps the user's text while typing. */
function parse(text: string): number | null {
  const n = Number(text.replace(/\s/g, '').replace(',', '.'));
  return text.trim() === '' || Number.isNaN(n) ? null : n;
}

/** Shows decimals the way the user types them: "0,5" in French, "0.5" in English. */
function display(value: number, locale: string): string {
  return locale === 'fr' ? String(value).replace('.', ',') : String(value);
}

export default function NumberInput({ label, hint, value, onChange, suffix, max }: Props) {
  const id = useId();
  const locale = useLocale();
  const [text, setText] = useState(display(value, locale));
  const [prevValue, setPrevValue] = useState(value);

  // Follow external changes (platform presets) without fighting the user's typing
  if (value !== prevValue) {
    setPrevValue(value);
    if (parse(text) !== value) setText(display(value, locale));
  }

  const invalid = text.trim() !== '' && (parse(text) === null || (parse(text) ?? 0) < 0 || (max !== undefined && (parse(text) ?? 0) > max));

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-sm font-medium text-ink">
        {label}
      </label>
      <div
        className={`flex items-center rounded-xl border bg-surface transition focus-within:border-primary-ink focus-within:ring-2 focus-within:ring-primary/40 ${
          invalid ? 'border-loss' : 'border-line'
        }`}
      >
        <input
          id={id}
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={text}
          aria-invalid={invalid}
          aria-describedby={hint ? `${id}-hint` : undefined}
          onChange={(e) => {
            setText(e.target.value);
            const n = parse(e.target.value);
            if (n !== null && n >= 0 && (max === undefined || n <= max)) onChange(n);
            else if (e.target.value.trim() === '') onChange(0);
          }}
          className="tabular h-12 w-full min-w-0 bg-transparent px-4 text-base text-ink outline-none"
        />
        {suffix && <span className="pr-4 text-sm text-muted">{suffix}</span>}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="text-xs text-muted">
          {hint}
        </p>
      )}
    </div>
  );
}
