import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import Calculator from '@/components/Calculator';
import SubscribeForm from '@/components/SubscribeForm';
import { parseState } from '@/lib/calculator-state';

/** Adds UTM tags so Gumroad analytics shows which sales come from the calculator. */
function withUtm(url: string | undefined, content: string) {
  if (!url) return null;
  try {
    const u = new URL(url);
    u.searchParams.set('utm_source', 'calculator');
    u.searchParams.set('utm_medium', 'website');
    u.searchParams.set('utm_content', content);
    return u.toString();
  } catch {
    return null;
  }
}

export default async function Page({ params, searchParams }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const initial = parseState(await searchParams, locale);

  const packUrl = withUtm(process.env.GUMROAD_PACK_URL, 'pack');
  const trackerUrl = withUtm(process.env.GUMROAD_TRACKER_URL, 'tracker');
  const faq = [1, 2, 3, 4] as const;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebApplication',
        name: t('meta.title'),
        description: t('meta.description'),
        url: `${siteUrl}/${locale}`,
        inLanguage: locale,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Any',
        isAccessibleForFree: true,
        offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
        publisher: { '@type': 'Organization', name: 'Margokit', url: siteUrl },
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map((n) => ({
          '@type': 'Question',
          name: t(`faq.q${n}`),
          acceptedAnswer: { '@type': 'Answer', text: t(`faq.a${n}`) },
        })),
      },
    ],
  };

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-28 pt-5 sm:px-6 lg:pb-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />
      <header className="flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-extrabold">
          <span aria-hidden className="grid size-8 place-items-center rounded-lg bg-primary text-on-primary">
            M
          </span>
          Margokit
        </Link>
        <Link href="/" locale={t('header.switchLocale')} className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-surface">
          {t('header.switchLabel')}
        </Link>
      </header>

      <section className="max-w-3xl">
        <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{t('hero.title')}</h1>
        <p className="mt-4 text-lg text-muted">{t('hero.subtitle')}</p>
      </section>

      <Calculator initial={initial} />

      {(packUrl || trackerUrl) && (
        <section className="rounded-2xl bg-ink p-6 text-bg sm:p-8">
          <h2 className="font-display text-2xl font-bold">{t('cta.packTitle')}</h2>
          <p className="mt-2 max-w-2xl opacity-80">{t('cta.packText')}</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            {packUrl && (
              <a href={packUrl} target="_blank" rel="noopener" className="grid h-12 place-items-center rounded-xl bg-primary px-6 font-semibold text-on-primary hover:brightness-95">
                {t('cta.packButton')}
              </a>
            )}
            {trackerUrl && (
              <a href={trackerUrl} target="_blank" rel="noopener" className="grid h-12 place-items-center rounded-xl border border-bg/30 px-6 font-semibold hover:bg-bg/10">
                {t('cta.trackerButton')}
              </a>
            )}
          </div>
        </section>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-dashed border-line p-5 sm:p-8">
          <h2 className="font-display text-2xl font-bold">{t('cta.proTitle')}</h2>
          <p className="mt-2 text-muted">{t('cta.proText')}</p>
        </section>
        <SubscribeForm />
      </div>

      <section>
        <h2 className="font-display text-2xl font-bold">{t('faq.title')}</h2>
        <div className="mt-4 divide-y divide-line rounded-2xl border border-line bg-surface">
          {faq.map((n) => (
            <details key={n} className="group p-5">
              <summary className="cursor-pointer list-none font-semibold marker:hidden">
                <span className="flex items-center justify-between gap-4">
                  {t(`faq.q${n}`)}
                  <span aria-hidden className="text-muted transition group-open:rotate-45">
                    +
                  </span>
                </span>
              </summary>
              <p className="mt-3 text-muted">{t(`faq.a${n}`)}</p>
            </details>
          ))}
        </div>
      </section>

      <footer className="flex flex-col gap-1 border-t border-line pt-6 text-sm text-muted sm:flex-row sm:justify-between">
        <span>{t('footer.tagline')}</span>
        <span>{t('footer.rights', { year: new Date().getFullYear() })}</span>
      </footer>
    </div>
  );
}
