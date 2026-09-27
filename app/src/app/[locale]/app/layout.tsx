import type { Metadata } from 'next';
import AppNav from '@/components/app/AppNav';
import LocaleSwitcher from '@/components/LocaleSwitcher';
import Logo from '@/components/Logo';
import PlanBanner from '@/components/plan/PlanBanner';
import { connectDb } from '@/lib/db';
import { getPlan } from '@/lib/plan';
import { requireUser } from '@/lib/session';

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({ children, params }: LayoutProps<'/[locale]/app'>) {
  const { locale } = await params;
  const user = await requireUser(locale);
  await connectDb();
  const plan = await getPlan(user.id);

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="flex items-center justify-between border-b border-line bg-surface px-4 py-3 sm:px-6">
        <Logo href="/app" />
        <LocaleSwitcher />
      </header>
      <PlanBanner plan={plan} locale={locale} />
      <div className="flex flex-1">
        <AppNav isAdmin={user.role === 'admin'} userName={user.name} />
        <main className="min-w-0 flex-1 px-4 pb-24 pt-6 sm:px-8 lg:pb-10">{children}</main>
      </div>
    </div>
  );
}
