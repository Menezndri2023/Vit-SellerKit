import { getTranslations, setRequestLocale } from 'next-intl/server';
import { PageHeader } from '@/components/form/fields';
import AccountSection from '@/components/settings/AccountSection';
import RemindersSection from '@/components/settings/RemindersSection';
import TwoFactorSection from '@/components/settings/TwoFactorSection';
import { hasActivePro } from '@/lib/plan';
import LogoForm from '@/components/settings/LogoForm';
import ProfileForm, { type ProfileValues } from '@/components/settings/ProfileForm';
import { ObjectId } from 'mongodb';
import { connectDb, mongoClient } from '@/lib/db';
import { guessCountry } from '@/lib/geo';
import { plain } from '@/lib/serialize';
import { requireUser } from '@/lib/session';
import { BusinessProfile } from '@/models/BusinessProfile';

export default async function SettingsPage({ params, searchParams }: PageProps<'/[locale]/app/settings'>) {
  const { locale } = await params;
  const { twofa } = await searchParams;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const t = await getTranslations('settings');
  await connectDb();
  const profile = await BusinessProfile.findOne({ userId: user.id }).lean();
  // Two-factor authentication applies to password sign-in: accounts created with Google only have none
  const hasPassword = Boolean(
    await mongoClient().db().collection('account').findOne({ providerId: 'credential', userId: { $in: [user.id, ...(ObjectId.isValid(user.id) ? [new ObjectId(user.id)] : [])] } }, { projection: { _id: 1 } }),
  );
  const values = profile ? plain<ProfileValues & { logo?: { key?: string } }>(profile) : { email: user.email };

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <PageHeader title={t('title')} subtitle={t('subtitle')} />
      <LogoForm logoKey={values.logo?.key} disabled={!profile} />
      <ProfileForm initial={values} isNew={!profile} defaultCountry={await guessCountry(locale)} />
      <RemindersSection enabled={Boolean(profile?.reminders?.enabled)} isPro={await hasActivePro(user.id)} />
      <TwoFactorSection enabled={Boolean(user.twoFactorEnabled)} hasPassword={hasPassword} isAdmin={user.role === 'admin'} required={twofa === 'required'} />
      <AccountSection email={user.email} />
    </div>
  );
}
