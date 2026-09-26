'use client';

import { useActionState, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { deleteProduct, saveProduct } from '@/app/[locale]/app/products/actions';
import { Input, SaveBar, Section, Select, Textarea, keepValues } from '@/components/form/fields';
import { UNIT_CODES, VAT_CATEGORIES } from '@/lib/catalog';
import type { FormState } from '@/lib/forms';
import { CURRENCY_OPTIONS, toInput } from '@/lib/money';

export type ProductValues = {
  _id?: string;
  name?: string;
  description?: string;
  kind?: 'goods' | 'service';
  unitCode?: string;
  unitPrice?: number;
  currency?: string;
  taxRate?: number;
  vatCategory?: string;
};

export default function ProductForm({ initial, defaults }: { initial: ProductValues; defaults: { currency: string; taxRate: number; vatCategory: string; rates: number[] } }) {
  const t = useTranslations('products');
  const tc = useTranslations('catalog');
  const tCommon = useTranslations('common');
  const te = useTranslations('errors');
  const locale = useLocale();
  const [state, action, pending] = useActionState<FormState, FormData>(saveProduct, {});
  const errors = state.errors;
  const [currency, setCurrency] = useState(initial.currency ?? defaults.currency);
  const [vatCategory, setVatCategory] = useState(initial.vatCategory ?? defaults.vatCategory);

  return (
    <form onSubmit={keepValues(action)} className="flex flex-col gap-6" noValidate>
      <input type="hidden" name="id" value={initial._id ?? ''} />
      <input type="hidden" name="locale" value={locale} />
      {errors?._form && <p className="rounded-xl bg-loss/10 px-4 py-3 text-sm text-loss">{te('notFound')}</p>}

      <Section title={t('newTitle')}>
        <Input name="name" label={t('name')} defaultValue={initial.name} errors={errors} maxLength={150} required wrapperClass="sm:col-span-2" />
        <Textarea name="description" label={t('description')} defaultValue={initial.description} errors={errors} maxLength={1000} optional wrapperClass="sm:col-span-2" />
        <Select name="kind" label={t('kind')} defaultValue={initial.kind ?? 'service'} options={(['service', 'goods'] as const).map((k) => ({ value: k, label: tc(`kinds.${k}`) }))} />
        <Select name="unitCode" label={t('unit')} defaultValue={initial.unitCode ?? 'C62'} options={UNIT_CODES.map((u) => ({ value: u, label: tc(`units.${u}`) }))} />
        <Input
          name="unitPrice"
          label={t('unitPrice')}
          inputMode="decimal"
          defaultValue={initial.unitPrice !== undefined ? toInput(initial.unitPrice, initial.currency ?? currency, locale) : ''}
          errors={errors}
          required
        />
        <Select name="currency" label={t('currency')} value={currency} onChange={(e) => setCurrency(e.target.value)} errors={errors} options={Array.from(new Set([currency, ...CURRENCY_OPTIONS])).map((c) => ({ value: c, label: c }))} />
        <Select name="vatCategory" label={t('vatCategory')} value={vatCategory} onChange={(e) => setVatCategory(e.target.value)} options={VAT_CATEGORIES.map((v) => ({ value: v, label: tc(`vat.${v}`) }))} />
        {vatCategory === 'S' ? (
          <Select
            name="taxRate"
            label={t('taxRate')}
            defaultValue={String(initial.taxRate ?? defaults.taxRate)}
            errors={errors}
            options={Array.from(new Set([...(initial.taxRate !== undefined ? [initial.taxRate] : []), ...defaults.rates])).map((r) => ({ value: String(r), label: `${r} %` }))}
          />
        ) : (
          <input type="hidden" name="taxRate" value="0" />
        )}
      </Section>

      <SaveBar
        pending={pending}
        hasErrors={Boolean(errors)}
        extra={
          initial._id ? (
            <button
              type="button"
              className="h-11 rounded-xl px-4 text-sm font-medium text-muted hover:bg-bg hover:text-loss"
              onClick={() => {
                if (confirm(tCommon('confirmDelete'))) void deleteProduct(initial._id!, locale);
              }}
            >
              {tCommon('delete')}
            </button>
          ) : null
        }
      />
    </form>
  );
}
