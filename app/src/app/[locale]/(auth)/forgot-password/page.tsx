import { getTranslations, setRequestLocale } from 'next-intl/server';
import AuthHeading from '@/components/auth/AuthHeading';
import ForgotForm from '@/components/auth/ForgotForm';

export default async function ForgotPage({ params }: PageProps<'/[locale]/forgot-password'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('auth');
  return (
    <>
      <AuthHeading title={t('forgotTitle')} subtitle={t('forgotText')} />
      <ForgotForm />
    </>
  );
}
