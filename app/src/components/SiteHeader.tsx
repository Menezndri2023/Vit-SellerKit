import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { getSession } from '@/lib/session';
import Logo from './Logo';

export default async function SiteHeader() {
  const t = await getTranslations('nav');
  const session = await getSession().catch(() => null);

  return (
    <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-5 sm:px-6">
      <Logo />
      <nav className="flex items-center gap-1 text-sm font-medium">
        <Link href="/calculator" className="hidden rounded-lg px-3 py-2 text-muted hover:bg-surface sm:block">
          {t('calculator')}
        </Link>
        <Link href="/#pricing" className="hidden rounded-lg px-3 py-2 text-muted hover:bg-surface sm:block">
          {t('pricing')}
        </Link>
        <Link href="/" locale={t('switchLocale')} className="rounded-lg px-3 py-2 text-muted hover:bg-surface">
          {t('switchLabel')}
        </Link>
        {session ? (
          <Link href="/app" className="rounded-xl bg-ink px-4 py-2 text-bg hover:opacity-90">
            {t('openApp')}
          </Link>
        ) : (
          <>
            <Link href="/login" className="hidden rounded-lg px-3 py-2 text-muted hover:bg-surface sm:block">
              {t('login')}
            </Link>
            <Link href="/signup" className="rounded-xl bg-primary px-4 py-2 font-semibold text-on-primary hover:brightness-95">
              {t('signup')}
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}
