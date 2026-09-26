'use client';

import { useActionState, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { deleteClient, saveClient } from '@/app/[locale]/app/clients/actions';
import AddressFields from '@/components/form/AddressFields';
import { Checkbox, Input, SaveBar, Section, Select, Textarea, keepValues } from '@/components/form/fields';
import { DOC_LOCALES } from '@/lib/catalog';
import { countryRules } from '@/lib/countries';
import type { FormState } from '@/lib/forms';
import { CURRENCY_OPTIONS } from '@/lib/money';

type Address = { line1?: string; line2?: string; postalCode?: string; city?: string; region?: string; country?: string };

export type ClientValues = {
  _id?: string;
  kind?: 'business' | 'individual';
  name?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: Address;
  deliveryAddress?: Address;
  ids?: { scheme: string; value: string }[];
  preferredDocLocale?: string;
  preferredCurrency?: string;
  notes?: string;
};

export default function ClientForm({ initial, defaultCountry }: { initial: ClientValues; defaultCountry: string }) {
  const t = useTranslations('clients');
  const tc = useTranslations('catalog');
  const tCommon = useTranslations('common');
  const te = useTranslations('errors');
  const locale = useLocale();
  const lang = locale === 'fr' ? 'fr' : 'en';
  const [state, action, pending] = useActionState<FormState, FormData>(saveClient, {});
  const errors = state.errors;
  const [kind, setKind] = useState(initial.kind ?? 'business');
  const [country, setCountry] = useState(initial.address?.country ?? defaultCountry);
  const [deliveryCountry, setDeliveryCountry] = useState(initial.deliveryAddress?.country ?? country);
  const [hasDelivery, setHasDelivery] = useState(Boolean(initial.deliveryAddress));
  const schemes = countryRules(country).idSchemes.filter((s) => s.buyer);
  const idValue = (scheme: string) => initial.ids?.find((i) => i.scheme === scheme)?.value ?? '';

  return (
    <form onSubmit={keepValues(action)} className="flex flex-col gap-6" noValidate>
      <input type="hidden" name="id" value={initial._id ?? ''} />
      <input type="hidden" name="locale" value={locale} />
      {errors?._form && <p className="rounded-xl bg-loss/10 px-4 py-3 text-sm text-loss">{te("notFound")}</p>}

      <Section title={t('title')}>
        <Select
          name="kind"
          label={t('kind')}
          value={kind}
          onChange={(e) => setKind(e.target.value as 'business' | 'individual')}
          options={(['business', 'individual'] as const).map((k) => ({ value: k, label: tc(`clientKinds.${k}`) }))}
        />
        <Input name="name" label={kind === 'business' ? t('nameBusiness') : t('nameIndividual')} defaultValue={initial.name} errors={errors} maxLength={150} required />
        {kind === 'business' && <Input name="contactName" label={t('contactName')} defaultValue={initial.contactName} errors={errors} maxLength={150} optional />}
        <Input name="email" type="email" label={t('email')} defaultValue={initial.email} errors={errors} optional />
        <Input name="phone" type="tel" label={t('phone')} defaultValue={initial.phone} errors={errors} maxLength={40} optional />
      </Section>

      <Section title={t('address')}>
        <AddressFields prefix="address" value={initial.address} errors={errors} country={country} onCountryChange={setCountry} />
        <div className="sm:col-span-2">
          <Checkbox name="hasDeliveryAddress" label={t('delivery')} checked={hasDelivery} onChange={(e) => setHasDelivery(e.target.checked)} />
        </div>
      </Section>

      {hasDelivery && (
        <Section title={t('deliveryTitle')}>
          <AddressFields prefix="deliveryAddress" value={initial.deliveryAddress} errors={errors} country={deliveryCountry} onCountryChange={setDeliveryCountry} />
        </Section>
      )}

      {kind === 'business' && (
        <Section title={t('ids')} description={country === 'FR' ? t('idsHint') : undefined}>
          {schemes.map((s) => (
            <Input key={`${country}-${s.scheme}`} name={`ids.${s.scheme}`} label={s.label[lang]} placeholder={s.placeholder} defaultValue={idValue(s.scheme)} errors={errors} maxLength={40} optional />
          ))}
        </Section>
      )}

      <Section title={t('preferences')}>
        <Select
          name="preferredDocLocale"
          label={t('docLocale')}
          defaultValue={initial.preferredDocLocale ?? ''}
          options={[{ value: '', label: t('default') }, ...DOC_LOCALES.map((l) => ({ value: l, label: tc(`docLocales.${l}`) }))]}
        />
        <Select name="preferredCurrency" label={t('currency')} defaultValue={initial.preferredCurrency ?? ''} errors={errors} options={[{ value: '', label: t('default') }, ...CURRENCY_OPTIONS.map((c) => ({ value: c, label: c }))]} />
        <Textarea name="notes" label={t('notes')} hint={t('notesHint')} defaultValue={initial.notes} errors={errors} maxLength={2000} optional wrapperClass="sm:col-span-2" />
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
                if (confirm(tCommon('confirmDelete'))) void deleteClient(initial._id!, locale);
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
