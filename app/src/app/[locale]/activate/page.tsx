import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import Logo from '@/components/Logo';
import ActivateForm from '@/components/plan/ActivateForm';
import { planLabel } from '@/components/plan/planLabel';
import { Link } from '@/i18n/navigation';
import { connectDb } from '@/lib/db';
import { links } from '@/lib/links';
import { getPlan } from '@/lib/plan';
import { requireUser } from '@/lib/session';
import { fmtLocale } from '@/lib/intl';

export const metadata: Metadata = { robots: { index: false } };

export default async function ActivatePage({ params }: PageProps<'/[locale]/activate'>) {
  const { locale } = await params;
  setRequestLocale(locale);
  const user = await requireUser(locale);
  const t = await getTranslations('plan');
  await connectDb();
  const plan = await getPlan(user.id);
  const fmt = (d: Date) => new Intl.DateTimeFormat(fmtLocale(locale), { dateStyle: 'long' }).format(d);
  const label = planLabel(plan, fmt);
  const monthly = links.proMonthly();
  const lifetime = links.proLifetime();
  const whatsapp = links.whatsapp();

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-3xl items-center justify-between px-4 py-5">
        <Logo href="/app" />
        <Link href="/app" className="text-sm font-medium text-muted hover:text-ink">
          {t('backToApp')}
        </Link>
      </header>
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 pb-16">
        <section className="rounded-2xl border border-line bg-surface p-6">
          <p className="text-sm text-muted">{t('title')}</p>
          <p className="mt-1 font-display text-2xl font-extrabold">{t(label.key as 'free', label.values)}</p>
          {plan.plan === 'free' && <p className="mt-2 text-muted">{t('freeUsage', { used: plan.used, limit: plan.limit ?? 0 })}</p>}
        </section>

        <section className="rounded-2xl border border-line bg-surface p-6">
          <h1 className="font-display text-2xl font-bold">{t('activateTitle')}</h1>
          <p className="mb-5 mt-2 text-muted">{t('activateText')}</p>
          <ActivateForm />
        </section>

        {(monthly || lifetime || whatsapp) && (
          <section className="rounded-2xl border border-dashed border-line p-6">
            <h2 className="font-display text-lg font-bold">{t('buyTitle')}</h2>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              {monthly && (
                <a href={monthly} target="_blank" rel="noopener" className="grid h-12 place-items-center rounded-xl bg-primary px-5 font-semibold text-on-primary hover:brightness-95">
                  {t('buyMonthly')}
                </a>
              )}
              {lifetime && (
                <a href={lifetime} target="_blank" rel="noopener" className="grid h-12 place-items-center rounded-xl border border-line bg-surface px-5 font-semibold hover:bg-bg">
                  {t('buyLifetime')}
                </a>
              )}
              {whatsapp && (
                <a href={whatsapp} target="_blank" rel="noopener" className="grid h-12 place-items-center rounded-xl px-5 font-medium text-primary-ink hover:underline">
                  {t('whatsapp')}
                </a>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}
