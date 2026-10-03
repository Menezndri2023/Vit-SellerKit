/**
 * Every marketing visual: name, size and HTML.
 * Gumroad covers (1280 × 720) and thumbnails (600 × 600) for the Tracker and the Seller Pack,
 * and the 10 Pinterest pins (1000 × 1500) in English and French.
 * Copy follows marketing/gumroad/*.md and marketing/content/pinterest.md.
 */
import { readFileSync } from 'node:fs';
import { build } from './data.mjs';
import {
  BRAND, page, logo, LOGO_SVG, browser, sheetsApp, tabBar, phone, mobileSheet, TRACKER_TABS, PACK_TABS,
  dashboard, ordersGrid, customersGrid, productsGrid, adsGrid, contentGrid, budgetView, pricingView,
} from './templates.mjs';

const DATA = { en: build('en'), fr: build('fr'), ma: build('ma') };
const tabs = (d, keys) => keys.map((k) => [k, d.t.sheets[k]]);
const app = (d, { pack = false, active, body, cell, formula }) =>
  sheetsApp({ title: pack ? d.t.packFile : d.t.file, tabs: tabs(d, pack ? PACK_TABS : TRACKER_TABS), active, body, cell, formula });
const zoom = (html, z, pad = 0) => `<div style="zoom:${z};padding:${pad}px">${html}</div>`;

// ---------------------------------------------------------------------------
// Shared CSS for covers, thumbs and pins
// ---------------------------------------------------------------------------

const CSS = `
.cv{position:relative;width:1280px;height:720px;overflow:hidden}
.dark{background:radial-gradient(900px 500px at 85% -10%,rgba(163,230,53,.22),transparent 60%),${BRAND.ink};color:#fff}
.light{background:radial-gradient(800px 480px at 100% 0%,rgba(163,230,53,.28),transparent 60%),${BRAND.bg};color:${BRAND.ink}}
.lime{background:${BRAND.lime};color:${BRAND.ink}}
.abs{position:absolute}
.kick{display:inline-flex;align-items:center;gap:8px;font-weight:700;font-size:15px;letter-spacing:.06em;text-transform:uppercase;padding:8px 14px;border-radius:999px}
.dark .kick{background:rgba(163,230,53,.14);color:${BRAND.lime};border:1px solid rgba(163,230,53,.35)}
.light .kick{background:#fff;color:${BRAND.limeInk};border:1px solid #D9F99D}
.lime .kick{background:${BRAND.ink};color:${BRAND.lime}}
h1{font-family:'Plus Jakarta Sans',Inter,sans-serif;font-weight:800;letter-spacing:-0.025em;line-height:1.05}
.dark h1 em{font-style:normal;color:${BRAND.lime}}
.light h1 em{font-style:normal;background:linear-gradient(transparent 58%,${BRAND.lime} 58%,${BRAND.lime} 92%,transparent 92%);padding:0 .06em}
.lime h1 em{font-style:normal;text-decoration:underline;text-decoration-thickness:.09em;text-underline-offset:.1em}
.sub{line-height:1.4}
.dark .sub{color:#CBD5E1}
.light .sub,.lime .sub{color:#334155}
.callout{background:${BRAND.lime};color:${BRAND.ink};font-weight:700;border-radius:14px;padding:12px 18px;box-shadow:0 12px 30px rgba(2,6,23,.3);line-height:1.3}
.callout.inkc{background:${BRAND.ink};color:#fff}
.pin{position:relative;width:1000px;height:1500px;overflow:hidden;display:flex;flex-direction:column}
.p-head{padding:84px 72px 0;flex:none}
.p-head h1{font-size:92px;margin-top:28px}
.p-head .sub{font-size:36px;margin-top:26px}
.p-head .kick{font-size:20px;padding:10px 18px}
.p-vis{flex:1;position:relative;min-height:0;margin-top:50px;overflow:hidden}
.fit{position:absolute;inset:0 0 36px;display:flex;justify-content:center;align-items:flex-start}
.fit img{max-height:100%;max-width:860px}
.p-foot{flex:none;height:150px;display:flex;align-items:center;justify-content:space-between;padding:0 72px}
.dark .p-foot{border-top:1px solid rgba(255,255,255,.1)}
.light .p-foot{border-top:1px solid ${BRAND.line}}
.p-foot .tag{font-size:24px;font-weight:600}
.dark .p-foot .tag{color:#94A3B8}
.light .p-foot .tag,.lime .p-foot .tag{color:#475569}
.shot{border-radius:22px;box-shadow:0 30px 70px rgba(2,6,23,.35),0 0 0 1px rgba(15,23,42,.08);display:block}
.stack .b-row{flex-direction:column;gap:20px}
.chip{display:flex;align-items:center;gap:14px;border-radius:16px;padding:14px 18px}
`;

const pageCover = (body, bg) => page({ w: 1280, h: 720, body, css: CSS, bg });
const pageThumb = (body) => page({ w: 600, h: 600, body, css: CSS });
const pagePin = (body) => page({ w: 1000, h: 1500, body, css: CSS });

// ---------------------------------------------------------------------------
// Tracker covers
// ---------------------------------------------------------------------------

function trackerCover1() {
  const d = DATA.en;
  const shot = browser(app(d, { active: 'dashboard', body: zoom(dashboard(d), 0.86) }), { width: 900, height: 700 });
  return pageCover(`<div class="cv dark">
    <div class="abs" style="left:72px;top:96px;width:440px"><span class="kick">Order &amp; Inventory Tracker</span>
      <h1 style="font-size:70px;margin-top:26px">Know what you <em>really</em> keep.</h1>
      <div class="sub" style="font-size:21px;margin-top:24px">Real profit on every order, automatic stock and a live dashboard — in Google Sheets. English + French.</div>
      <div style="margin-top:40px">${logo(42, '#fff')}</div></div>
    <div class="abs" style="left:548px;top:84px">${shot}</div></div>`);
}

function trackerCover2() {
  const d = DATA.en;
  const g = ordersGrid(d, { pick: [1, 2, 6, 7, 8, 10, 12, 13, 17, 18, 19], highlightProfit: true, rowH: 30, fill: 2,
    widths: { 2: 130, 6: 150, 10: 100, 13: 105 } });
  const shot = browser(app(d, { active: 'orders', body: zoom(g, 1.06), cell: 'S2', formula: '={"Profit"; MAP(G2:G, H2:H, I2:I, …' }), { width: 1180, height: 640 });
  return pageCover(`<div class="cv light">
    <div class="abs" style="left:72px;top:52px"><span class="kick">🧾 Orders tab</span>
      <h1 style="font-size:60px;margin-top:18px">Real profit on <em>every</em> order.</h1>
      <div class="sub" style="font-size:20px;margin-top:14px;width:640px">Rows change color with the status. Profit is calculated for you — refused parcels included.</div></div>
    <div class="abs" style="left:50px;top:268px">${shot}</div>
    <div class="abs callout" style="right:42px;top:96px;width:330px;font-size:18px">Profit = price − product − packaging − shipping − platform &amp; payment fees</div>
    <svg class="abs" style="left:1060px;top:186px" width="90" height="250" viewBox="0 0 90 250"><path d="M50 4 C 62 90, 60 160, 50 236" stroke="${BRAND.ink}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M34 218 L50 240 L66 218" stroke="${BRAND.ink}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
  </div>`);
}

function trackerCover3() {
  const d = DATA.en;
  const g = customersGrid(d, { pick: [1, 4, 5, 6, 7, 11], focusTags: true, rowH: 34, fill: 3 });
  const shot = browser(app(d, { active: 'customers', body: zoom(g, 1.25) }), { width: 880, height: 560 });
  return pageCover(`<div class="cv dark">
    <div class="abs" style="left:72px;top:52px"><span class="kick">👥 Customers tab · built automatically</span>
      <h1 style="font-size:60px;margin-top:18px">Spot customers who <em>refuse parcels.</em></h1></div>
    <div class="abs" style="left:72px;top:232px">${shot}</div>
    <div class="abs callout" style="right:56px;top:330px;width:270px;font-size:18px;background:#FEE2E2;color:#B91C1C">⚠️ Risky = 2+ refused parcels.<br><span style="font-weight:500;color:#7F1D1D">Ask for a deposit next time.</span></div>
    <div class="abs callout" style="right:56px;top:470px;width:270px;font-size:18px;background:#DCFCE7;color:#15803D">⭐ Loyal = 3+ delivered orders.<br><span style="font-weight:500;color:#14532D">Reward them.</span></div>
  </div>`);
}

function trackerCover4() {
  const d = DATA.en;
  const g = ordersGrid(d, { pick: [2, 12, 18], rows: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17], rowH: 34, widths: { 2: 130, 12: 105, 18: 85 } });
  const dd = `<div style="position:absolute;left:128px;top:392px;width:220px;background:#fff;border-radius:12px;box-shadow:0 18px 40px rgba(2,6,23,.3);padding:6px 0;font-size:15px">${d.t.statuses.map((s, i) => `<div style="padding:9px 16px;display:flex;align-items:center;gap:10px;${i === 3 ? 'background:#F0FDF4;font-weight:700' : ''}"><span style="width:10px;height:10px;border-radius:50%;background:${['#3B82F6', '#8B5CF6', '#F59E0B', '#16A34A', '#DC2626', '#94A3B8'][i]}"></span>${s}${i === 3 ? ' ✓' : ''}</div>`).join('')}</div>`;
  const screen = mobileSheet({ title: d.t.file, gridHtml: zoom(g, 1.02), tabs: tabs(d, TRACKER_TABS), active: 'orders' }) + dd;
  return pageCover(`<div class="cv lime">
    <div class="abs" style="left:80px;top:150px;width:560px"><span class="kick">📱 Google Sheets app</span>
      <h1 style="font-size:76px;margin-top:22px">Works on <em>your phone.</em></h1>
      <div class="sub" style="font-size:22px;margin-top:22px">Add orders from the free Google Sheets app. Tap a cell to open the dropdowns — profit and stock update by themselves.</div>
      <div style="margin-top:36px">${logo(44, BRAND.ink, true)}</div></div>
    <div class="abs" style="right:150px;top:40px">${phone(`<div style="position:relative;flex:1;display:flex;flex-direction:column;min-height:0">${screen}</div>`, { width: 390, height: 800 })}</div>
  </div>`);
}

function versionCard(d, flag, name, rot) {
  const f = (k) => k;
  const D = d.dash;
  const F = (n) => new Intl.NumberFormat(d.lang === 'fr' ? 'fr-FR' : 'en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n).replace(/ /g, ' ');
  const P = (n) => `${new Intl.NumberFormat(d.lang === 'fr' ? 'fr-FR' : 'en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(n * 100)}%`;
  const t = d.t.dash;
  const tile = (l, v, c) => `<div style="background:#fff;border:1px solid ${BRAND.line};padding:10px 12px"><div style="font-size:12.5px;color:#475569;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${l}</div><div class="tab" style="font-size:22px;font-weight:700;margin-top:4px;${c ? `color:${c}` : ''}">${v}</div></div>`;
  return `<div style="width:352px;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 24px 60px rgba(2,6,23,.45);transform:rotate(${rot}deg);color:${BRAND.ink}">
    <div style="background:${BRAND.lime};padding:16px 20px;display:flex;align-items:center;gap:12px"><span style="font-size:34px">${flag}</span><div><div class="jk" style="font-weight:800;font-size:22px">${name}</div><div style="font-size:13.5px;font-weight:600;opacity:.75">${f(d.t.file.replace('Margokit — ', ''))}</div></div></div>
    <div style="background:#F8FAFC;padding:16px">
      <div style="font-weight:700;font-size:16px;margin-bottom:12px">📊 ${d.t.shop} · ${d.t.sheets.dashboard}</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
        ${tile(`${t.revenue} (${d.currency})`, F(D.revenue))}${tile(`${t.profit} (${d.currency})`, F(D.profit), '#16A34A')}
        ${tile(t.margin, P(D.margin))}${tile(t.deliveryRate, P(D.deliveryRate))}</div>
      <div style="margin-top:12px;font-size:13px;color:#475569">${d.t.sheets.orders} · ${d.t.sheets.products} · ${d.t.sheets.customers} · ${d.t.sheets.settings}</div></div></div>`;
}

function trackerCover5() {
  return pageCover(`<div class="cv dark">
    <div class="abs" style="left:0;right:0;top:60px;text-align:center"><span class="kick">Included with your purchase</span>
      <h1 style="font-size:66px;margin-top:20px"><em>3 versions</em> included</h1>
      <div class="sub" style="font-size:21px;margin-top:12px">Pick yours or use them all. Currency, carriers and sample data adapted to each.</div></div>
    <div class="abs" style="left:0;right:0;top:318px;display:flex;justify-content:center;gap:44px">
      ${versionCard(DATA.en, '🇬🇧', 'English · $', -2)}${versionCard(DATA.fr, '🇫🇷', 'Français · €', 0)}${versionCard(DATA.ma, '🇲🇦', 'Maroc · MAD', 2)}</div>
  </div>`);
}

function thumb({ title, sub, shot }) {
  return pageThumb(`<div class="dark" style="position:relative;width:600px;height:600px;overflow:hidden">
    <div class="abs" style="left:44px;top:40px">${logo(52, '#fff')}</div>
    <div class="abs" style="left:44px;top:122px"><h1 style="font-size:60px">${title}</h1><div class="sub" style="font-size:21px;margin-top:10px;color:#CBD5E1">${sub}</div></div>
    <div class="abs" style="left:44px;top:322px">${shot}</div></div>`);
}

function trackerThumb() {
  const d = DATA.en;
  return thumb({ title: '<em>Tracker</em>', sub: 'Orders · Stock · Real profit', shot: browser(zoom(dashboard(d, { charts: false }), 0.82), { width: 640, height: 340 }) });
}

// ---------------------------------------------------------------------------
// Seller Pack covers
// ---------------------------------------------------------------------------

function packCover1() {
  const d = DATA.en;
  const shot = browser(app(d, { pack: true, active: 'dashboard', cell: 'B16', body: `<div style="margin-top:-100px">${zoom(dashboard(d, { pack: true }), 0.86)}</div>` }), { width: 1136, height: 560 });
  return pageCover(`<div class="cv dark">
    <div class="abs" style="left:72px;top:52px"><span class="kick">Seller Pack · 11 tabs in Google Sheets</span>
      <h1 style="font-size:62px;margin-top:20px">Your ROAS lies. <em>This sheet doesn't.</em></h1></div>
    <div class="abs" style="left:72px;top:212px">${shot}</div>
    <div class="abs callout" style="right:56px;top:566px;width:250px;font-size:17px">+8 numbers: ad spend, ROAS, profit <u>after</u> ads, cost per order, cash &amp; content</div>
  </div>`);
}

function packCover2() {
  const d = DATA.en;
  const g = adsGrid(d, { pick: [1, 2, 4, 5, 9, 11, 12], hlVerdict: true, rowH: 36, fill: 3 });
  const shot = browser(app(d, { pack: true, active: 'ads', body: zoom(g, 1.32) }), { width: 1180, height: 520 });
  return pageCover(`<div class="cv light">
    <div class="abs" style="left:72px;top:48px"><span class="kick">📣 Ads tab</span>
      <h1 style="font-size:58px;margin-top:18px">Which ads <em>really</em> make money?</h1>
      <div class="sub" style="font-size:20px;margin-top:12px;width:900px">Real profit per campaign, from your real profit per order — refused parcels included.</div></div>
    <div class="abs" style="left:50px;top:244px">${shot}</div>
  </div>`);
}

function packCover3() {
  const d = DATA.en;
  const v = pricingView(d, { side: true });
  const shot = browser(app(d, { pack: true, active: 'pricing', body: zoom(v, 0.8) }), { width: 1180, height: 600 });
  return pageCover(`<div class="cv dark">
    <div class="abs" style="left:72px;top:48px"><span class="kick">🧮 Price calculator</span>
      <h1 style="font-size:58px;margin-top:18px">Price it right <em>before</em> you sell.</h1></div>
    <div class="abs sub" style="right:60px;top:84px;width:360px;font-size:18px;text-align:right">Minimum price, price for 30% &amp; 50% margin, max ad cost, break-even ROAS.</div>
    <div class="abs" style="left:50px;top:196px">${shot}</div>
  </div>`);
}

function packCover4() {
  const d = DATA.en;
  const c = contentGrid(d, { pick: [1, 3, 5, 7, 14], rowH: 32 });
  const content = browser(app(d, { pack: true, active: 'content', body: zoom(c, 0.93) }), { width: 770, height: 480 });
  const budget = browser(app(d, { pack: true, active: 'budget', body: zoom(`<div class="stack">${budgetView(d, { chart: false })}</div>`, 0.76) }), { width: 470, height: 530 });
  return pageCover(`<div class="cv light">
    <div class="abs" style="left:72px;top:48px"><span class="kick">🎬 Content · 💰 Budget</span>
      <h1 style="font-size:56px;margin-top:18px">Plan your content. <em>Control your cash.</em></h1></div>
    <div class="abs" style="left:44px;top:232px">${content}</div>
    <div class="abs" style="right:36px;top:196px">${budget}</div>
  </div>`);
}

const TAB_INFO = {
  en: [['📊', 'dashboard', 'Revenue, real profit, ROAS, cash'], ['🧾', 'orders', 'Real profit on every order'], ['📦', 'products', 'Stock updates itself'],
    ['👥', 'customers', '⚠️ risky · ⭐ loyal customers'], ['📣', 'ads', 'Real profit per campaign'], ['🎬', 'content', 'Idea → published, views, engagement'],
    ['💵', 'cash', 'Every money movement, running balance'], ['💰', 'budget', 'Monthly budget, alerts at 80% & 100%'], ['🧮', 'pricing', 'Minimum price, break-even ROAS'],
    ['⚙️', 'settings', 'Currency, channels, fees, carriers'], ['📖', 'guide', 'Step-by-step guide']],
};

function packCover5() {
  const d = DATA.en;
  const chips = TAB_INFO.en.map(([e, k, desc], i) => {
    const plus = i >= 4 && i <= 8;
    return `<div class="chip" style="height:104px;background:${plus ? 'rgba(163,230,53,.12)' : 'rgba(255,255,255,.06)'};border:1px solid ${plus ? 'rgba(163,230,53,.45)' : 'rgba(255,255,255,.12)'}">
    <span style="font-size:34px">${e}</span><div><div class="jk" style="font-weight:800;font-size:23px;color:#fff">${d.t.sheets[k]}</div><div style="font-size:15px;color:#CBD5E1;margin-top:3px;line-height:1.3">${desc}</div></div></div>`;
  }).join('');
  return pageCover(`<div class="cv dark">
    <div class="abs" style="left:72px;top:44px"><span class="kick">Seller Pack</span>
      <h1 style="font-size:64px;margin-top:16px"><em>11 tabs.</em> One file.</h1></div>
    <div class="abs sub" style="right:72px;top:84px;width:420px;font-size:19px;text-align:right">Everything in the Order &amp; Inventory Tracker, <b style="color:${BRAND.lime}">plus 5 tabs</b> (highlighted). All connected together.</div>
    <div class="abs" style="left:72px;right:72px;top:214px;display:grid;grid-template-columns:repeat(4,1fr);gap:14px">${chips}
      <div class="chip" style="height:104px;background:${BRAND.lime};color:${BRAND.ink};flex-direction:column;align-items:flex-start;justify-content:center;gap:4px"><div class="jk" style="font-weight:800;font-size:23px">3 versions</div><div style="font-size:15px;font-weight:600">English · Français · Maroc</div></div></div>
    <div class="abs" style="left:72px;right:72px;bottom:64px;border-radius:12px;overflow:hidden;box-shadow:0 20px 50px rgba(2,6,23,.5)">${tabBar(tabs(d, PACK_TABS), 'dashboard')}</div>
  </div>`);
}

function packThumb() {
  const d = DATA.en;
  return thumb({ title: '<em>Seller Pack</em>', sub: 'Profit · Ads · Content · Cash', shot: browser(zoom(adsGrid(d, { pick: [2, 9, 11, 12], rowH: 34 }), 1.05), { width: 640, height: 340 }) });
}

// ---------------------------------------------------------------------------
// Pinterest pins
// ---------------------------------------------------------------------------

const PIN_FOOT = { en: 'Know what you really keep.', fr: 'Sache ce que tu gardes vraiment.' };

function pin({ lang, theme, kick, title, sub, vis, titleSize = 92 }) {
  return pagePin(`<div class="pin ${theme}">
    <div class="p-head"><span class="kick">${kick}</span><h1 style="font-size:${titleSize}px">${title}</h1>${sub ? `<div class="sub">${sub}</div>` : ''}</div>
    <div class="p-vis">${vis}</div>
    <div class="p-foot">${logo(64, theme === 'dark' ? '#fff' : BRAND.ink, theme === 'lime')}<span class="tag">${PIN_FOOT[lang]}</span></div></div>`);
}

const KICK = {
  calc: { en: 'Free calculator · no sign-up', fr: 'Calculateur gratuit · sans inscription' },
  sheet: { en: 'Google Sheets template', fr: 'Template Google Sheets' },
  pack: { en: 'Seller Pack · Google Sheets', fr: 'Pack Vendeur · Google Sheets' },
};

const img = (src, style) => `<img class="shot" src="${src}" style="${style}">`;
const fitImg = (src) => `<div class="fit"><img class="shot" src="${src}"></div>`;
const note = (html, bottom = 70) => `<div class="abs callout" style="left:96px;right:96px;bottom:${bottom}px;font-size:30px;padding:22px 28px;text-align:center">${html}</div>`;
const bleed = (html) => `<div style="position:absolute;left:56px;top:10px">${html}</div>`;
const center = (html, top = 0) => `<div style="position:absolute;left:0;right:0;top:${top}px;display:flex;justify-content:center">${html}</div>`;

/** `shots` = { results, hlPrice, hlRoas, hlFive, form } data URLs per language (calculator screenshots). */
export function pins(shots) {
  const out = [];
  for (const lang of ['en', 'fr']) {
    const d = DATA[lang];
    const S = shots[lang];
    const L = (en, fr) => (lang === 'en' ? en : fr);
    const appIn = (opts, w, h) => browser(app(d, opts), { width: w, height: h, url: 'docs.google.com/spreadsheets' });

    out.push([1, lang, pin({ lang, theme: 'dark', kick: KICK.calc[lang],
      title: L('Free profit calculator for <em>online sellers</em>', 'Calculateur de bénéfice <em>gratuit</em> pour vendeurs en ligne'), titleSize: L(92, 80),
      sub: L('Shipping, fees &amp; returns included.', 'Livraison, frais et retours inclus.'),
      vis: img(S.form, 'position:absolute;left:48px;top:90px;width:600px') + img(S.results, 'position:absolute;right:48px;top:0;width:520px') })]);

    out.push([2, lang, pin({ lang, theme: 'light', kick: KICK.calc[lang],
      title: L('The <em>minimum price</em> formula for your product', 'La formule du <em>prix minimum</em> de ton produit'), titleSize: L(88, 88),
      sub: L('Most sellers price too low. Find your floor price and your price for a 30% margin.', 'La plupart des vendeurs vendent trop bas. Trouve ton prix plancher et ton prix pour 30 % de marge.'),
      vis: fitImg(S.hlPrice) })]);

    out.push([3, lang, pin({ lang, theme: 'dark', kick: KICK.sheet[lang],
      title: L('Order tracker <em>Google Sheets</em> template', 'Suivi des commandes et du stock <em>sur Google Sheets</em>'), titleSize: L(92, 80),
      sub: L('Inventory + profit dashboard. Works on your phone.', 'Tableau de bord bénéfice + stock. Marche sur téléphone.'),
      vis: bleed(appIn({ active: 'dashboard', body: zoom(dashboard(d, { chartRows: 1 }), 0.9) }, 1000, 900)) })]);

    out.push([4, lang, pin({ lang, theme: 'light', kick: KICK.sheet[lang],
      title: L('Inventory tracker: stock <em>updates itself</em>', 'Ton stock se met à jour <em>tout seul</em>'), titleSize: L(90, 96),
      sub: L('Stock goes down when an order ships and back up when a parcel is returned.', 'Le stock baisse quand une commande part et remonte quand un colis revient.'),
      vis: bleed(appIn({ active: 'products', body: zoom(productsGrid(d, { pick: [1, 6, 9, 10, 11], rowH: 40, fill: 8 }), 1.45) }, 1000, 900)) + note(L('Low stock in orange. Out of stock in red.', 'Stock bas en orange. Rupture en rouge.')) })]);

    out.push([5, lang, pin({ lang, theme: 'dark', kick: KICK.sheet[lang],
      title: L('Cash on delivery? Track <em>refused parcels</em>', 'Paiement à la livraison&nbsp;? Suis les <em>colis refusés</em>'), titleSize: L(88, 84),
      sub: L('Flags customers who refused 2+ parcels, so you ask for a deposit next time.', 'Repère les clients qui ont refusé 2 colis ou plus, pour leur demander un acompte.'),
      vis: bleed(appIn({ active: 'customers', body: zoom(customersGrid(d, { pick: [1, 4, 6, 7, 11], focusTags: true, rowH: 40, fill: 8 }), 1.55) }, 1000, 900)) + note(L('⚠️ 2+ refused parcels → ask for a deposit', '⚠️ 2 colis refusés ou plus → demande un acompte')) })]);

    out.push([6, lang, pin({ lang, theme: 'light', kick: KICK.calc[lang],
      title: L('What is a <em>good ROAS?</em>', 'C’est quoi un <em>bon ROAS</em>&nbsp;?'), titleSize: 104,
      sub: L('There is no universal answer. Calculate your break-even ROAS in 10 seconds.', 'Il n’y a pas de réponse universelle. Calcule ton ROAS minimum rentable en 10 secondes.'),
      vis: fitImg(S.hlRoas) })]);

    out.push([7, lang, pin({ lang, theme: 'dark', kick: KICK.pack[lang],
      title: L('Facebook &amp; TikTok ads: <em>real profit</em> per campaign', 'Pubs Facebook &amp; TikTok&nbsp;: le <em>vrai bénéfice</em> par campagne'), titleSize: L(82, 80),
      sub: L('ROAS hides product costs and refused parcels. This sheet doesn’t.', 'Le ROAS cache le coût des produits et les colis refusés. Pas ce tableau.'),
      vis: bleed(appIn({ pack: true, active: 'ads', body: zoom(adsGrid(d, { pick: [2, 4, 9, 11, 12], rowH: 42, fill: 6, hlVerdict: true }), 1.38) }, 1000, 900)) + note(L('Real profit = orders × real profit per order − ad&nbsp;spend', 'Bénéfice réel = commandes × bénéfice réel par commande − dépense&nbsp;pub'), 60) })]);

    out.push([8, lang, pin({ lang, theme: 'light', kick: KICK.pack[lang],
      title: L('Content calendar for <em>TikTok, Reels</em> &amp; Pinterest', 'Planning de contenu <em>TikTok, Reels</em> &amp; Pinterest'), titleSize: L(88, 88),
      sub: L('From idea to published. Engagement is calculated so you repeat what works.', 'De l’idée à la publication. L’engagement se calcule pour refaire ce qui marche.'),
      vis: bleed(appIn({ pack: true, active: 'content', body: zoom(contentGrid(d, { pick: [1, 3, 5, 7, 14], rowH: 40 }), 1.04) }, 1000, 900)) })]);

    out.push([9, lang, pin({ lang, theme: 'dark', kick: KICK.pack[lang],
      title: L('Separate business &amp; <em>personal money</em>', 'Sépare l’argent <em>pro et perso</em>'), titleSize: L(90, 100),
      sub: L('Cash balance and a monthly budget per category, with alerts at 80% and 100%.', 'Ton solde et un budget mensuel par catégorie, avec alertes à 80 % et 100 %.'),
      vis: bleed(appIn({ pack: true, active: 'budget', body: zoom(`<div class="stack">${budgetView(d, { chart: false })}</div>`, 1.25) }, 1000, 900)) })]);

    out.push([10, lang, pin({ lang, theme: 'lime', kick: KICK.calc[lang],
      title: L('5 numbers to know <em>before</em> you order stock', '5 chiffres à connaître <em>avant</em> de commander ton stock'), titleSize: L(88, 82),
      sub: '', vis: fitImg(S.hlFive) })]);
  }
  return out.map(([n, lang, html]) => ({ name: `pin-${String(n).padStart(2, '0')}-${lang}`, w: 1000, h: 1500, html }));
}

// ---------------------------------------------------------------------------
// Margokit Pro covers (Monthly + Lifetime share the same images)
// Screenshots come from shoot-app.mjs (real app, local build, fictional demo data).
// ---------------------------------------------------------------------------

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const PRICING = JSON.parse(readFileSync(new URL('../../app/messages/en.json', import.meta.url), 'utf8')).pricing;

/** Window onto a screenshot: region {x, y, w, h} in CSS px of a capture `srcW` CSS px wide, shown at `scale`. */
const crop = (src, { srcW, x = 0, y = 0, w, h, scale = 1, style = '' }) =>
  `<div style="position:relative;overflow:hidden;width:${Math.round(w * scale)}px;height:${Math.round(h * scale)}px;${style}"><img src="${src}" style="position:absolute;left:${-x * scale}px;top:${-y * scale}px;width:${srcW * scale}px;max-width:none"></div>`;
const DESK = 1280; // desktop captures: 1280 CSS px wide
const MOB = 390; // phone captures
const PDF_W = 1240; // PDF rasters (A4 at 150 dpi)
const sheet = (src, { width, rot = 0, style = '' }) =>
  `<div style="width:${width}px;background:#fff;border-radius:6px;overflow:hidden;box-shadow:0 30px 80px rgba(2,6,23,.5),0 0 0 1px rgba(15,23,42,.08);transform:rotate(${rot}deg);${style}"><img src="${src}" style="display:block;width:${width}px"></div>`;
const tick = (html, color = BRAND.lime) => `<div style="display:flex;gap:12px;align-items:flex-start"><span style="flex:none;width:26px;height:26px;border-radius:50%;background:${color};color:${BRAND.ink};font-weight:800;font-size:15px;display:grid;place-items:center;margin-top:1px">✓</span><span>${html}</span></div>`;
const badge = (text, bg, fg) => `<span style="display:inline-flex;align-items:center;border-radius:999px;padding:6px 14px;font-weight:600;font-size:16px;background:${bg};color:${fg}">${text}</span>`;
const PRO_URL = 'margokit.com/en/app/documents';

function proCover1(S) {
  const app = crop(S.invoiceEn, { srcW: DESK, x: 280, y: 60, w: 935, h: 900, scale: 0.767 });
  return pageCover(`<div class="cv dark">
    <div class="abs" style="left:72px;top:92px;width:440px"><span class="kick">Margokit Pro · web app</span>
      <h1 style="font-size:64px;margin-top:24px">Quotes &amp; invoices <em>in one minute.</em></h1>
      <div class="sub" style="font-size:20px;margin-top:22px">Professional PDFs with your logo, tax IDs and legal mentions. Share by link, email or WhatsApp.</div>
      <div style="display:flex;gap:10px;margin-top:26px">${badge('🇬🇧 English', 'rgba(255,255,255,.08)', '#fff')}${badge('🇫🇷 Français', 'rgba(255,255,255,.08)', '#fff')}</div>
      <div style="margin-top:34px">${logo(42, '#fff')}</div></div>
    <div class="abs" style="left:548px;top:64px">${browser(app, { url: PRO_URL, width: 717, height: 700 })}</div>
    <div class="abs" style="left:880px;top:470px">${sheet(S.pdfEn, { width: 370, rot: 3 })}</div>
    <div class="abs callout" style="left:700px;top:560px;font-size:16px;padding:8px 14px;transform:rotate(-2deg)">PDF ready to send →</div>
  </div>`);
}

function proCover2(S) {
  const region = { srcW: DESK, x: 270, y: 60, w: 970, h: 560, scale: 0.58 };
  const quote = browser(crop(S.quote, region), { url: PRO_URL, width: Math.round(970 * 0.58), height: Math.round(560 * 0.58) + 40 });
  const invoice = browser(crop(S.invoiceFr, region), { url: PRO_URL, width: Math.round(970 * 0.58), height: Math.round(560 * 0.58) + 40 });
  // "Convert to invoice" button in the quote crop (CSS 461..641 × 188..232 in the capture)
  const bx = 48 + (461 - 270) * 0.58, by = 262 + 40 + (188 - 60) * 0.58;
  const step = (t, bg, fg) => badge(t, bg, fg);
  const arrow = `<span style="color:#94A3B8;font-weight:700;font-size:20px">→</span>`;
  return pageCover(`<div class="cv light">
    <div class="abs" style="left:72px;top:46px"><span class="kick">📄 Quote → invoice</span>
      <h1 style="font-size:56px;margin-top:16px">Your client said yes? <em>One click.</em></h1></div>
    <div class="abs" style="left:72px;top:192px;display:flex;align-items:center;gap:10px">
      ${step('Draft', '#F1F5F9', '#64748B')}${arrow}${step('Sent', '#E0F2FE', '#0369A1')}${arrow}${step('Accepted', '#DCFCE7', '#15803D')}${arrow}${step('Invoice', BRAND.ink, BRAND.lime)}${arrow}${step('Paid', '#DCFCE7', '#15803D')}
      <span style="margin-left:14px;font-size:17px;color:#475569">Automatic, gap-free numbering</span></div>
    <div class="abs" style="left:48px;top:262px">${quote}</div>
    <div class="abs" style="left:${Math.round(bx - 6)}px;top:${Math.round(by - 6)}px;width:${Math.round(180 * 0.58 + 12)}px;height:${Math.round(44 * 0.58 + 12)}px;border:3px solid ${BRAND.ink};border-radius:14px"></div>
    <div class="abs" style="left:672px;top:308px">${invoice}</div>
    <svg class="abs" style="left:560px;top:250px" width="150" height="80" viewBox="0 0 150 80"><path d="M6 60 C 50 6, 100 6, 138 40" stroke="${BRAND.ink}" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M118 38 L140 42 L134 20" stroke="${BRAND.ink}" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>
    <div class="abs callout" style="left:720px;top:256px;font-size:16px;padding:8px 14px">Lines, client &amp; totals copied</div>
  </div>`);
}

function proCover3(S) {
  const pill = (text, left, top, arrow = '') => `<div class="abs" style="left:${left}px;top:${top}px;background:${BRAND.lime};color:${BRAND.ink};font-weight:800;font-size:14px;padding:6px 11px;border-radius:8px;box-shadow:0 8px 20px rgba(2,6,23,.35);white-space:nowrap">${arrow}${text}</div>`;
  return pageCover(`<div class="cv dark">
    <div class="abs" style="left:72px;top:64px;width:470px"><span class="kick">🧾 The PDF your client receives</span>
      <h1 style="font-size:54px;margin-top:20px">Looks pro. <em>Ticks the legal boxes.</em></h1>
      <div class="sub" style="font-size:19px;margin-top:26px;display:flex;flex-direction:column;gap:14px">
        ${tick('<b style="color:#fff">Your logo</b>, no watermark')}
        ${tick('<b style="color:#fff">Tax IDs &amp; legal mentions</b> of your country')}
        ${tick('<b style="color:#fff">SEPA QR code</b> + payment link on EUR invoices')}
        ${tick('<b style="color:#fff">English or French</b>, multiple tax rates &amp; currencies')}</div></div>
    <div class="abs" style="left:900px;top:58px">${sheet(S.pdfFr, { width: 400, rot: 5 })}</div>
    <div class="abs" style="left:610px;top:30px">${sheet(S.pdfEn, { width: 460, rot: 0 })}</div>
    ${pill('Your logo', 745, 68, '← ')}${pill('Tax IDs', 790, 150, '← ')}${pill('SEPA QR code', 856, 474, '')}${pill('Legal mentions', 846, 588, '← ')}
    <div class="abs" style="left:620px;top:40px;background:${BRAND.ink};color:#fff;font-weight:800;font-size:15px;padding:5px 10px;border-radius:8px">EN</div>
    <div class="abs" style="left:1196px;top:596px;background:#fff;color:${BRAND.ink};font-weight:800;font-size:15px;padding:5px 10px;border-radius:8px;transform:rotate(5deg)">FR</div>
  </div>`);
}

function proCover4(S) {
  const share = crop(S.share, { srcW: 896, w: 896, h: 255, scale: 0.66, style: 'border-radius:16px;box-shadow:0 24px 60px rgba(2,6,23,.18),0 0 0 1px #E2E8F0' });
  const tiles = crop(S.dashboard, { srcW: DESK, x: 262, y: 165, w: 996, h: 130, scale: 0.6, style: 'border-radius:16px;box-shadow:0 24px 60px rgba(2,6,23,.18),0 0 0 1px #E2E8F0' });
  const list = `<img src="${S.listMobile}" style="display:block;width:390px">`;
  return pageCover(`<div class="cv light">
    <div class="abs" style="left:72px;top:52px;width:640px"><span class="kick">💸 Get paid faster</span>
      <h1 style="font-size:60px;margin-top:18px">Send it. <em>Get paid.</em></h1>
      <div class="sub" style="font-size:20px;margin-top:16px;width:600px">Share by link, email or WhatsApp — your client views and downloads the PDF, no account needed. See what's paid and what's overdue.</div></div>
    <div class="abs" style="left:64px;top:330px">${share}</div>
    <div class="abs" style="left:64px;top:542px">${tiles}</div>
    <div class="abs" style="right:96px;top:38px;zoom:.8">${phone(list, { width: 390, height: 800 })}</div>
    <div class="abs callout" style="left:700px;top:632px;font-size:16px;padding:9px 14px;background:#FEE2E2;color:#B91C1C">Overdue at a glance →</div>
  </div>`);
}

function proCover5() {
  const P = PRICING;
  const card = ({ name, price, period, features, hl, tag }) => `<div style="flex:1;border-radius:22px;padding:26px 26px 22px;${hl ? `background:${BRAND.lime};color:${BRAND.ink};box-shadow:0 24px 60px rgba(163,230,53,.25)` : 'background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.14);color:#fff'};position:relative">
    ${tag ? `<span style="position:absolute;right:20px;top:22px;font-size:13px;font-weight:700;padding:5px 10px;border-radius:999px;${hl ? `background:${BRAND.ink};color:${BRAND.lime}` : `background:${BRAND.lime};color:${BRAND.ink}`}">${tag}</span>` : ''}
    <div class="jk" style="font-weight:800;font-size:22px">${name}</div>
    <div style="display:flex;align-items:baseline;gap:8px;margin-top:8px"><span class="jk" style="font-weight:800;font-size:52px;letter-spacing:-.02em">${price}</span><span style="font-size:17px;opacity:.75">${period}</span></div>
    <div style="margin-top:16px;display:flex;flex-direction:column;gap:9px;font-size:16px;line-height:1.3">${features.map((f) => `<div style="display:flex;gap:9px"><span style="font-weight:800;${hl ? '' : `color:${BRAND.lime}`}">✓</span><span>${esc(f)}</span></div>`).join('')}</div></div>`;
  return pageCover(`<div class="cv dark">
    <div class="abs" style="left:0;right:0;top:44px;text-align:center"><span class="kick">Margokit Pro</span>
      <h1 style="font-size:54px;margin-top:16px">Start free. <em>Go Pro</em> when you need more.</h1></div>
    <div class="abs" style="left:72px;right:72px;top:216px;display:flex;gap:22px;align-items:stretch">
      ${card({ name: P.freeName, price: P.freePrice, period: P.freePeriod, features: [P.freeF1, P.freeF2, P.freeF3] })}
      ${card({ name: P.monthlyName, price: P.monthlyPrice, period: P.monthlyPeriod, features: [P.proF1, P.proF2, P.proF3, P.proF4], hl: true, tag: 'Cancel anytime' })}
      ${card({ name: P.lifetimeName, price: P.lifetimePrice, period: P.lifetimePeriod, features: [P.lifetimeF1, P.lifetimeF2, P.proF2, P.proF3], tag: 'Pay once' })}</div>
    <div class="abs" style="left:72px;right:72px;bottom:72px;display:flex;align-items:center;justify-content:center;gap:14px;border-radius:14px;padding:16px 18px;background:rgba(163,230,53,.1);border:1px solid rgba(163,230,53,.4);font-size:18px;color:#E2E8F0">
      <span style="font-size:22px">⚡</span><b style="color:#fff">Ready for e-invoicing:</b> Factur-X · UBL/Peppol (EN 16931)</div>
  </div>`);
}

function proThumb(S) {
  return thumb({ title: '<em>Pro</em>', sub: 'Quotes &amp; invoices in one minute', shot: `<div style="width:512px;border-radius:14px;overflow:hidden;box-shadow:0 30px 80px rgba(2,6,23,.45)">${crop(S.pdfEn, { srcW: PDF_W, x: 60, y: 60, w: 1120, h: 520, scale: 512 / 1120 })}</div>` });
}

/** `S` = data URLs of the app screenshots (see render.mjs). */
export function proVisuals(S) {
  return [['pro-cover-1', proCover1], ['pro-cover-2', proCover2], ['pro-cover-3', proCover3], ['pro-cover-4', proCover4], ['pro-cover-5', proCover5]]
    .map(([name, fn]) => ({ name, w: 1280, h: 720, html: fn(S) }))
    .concat([{ name: 'pro-thumb', w: 600, h: 600, html: proThumb(S) }]);
}

export function covers() {
  return [
    ['tracker-cover-1', trackerCover1], ['tracker-cover-2', trackerCover2], ['tracker-cover-3', trackerCover3], ['tracker-cover-4', trackerCover4], ['tracker-cover-5', trackerCover5],
    ['pack-cover-1', packCover1], ['pack-cover-2', packCover2], ['pack-cover-3', packCover3], ['pack-cover-4', packCover4], ['pack-cover-5', packCover5],
  ].map(([name, fn]) => ({ name, w: 1280, h: 720, html: fn() }))
    .concat([{ name: 'tracker-thumb', w: 600, h: 600, html: trackerThumb() }, { name: 'pack-thumb', w: 600, h: 600, html: packThumb() }]);
}

export { LOGO_SVG };
