import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/form/fields';
import LogoForm from '@/components/settings/LogoForm';
import ProfileForm, { type ProfileValues } from '@/components/settings/ProfileForm';
import { connectDb } from '@/lib/db';
import { guessCountry } from '@/lib/geo';
import { plain } from '@/lib/serialize';
import { requireUser } from '@/lib/session';
import { BusinessProfile } from '@/models/BusinessProfile';

export default async function SettingsPage({ params }: PageProps<'/[locale]/app/settings'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const t = await getTranslations('settings');
  await connectDb();
  const profile = await BusinessProfile.findOne({ userId: user.id }).lean();
  const values = profile ? plain<ProfileValues & { logo?: { key?: string } }>(profile) : { email: user.email };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <LogoForm logoKey={values.logo?.key} disabled={!profile} />
      <ProfileForm initial={values} isNew={!profile} defaultCountry={await guessCountry(locale)} />
    </div>
  );
}
