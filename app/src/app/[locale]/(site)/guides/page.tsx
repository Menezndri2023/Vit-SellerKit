import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link, redirect } from '@/i18n/navigation';
import { GUIDES, guideLang } from '@/content/guides';

/** Guides are written in French and English; the Arabic URL sends to the French list. */
export async function generateMetadata({ params }: PageProps<'/[locale]/guides'>): Promise<Metadata> {
  const { locale } = await params;
  const lang = guideLang(locale);
  const t = await getTranslations({ locale: lang, namespace: 'guides' });
  return {
    title: t('metaTitle'),
    description: t('metaDescription'),
    alternates: { canonical: `/${lang}/guides`, languages: { fr: '/fr/guides', en: '/en/guides', 'x-default': '/en/guides' } },
  };
}

export default async function GuidesIndex({ params }: PageProps<'/[locale]/guides'>) {
  const { locale } = await params;
  if (locale === 'ar') redirect({ href: '/guides', locale: 'fr' });
  setRequestLocale(locale);
  const lang = guideLang(locale);
  const t = await getTranslations('guides');
  return (
    <div className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
      <h1 className="font-display text-4xl font-extrabold">{t('title')}</h1>
      <p className="mt-3 text-lg text-muted">{t('subtitle')}</p>
      <ul className="mt-8 flex flex-col gap-4">
        {GUIDES.map((g) => (
          <li key={g.id}>
            <Link href={`/guides/${g.text[lang].slug}`} className="block rounded-2xl border border-line bg-surface p-5 hover:border-primary-ink">
              <h2 className="font-display text-xl font-bold">{g.text[lang].title}</h2>
              <p className="mt-2 text-muted">{g.text[lang].description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
