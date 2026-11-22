import { getTranslations, setRequestLocale } from 'next-intl/server';
import AuthHeading from '@/components/auth/AuthHeading';
import ConsentForm from '@/components/auth/ConsentForm';
import { redirect } from '@/i18n/navigation';
import { CONSENT_VERSION, consentOf, safeNext } from '@/lib/consent';
import { connectDb } from '@/lib/db';
import { requireUser } from '@/lib/session';

/** Terms + transfer-abroad consent, asked once per version (new accounts, Google sign-ups, existing users). */
export default async function ConsentPage({ params, searchParams }: PageProps<'/[locale]/consent'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const next = safeNext((await searchParams).next);
  await connectDb();
  if ((await consentOf(user.id))?.version === CONSENT_VERSION) redirect({ href: next, locale });
  const t = await getTranslations('consent');
  return (
    <>
      <AuthHeading title={t('title')} subtitle={t('subtitle')} />
      <ConsentForm locale={locale} next={next} />
    </>
  );
}
