'use client';

import { startTransition, useActionState, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { importClients, type ImportState } from '@/app/[locale]/app/clients/import-actions';
import { Link } from '@/i18n/navigation';

/** "address.line1" → label key; "ids.ICE" → "ICE". */
const FIELD_KEYS: Record<string, string> = {
  name: 'name', email: 'email', phone: 'phone', contactName: 'contact', notes: 'notes',
  'address.line1': 'address', 'address.city': 'city', 'address.country': 'country', 'address.postalCode': 'postalCode', 'address.region': 'region', 'address.line2': 'address',
  preferredCurrency: 'currency', preferredDocLocale: 'language',
};

export default function ImportClientsForm() {
  const t = useTranslations('clientsImport');
  const locale = useLocale();
  const [state, dispatch, pending] = useActionState<ImportState, FormData>(importClients, {});
  const [fileName, setFileName] = useState('');

  // Manual submit: React would otherwise reset the form (and the chosen file) after the check step
  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    startTransition(() => dispatch(data));
  }

  const field = (path: string) => (path.startsWith('ids.') ? path.slice(4) : FIELD_KEYS[path] ? t(`fields.${FIELD_KEYS[path]}` as 'fields.name') : path);
  const p = state.preview;

  if (state.created !== undefined) {
    return (
      <div role="status" className="rounded-2xl border border-line bg-surface p-6">
        <p className="font-display text-xl font-bold">{t('done', { count: state.created })}</p>
        <Link href="/app/clients" className="mt-4 inline-grid h-11 place-items-center rounded-xl bg-primary px-5 font-semibold text-on-primary hover:brightness-95">
          {t('seeClients')}
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-5 rounded-2xl border border-line bg-surface p-6">
      <input type="hidden" name="locale" value={locale} />
      <div>
        <label htmlFor="csv-file" className="font-semibold">
          {t('fileLabel')}
        </label>
        <p className="mt-1 text-sm text-muted">{t('fileHint')}</p>
        <input
          id="csv-file"
          name="file"
          type="file"
          accept=".csv,text/csv,text/plain"
          required
          onChange={(e) => setFileName(e.target.files?.[0]?.name ?? '')}
          className="mt-3 block w-full text-sm file:me-4 file:h-11 file:rounded-xl file:border-0 file:bg-primary-soft file:px-4 file:font-semibold file:text-primary-ink"
        />
      </div>

      {state.error && (
        <p role="alert" className="rounded-xl bg-loss/10 px-4 py-3 text-sm text-loss">
          {t(`errors.${state.error}`)}
        </p>
      )}

      {p && (
        <div role="status" className="flex flex-col gap-3 rounded-xl border border-line bg-bg p-4 text-sm">
          <p className="font-semibold">{t('summary', { total: p.total, ready: p.ready })}</p>
          {p.duplicates > 0 && <p className="text-muted">{t('duplicates', { count: p.duplicates })}</p>}
          {p.ignoredColumns.length > 0 && <p className="text-muted">{t('ignored', { columns: p.ignoredColumns.join(', ') })}</p>}
          {p.invalid.length > 0 && (
            <div>
              <p className="font-semibold text-warn">{t('invalid', { count: p.invalid.length })}</p>
              <ul className="mt-2 max-h-64 list-inside list-disc overflow-auto text-muted">
                {p.invalid.map((r) => (
                  <li key={r.line}>
                    {t('line', { line: r.line })} {r.name ? `(${r.name})` : ''} : {r.errors.map(field).join(', ')}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button type="submit" name="commit" value="0" disabled={pending} className="h-11 rounded-xl border border-line bg-surface px-5 font-semibold hover:bg-bg disabled:opacity-60">
          {pending ? t('checking') : t(p ? 'recheck' : 'check')}
        </button>
        {p && p.ready > 0 && (
          <button type="submit" name="commit" value="1" disabled={pending || !fileName} className="h-11 rounded-xl bg-primary px-5 font-semibold text-on-primary hover:brightness-95 disabled:opacity-60">
            {t('import', { count: p.ready })}
          </button>
        )}
      </div>
    </form>
  );
}
