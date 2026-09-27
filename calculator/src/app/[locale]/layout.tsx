import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { Inter, Plus_Jakarta_Sans } from 'next/font/google';
import { NextIntlClientProvider, hasLocale } from 'next-intl';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Analytics } from '@vercel/analytics/next';
import { routing } from '@/i18n/routing';
import '../globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const jakarta = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-jakarta', weight: ['600', '700', '800'] });

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: LayoutProps<'/[locale]'>): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'meta' });
  const languages = Object.fromEntries(routing.locales.map((l) => [l, `/${l}`]));
  return {
    metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    title: t('title'),
    description: t('description'),
    alternates: {
      canonical: `/${locale}`,
      languages: { ...languages, 'x-default': `/${routing.defaultLocale}` },
    },
    openGraph: {
      type: 'website',
      siteName: 'Margokit',
      title: t('title'),
      description: t('description'),
      locale: locale === 'fr' ? 'fr_FR' : 'en_US',
      url: `/${locale}`,
    },
    twitter: { card: 'summary_large_image', title: t('title'), description: t('description') },
    // Google Search Console : méthode « Balise HTML » (seule possible sur un sous-domaine vercel.app)
    verification: process.env.GOOGLE_SITE_VERIFICATION ? { google: process.env.GOOGLE_SITE_VERIFICATION } : undefined,
  };
}

export default async function LocaleLayout({ children, params }: LayoutProps<'/[locale]'>) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  return (
    <html lang={locale} className={`${inter.variable} ${jakarta.variable} antialiased`}>
      <body className="min-h-dvh font-sans">
        <NextIntlClientProvider>{children}</NextIntlClientProvider>
        <Analytics />
      </body>
    </html>
  );
}
