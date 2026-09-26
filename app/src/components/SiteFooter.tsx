import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function SiteFooter() {
  const t = await getTranslations('footer');
  return (
    <footer className="mx-auto flex max-w-6xl flex-col gap-3 border-t border-line px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <span>{t('tagline')}</span>
      <div className="flex gap-4">
        <Link href="/legal/terms" className="hover:text-ink">
          {t('terms')}
        </Link>
        <Link href="/legal/privacy" className="hover:text-ink">
          {t('privacy')}
        </Link>
        <span>{t('rights', { year: new Date().getFullYear() })}</span>
      </div>
    </footer>
  );
}
