import { getTranslations, setRequestLocale } from 'next-intl/server';
import ClientForm from '@/components/clients/ClientForm';
import { PageHeader } from '@/components/form/fields';
import { connectDb } from '@/lib/db';
import { guessCountry } from '@/lib/geo';
import { requireUser } from '@/lib/session';
import { BusinessProfile } from '@/models/BusinessProfile';

export default async function NewClientPage({ params }: PageProps<'/[locale]/app/clients/new'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const t = await getTranslations('clients');
  await connectDb();
  const profile = await BusinessProfile.findOne({ userId: user.id }).select('address.country').lean();
  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title={t('newTitle')} />
      <ClientForm initial={{}} defaultCountry={profile?.address?.country ?? (await guessCountry(locale))} />
    </div>
  );
}
