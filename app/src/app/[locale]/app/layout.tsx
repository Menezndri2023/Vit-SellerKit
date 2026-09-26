import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import AppNav from '@/components/app/AppNav';
import Logo from '@/components/Logo';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({ children, params }: LayoutProps<'/[locale]/app'>) {
  const { locale } = await params;
  const user = await requireUser(locale);
  const t = await getTranslations('nav');

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 sm:px-6">
        <Logo href="/app" />
        <Link href="/app" locale={t('switchLocale')} className="rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-bg">
          {t('switchLabel')}
        </Link>
      </header>
      <div className="flex flex-1">
        <AppNav isAdmin={user.role === 'admin'} userName={user.name} />
        <main className="min-w-0 flex-1 px-4 pb-24 pt-6 sm:px-8 lg:pb-10">{children}</main>
      </div>
    </div>
  );
}
