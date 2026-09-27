import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import type { PlanInfo } from '@/lib/plan';
import { fmtLocale } from '@/lib/intl';

export default async function PlanBanner({ plan, locale }: { plan: PlanInfo; locale: string }) {
  const t = await getTranslations('plan');
  if (plan.plan === 'free') {
    const reached = plan.used >= (plan.limit ?? 0);
    return (
      <div className={`flex flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm sm:px-6 ${reached ? 'bg-warn/15 text-warn' : 'bg-primary-soft text-primary-ink'}`}>
        <span>{reached ? t('limitReached', { limit: plan.limit ?? 0 }) : t('freeUsage', { used: plan.used, limit: plan.limit ?? 0 })}</span>
        <Link href="/activate" className="font-semibold underline-offset-2 hover:underline">
          {t('upgrade')} <span className="inline-block rtl:-scale-x-100">→</span>
        </Link>
      </div>
    );
  }
  if (plan.expiringSoon && plan.expiresAt) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-2 bg-warn/15 px-4 py-2 text-sm text-warn sm:px-6">
        <span>{t('expiring', { date: new Intl.DateTimeFormat(fmtLocale(locale), { dateStyle: 'long' }).format(plan.expiresAt) })}</span>
        <Link href="/activate" className="font-semibold hover:underline">
          {t('renew')} <span className="inline-block rtl:-scale-x-100">→</span>
        </Link>
      </div>
    );
  }
  return null;
}
