import { getLocale, getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { PUBLISHER_NAME, publisherLine, publisherUrl } from '@/lib/brand';

export default async function SiteFooter() {
  const [t, locale] = await Promise.all([getTranslations('footer'), getLocale()]);
  const line = publisherLine(locale);
  const url = publisherUrl();
  return (
    <footer className="mx-auto flex max-w-6xl flex-col gap-3 border-t border-line px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="flex flex-col gap-1">
        <span>{t('tagline')}</span>
        {/* Margokit is a product of VIT GLOBAL TECHNOLOGIES GROUP (publisher) — named, not merged into the brand */}
        <span className="text-xs">
          {url ? (
            <>
              {line.slice(0, line.indexOf(PUBLISHER_NAME))}
              <a href={url} target="_blank" rel="noopener" className="underline-offset-2 hover:text-ink hover:underline">
                {PUBLISHER_NAME}
              </a>
              {line.slice(line.indexOf(PUBLISHER_NAME) + PUBLISHER_NAME.length)}
            </>
          ) : (
            line
          )}
        </span>
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-2">
        <Link href="/reviews" className="hover:text-ink">
          {t('reviews')}
        </Link>
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
