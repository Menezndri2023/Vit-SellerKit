import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import DocumentActions from '@/components/documents/DocumentActions';
import DocumentEditor from '@/components/documents/DocumentEditor';
import DocumentView from '@/components/documents/DocumentView';
import EInvoicePanel from '@/components/documents/EInvoicePanel';
import { einvoicingProvider } from '@/lib/einvoice/providers';
import PaymentsPanel from '@/components/documents/PaymentsPanel';
import SharePanel from '@/components/documents/SharePanel';
import { formatMinor } from '@/lib/money';
import StatusBadge from '@/components/documents/StatusBadge';
import { Link } from '@/i18n/navigation';
import { connectDb } from '@/lib/db';
import { docToEditor, editorData } from '@/lib/documents/editor-data';
import { findOwned, isoDay, todayIn } from '@/lib/documents/service';
import { displayStatus } from '@/lib/documents/status';
import { buildDocView } from '@/lib/documents/view-model';
import { guessCountry } from '@/lib/geo';
import { plain } from '@/lib/serialize';
import { requireUser } from '@/lib/session';
import { BusinessProfile } from '@/models/BusinessProfile';
import { Client } from '@/models/Client';

export default async function DocumentPage({ params }: PageProps<'/[locale]/app/documents/[id]'>) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  await connectDb();
  const doc = await findOwned(user.id, id);
  if (!doc) notFound();
  const t = await getTranslations('documents');
  const today = todayIn((user as { timeZone?: string }).timeZone);
  const isDraft = doc.status === 'draft';

  const [profile, client] = await Promise.all([
    isDraft ? BusinessProfile.findOne({ userId: user.id }).lean() : null,
    isDraft && doc.clientId ? Client.findOne({ _id: doc.clientId, userId: user.id }).lean() : null,
  ]);
  const view = buildDocView(doc.toObject(), profile, client);
  const typeLabel = t(`types.${doc.type}`);
  const tDoc = await getTranslations({ locale: view.lang, namespace: 'doc' });
  // Keep {url} for the share link, filled in the browser once the link exists
  const fillTemplate = (tpl: string) =>
    tpl
      .replaceAll('{type}', tDoc(view.type).toLowerCase())
      .replaceAll('{number}', view.number ?? '')
      .replaceAll('{seller}', view.seller?.tradeName || view.seller?.legalName || '')
      .replaceAll('{amount}', formatMinor(view.totals.totalInclTax, view.currency, view.lang === 'fr' ? 'fr-FR' : 'en-GB'));
  const payable = doc.type === 'invoice' || doc.type === 'deposit_invoice';
  const platform = einvoicingProvider();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <Link href="/app/documents" className="text-sm text-muted hover:text-ink">
        ← {t('view.back')}
      </Link>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">
          {typeLabel} {doc.number ?? ''}
        </h1>
        <StatusBadge status={displayStatus(doc, today)} />
      </div>
      {doc.precedingInvoice?.number && <p className="text-sm text-muted">{t('view.creditFor', { number: doc.precedingInvoice.number })}</p>}
      {doc.convertedFromId && <p className="text-sm text-muted">{t('view.convertedFrom')}</p>}

      <DocumentActions id={id} type={doc.type} status={doc.status} typeLabel={typeLabel} />
      <SharePanel
        id={id}
        isDraft={isDraft}
        exportable={['invoice', 'credit_note', 'deposit_invoice'].includes(doc.type)}
        docLang={view.lang}
        buyerEmail={view.buyer?.email}
        buyerPhone={(view.buyer as { phone?: string } | null)?.phone}
        emailMessage={fillTemplate(tDoc.raw('emailBody') as string)}
        whatsappTemplate={fillTemplate(tDoc.raw('whatsapp') as string)}
      />

      {isDraft ? (
        <>
          <p className="rounded-xl bg-primary-soft px-4 py-3 text-sm text-primary-ink">{t('view.draftNotice')}</p>
          <DocumentEditor initial={docToEditor(doc.toObject(), locale)} {...await editorData(user.id, await guessCountry(locale))} />
          <DocumentView doc={view} />
        </>
      ) : (
        <>
          <p className="text-sm text-muted">{t('view.locked')}</p>
          {platform && ['invoice', 'credit_note', 'deposit_invoice'].includes(doc.type) && (
            <EInvoicePanel id={id} provider={platform.name} lifecycle={plain(doc.einvoice?.lifecycle ?? [])} />
          )}
          {payable && (
            <PaymentsPanel
              id={id}
              currency={doc.currency}
              payments={plain(doc.payments)}
              amountDue={doc.amountDue ?? 0}
              canAdd={['issued', 'sent'].includes(doc.status)}
              today={isoDay(today)}
            />
          )}
          <DocumentView doc={view} />
        </>
      )}
    </div>
  );
}
