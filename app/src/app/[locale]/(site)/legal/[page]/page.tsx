import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { setRequestLocale } from 'next-intl/server';
import { routing } from '@/i18n/routing';
import { privacy, publisher, terms } from '@/content/legal';

const PAGES = { terms, privacy } as const;

const DESCRIPTIONS = {
  terms: {
    en: 'Terms of service of Margokit: free and Pro plans, Gumroad payments, refunds, your responsibility for your quotes and invoices, liability and termination.',
    fr: 'Conditions générales d’utilisation de Margokit : plans gratuit et Pro, paiement via Gumroad, remboursement, responsabilité sur tes devis et factures, résiliation.',
  },
  privacy: {
    en: 'How Margokit processes your data: what is collected, why, processors and hosting, retention, cookies, security and how to exercise your rights.',
    fr: 'Comment Margokit traite tes données : données collectées, finalités, sous-traitants et hébergement, durées de conservation, cookies, sécurité et exercice de tes droits.',
  },
} as const;

export function generateStaticParams() {
  return ['en', 'fr'].flatMap((locale) => Object.keys(PAGES).map((page) => ({ locale, page })));
}

export async function generateMetadata({ params }: PageProps<'/[locale]/legal/[page]'>): Promise<Metadata> {
  const { locale, page } = await params;
  const build = PAGES[page as keyof typeof PAGES];
  if (!build) return {};
  // Written in English and French only: the Arabic URL shows the English text, so it points there
  const textLocale = locale === 'fr' ? 'fr' : 'en';
  const languages = { en: `/en/legal/${page}`, fr: `/fr/legal/${page}` };
  const lang = locale === 'fr' ? 'fr' : 'en';
  return {
    title: `${build(lang, publisher()).title} — Margokit`,
    description: DESCRIPTIONS[page as keyof typeof PAGES][lang],
    // Each legal page is its own canonical URL (the layout default points at the home page)
    alternates: { canonical: `/${textLocale}/legal/${page}`, languages: { ...languages, 'x-default': `/${routing.defaultLocale}/legal/${page}` } },
  };
}

export default async function LegalPage({ params }: PageProps<'/[locale]/legal/[page]'>) {
  const { locale, page } = await params;
  setRequestLocale(locale);
  const build = PAGES[page as keyof typeof PAGES];
  if (!build) notFound();
  const doc = build(locale === 'fr' ? 'fr' : 'en', publisher());
  return (
    <article className="mx-auto max-w-3xl px-4 pb-16 pt-6 sm:px-6">
      <h1 className="font-display text-4xl font-extrabold">{doc.title}</h1>
      <p className="mt-2 text-sm text-muted">{doc.updated}</p>
      {doc.sections.map((s) => (
        <section key={s.title} className="mt-8">
          <h2 className="font-display text-xl font-bold">{s.title}</h2>
          {s.body.map((p) => (
            <p key={p} className="mt-3 leading-relaxed text-muted">
              {p}
            </p>
          ))}
        </section>
      ))}
    </article>
  );
}
