import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import Calculator from '@/components/Calculator';
import Faq from '@/components/Faq';
import Pricing from '@/components/Pricing';
import SheetsCta from '@/components/SheetsCta';
import SubscribeForm from '@/components/SubscribeForm';
import WhatsAppButton from '@/components/WhatsAppButton';
import { testimonials } from '@/content/testimonials';
import { parseState } from '@/lib/calculator-state';
import { links } from '@/lib/links';

export default async function Home({ params, searchParams }: PageProps<'/[locale]'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('landing');
  const initial = parseState(await searchParams, locale);
  const lang = locale === 'fr' ? 'fr' : 'en';
  const features = [1, 2, 3, 4] as const;

  return (
    <div className="flex flex-col gap-20 pb-28 lg:pb-16">
      <section className="mx-auto w-full max-w-6xl px-4 pt-6 sm:px-6 sm:pt-12">
        <h1 className="max-w-4xl font-display text-4xl font-extrabold leading-tight tracking-tight sm:text-6xl">{t('title')}</h1>
        <p className="mt-5 max-w-2xl text-lg text-muted">{t('subtitle')}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <a href="#calculator" className="grid h-12 place-items-center rounded-xl bg-primary px-6 font-semibold text-on-primary hover:brightness-95">
            {t('ctaCalc')}
          </a>
          <Link href="/signup" className="grid h-12 place-items-center rounded-xl border border-line bg-surface px-6 font-semibold hover:bg-bg">
            {t('ctaSignup')}
          </Link>
        </div>
      </section>

      <section id="calculator" className="mx-auto w-full max-w-6xl scroll-mt-6 px-4 sm:px-6">
        <h2 className="font-display text-3xl font-bold">{t('calcTitle')}</h2>
        <p className="mb-6 mt-2 text-muted">{t('calcSubtitle')}</p>
        <Calculator initial={initial} />
      </section>

      <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-bold">{t('proTitle')}</h2>
        <p className="mt-2 text-muted">{t('proSubtitle')}</p>
        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          {features.map((n) => (
            <div key={n} className="rounded-2xl border border-line bg-surface p-6">
              <h3 className="font-display text-lg font-bold">{t(`features.f${n}Title`)}</h3>
              <p className="mt-2 text-muted">{t(`features.f${n}Text`)}</p>
            </div>
          ))}
        </div>
      </section>

      <Pricing />

      <SheetsCta />

      {testimonials.length > 0 && (
        <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
          <h2 className="font-display text-3xl font-bold">{t('testimonialsTitle')}</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {testimonials.map((x) => (
              <figure key={x.name} className="rounded-2xl border border-line bg-surface p-6">
                <blockquote className="text-ink">“{x.quote[lang]}”</blockquote>
                <figcaption className="mt-4 text-sm text-muted">
                  <strong className="text-ink">{x.name}</strong> · {x.role[lang]}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      )}

      <Faq />

      <section className="mx-auto w-full max-w-3xl px-4 sm:px-6">
        <SubscribeForm />
      </section>

      <WhatsAppButton href={links.whatsapp()} label={t('whatsapp')} />
    </div>
  );
}
