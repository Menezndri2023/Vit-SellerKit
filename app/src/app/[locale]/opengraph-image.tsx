import { ImageResponse } from 'next/og';
import { hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';
import en from '../../../messages/en.json';
import fr from '../../../messages/fr.json';

export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export const alt = 'Margokit — Profit Calculator';

export default async function Image({ params }: { params: Promise<{ locale: string }> }) {
  const { locale: requested } = await params;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  // The image renderer can't shape Arabic text: Arabic pages use the English image
  const { hero } = locale === 'fr' ? fr : en;

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', background: '#0F172A', color: '#F8FAFC', padding: 72 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 36, fontWeight: 800 }}>
          <div style={{ display: 'flex', width: 56, height: 56, borderRadius: 14, background: '#A3E635', color: '#0F172A', alignItems: 'center', justifyContent: 'center' }}>M</div>
          Margokit
        </div>
        <div style={{ fontSize: 68, fontWeight: 800, lineHeight: 1.1, letterSpacing: -1 }}>{hero.title}</div>
        <div style={{ display: 'flex', alignSelf: 'flex-start', padding: '14px 28px', borderRadius: 16, background: '#A3E635', color: '#0F172A', fontSize: 30, fontWeight: 700 }}>
          {locale === 'fr' ? 'Calculateur gratuit' : 'Free calculator'}
        </div>
      </div>
    ),
    size,
  );
}
