import { getTranslations, setRequestLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { requireUser } from '@/lib/session';

export default async function Dashboard({ params }: PageProps<'/[locale]/app'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const t = await getTranslations('app');

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div>
        <h1 className="font-display text-3xl font-bold">{t('welcome', { name: user.name.split(' ')[0] })}</h1>
        <p className="mt-1 text-muted">{t('dashboardSubtitle')}</p>
      </div>
      <section className="rounded-2xl border border-dashed border-line bg-surface p-6 sm:p-8">
        <h2 className="font-display text-xl font-bold">{t('setupTitle')}</h2>
        <p className="mt-2 max-w-xl text-muted">{t('setupText')}</p>
        <Link href="/app/settings" className="mt-5 inline-grid h-12 place-items-center rounded-xl bg-primary px-6 font-semibold text-on-primary hover:brightness-95">
          {t('setupCta')}
        </Link>
      </section>
    </div>
  );
}
