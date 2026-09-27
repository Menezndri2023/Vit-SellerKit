'use client';

import { useLocale } from 'next-intl';
import { Link, usePathname } from '@/i18n/navigation';
import { routing } from '@/i18n/routing';

const LABELS: Record<string, string> = { en: 'English', fr: 'Français', ar: 'العربية' };

/** Links to the same page in the other languages. */
export default function LocaleSwitcher({ className = '' }: { className?: string }) {
  const locale = useLocale();
  const pathname = usePathname();
  return (
    <div className={`flex items-center gap-1 text-sm ${className}`}>
      {routing.locales
        .filter((l) => l !== locale)
        .map((l) => (
          <Link key={l} href={pathname} locale={l} lang={l} className="rounded-lg px-2.5 py-2 font-medium text-muted hover:bg-bg hover:text-ink">
            {LABELS[l]}
          </Link>
        ))}
    </div>
  );
}
