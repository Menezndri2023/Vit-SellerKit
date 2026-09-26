import { getTranslations } from 'next-intl/server';
import { links } from '@/lib/links';

export default async function SheetsCta() {
  const t = await getTranslations('landing');
  const pack = links.pack();
  const tracker = links.tracker();
  if (!pack && !tracker) return null;
  return (
    <section className="mx-auto w-full max-w-6xl px-4 sm:px-6">
      <div className="rounded-2xl bg-ink p-6 text-bg sm:p-10">
        <h2 className="font-display text-2xl font-bold sm:text-3xl">{t('sheetsTitle')}</h2>
        <p className="mt-3 max-w-2xl opacity-80">{t('sheetsText')}</p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          {pack && (
            <a href={pack} target="_blank" rel="noopener" className="grid h-12 place-items-center rounded-xl bg-primary px-6 font-semibold text-on-primary hover:brightness-95">
              {t('sheetsPack')}
            </a>
          )}
          {tracker && (
            <a href={tracker} target="_blank" rel="noopener" className="grid h-12 place-items-center rounded-xl border border-bg/30 px-6 font-semibold hover:bg-bg/10">
              {t('sheetsTracker')}
            </a>
          )}
        </div>
      </div>
    </section>
  );
}
