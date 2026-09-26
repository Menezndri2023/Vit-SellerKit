import { getTranslations, setRequestLocale } from 'next-intl/server';
import AuthHeading from '@/components/auth/AuthHeading';
import LoginForm from '@/components/auth/LoginForm';
import { redirect } from '@/i18n/navigation';
import { googleEnabled } from '@/lib/env';
import { getSession } from '@/lib/session';

export default async function LoginPage({ params }: PageProps<'/[locale]/login'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  if (await getSession()) redirect({ href: '/app', locale });
  const t = await getTranslations('auth');
  return (
    <>
      <AuthHeading title={t('loginTitle')} subtitle={t('loginSubtitle')} />
      <LoginForm google={googleEnabled()} />
    </>
  );
}
