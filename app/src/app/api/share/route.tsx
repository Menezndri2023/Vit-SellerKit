import { ImageResponse } from 'next/og';
import { hasLocale } from 'next-intl';
import { routing } from '@/i18n/routing';
import { computeProfit } from '@/lib/profit';
import { formatMoney, formatPct, parseState, toInputs } from '@/lib/calculator-state';
import en from '../../../../messages/en.json';
import fr from '../../../../messages/fr.json';

const messages = { en, fr };

/** 1080×1920 image (stories, TikTok, Reels) of the user's result. */
export async function GET(request: Request) {
  const params = Object.fromEntries(new URL(request.url).searchParams);
  const requested = hasLocale(routing.locales, params.locale) ? params.locale : routing.defaultLocale;
  // The image renderer can't shape Arabic text: Arabic users get the English image
  const locale = requested === 'fr' ? 'fr' : 'en';
  const t = messages[locale].image;
  const s = parseState(params, locale);
  const r = computeProfit(toInputs(s));
  if (!r) return new Response('Invalid numbers', { status: 400 });

  const money = (v: number | null) => (v === null ? '—' : formatMoney(v, s.cur, locale));
  const site = (process.env.NEXT_PUBLIC_SITE_URL ?? 'margokit.com').replace(/^https?:\/\//, '').replace(/\/$/, '');
  const profitColor = r.profit < 0 ? '#F87171' : '#A3E635';
  const stats: [string, string][] = [
    [t.margin, formatPct(r.margin, locale)],
    [t.breakEven, money(r.breakEvenPrice)],
    [t.roas, r.breakEvenRoas === null ? '—' : `${r.breakEvenRoas.toLocaleString(locale, { maximumFractionDigits: 2 })}x`],
    [t.returns, formatPct(s.rr / 100, locale)],
  ];

  return new ImageResponse(
    (
      <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column', background: '#0F172A', color: '#F8FAFC', padding: '120px 90px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 20, fontSize: 44, fontWeight: 800 }}>
          <div style={{ display: 'flex', width: 72, height: 72, borderRadius: 18, background: '#A3E635', color: '#0F172A', alignItems: 'center', justifyContent: 'center' }}>M</div>
          Margokit
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 190 }}>
          <div style={{ fontSize: 64, color: '#CBD5E1' }}>{t.headline.replace('{price}', money(s.p))}</div>
          <div style={{ fontSize: 64, color: '#CBD5E1' }}>{t.keep}</div>
          <div style={{ fontSize: 190, fontWeight: 800, color: profitColor, marginTop: 30, letterSpacing: -4 }}>{money(r.profit)}</div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 30, marginTop: 110 }}>
          {stats.map(([label, value]) => (
            <div key={label} style={{ display: 'flex', flexDirection: 'column', width: 435, padding: '36px 40px', borderRadius: 32, background: '#1E293B' }}>
              <div style={{ fontSize: 34, color: '#94A3B8' }}>{label}</div>
              <div style={{ fontSize: 60, fontWeight: 800, marginTop: 10 }}>{value}</div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 'auto', padding: '44px 50px', borderRadius: 32, background: '#A3E635', color: '#0F172A' }}>
          <div style={{ fontSize: 44, fontWeight: 800 }}>{t.cta}</div>
          <div style={{ fontSize: 40, marginTop: 6 }}>{site}</div>
        </div>
      </div>
    ),
    { width: 1080, height: 1920 },
  );
}
