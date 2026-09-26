import { getTranslations } from 'next-intl/server';

export default async function Faq({ count = 6 }: { count?: number }) {
  const t = await getTranslations('faq');
  const items = Array.from({ length: count }, (_, i) => i + 1);
  return (
    <section className="mx-auto w-full max-w-3xl px-4 sm:px-6">
      <h2 className="font-display text-3xl font-bold">{t('title')}</h2>
      <div className="mt-6 divide-y divide-line rounded-2xl border border-line bg-surface">
        {items.map((n) => (
          <details key={n} className="group p-5">
            <summary className="cursor-pointer list-none font-semibold marker:hidden">
              <span className="flex items-center justify-between gap-4">
                {t(`q${n}`)}
                <span aria-hidden className="text-muted transition group-open:rotate-45">
                  +
                </span>
              </span>
            </summary>
            <p className="mt-3 text-muted">{t(`a${n}`)}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
