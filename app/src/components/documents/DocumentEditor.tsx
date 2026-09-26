'use client';

import { useActionState, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { saveDraft } from '@/app/[locale]/app/documents/actions';
import { keepValues } from '@/components/form/fields';
import { Link } from '@/i18n/navigation';
import { DOC_LOCALES, UNIT_CODES, VAT_CATEGORIES, type VatCategory } from '@/lib/catalog';
import { computeTotals } from '@/lib/documents/totals';
import type { FormState } from '@/lib/forms';
import { CURRENCY_OPTIONS, formatMinor, parseAmount, toInput } from '@/lib/money';

export type EditorLine = {
  productId?: string;
  description: string;
  kind: 'goods' | 'service';
  qty: string;
  unitCode: string;
  unitPrice: string;
  discountPct: string;
  vatCategory: VatCategory;
  taxRate: string;
  exemptionReason?: string;
};

export type EditorValues = {
  id?: string;
  type: 'quote' | 'invoice' | 'credit_note' | 'deposit_invoice';
  clientId?: string;
  issueDate: string;
  dueDate?: string;
  validUntil?: string;
  serviceDate?: string;
  currency: string;
  docLocale: 'en' | 'fr';
  buyerReference?: string;
  notes?: string;
  lines: EditorLine[];
};

export type EditorClient = { id: string; name: string; preferredCurrency?: string; preferredDocLocale?: string };
export type EditorProduct = { id: string; name: string; description?: string; unitPrice: number; currency: string; unitCode: string; taxRate: number; vatCategory: VatCategory; kind: 'goods' | 'service' };

type Props = {
  initial: EditorValues;
  clients: EditorClient[];
  products: EditorProduct[];
  defaults: { vatCategory: VatCategory; taxRate: number; rates: number[]; paymentTermsDays: number };
};

const control = 'h-11 w-full rounded-xl border border-line bg-surface px-3 text-base outline-none focus:border-primary-ink focus:ring-2 focus:ring-primary/40';
const addDays = (iso: string, days: number) => new Date(new Date(`${iso}T00:00:00Z`).getTime() + days * 86_400_000).toISOString().slice(0, 10);
const num = (s: string) => Number(String(s).replace(',', '.'));

function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-xs font-medium text-muted">
      {children}
    </label>
  );
}

export default function DocumentEditor({ initial, clients, products, defaults }: Props) {
  const t = useTranslations('documents.editor');
  const tc = useTranslations('catalog');
  const te = useTranslations('errors');
  const tCommon = useTranslations('common');
  const locale = useLocale();
  const [state, action, pending] = useActionState<FormState, FormData>(saveDraft, {});
  const [v, setV] = useState<EditorValues>(initial);
  const [dueTouched, setDueTouched] = useState(Boolean(initial.id));
  const errors = state.errors ?? {};
  const err = (key: string) => {
    const code = errors[key];
    if (!code) return null;
    const k = code as Parameters<typeof te>[0];
    return <p className="mt-1 text-xs text-loss">{te.has(k) ? te(k) : te('invalid')}</p>;
  };

  const blankLine = (): EditorLine => ({ description: '', kind: 'service', qty: '1', unitCode: 'C62', unitPrice: '', discountPct: '0', vatCategory: defaults.vatCategory, taxRate: String(defaults.taxRate) });
  const set = <K extends keyof EditorValues>(key: K, value: EditorValues[K]) => setV((prev) => ({ ...prev, [key]: value }));
  const setLine = (i: number, patch: Partial<EditorLine>) => setV((prev) => ({ ...prev, lines: prev.lines.map((l, j) => (j === i ? { ...l, ...patch } : l)) }));
  const isPayable = v.type === 'invoice' || v.type === 'deposit_invoice';

  const preview = useMemo(() => {
    const lines = v.lines.map((l) => ({ qty: num(l.qty) || 0, unitPrice: parseAmount(l.unitPrice || '0', v.currency) ?? 0, discountPct: num(l.discountPct) || 0, vatCategory: l.vatCategory, taxRate: num(l.taxRate) || 0 }));
    return computeTotals(lines);
  }, [v.lines, v.currency]);
  const money = (minor: number) => formatMinor(minor, v.currency, locale);

  function chooseClient(id: string) {
    const c = clients.find((x) => x.id === id);
    setV((prev) => ({
      ...prev,
      clientId: id || undefined,
      ...(c?.preferredCurrency && prev.lines.every((l) => !l.unitPrice) ? { currency: c.preferredCurrency } : {}),
      ...(c?.preferredDocLocale ? { docLocale: c.preferredDocLocale as 'en' | 'fr' } : {}),
    }));
  }

  function addProduct(id: string) {
    const p = products.find((x) => x.id === id);
    if (!p) return;
    const line: EditorLine = {
      productId: p.id,
      description: p.description ? `${p.name} — ${p.description}` : p.name,
      kind: p.kind,
      qty: '1',
      unitCode: p.unitCode,
      unitPrice: toInput(p.unitPrice, p.currency, locale),
      discountPct: '0',
      vatCategory: p.vatCategory,
      taxRate: String(p.taxRate),
    };
    setV((prev) => ({ ...prev, lines: [...prev.lines.filter((l) => l.description || l.unitPrice), line] }));
  }

  const payload = JSON.stringify({
    ...v,
    lines: v.lines.map((l) => ({ ...l, discountPct: l.discountPct || '0', taxRate: l.vatCategory === 'S' ? l.taxRate || '0' : '0' })),
  });

  return (
    <form onSubmit={keepValues(action)} className="flex flex-col gap-6" noValidate>
      <input type="hidden" name="payload" value={payload} />
      <input type="hidden" name="locale" value={locale} />
      {errors._form && <p className="rounded-xl bg-loss/10 px-4 py-3 text-sm text-loss">{te.has(errors._form as 'locked') ? te(errors._form as 'locked') : te('generic')}</p>}

      <section className="grid gap-4 rounded-2xl border border-line bg-surface p-5 sm:grid-cols-2 sm:p-6">
        <div className="sm:col-span-2">
          <div className="flex items-baseline justify-between">
            <Label htmlFor="client">{t('client')}</Label>
            <Link href="/app/clients/new" className="text-xs font-medium text-primary-ink hover:underline">
              {t('newClient')}
            </Link>
          </div>
          <select id="client" className={control} value={v.clientId ?? ''} onChange={(e) => chooseClient(e.target.value)}>
            <option value="">{clients.length ? t('chooseClient') : t('noClients')}</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          {err('clientId')}
        </div>
        <div>
          <Label htmlFor="issueDate">{t('issueDate')}</Label>
          <input
            id="issueDate"
            type="date"
            className={control}
            value={v.issueDate}
            onChange={(e) => {
              const issueDate = e.target.value;
              setV((prev) => ({
                ...prev,
                issueDate,
                ...(isPayable && !dueTouched && issueDate ? { dueDate: addDays(issueDate, defaults.paymentTermsDays) } : {}),
                ...(prev.type === 'quote' && issueDate ? { validUntil: addDays(issueDate, 30) } : {}),
              }));
            }}
          />
          {err('issueDate')}
        </div>
        {isPayable && (
          <div>
            <Label htmlFor="dueDate">{t('dueDate')}</Label>
            <input id="dueDate" type="date" className={control} value={v.dueDate ?? ''} onChange={(e) => (setDueTouched(true), set('dueDate', e.target.value))} />
            {err('dueDate')}
          </div>
        )}
        {v.type === 'quote' && (
          <div>
            <Label htmlFor="validUntil">{t('validUntil')}</Label>
            <input id="validUntil" type="date" className={control} value={v.validUntil ?? ''} onChange={(e) => set('validUntil', e.target.value)} />
          </div>
        )}
        <div>
          <Label htmlFor="serviceDate">{t('serviceDate')}</Label>
          <input id="serviceDate" type="date" className={control} value={v.serviceDate ?? ''} onChange={(e) => set('serviceDate', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="buyerReference">{t('buyerReference')}</Label>
          <input id="buyerReference" className={control} maxLength={100} value={v.buyerReference ?? ''} onChange={(e) => set('buyerReference', e.target.value)} />
        </div>
        <div>
          <Label htmlFor="currency">{t('currency')}</Label>
          <select id="currency" className={control} value={v.currency} onChange={(e) => set('currency', e.target.value)}>
            {Array.from(new Set([v.currency, ...CURRENCY_OPTIONS])).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="docLocale">{t('docLocale')}</Label>
          <select id="docLocale" className={control} value={v.docLocale} onChange={(e) => set('docLocale', e.target.value as 'en' | 'fr')}>
            {DOC_LOCALES.map((l) => (
              <option key={l} value={l}>
                {tc(`docLocales.${l}`)}
              </option>
            ))}
          </select>
        </div>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-lg font-bold">{t('lines')}</h2>
          {products.length > 0 && (
            <select className={`${control} sm:w-72`} value="" onChange={(e) => addProduct(e.target.value)} aria-label={t('addProduct')}>
              <option value="">{t('addProduct')}</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} · {formatMinor(p.unitPrice, p.currency, locale)}
                </option>
              ))}
            </select>
          )}
        </div>

        <ol className="mt-4 flex flex-col gap-4">
          {v.lines.map((l, i) => (
            <li key={i} className="grid grid-cols-2 gap-3 rounded-xl border border-line p-4 sm:grid-cols-12">
              <div className="col-span-2 sm:col-span-12">
                <Label htmlFor={`d-${i}`}>{t('description')}</Label>
                <input id={`d-${i}`} className={control} maxLength={1000} value={l.description} onChange={(e) => setLine(i, { description: e.target.value })} />
                {err(`lines.${i}.description`)}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor={`q-${i}`}>{t('qty')}</Label>
                <input id={`q-${i}`} className={control} inputMode="decimal" value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} />
                {err(`lines.${i}.qty`)}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor={`u-${i}`}>{t('unit')}</Label>
                <select id={`u-${i}`} className={control} value={l.unitCode} onChange={(e) => setLine(i, { unitCode: e.target.value })}>
                  {UNIT_CODES.map((u) => (
                    <option key={u} value={u}>
                      {tc(`units.${u}`)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="sm:col-span-3">
                <Label htmlFor={`p-${i}`}>{t('unitPrice')}</Label>
                <input id={`p-${i}`} className={control} inputMode="decimal" value={l.unitPrice} onChange={(e) => setLine(i, { unitPrice: e.target.value })} />
                {err(`lines.${i}.unitPrice`)}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor={`r-${i}`}>{t('discount')}</Label>
                <input id={`r-${i}`} className={control} inputMode="decimal" value={l.discountPct} onChange={(e) => setLine(i, { discountPct: e.target.value })} />
              </div>
              <div className="flex items-end justify-end sm:col-span-3">
                <p className="tabular pb-2 text-end font-semibold">
                  <span className="block text-xs font-medium text-muted">{t('lineTotal')}</span>
                  {money(preview.lines[i] ?? 0)}
                </p>
              </div>
              <div className="col-span-2 sm:col-span-5">
                <Label htmlFor={`c-${i}`}>{t('vat')}</Label>
                <select id={`c-${i}`} className={control} value={l.vatCategory} onChange={(e) => setLine(i, { vatCategory: e.target.value as VatCategory })}>
                  {VAT_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {tc(`vat.${c}`)}
                    </option>
                  ))}
                </select>
              </div>
              {l.vatCategory === 'S' && (
                <div className="sm:col-span-3">
                  <Label htmlFor={`t-${i}`}>{t('rate')}</Label>
                  <select id={`t-${i}`} className={control} value={l.taxRate} onChange={(e) => setLine(i, { taxRate: e.target.value })}>
                    {Array.from(new Set([num(l.taxRate), ...defaults.rates])).map((r) => (
                      <option key={r} value={String(r)}>
                        {r} %
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {l.vatCategory === 'E' && (
                <div className="col-span-2 sm:col-span-5">
                  <Label htmlFor={`x-${i}`}>{t('exemptionReason')}</Label>
                  <input id={`x-${i}`} className={control} maxLength={300} value={l.exemptionReason ?? ''} onChange={(e) => setLine(i, { exemptionReason: e.target.value })} />
                </div>
              )}
              <div className="col-span-2 flex items-end justify-end sm:col-span-12">
                <button type="button" onClick={() => set('lines', v.lines.filter((_, j) => j !== i))} className="text-sm text-muted hover:text-loss">
                  {t('removeLine')}
                </button>
              </div>
            </li>
          ))}
        </ol>
        {v.lines.length === 0 && <p className="mt-4 text-sm text-muted">{t('emptyLines')}</p>}
        <button type="button" onClick={() => set('lines', [...v.lines, blankLine()])} className="mt-4 h-11 rounded-xl border border-dashed border-line px-4 font-medium text-primary-ink hover:bg-bg">
          {t('addLine')}
        </button>

        <dl className="tabular ms-auto mt-6 flex max-w-sm flex-col gap-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">{t('subtotal')}</dt>
            <dd className="font-semibold">{money(preview.totalExclTax)}</dd>
          </div>
          {preview.taxBreakdown.map((g) => (
            <div key={`${g.category}-${g.rate}`} className="flex justify-between gap-4">
              <dt className="text-muted">{g.category === 'S' ? t('tax', { rate: g.rate }) : t('taxExempt', { category: tc(`vat.${g.category}`) })}</dt>
              <dd>{money(g.amount)}</dd>
            </div>
          ))}
          <div className="flex justify-between gap-4 border-t border-line pt-2 text-base">
            <dt className="font-semibold">{t('total')}</dt>
            <dd className="font-display text-xl font-extrabold">{money(preview.totalInclTax)}</dd>
          </div>
          <p className="text-end text-xs text-muted">{t('serverRecalc')}</p>
        </dl>
      </section>

      <section className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
        <Label htmlFor="notes">{t('notes')}</Label>
        <textarea id="notes" rows={3} maxLength={2000} className={`${control} h-auto py-3`} value={v.notes ?? ''} onChange={(e) => set('notes', e.target.value)} />
      </section>

      <div className="sticky bottom-20 z-10 flex items-center justify-end gap-3 rounded-2xl border border-line bg-surface/95 p-3 shadow-sm backdrop-blur lg:bottom-4">
        <p className="me-auto text-sm text-loss">{Object.keys(errors).length > 0 && !errors._form ? tCommon('formHasErrors') : ''}</p>
        <button type="submit" disabled={pending} className="h-11 rounded-xl bg-primary px-6 font-semibold text-on-primary hover:brightness-95 disabled:opacity-60">
          {pending ? '…' : t('saveDraft')}
        </button>
      </div>
    </form>
  );
}
