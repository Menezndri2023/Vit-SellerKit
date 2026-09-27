'use client';

import { useEffect, useMemo, useState } from 'react';
import { useLocale, useTranslations } from 'next-intl';
import { track } from '@vercel/analytics';
import NumberInput from './NumberInput';
import {
  CURRENCIES,
  PLATFORM_PRESETS,
  PLATFORMS,
  formatMoney,
  formatPct,
  toInputs,
  toQuery,
  type CalculatorState,
  type Currency,
  type NumberField,
  type Platform,
} from '@/lib/calculator-state';
import { computeProfit } from '@/lib/profit';
import { fmtLocale } from '@/lib/intl';

function currencySymbol(currency: Currency, locale: string) {
  return new Intl.NumberFormat(fmtLocale(locale), { style: 'currency', currency }).formatToParts(0).find((p) => p.type === 'currency')?.value ?? currency;
}

const selectClass =
  'h-12 w-full rounded-xl border border-line bg-surface px-4 text-base text-ink outline-none focus:border-primary-ink focus:ring-2 focus:ring-primary/40';

export default function Calculator({ initial }: { initial: CalculatorState }) {
  const t = useTranslations();
  const locale = useLocale();
  const [s, setS] = useState<CalculatorState>(initial);
  const [shareState, setShareState] = useState<'idle' | 'working' | 'error'>('idle');
  const [copied, setCopied] = useState(false);

  const results = useMemo(() => computeProfit(toInputs(s)), [s]);
  const money = (v: number | null) => (v === null ? t('results.none') : formatMoney(v, s.cur, locale));
  const sym = currencySymbol(s.cur, locale);

  // Keep the URL in sync so any result can be shared as a link
  useEffect(() => {
    const id = setTimeout(() => window.history.replaceState(null, '', `?${toQuery(s)}`), 300);
    return () => clearTimeout(id);
  }, [s]);

  const set = (field: NumberField) => (value: number) =>
    setS((prev) => ({ ...prev, [field]: value, ...(field === 'pf' || field === 'ff' || field === 'pay' ? { pl: 'custom' as Platform } : {}) }));

  const choosePlatform = (pl: Platform) => {
    const preset = PLATFORM_PRESETS[pl];
    setS((prev) => (preset ? { ...prev, pl, pf: preset.platformPct, ff: preset.platformFixed, pay: preset.paymentPct } : { ...prev, pl }));
  };

  async function share() {
    setShareState('working');
    track('share_result', { status: results?.status ?? 'invalid' });
    try {
      const res = await fetch(`/api/share?locale=${locale}&${toQuery(s)}`);
      if (!res.ok) throw new Error(String(res.status));
      const file = new File([await res.blob()], 'margokit-profit.png', { type: 'image/png' });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], text: window.location.href }).catch(() => undefined);
      } else {
        const url = URL.createObjectURL(file);
        const a = Object.assign(document.createElement('a'), { href: url, download: file.name });
        a.click();
        URL.revokeObjectURL(url);
      }
      setShareState('idle');
    } catch {
      setShareState('error');
    }
  }

  async function copyLink() {
    await navigator.clipboard.writeText(window.location.href);
    track('copy_link');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const statusStyle = {
    loss: 'bg-loss/10 text-loss border-loss/30',
    thin: 'bg-warn/10 text-warn border-warn/30',
    ok: 'bg-profit/10 text-profit border-profit/30',
  } as const;

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_400px] lg:items-start">
      {/* Inputs */}
      <div className="flex flex-col gap-6">
        <fieldset className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <legend className="px-1 font-display text-lg font-bold">{t('form.product')}</legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="currency" className="text-sm font-medium">
                {t('form.currency')}
              </label>
              <select id="currency" className={selectClass} value={s.cur} onChange={(e) => setS({ ...s, cur: e.target.value as Currency })}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c} ({currencySymbol(c, locale)})
                  </option>
                ))}
              </select>
            </div>
            <NumberInput label={t('form.price')} value={s.p} onChange={set('p')} suffix={sym} />
            <NumberInput label={t('form.productCost')} hint={t('form.productCostHint')} value={s.pc} onChange={set('pc')} suffix={sym} />
            <NumberInput label={t('form.packaging')} value={s.pk} onChange={set('pk')} suffix={sym} />
            <NumberInput label={t('form.shipping')} value={s.sh} onChange={set('sh')} suffix={sym} />
          </div>
        </fieldset>

        <fieldset className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <legend className="px-1 font-display text-lg font-bold">{t('form.selling')}</legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label htmlFor="platform" className="text-sm font-medium">
                {t('form.platform')}
              </label>
              <select id="platform" className={selectClass} value={s.pl} onChange={(e) => choosePlatform(e.target.value as Platform)}>
                {PLATFORMS.map((p) => (
                  <option key={p} value={p}>
                    {t(`form.platforms.${p}`)}
                  </option>
                ))}
              </select>
            </div>
            <NumberInput label={t('form.platformPct')} value={s.pf} onChange={set('pf')} suffix="%" max={100} />
            <NumberInput label={t('form.platformFixed')} value={s.ff} onChange={set('ff')} suffix={sym} />
            <NumberInput label={t('form.paymentPct')} value={s.pay} onChange={set('pay')} suffix="%" max={100} />
          </div>
          <p className="mt-4 text-xs text-muted">{t('form.feesNote')}</p>
        </fieldset>

        <fieldset className="rounded-2xl border border-line bg-surface p-5 sm:p-6">
          <legend className="px-1 font-display text-lg font-bold">{t('form.adsReturns')}</legend>
          <div className="mt-2 grid gap-4 sm:grid-cols-2">
            <NumberInput label={t('form.adCost')} hint={t('form.adCostHint')} value={s.ad} onChange={set('ad')} suffix={sym} />
            <NumberInput label={t('form.returnRate')} hint={t('form.returnRateHint')} value={s.rr} onChange={set('rr')} suffix="%" max={99} />
            <NumberInput label={t('form.returnCost')} hint={t('form.returnCostHint')} value={s.rc} onChange={set('rc')} suffix={sym} />
            <NumberInput label={t('form.adBudget')} value={s.b} onChange={set('b')} suffix={sym} />
          </div>
        </fieldset>
      </div>

      {/* Results */}
      <section id="results" aria-live="polite" className="scroll-mt-4 rounded-2xl border border-line bg-surface p-5 sm:p-6 lg:sticky lg:top-6">
        <h2 className="font-display text-lg font-bold">{t('results.title')}</h2>
        {results ? (
          <>
            <p className="mt-4 text-sm text-muted">{t('results.headline', { price: formatMoney(s.p, s.cur, locale) })}</p>
            <p className={`tabular mt-1 font-display text-5xl font-extrabold tracking-tight ${results.profit < 0 ? 'text-loss' : 'text-profit'}`}>
              {money(results.profit)}
            </p>
            <p className="text-sm text-muted">{t('results.perDelivered')}</p>

            <p className={`mt-4 rounded-xl border px-4 py-3 text-sm font-medium ${statusStyle[results.status]}`}>{t(`results.status.${results.status}`)}</p>

            <dl className="tabular mt-4 divide-y divide-line text-sm">
              {[
                [t('results.margin'), formatPct(results.margin, locale)],
                [`${t('results.realCost')} · ${t('results.realCostHint')}`, money(results.realCost)],
                [t('results.breakEven'), money(results.breakEvenPrice)],
                [t('results.price30'), money(results.price30)],
                [t('results.price50'), money(results.price50)],
                [t('results.maxAdCost'), money(results.maxAdCost)],
                [t('results.breakEvenRoas'), results.breakEvenRoas === null ? t('results.none') : `${results.breakEvenRoas.toLocaleString(fmtLocale(locale), { maximumFractionDigits: 2 })}x`],
                [t('results.ordersToRecoup'), results.ordersToRecoup === null ? t('results.none') : t('results.orders', { count: results.ordersToRecoup })],
              ].map(([label, value]) => (
                <div key={label} className="flex items-baseline justify-between gap-4 py-2.5">
                  <dt className="text-muted">{label}</dt>
                  <dd className="whitespace-nowrap font-semibold">{value}</dd>
                </div>
              ))}
            </dl>

            <div className="mt-5 grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <button
                type="button"
                onClick={share}
                disabled={shareState === 'working'}
                className="h-12 w-full rounded-xl bg-primary px-5 font-semibold text-on-primary transition hover:brightness-95 disabled:opacity-60"
              >
                {shareState === 'working' ? t('share.working') : t('share.button')}
              </button>
              <button type="button" onClick={copyLink} className="h-12 w-full rounded-xl border border-line px-5 font-semibold transition hover:bg-bg">
                {copied ? t('share.copied') : t('share.copyLink')}
              </button>
            </div>
            {shareState === 'error' && <p className="mt-2 text-sm text-loss">{t('share.error')}</p>}
          </>
        ) : (
          <p className="mt-4 text-sm text-loss">{t('results.invalid')}</p>
        )}
      </section>

      {/* Mobile: the key number always visible */}
      {results && (
        <a
          href="#results"
          className="fixed inset-x-4 bottom-4 z-10 flex items-center justify-between rounded-2xl border border-line bg-surface/95 px-5 py-3 shadow-lg backdrop-blur lg:hidden"
        >
          <span className="text-sm text-muted">{t('results.perDelivered')}</span>
          <span className={`tabular font-display text-xl font-extrabold ${results.profit < 0 ? 'text-loss' : 'text-profit'}`}>{money(results.profit)}</span>
        </a>
      )}
    </div>
  );
}
