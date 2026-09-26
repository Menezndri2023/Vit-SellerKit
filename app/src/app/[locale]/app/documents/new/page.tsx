import { getTranslations, setRequestLocale } from 'next-intl/server';
import DocumentEditor, { type EditorValues } from '@/components/documents/DocumentEditor';
import { PageHeader } from '@/components/form/fields';
import { connectDb } from '@/lib/db';
import { editorData } from '@/lib/documents/editor-data';
import { addDays, isoDay, todayIn } from '@/lib/documents/service';
import { guessCountry } from '@/lib/geo';
import { requireUser } from '@/lib/session';

const TYPES = ['invoice', 'quote', 'deposit_invoice'] as const;

export default async function NewDocumentPage({ params, searchParams }: PageProps<'/[locale]/app/documents/new'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const t = await getTranslations('documents');
  const sp = await searchParams;
  const type = TYPES.find((x) => x === sp.type) ?? 'invoice';
  await connectDb();
  const data = await editorData(user.id, await guessCountry(locale));
  const today = todayIn((user as { timeZone?: string }).timeZone);
  const clientId = typeof sp.client === 'string' && data.clients.some((c) => c.id === sp.client) ? sp.client : undefined;

  const initial: EditorValues = {
    type,
    clientId,
    issueDate: isoDay(today),
    dueDate: type === 'quote' ? undefined : isoDay(addDays(today, data.defaults.paymentTermsDays)),
    validUntil: type === 'quote' ? isoDay(addDays(today, 30)) : undefined,
    currency: data.defaults.currency,
    docLocale: (data.defaults.docLocale ?? locale) as 'en' | 'fr',
    lines: [{ description: '', kind: 'service', qty: '1', unitCode: 'C62', unitPrice: '', discountPct: '0', vatCategory: data.defaults.vatCategory, taxRate: String(data.defaults.taxRate) }],
  };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title={t('editor.newTitle', { type: t(`types.${type}`).toLowerCase() })} />
      <DocumentEditor initial={initial} clients={data.clients} products={data.products} defaults={data.defaults} />
    </div>
  );
}
