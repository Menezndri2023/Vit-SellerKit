import { getTranslations, setRequestLocale } from 'next-intl/server';
import ImportClientsForm from '@/components/clients/ImportClientsForm';
import { PageHeader } from '@/components/form/fields';
import { Link } from '@/i18n/navigation';
import { requireUser } from '@/lib/session';

export default async function ImportClientsPage({ params }: PageProps<'/[locale]/app/clients/import'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  await requireUser(locale);
  const t = await getTranslations('clientsImport');
  const template = locale === 'fr' ? '/templates/clients-fr.csv' : '/templates/clients-en.csv';

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <Link href="/app/clients" className="text-sm font-medium text-muted hover:text-ink">
        <span className="inline-block rtl:-scale-x-100">←</span> {t('back')}
      </Link>
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <section className="rounded-2xl border border-dashed border-line p-6 text-sm">
        <h2 className="font-display text-lg font-bold">{t('howTitle')}</h2>
        <ol className="mt-3 list-inside list-decimal space-y-2 text-muted">
          <li>{t('how1')}</li>
          <li>{t('how2')}</li>
          <li>{t('how3')}</li>
        </ol>
        <p className="mt-4 text-muted">{t('columns')}</p>
        <a href={template} download className="mt-4 inline-block font-semibold text-primary-ink hover:underline">
          {t('template')} ↓
        </a>
      </section>
      <ImportClientsForm />
    </div>
  );
}
