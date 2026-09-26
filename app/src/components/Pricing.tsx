import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { links } from '@/lib/links';

function Check() {
  return (
    <svg aria-hidden viewBox="0 0 20 20" className="mt-0.5 size-5 shrink-0 text-primary-ink">
      <path fill="currentColor" d="M8 13.6 4.4 10l-1.4 1.4L8 16.4l9-9L15.6 6z" />
    </svg>
  );
}

export default async function Pricing() {
  const t = await getTranslations('pricing');
  const monthly = links.proMonthly();
  const lifetime = links.proLifetime();

  const plans = [
    { name: t('freeName'), price: t('freePrice'), period: t('freePeriod'), features: [t('freeF1'), t('freeF2'), t('freeF3'), t('freeF4')], cta: t('freeCta'), href: '/signup', external: false, highlight: false },
    { name: t('monthlyName'), price: t('monthlyPrice'), period: t('monthlyPeriod'), features: [t('proF1'), t('proF2'), t('proF3'), t('proF4')], cta: t('monthlyCta'), href: monthly ?? '/signup', external: Boolean(monthly), highlight: true },
    { name: t('lifetimeName'), price: t('lifetimePrice'), period: t('lifetimePeriod'), features: [t('lifetimeF1'), t('lifetimeF2'), t('proF2'), t('proF3')], cta: t('lifetimeCta'), href: lifetime ?? '/signup', external: Boolean(lifetime), highlight: false },
  ];

  return (
    <section id="pricing" className="mx-auto w-full max-w-6xl scroll-mt-8 px-4 sm:px-6">
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl font-bold">{t('title')}</h2>
        <p className="mt-2 text-muted">{t('subtitle')}</p>
      </div>
      <div className="mt-8 grid gap-5 md:grid-cols-3">
        {plans.map((p) => (
          <div key={p.name} className={`flex flex-col rounded-2xl border bg-surface p-6 ${p.highlight ? 'border-primary-ink ring-2 ring-primary/40' : 'border-line'}`}>
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold">{p.name}</h3>
              {p.highlight && <span className="rounded-full bg-primary px-3 py-1 text-xs font-semibold text-on-primary">{t('popular')}</span>}
            </div>
            <p className="mt-4">
              <span className="font-display text-4xl font-extrabold">{p.price}</span> <span className="text-muted">{p.period}</span>
            </p>
            <ul className="mt-6 flex flex-1 flex-col gap-3 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex gap-2">
                  <Check />
                  {f}
                </li>
              ))}
            </ul>
            {p.external ? (
              <a href={p.href} target="_blank" rel="noopener" className={`mt-6 grid h-12 place-items-center rounded-xl font-semibold ${p.highlight ? 'bg-primary text-on-primary hover:brightness-95' : 'border border-line hover:bg-bg'}`}>
                {p.cta}
              </a>
            ) : (
              <Link href={p.href} className={`mt-6 grid h-12 place-items-center rounded-xl font-semibold ${p.highlight ? 'bg-primary text-on-primary hover:brightness-95' : 'border border-line hover:bg-bg'}`}>
                {p.cta}
              </Link>
            )}
          </div>
        ))}
      </div>
      <p className="mt-4 text-sm text-muted">{t('note')}</p>
    </section>
  );
}
