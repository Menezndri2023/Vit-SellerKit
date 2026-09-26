import type { ZodError } from 'zod';

/** Result returned by every form Server Action. Error values are keys of the `errors` translation namespace. */
export type FormState = { ok?: boolean; errors?: Record<string, string>; savedAt?: number; id?: string };

/**
 * FormData → nested object. Field names use dot paths: `address.city`, `ids.SIREN`, `taxRates.0.rate`.
 * Numeric segments create arrays. Empty strings are kept (schemas decide what is optional).
 */
export function formToObject(form: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, raw] of form.entries()) {
    if (key.startsWith('$ACTION') || typeof raw !== 'string') continue;
    const path = key.split('.');
    let node = out as Record<string, unknown>;
    path.forEach((segment, i) => {
      const last = i === path.length - 1;
      const nextIsIndex = !last && /^\d+$/.test(path[i + 1]);
      if (last) node[segment] = raw;
      else {
        node[segment] ??= nextIsIndex ? [] : {};
        node = node[segment] as Record<string, unknown>;
      }
    });
  }
  return out;
}

/** Zod issues → { "address.city": "required" }. The issue message is the translation key. */
export function fieldErrors(error: ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_form';
    errors[key] ??= issue.message.startsWith('Invalid') || issue.message.includes(' ') ? 'invalid' : issue.message;
  }
  return errors;
}
