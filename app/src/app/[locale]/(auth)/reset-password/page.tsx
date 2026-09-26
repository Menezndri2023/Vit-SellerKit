import { getTranslations, setRequestLocale } from 'next-intl/server';
import AuthHeading from '@/components/auth/AuthHeading';
import ResetForm from '@/components/auth/ResetForm';

export default async function ResetPage({ params, searchParams }: PageProps<'/[locale]/reset-password'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('auth');
  const { token, error } = await searchParams;
  const valid = typeof token === 'string' && token.length > 0 && !error;
  return (
    <>
      <AuthHeading title={t('resetTitle')} />
      <ResetForm token={valid ? token : null} />
    </>
  );
}
