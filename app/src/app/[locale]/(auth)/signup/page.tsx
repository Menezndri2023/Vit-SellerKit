import { getTranslations, setRequestLocale } from 'next-intl/server';
import AuthHeading from '@/components/auth/AuthHeading';
import SignupForm from '@/components/auth/SignupForm';
import { redirect } from '@/i18n/navigation';
import { googleEnabled } from '@/lib/env';
import { getSession } from '@/lib/session';

export default async function SignupPage({ params }: PageProps<'/[locale]/signup'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (await getSession()) redirect({ href: '/app', locale });
  const t = await getTranslations('auth');
  return (
    <>
      <AuthHeading title={t('signupTitle')} subtitle={t('signupSubtitle')} />
      <SignupForm google={googleEnabled()} />
    </>
  );
}
