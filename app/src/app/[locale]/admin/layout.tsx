import type { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import Logo from '@/components/Logo';
import AdminTabs from '@/components/admin/AdminTabs';
import { Link } from '@/i18n/navigation';
import { requireAdmin } from '@/lib/session';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLayout({ children, params }: LayoutProps<'/[locale]/admin'>) {
  const { locale } = await params;
  await requireAdmin(locale);
  const t = await getTranslations('admin');
  return (
    <div className="min-h-dvh">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <Logo href="/app" />
            <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-semibold text-bg">{t('title')}</span>
          </div>
          <Link href="/app" className="text-sm text-muted hover:text-ink">
            <span className="inline-block rtl:-scale-x-100">←</span> App
          </Link>
        </div>
        <AdminTabs />
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">{children}</main>
    </div>
  );
}
