import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link, redirect } from '@/i18n/navigation';
import { PUBLISHER_NAME } from '@/lib/brand';
import { jsonLdString } from '@/lib/structured-data';
import { GUIDES, findGuide, findGuideAnyLang, guideLang } from '@/content/guides';

export function generateStaticParams() {
  return GUIDES.flatMap((g) => [{ locale: 'fr', slug: g.text.fr.slug }, { locale: 'en', slug: g.text.en.slug }]);
}

export async function generateMetadata({ params }: PageProps<'/[locale]/guides/[slug]'>): Promise<Metadata> {
  const { locale, slug } = await params;
  const lang = guideLang(locale);
  const g = findGuide(lang, slug);
  if (!g) return {};
  const tx = g.text[lang];
  return {
    title: `${tx.title} — Margokit`,
    description: tx.description,
    alternates: { canonical: `/${lang}/guides/${tx.slug}`, languages: { fr: `/fr/guides/${g.text.fr.slug}`, en: `/en/guides/${g.text.en.slug}`, 'x-default': `/en/guides/${g.text.en.slug}` } },
    openGraph: { type: 'article', title: tx.title, description: tx.description, url: `/${lang}/guides/${tx.slug}` },
  };
}

export default async function GuidePage({ params }: PageProps<'/[locale]/guides/[slug]'>) {
  const { locale, slug } = await params;
  const lang = guideLang(locale);
  const g = findGuide(lang, slug);
  if (!g || locale === 'ar') {
    // Language switch (or Arabic URL): send to this guide in the right language, if it exists
    const other = findGuideAnyLang(slug);
    if (!other) notFound();
    redirect({ href: `/guides/${other.text[lang].slug}`, locale: lang });
  }
  setRequestLocale(locale);
  const t = await getTranslations('guides');
  const tx = g!.text[lang];
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');
  const url = `${site}/${lang}/guides/${tx.slug}`;
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      { '@type': 'Article', headline: tx.title, description: tx.description, inLanguage: lang, datePublished: g!.updated, dateModified: g!.updated, mainEntityOfPage: url, author: { '@type': 'Organization', name: 'Margokit' }, publisher: { '@type': 'Organization', name: PUBLISHER_NAME } },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Margokit', item: `${site}/${lang}` },
          { '@type': 'ListItem', position: 2, name: t('title'), item: `${site}/${lang}/guides` },
          { '@type': 'ListItem', position: 3, name: tx.title, item: url },
        ],
      },
    ],
  };
  return (
    <article className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(jsonLd) }} />
      <nav aria-label={t('breadcrumb')} className="text-sm text-muted">
        <Link href="/guides" className="hover:text-ink">
          {t('title')}
        </Link>
      </nav>
      <h1 className="mt-3 font-display text-3xl font-extrabold leading-tight sm:text-4xl">{tx.title}</h1>
      <p className="mt-2 text-sm text-muted">{t('updated', { date: new Intl.DateTimeFormat(lang === 'fr' ? 'fr-FR' : 'en-GB', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${g!.updated}T00:00:00Z`)) })}</p>
      <p className="mt-6 text-lg leading-relaxed">{tx.intro}</p>
      {tx.blocks.map((b) => (
        <section key={b.h2} className="mt-8">
          <h2 className="font-display text-2xl font-bold">{b.h2}</h2>
          {b.p?.map((p) => (
            <p key={p} className="mt-3 leading-relaxed text-muted">
              {p}
            </p>
          ))}
          {b.list && (
            <ul className="mt-3 list-disc space-y-2 ps-6 leading-relaxed text-muted">
              {b.list.map((li) => (
                <li key={li}>{li}</li>
              ))}
            </ul>
          )}
        </section>
      ))}
      {tx.sources && (
        <section className="mt-8 text-sm text-muted">
          <h2 className="font-display text-lg font-bold text-ink">{t('sources')}</h2>
          <ul className="mt-2 list-disc ps-6">
            {tx.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener" className="underline hover:text-ink">
                  {s.label}
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}
      <div className="mt-10 rounded-2xl bg-ink p-6 text-bg sm:p-8">
        <p className="font-display text-xl font-bold">{t('ctaTitle')}</p>
        <Link href={tx.cta.href} className="mt-4 inline-grid h-12 place-items-center rounded-xl bg-primary px-6 font-semibold text-on-primary hover:brightness-95">
          {tx.cta.label}
        </Link>
      </div>
    </article>
  );
}
