'use client';

import { useActionState, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { saveProfile } from '@/app/[locale]/app/settings/actions';
import AddressFields from '@/components/form/AddressFields';
import { Checkbox, Input, SaveBar, Section, Select, Textarea, keepValues } from '@/components/form/fields';
import { DOC_LOCALES, VAT_REGIMES } from '@/lib/catalog';
import { countryRules } from '@/lib/countries';
import type { FormState } from '@/lib/forms';
import { CURRENCY_OPTIONS } from '@/lib/money';

export type ProfileValues = {
  legalName?: string;
  tradeName?: string;
  address?: { line1?: string; line2?: string; postalCode?: string; city?: string; region?: string; country?: string };
  email?: string;
  phone?: string;
  website?: string;
  ids?: { scheme: string; value: string }[];
  vatRegime?: string;
  vatOnDebits?: boolean;
  taxRates?: { name?: string; rate: number }[];
  bankAccounts?: { label?: string; holder?: string; iban?: string; bic?: string; accountNumber?: string; bankName?: string }[];
  paymentLinks?: { label?: string; url?: string }[];
  paymentTermsDays?: number;
  latePenaltyText?: string;
  latePenaltyTextEn?: string;
  defaultCurrency?: string;
  defaultDocLocale?: string;
  numbering?: { invoice?: string; quote?: string; credit_note?: string };
  legalMentions?: string;
  footer?: string;
};

const RATE_ROWS = 6;
const rateText = (rate: number, locale: string) => (locale === 'fr' ? String(rate).replace('.', ',') : String(rate));
const ratesFor = (country: string, locale: string) => countryRules(country).taxRates.map((rate) => ({ name: '', rate: rateText(rate, locale) }));

export default function ProfileForm({ initial, isNew, defaultCountry }: { initial: ProfileValues; isNew: boolean; defaultCountry: string }) {
  const t = useTranslations('settings');
  const tc = useTranslations('catalog');
  const locale = useLocale();
  const lang = locale === 'fr' ? 'fr' : 'en';
  const [state, action, pending] = useActionState<FormState, FormData>(saveProfile, {});
  const errors = state.errors;

  const [country, setCountry] = useState(initial.address?.country ?? defaultCountry);
  const [vatRegime, setVatRegime] = useState(initial.vatRegime ?? 'standard');
  const [currency, setCurrency] = useState(initial.defaultCurrency ?? countryRules(country).currency);
  const [rates, setRates] = useState(initial.taxRates?.length ? initial.taxRates.map((r) => ({ name: r.name ?? '', rate: rateText(r.rate, locale) })) : ratesFor(country, locale));
  const rules = countryRules(country);
  const idValue = (scheme: string) => initial.ids?.find((i) => i.scheme === scheme)?.value ?? '';
  const bank = initial.bankAccounts?.[0] ?? {};
  const links = [...(initial.paymentLinks ?? []), {}, {}, {}].slice(0, 3);

  function changeCountry(code: string) {
    setCountry(code);
    if (isNew) {
      setCurrency(countryRules(code).currency);
      setRates(ratesFor(code, locale));
    }
  }

  const rows = [...rates, ...Array.from({ length: RATE_ROWS }, () => ({ name: '', rate: '' }))].slice(0, RATE_ROWS);

  return (
    <form onSubmit={keepValues(action)} className="flex flex-col gap-6" noValidate>
      <Section title={t('business')}>
        <Input name="legalName" label={t('legalName')} hint={t('legalNameHint')} defaultValue={initial.legalName} errors={errors} maxLength={150} required wrapperClass="sm:col-span-2" />
        <Input name="tradeName" label={t('tradeName')} defaultValue={initial.tradeName} errors={errors} maxLength={150} optional />
        <Input name="email" type="email" label={t('email')} defaultValue={initial.email} errors={errors} autoComplete="email" optional />
        <Input name="phone" type="tel" label={t('phone')} defaultValue={initial.phone} errors={errors} autoComplete="tel" maxLength={40} optional />
        <Input name="website" type="url" label={t('website')} defaultValue={initial.website} errors={errors} placeholder="https://" optional />
      </Section>

      <Section title={t('address')}>
        <AddressFields prefix="address" value={initial.address} errors={errors} country={country} onCountryChange={changeCountry} />
      </Section>

      <Section title={t('ids')} description={t('idsHint')}>
        {rules.idSchemes
          .filter((s) => s.seller)
          .map((s) => (
            <Input key={`${country}-${s.scheme}`} name={`ids.${s.scheme}`} label={s.label[lang]} placeholder={s.placeholder} defaultValue={idValue(s.scheme)} errors={errors} maxLength={40} optional />
          ))}
      </Section>

      <Section title={t('tax')}>
        <Select
          name="vatRegime"
          label={t('vatRegime')}
          value={vatRegime}
          onChange={(e) => setVatRegime(e.target.value)}
          options={VAT_REGIMES.map((r) => ({ value: r, label: tc(`regimes.${r}`) }))}
          wrapperClass="sm:col-span-2"
        />
        {vatRegime === 'franchise' && rules.franchiseMention && (
          <p className="rounded-xl bg-primary-soft px-4 py-3 text-sm text-primary-ink sm:col-span-2">{t('franchiseNotice', { mention: rules.franchiseMention[lang] })}</p>
        )}
        {rules.vatOnDebitsOption && vatRegime === 'standard' && (
          <div className="sm:col-span-2">
            <Checkbox name="vatOnDebits" label={t('vatOnDebits')} hint={t('vatOnDebitsHint')} defaultChecked={initial.vatOnDebits} />
          </div>
        )}
        {vatRegime === 'standard' && (
          <div className="flex flex-col gap-3 sm:col-span-2">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <p className="text-sm font-medium">{t('taxRates')}</p>
                <p className="text-xs text-muted">{t('taxRatesHint')}</p>
              </div>
              <button type="button" onClick={() => setRates(ratesFor(country, locale))} className="text-sm font-medium text-primary-ink hover:underline">
                {t('useSuggested')}
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              {rows.map((r, i) => (
                <div key={`${country}-${i}-${r.rate}`} className="grid grid-cols-[1fr_90px] gap-2">
                  <Input name={`taxRates.${i}.name`} label={t('rateName')} defaultValue={r.name} placeholder={rules.taxLabel[lang]} errors={errors} maxLength={40} />
                  <Input name={`taxRates.${i}.rate`} label={t('rate')} defaultValue={r.rate} inputMode="decimal" errors={errors} />
                </div>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Section title={t('payment')}>
        <Input name="paymentTermsDays" type="number" min={0} max={365} label={t('paymentTerms')} defaultValue={initial.paymentTermsDays ?? 30} errors={errors} />
        <div className="hidden sm:block" />
        <p className="text-sm font-medium sm:col-span-2">{t('bankAccount')}</p>
        <Input name="bankAccounts.0.holder" label={t('holder')} defaultValue={bank.holder} errors={errors} maxLength={150} optional />
        <Input name="bankAccounts.0.bankName" label={t('bankName')} defaultValue={bank.bankName} errors={errors} maxLength={100} optional />
        <Input name="bankAccounts.0.iban" label={t('iban')} defaultValue={bank.iban} errors={errors} maxLength={40} autoComplete="off" optional />
        <Input name="bankAccounts.0.bic" label={t('bic')} defaultValue={bank.bic} errors={errors} maxLength={11} autoComplete="off" optional />
        <Input name="bankAccounts.0.accountNumber" label={t('accountNumber')} defaultValue={bank.accountNumber} errors={errors} maxLength={40} optional wrapperClass="sm:col-span-2" />
        <div className="sm:col-span-2">
          <p className="text-sm font-medium">{t('paymentLinks')}</p>
          <p className="text-xs text-muted">{t('paymentLinksHint')}</p>
        </div>
        {links.map((l, i) => (
          <div key={i} className="grid gap-3 sm:col-span-2 sm:grid-cols-[200px_1fr]">
            <Input name={`paymentLinks.${i}.label`} label={t('linkLabel')} defaultValue={l.label} placeholder="PayPal" errors={errors} maxLength={60} />
            <Input name={`paymentLinks.${i}.url`} type="url" label={t('linkUrl')} defaultValue={l.url} placeholder="https://" errors={errors} />
          </div>
        ))}
        <Textarea name="latePenaltyText" label={t('latePenalty')} hint={t('latePenaltyHint')} defaultValue={initial.latePenaltyText} errors={errors} maxLength={500} optional wrapperClass="sm:col-span-2" />
        <Textarea name="latePenaltyTextEn" label={t('latePenaltyEn')} hint={t('latePenaltyEnHint')} defaultValue={initial.latePenaltyTextEn} errors={errors} maxLength={500} optional wrapperClass="sm:col-span-2" />
      </Section>

      <Section title={t('documents')}>
        <Select name="defaultCurrency" label={t('defaultCurrency')} value={currency} onChange={(e) => setCurrency(e.target.value)} errors={errors} options={Array.from(new Set([currency, ...CURRENCY_OPTIONS])).map((c) => ({ value: c, label: c }))} />
        <Select name="defaultDocLocale" label={t('defaultDocLocale')} defaultValue={initial.defaultDocLocale ?? (locale === 'en' ? 'en' : 'fr')} options={DOC_LOCALES.map((l) => ({ value: l, label: tc(`docLocales.${l}`) }))} />
        <div className="sm:col-span-2">
          <p className="text-sm font-medium">{t('numbering')}</p>
          <p className="text-xs text-muted">{t('numberingHint')}</p>
        </div>
        <Input name="numbering.invoice" label={t('numInvoice')} defaultValue={initial.numbering?.invoice ?? 'INV-{YYYY}-{SEQ:3}'} errors={errors} maxLength={40} />
        <Input name="numbering.quote" label={t('numQuote')} defaultValue={initial.numbering?.quote ?? 'QUO-{YYYY}-{SEQ:3}'} errors={errors} maxLength={40} />
        <Input name="numbering.credit_note" label={t('numCredit')} defaultValue={initial.numbering?.credit_note ?? 'CN-{YYYY}-{SEQ:3}'} errors={errors} maxLength={40} />
        <div className="hidden sm:block" />
        <Textarea name="legalMentions" label={t('legalMentions')} hint={t('legalMentionsHint')} defaultValue={initial.legalMentions} errors={errors} maxLength={2000} optional wrapperClass="sm:col-span-2" />
        <Input name="footer" label={t('footer')} defaultValue={initial.footer} errors={errors} maxLength={500} optional wrapperClass="sm:col-span-2" />
      </Section>

      <p className="text-xs text-muted">{t('disclaimer')}</p>
      <SaveBar pending={pending} saved={state.ok} hasErrors={Boolean(errors)} />
    </form>
  );
}
