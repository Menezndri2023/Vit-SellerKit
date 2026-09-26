import { isValidObjectId } from 'mongoose';
import { notFound } from 'next/navigation';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import ClientForm, { type ClientValues } from '@/components/clients/ClientForm';
import { PageHeader } from '@/components/form/fields';
import { connectDb } from '@/lib/db';
import { plain } from '@/lib/serialize';
import { requireUser } from '@/lib/session';
import { Client } from '@/models/Client';

export default async function EditClientPage({ params }: PageProps<'/[locale]/app/clients/[id]'>) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  if (!isValidObjectId(id)) notFound();
  await connectDb();
  // userId in the query: another user's client is simply "not found"
  const client = await Client.findOne({ _id: id, userId: user.id }).lean();
  if (!client) notFound();
  const t = await getTranslations('clients');
  const values = plain<ClientValues>(client);
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title={t('editTitle')} subtitle={values.name} />
      <ClientForm initial={values} defaultCountry={values.address?.country ?? 'FR'} />
    </div>
  );
}
