'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { countryOptions } from '@/lib/countries';
import type { Address } from '@/models/common';
import { Input, Select } from './fields';

type Props = {
  prefix: string;
  value?: Partial<Address>;
  errors?: Record<string, string>;
  country: string;
  onCountryChange?: (code: string) => void;
};

export default function AddressFields({ prefix, value, errors, country, onCountryChange }: Props) {
  const t = useTranslations('settings');
  const locale = useLocale();
  const countries = useMemo(() => countryOptions(locale), [locale]);
  const n = (field: string) => `${prefix}.${field}`;

  return (
    <>
      <Input name={n('line1')} label={t('line1')} defaultValue={value?.line1} errors={errors} autoComplete="address-line1" maxLength={200} wrapperClass="sm:col-span-2" />
      <Input name={n('line2')} label={t('line2')} defaultValue={value?.line2} errors={errors} autoComplete="address-line2" maxLength={200} optional wrapperClass="sm:col-span-2" />
      <Input name={n('postalCode')} label={t('postalCode')} defaultValue={value?.postalCode} errors={errors} autoComplete="postal-code" maxLength={20} optional />
      <Input name={n('city')} label={t('city')} defaultValue={value?.city} errors={errors} autoComplete="address-level2" maxLength={100} />
      <Input name={n('region')} label={t('region')} defaultValue={value?.region} errors={errors} autoComplete="address-level1" maxLength={100} optional />
      <Select
        name={n('country')}
        label={t('country')}
        errors={errors}
        value={country}
        onChange={(e) => onCountryChange?.(e.target.value)}
        options={countries.map((c) => ({ value: c.code, label: c.name }))}
      />
    </>
  );
}
