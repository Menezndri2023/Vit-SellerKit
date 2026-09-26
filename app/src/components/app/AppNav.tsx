'use client';

import { useTranslations } from 'next-intl';
import { Link, usePathname, useRouter } from '@/i18n/navigation';
import { authClient } from '@/lib/auth-client';

const icons: Record<string, string> = {
  dashboard: 'M3 13h8V3H3v10Zm0 8h8v-6H3v6Zm10 0h8V11h-8v10Zm0-18v6h8V3h-8Z',
  documents: 'M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Zm-1 7V3.5L18.5 9H13ZM8 13h8v2H8v-2Zm0 4h8v2H8v-2Z',
  clients: 'M16 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm-8 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm0 2c-2.3 0-7 1.2-7 3.5V19h14v-2.5C15 14.2 10.3 13 8 13Zm8 0h-1a4.2 4.2 0 0 1 2 3.5V19h6v-2.5c0-2.3-4.7-3.5-7-3.5Z',
  products: 'M20 7 12 3 4 7v10l8 4 8-4V7Zm-8 11.8-6-3V9.2l6 3v6.6Zm1-8.3L7.2 7.7 12 5.3l4.8 2.4L13 10.5Z',
  settings: 'M19.4 13a7.5 7.5 0 0 0 0-2l2.1-1.6-2-3.5-2.5 1a7.3 7.3 0 0 0-1.7-1L15 3.3h-4l-.4 2.6c-.6.3-1.2.6-1.7 1l-2.5-1-2 3.5L6.6 11a7.5 7.5 0 0 0 0 2l-2.1 1.6 2 3.5 2.5-1c.5.4 1.1.7 1.7 1l.3 2.6h4l.4-2.6c.6-.3 1.2-.6 1.7-1l2.5 1 2-3.5-2.2-1.6ZM13 15.5a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Z',
  admin: 'M12 1 3 5v6c0 5.6 3.8 10.7 9 12 5.2-1.3 9-6.4 9-12V5l-9-4Zm0 11h7c-.5 4.1-3.3 7.8-7 8.9V12H5V6.3l7-3.1V12Z',
};

function Icon({ name }: { name: string }) {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5 shrink-0" fill="currentColor">
      <path d={icons[name]} />
    </svg>
  );
}

export default function AppNav({ isAdmin, userName }: { isAdmin: boolean; userName: string }) {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const router = useRouter();
  const items = [
    { key: 'dashboard', href: '/app' },
    { key: 'documents', href: '/app/documents' },
    { key: 'clients', href: '/app/clients' },
    { key: 'products', href: '/app/products' },
    { key: 'settings', href: '/app/settings' },
    ...(isAdmin ? [{ key: 'admin', href: '/admin' }] : []),
  ] as const;
  const active = (href: string) => (href === '/app' ? pathname === '/app' : pathname.startsWith(href));

  async function signOut() {
    await authClient.signOut();
    router.push('/');
    router.refresh();
  }

  return (
    <>
      {/* Desktop sidebar */}
      <nav className="hidden w-60 shrink-0 flex-col gap-1 border-e border-line bg-surface p-4 lg:flex">
        {items.map((i) => (
          <Link
            key={i.key}
            href={i.href}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ${active(i.href) ? 'bg-primary-soft text-primary-ink' : 'text-muted hover:bg-bg hover:text-ink'}`}
          >
            <Icon name={i.key} />
            {t(i.key)}
          </Link>
        ))}
        <div className="mt-auto border-t border-line pt-4">
          <p className="truncate px-3 text-sm font-medium">{userName}</p>
          <button type="button" onClick={signOut} className="mt-2 w-full rounded-xl px-3 py-2 text-start text-sm text-muted hover:bg-bg hover:text-ink">
            {t('signOut')}
          </button>
        </div>
      </nav>

      {/* Mobile bottom bar */}
      <nav className="fixed inset-x-0 bottom-0 z-20 flex border-t border-line bg-surface/95 backdrop-blur lg:hidden">
        {items.slice(0, 5).map((i) => (
          <Link
            key={i.key}
            href={i.href}
            className={`flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium ${active(i.href) ? 'text-primary-ink' : 'text-muted'}`}
          >
            <Icon name={i.key} />
            {t(i.key)}
          </Link>
        ))}
      </nav>
    </>
  );
}
