import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Calculator from '@/components/Calculator';
import { routing } from '@/i18n/routing';
import { parseState } from '@/lib/calculator-state';
import { links } from '@/lib/links';

export async function generateMetadata({ params }: PageProps<'/[locale]/calculator'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const languages = Object.fromEntries(routing.locales.map((l) => [l, `/${l}/calculator`]));
  return {
    title: t('calcTitle'),
    description: t('calcDescription'),
    alternates: { canonical: `/${locale}/calculator`, languages: { ...languages, 'x-default': `/${routing.defaultLocale}/calculator` } },
    openGraph: { title: t('calcTitle'), description: t('calcDescription'), url: `/${locale}/calculator` },
  };
}

export default async function CalculatorPage({ params, searchParams }: PageProps<'/[locale]/calculator'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations();
  const initial = parseState(await searchParams, locale);
  const pack = links.pack();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 pb-28 pt-4 sm:px-6 lg:pb-12">
      <section className="max-w-3xl">
        <h1 className="font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-5xl">{t('hero.title')}</h1>
        <p className="mt-4 text-lg text-muted">{t('hero.subtitle')}</p>
      </section>
      <Calculator initial={initial} />
      {pack && (
        <section className="rounded-2xl bg-ink p-6 text-bg sm:p-8">
          <h2 className="font-display text-2xl font-bold">{t('calcCta.packTitle')}</h2>
          <p className="mt-2 max-w-2xl opacity-80">{t('calcCta.packText')}</p>
          <a href={pack} target="_blank" rel="noopener" className="mt-6 inline-grid h-12 place-items-center rounded-xl bg-primary px-6 font-semibold text-on-primary hover:brightness-95">
            {t('calcCta.packButton')}
          </a>
        </section>
      )}
    </div>
  );
}
