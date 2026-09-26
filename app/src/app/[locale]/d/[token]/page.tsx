import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import DocumentView from '@/components/documents/DocumentView';
import { connectDb } from '@/lib/db';
import { loadDocView } from '@/lib/documents/load';
import { findByShareToken } from '@/lib/documents/share';
import { clientIp, rateLimit } from '@/lib/rate-limit';

export const metadata: Metadata = { robots: { index: false, follow: false }, referrer: 'no-referrer' };

/** What the user's client sees: the document, a PDF download and the payment options. No account needed. */
export default async function PublicDocumentPage({ params }: PageProps<'/[locale]/d/[token]'>) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  if (!(await rateLimit('public-doc', await clientIp(), 60, 60))) notFound();
  await connectDb();
  const doc = await findByShareToken(token);
  if (!doc) notFound();
  const view = await loadDocView(doc);
  const t = await getTranslations({ locale: view.lang, namespace: 'doc' });

  return (
    <div className="min-h-dvh bg-bg px-4 py-6 sm:py-10">
      <div className="mx-auto flex max-w-3xl flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-display text-lg font-bold">{view.seller?.tradeName || view.seller?.legalName}</p>
          <a href={`/api/public/${token}/pdf`} className="inline-flex h-11 items-center rounded-xl bg-ink px-5 font-semibold text-bg hover:opacity-90">
            {t('download')}
          </a>
        </div>
        <DocumentView doc={view} />
        <p className="text-center text-xs text-muted">{t('madeWith')}</p>
      </div>
    </div>
  );
}
