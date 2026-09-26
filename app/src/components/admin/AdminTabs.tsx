'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';

const TABS = [
  { key: 'stats', href: '/admin' },
  { key: 'users', href: '/admin/users' },
  { key: 'codes', href: '/admin/codes' },
  { key: 'sales', href: '/admin/sales' },
] as const;

export default function AdminTabs() {
  const t = useTranslations('admin.tabs');
  const pathname = usePathname();
  return (
    <nav className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 sm:px-6">
      {TABS.map((tab) => {
        const active = tab.href === '/admin' ? pathname === '/admin' : pathname.startsWith(tab.href);
        return (
          <Link key={tab.key} href={tab.href} className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium ${active ? 'border-primary-ink text-ink' : 'border-transparent text-muted hover:text-ink'}`}>
            {t(tab.key)}
          </Link>
        );
      })}
    </nav>
  );
}
