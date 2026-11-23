/**
 * Vidéos avec voix off de la campagne « Facture. Encaisse. Respire. » (Margokit Pro).
 *
 *   node marketing/visuals/videos-pro.mjs              # toutes
 *   node marketing/visuals/videos-pro.mjs V01 H3       # celles dont l'id commence par V01 ou H3
 *
 * 1. Voix : Kokoro en local (voix ff_siwis, licence Apache-2.0, usage commercial autorisé) via tts/kokoro_batch.py,
 *    dans le venv ~/.venvs/kokoro (uv venv --python 3.12 ~/.venvs/kokoro && uv pip install kokoro-onnx soundfile).
 * 2. Images : une image par scène (Playwright, polices et couleurs Margokit) + une image transparente par sous-titre.
 * 3. Montage : ffmpeg (léger zoom continu par scène, sous-titres superposés, voix).
 * Sortie : marketing/campagne-pro/rendu/<format>/<id>.mp4 + miniature .jpg (non versionné).
 */
import { spawnSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './data.mjs';
import { BRAND, page, LOGO_SVG, browser, sheetsApp, PACK_TABS, TRACKER_TABS, dashboard, ordersGrid, adsGrid, pricingView, productsGrid, customersGrid, contentGrid, budgetView } from './templates.mjs';

// CAMPAIGN=kits → marketing/campagne-kits ; default → marketing/campagne-pro
const CAMPAIGN_DIR = process.env.CAMPAIGN === 'kits' ? 'campagne-kits' : 'campagne-pro';
const { VIDEOS, SAY, SUB } = await import(`../${CAMPAIGN_DIR}/videos.mjs`);

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const CAP = join(ROOT, 'marketing', CAMPAIGN_DIR, 'captures');
const CAP_PRO = join(ROOT, 'marketing', 'campagne-pro', 'captures');
const OUT = join(ROOT, 'marketing', CAMPAIGN_DIR, 'rendu');
const WORK = join(OUT, '_travail');
const PY = join(process.env.HOME, '.venvs', 'kokoro', 'bin', 'python');
const FPS = 30;
const PAUSE = 0.35;
const { chromium } = await import(join(ROOT, 'app', 'node_modules', 'playwright', 'index.mjs'));

const FORMATS = { '9x16': [1080, 1920], '16x9': [1920, 1080], '1x1': [1080, 1080] };
const ONLY = process.argv.slice(2);
const videos = VIDEOS.filter((v) => !ONLY.length || ONLY.some((o) => v.id.startsWith(o)));
for (const d of [OUT, WORK, join(WORK, 'audio')]) mkdirSync(d, { recursive: true });

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const sayText = (t) => SAY.reduce((s, [re, r]) => s.replace(re, r), t);
const subText = (t) => SUB.reduce((s, [re, r]) => s.replace(re, r), t);
const run = (cmd, args) => {
  const r = spawnSync(cmd, args, { encoding: 'utf8', maxBuffer: 1 << 26 });
  if (r.status !== 0) throw new Error(`${cmd} failed: ${r.stderr?.slice(-2000)}`);
  return r.stdout;
};
const duration = (f) => Number(run('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).trim());
const dataUri = (f) => `data:image/png;base64,${readFileSync(f).toString('base64')}`;
/** Capture file; `pro:name` reads the Margokit Pro captures, other names fall back to them. */
const capture = (name, variant) => {
  const [dir, base] = name.startsWith('pro:') ? [CAP_PRO, name.slice(4)] : [CAP, name];
  for (const d of [dir, CAP_PRO]) {
    const f = join(d, `${base}-${variant}.png`);
    if (existsSync(f)) return f;
    if (existsSync(join(d, `${base}.png`)) && base.endsWith(variant)) return join(d, `${base}.png`);
  }
  return null;
};

// ---------------------------------------------------------------------------
// 1. Voice
// ---------------------------------------------------------------------------
const jobs = [];
for (const v of videos) v.segments.forEach((s, i) => {
  s.wav = join(WORK, 'audio', `${v.id}-${i}.wav`);
  s.said = sayText(s.vo);
  // Re-synthesize when the text changed
  const txt = `${s.wav}.txt`;
  if (existsSync(s.wav) && (!existsSync(txt) || readFileSync(txt, 'utf8') !== s.said)) run('rm', ['-f', s.wav]);
  writeFileSync(txt, s.said);
  jobs.push({ text: s.said, out: s.wav });
});
writeFileSync(join(WORK, 'jobs.json'), JSON.stringify(jobs));
console.log(`· voix : ${jobs.length} phrases`);
run(PY, [join(HERE, 'tts', 'kokoro_batch.py'), join(WORK, 'jobs.json')]);
for (const v of videos) for (const s of v.segments) s.dur = duration(s.wav);

// ---------------------------------------------------------------------------
// 2. Scenes
// ---------------------------------------------------------------------------
const MA = build('ma');
const packApp = (active, body) => sheetsApp({ title: MA.t.packFile, tabs: PACK_TABS.map((k) => [k, MA.t.sheets[k]]), active, body });
const zoom = (html, z) => `<div style="zoom:${z}">${html}</div>`;
const sheet = (html, w, h) => `<div class="sheetwrap">${browser(html, { width: w, height: h })}</div>`;
const trackerApp = (active, body) => sheetsApp({ title: MA.t.file, tabs: TRACKER_TABS.map((k) => [k, MA.t.sheets[k]]), active, body });
const PACK = {
  trackerTabs: () => sheet(trackerApp('orders', zoom(ordersGrid(MA, { pick: [1, 2, 6, 10], rowH: 34, fill: 8 }), 1.1)), 900, 760),
  trackerDashboard: () => sheet(trackerApp('dashboard', zoom(dashboard(MA, { chartRows: 1 }), 0.8)), 900, 760),
  trackerDashboardTall: () => sheet(trackerApp('dashboard', zoom(dashboard(MA, { chartRows: 1 }), 1.05)), 900, 900),
  trackerOrders: () => sheet(trackerApp('orders', zoom(ordersGrid(MA, { pick: [1, 2, 6, 10, 18], rowH: 40, fill: 4, highlightProfit: true }), 1.3)), 900, 640),
  trackerProducts: () => sheet(trackerApp('products', zoom(productsGrid(MA, { pick: [1, 3, 5, 6, 7, 9], rowH: 40, fill: 3 }), 1.25)), 900, 640),
  trackerCustomers: () => sheet(trackerApp('customers', zoom(customersGrid(MA, { pick: [1, 4, 6, 7, 11], focusTags: true, rowH: 40, fill: 4 }), 1.4)), 900, 640),
  adsVerdict: () => sheet(packApp('ads', zoom(adsGrid(MA, { pick: [2, 4, 9, 11, 12], rowH: 48, fill: 2, hlVerdict: true }), 1.4)), 900, 640),
  content: () => sheet(packApp('content', zoom(contentGrid(MA, { pick: [0, 1, 3, 5, 7], rowH: 40, fill: 4 }), 1.25)), 900, 640),
  budget: () => sheet(packApp('budget', zoom(budgetView(MA, { scale: 1 }), 0.9)), 900, 760),
  dashboard: () => sheet(packApp('dashboard', zoom(dashboard(MA, { pack: true, chartRows: 1 }), 0.8)), 900, 760),
  dashboardTall: () => sheet(packApp('dashboard', zoom(dashboard(MA, { pack: true, chartRows: 1 }), 1.05)), 900, 900),
  orders: () => sheet(packApp('orders', zoom(ordersGrid(MA, { pick: [1, 2, 6, 10, 18], rowH: 40, fill: 4, highlightProfit: true }), 1.3)), 900, 640),
  ads: () => sheet(packApp('ads', zoom(adsGrid(MA, { pick: [2, 4, 9, 11, 12], rowH: 44, fill: 4, hlVerdict: true }), 1.25)), 900, 640),
  pricing: () => sheet(packApp('pricing', zoom(pricingView(MA, { scale: 1 }), 0.95)), 900, 760),
};

const CSS = `
body{background:radial-gradient(120% 70% at 50% 0%,#1E293B 0%,#0F172A 60%);color:#fff}
.brand{position:absolute;display:flex;align-items:center;gap:14px}
.brand b{font-family:'Plus Jakarta Sans';font-weight:800;letter-spacing:-.02em}
.brand small{color:#94A3B8;font-weight:500}
.head{position:absolute;font-family:'Plus Jakarta Sans';font-weight:800;letter-spacing:-.025em;line-height:1.08;color:#fff;text-wrap:balance}
.head em{font-style:normal;color:${BRAND.lime}}
.vis{position:absolute;display:flex;align-items:center;justify-content:center}
.phone{background:#0B1220;border-radius:56px;padding:14px;box-shadow:0 50px 120px rgba(0,0,0,.6),0 0 0 2px #334155}
.phone img{display:block;border-radius:44px}
.card{border-radius:28px;overflow:hidden;box-shadow:0 50px 120px rgba(0,0,0,.55);background:#fff}
.card img{display:block}
.desk{border-radius:18px;overflow:hidden;box-shadow:0 50px 120px rgba(0,0,0,.55);background:#fff;border:10px solid #1E293B}
.desk img{display:block}
.big{font-family:'Plus Jakarta Sans';font-weight:800;text-align:center;letter-spacing:-.03em;line-height:1.05;text-wrap:balance}
.big .t{color:#fff}.big .t em{font-style:normal;color:${BRAND.lime}}
.big .s{color:#94A3B8;font-weight:600;margin-top:28px;letter-spacing:0}
.list{display:flex;flex-direction:column;gap:22px;width:100%}
.li{display:flex;align-items:center;gap:26px;border-radius:24px;padding:26px 30px;background:#1E293B;color:#CBD5E1;font-weight:600}
.li .n{flex:none;display:grid;place-items:center;border-radius:50%;background:#334155;color:#fff;font-family:'Plus Jakarta Sans';font-weight:800}
.li.on{background:${BRAND.lime};color:${BRAND.ink};transform:scale(1.04)}
.li.on .n{background:${BRAND.ink};color:${BRAND.lime}}
.li.done .n{background:${BRAND.limeInk};color:#fff}
.chat{width:100%;border-radius:36px;overflow:hidden;background:#ECE5DD;box-shadow:0 50px 120px rgba(0,0,0,.55)}
.chat .top{background:#075E54;color:#fff;display:flex;align-items:center;gap:20px;font-weight:600}
.chat .av{border-radius:50%;background:#CBD5E1;display:grid;place-items:center;color:#334155;font-weight:800}
.chat .msgs{display:flex;flex-direction:column;gap:22px}
.bub{max-width:80%;border-radius:26px;line-height:1.35;color:#0F172A;box-shadow:0 2px 0 rgba(0,0,0,.08)}
.bub.me{align-self:flex-end;background:#DCF8C6;border-bottom-right-radius:8px}
.bub.them{align-self:flex-start;background:#fff;border-bottom-left-radius:8px}
.bub small{display:block;text-align:right;color:#64748B;margin-top:6px}
.word{width:100%;background:#fff;color:#111;border-radius:12px;box-shadow:0 50px 120px rgba(0,0,0,.55);font-family:'Times New Roman',serif;position:relative}
.word .bar{background:#2B579A;color:#fff;font-family:Inter;font-weight:600;border-radius:12px 12px 0 0}
.word .x{color:#DC2626;font-family:Inter;font-weight:800;position:absolute;transform:rotate(-6deg)}
.mail{width:100%;background:#fff;color:#0F172A;border-radius:28px;box-shadow:0 50px 120px rgba(0,0,0,.55);overflow:hidden}
.mail .h{border-bottom:1px solid #E2E8F0}
.mail .btn{display:inline-block;background:${BRAND.lime};color:${BRAND.ink};font-weight:700;border-radius:14px}
.steps{display:flex;gap:18px;justify-content:center}
.steps span{background:${BRAND.lime};color:${BRAND.ink};font-family:'Plus Jakarta Sans';font-weight:800;border-radius:999px}
.prices{display:grid;grid-template-columns:1fr 1fr;gap:22px;width:100%}
.pc{background:#1E293B;border-radius:26px;text-align:center;border:3px solid transparent}
.pc.hl{border-color:${BRAND.lime}}
.pc .p{font-family:'Plus Jakarta Sans';font-weight:800;color:#fff}
.pc .l{color:#94A3B8;font-weight:600}
.pc .tag{display:inline-block;background:${BRAND.lime};color:${BRAND.ink};font-weight:700;border-radius:999px}
.end{display:flex;flex-direction:column;align-items:center;text-align:center}
.end .slog{font-family:'Plus Jakarta Sans';font-weight:800;color:#fff;letter-spacing:-.02em}
.end .slog em{font-style:normal;color:${BRAND.lime}}
.end .cta{background:${BRAND.lime};color:${BRAND.ink};font-weight:800;border-radius:999px;font-family:'Plus Jakarta Sans'}
.end .url{color:#fff;font-weight:700}
.end .vit{color:#94A3B8;font-weight:600;letter-spacing:.08em;text-transform:uppercase}
.sheetwrap{border-radius:22px;overflow:hidden;box-shadow:0 50px 120px rgba(0,0,0,.55);background:#fff}
`;

/** Layout boxes per format: brand, head, visual. */
const L = {
  '9x16': { brand: [70, 150, 40], head: [70, 230, 940, 250, 66], vis: [70, 510, 940, 960], sub: [70, 1500, 940, 150, 50] },
  '16x9': { brand: [90, 60, 34], head: [90, 250, 760, 520, 64], vis: [900, 90, 930, 800], sub: [160, 925, 1600, 120, 44] },
  '1x1': { brand: [60, 46, 30], head: [60, 110, 960, 140, 50], vis: [90, 270, 900, 600], sub: [60, 900, 960, 140, 40] },
};

function visual(scene, fmt, box) {
  const [, , W, H] = box;
  const k = fmt === '16x9' && scene.k === 'phone' && capture(scene.img, 'desktop') ? 'desk' : scene.k;
  if (k === 'phone') {
    const f = capture(scene.img, 'mobile');
    if (fmt === '1x1') return card({ img: scene.img, y: 0, h: 1500 }, W, H);
    // 9:16: a large phone rising from the bottom edge (cropped by the frame), so the screen stays readable
    if (fmt === '9x16') {
      const w = 780;
      const h = Math.round((w * 2532) / 1170);
      if (scene.y) {
        // Show a lower part of the full-page capture inside the phone
        const full = capture(scene.img, 'mobile-full');
        return `<div style="position:absolute;top:10px;left:${Math.round((W - w - 28) / 2)}px"><div class="phone"><div style="width:${w}px;height:${h}px;overflow:hidden;border-radius:44px"><img src="${dataUri(full)}" style="width:${w}px;border-radius:0;margin-top:-${Math.round((scene.y * w) / 1170)}px"></div></div></div>`;
      }
      return `<div style="position:absolute;top:10px;left:${Math.round((W - w - 28) / 2)}px"><div class="phone"><img src="${dataUri(f)}" style="width:${w}px;height:${h}px"></div></div>`;
    }
    const h = H - 28;
    const w = Math.round((h * 1170) / 2532);
    return `<div class="phone"><img src="${dataUri(f)}" style="width:${w}px;height:${h}px"></div>`;
  }
  if (k === 'card') return card(scene, W, H);
  if (k === 'desk') {
    const f = capture(scene.img, 'desktop');
    const w = W - 20;
    const h = Math.min(H - 20, Math.round((w * 1800) / 2880));
    return `<div class="desk"><img src="${dataUri(f)}" style="width:${w}px;height:${Math.round((w * 1800) / 2880)}px;object-fit:cover;object-position:top;max-height:${h}px"></div>`;
  }
  const u = Math.min(W / 940, H / 960); // unit scale vs the 9:16 design
  const px = (n) => `${Math.round(n * u)}px`;
  if (k === 'big') return `<div class="big" style="width:${W}px"><div class="t" style="font-size:${px(scene.text.length > 18 ? 118 : 150)}">${esc(scene.text)}</div>${scene.sub ? `<div class="s" style="font-size:${px(44)}">${esc(scene.sub)}</div>` : ''}</div>`;
  if (k === 'list')
    return `<div class="list" style="gap:${px(22)}">${scene.items.map((t, i) => `<div class="li ${i === scene.active ? 'on' : i < scene.active ? 'done' : ''}" style="font-size:${px(40)};padding:${px(26)} ${px(30)}"><span class="n" style="width:${px(70)};height:${px(70)};font-size:${px(36)}">${i < scene.active ? '✓' : i + 1}</span>${esc(t)}</div>`).join('')}</div>`;
  if (k === 'chat')
    return `<div class="chat"><div class="top" style="padding:${px(28)} ${px(34)};font-size:${px(36)}"><span class="av" style="width:${px(72)};height:${px(72)};font-size:${px(32)}">C</span>${scene.msgs.some((m) => !m.me) ? 'Client — Riad Yasmine' : 'Client'}</div>
      <div class="msgs" style="padding:${px(40)} ${px(34)} ${px(60)}">${scene.msgs.map((m) => `<div class="bub ${m.me ? 'me' : 'them'}" style="font-size:${px(40)};padding:${px(26)} ${px(32)}">${esc(m.t)}<small style="font-size:${px(24)}">${m.me ? '14:02 ✓✓' : '18:47'}</small></div>`).join('')}</div></div>`;
  if (k === 'word')
    return `<div class="word"><div class="bar" style="padding:${px(18)} ${px(28)};font-size:${px(28)}">Facture_client_FINAL_v3 (2).docx</div>
      <div style="padding:${px(50)} ${px(56)};font-size:${px(34)};line-height:1.6">
      <div style="font-size:${px(62)};font-weight:700">FACTURE</div>
      <div>N° <s>12</s> 13 ?</div><div>Client : Riad Yasmine</div><div>ICE : <span style="background:#FEF08A">????</span></div>
      <div style="margin-top:${px(26)}">Site web ........ 12 000</div><div>Logo ........... 6 500</div><div>TVA ? ........... <span style="background:#FEF08A">à calculer</span></div>
      <div style="margin-top:${px(20)};font-weight:700">TOTAL : 18 500 (HT ou TTC ?)</div></div>
      <div class="x" style="right:${px(40)};top:${px(150)};font-size:${px(44)}">Numéro ?!</div>
      <div class="x" style="right:${px(70)};bottom:${px(80)};font-size:${px(40)}">Mentions ?</div></div>`;
  if (k === 'email')
    return `<div style="width:100%;display:flex;flex-direction:column;gap:${px(30)}">
      <div class="steps">${['J+1', 'J+7', 'J+15'].map((s) => `<span style="font-size:${px(40)};padding:${px(14)} ${px(34)}">${s}</span>`).join('')}</div>
      <div class="mail"><div class="h" style="padding:${px(28)} ${px(36)};font-size:${px(28)}"><div style="color:#64748B">De : Studio Atlas</div><div style="font-weight:700;font-size:${px(32)};margin-top:${px(8)}">Rappel : facture INV-2026-016 — Studio Atlas</div></div>
      <div style="padding:${px(32)} ${px(36)};font-size:${px(29)};line-height:1.5;color:#334155">Bonjour,<br><br>Sauf erreur de notre part, la facture INV-2026-016 de Studio Atlas, arrivée à échéance le 20 nov. 2026, n’est pas encore réglée. Reste à payer : 5 520,00 MAD. Vous pouvez la consulter et la régler en suivant le lien ci-dessous.<br><br><span class="btn" style="padding:${px(18)} ${px(30)}">Voir la facture</span></div></div></div>`;
  if (k === 'pack' || k === 'sheet') {
    const html = PACK[scene.view]();
    const nat = [900, /Tall$/.test(scene.view) ? 900 : /^(dashboard|pricing|budget|trackerDashboard|trackerTabs)$/.test(scene.view) ? 760 : 640];
    const z = Math.min(W / nat[0], H / nat[1]);
    return `<div style="zoom:${z.toFixed(3)}">${html}</div>`;
  }
  if (k === 'prices') {
    const rows = [['0 $', 'Gratuit', '3 documents / mois'], ['5 $', 'par mois', 'résiliable'], ['49 $', 'par an', '2 mois offerts', true], ['99 $', 'à vie', 'paiement unique']];
    return `<div class="prices" style="gap:${px(22)}">${rows.map(([p, l, n, hl]) => `<div class="pc ${hl ? 'hl' : ''}" style="padding:${px(40)} ${px(20)}"><div class="p" style="font-size:${px(96)}">${p}</div><div class="l" style="font-size:${px(36)}">${l}</div><div style="margin-top:${px(16)}">${hl ? `<span class="tag" style="font-size:${px(26)};padding:${px(8)} ${px(18)}">${n}</span>` : `<span class="l" style="font-size:${px(28)}">${n}</span>`}</div></div>`).join('')}</div>`;
  }
  if (k === 'end')
    return `<div class="end" style="gap:${px(40)}">${LOGO_SVG(Math.round(170 * u))}
      <div class="slog" style="font-size:${px(78)}">${scene.slogan ?? 'Facture. Encaisse. <em>Respire.</em>'}</div>
      <div class="cta" style="font-size:${px(44)};padding:${px(26)} ${px(46)}">${esc(scene.cta)}</div>
      <div class="url" style="font-size:${px(52)}">${esc(scene.url ?? 'margokit.com')}</div>
      <div class="vit" style="font-size:${px(26)}">Margokit · un produit VIT GLOBAL</div></div>`;
  throw new Error(`scene ${k}?`);
}

function card(scene, W, H) {
  const f = capture(scene.img, 'mobile-full') ?? capture(scene.img, 'mobile');
  const { y = 0, h = 1200 } = scene;
  const scale = Math.min(W / 1170, H / h);
  const w = Math.round(1170 * scale);
  return `<div class="card" style="width:${w}px;height:${Math.round(h * scale)}px"><img src="${dataUri(f)}" style="width:${w}px;margin-top:-${Math.round(y * scale)}px"></div>`;
}

function sceneHtml(seg, fmt) {
  const [w, h] = FORMATS[fmt];
  const l = L[fmt];
  const [bx, by, bs] = l.brand;
  const [hx, hy, hw, hh, hs] = l.head;
  const [vx, vy, vw, vh] = l.vis;
  const end = seg.scene.k === 'end';
  const visBox = end ? [vx, fmt === '9x16' ? 300 : vy - 40, vw, fmt === '9x16' ? 1150 : vh + 80] : l.vis;
  const headHtml = !end && seg.head ? `<div class="head" style="left:${hx}px;top:${hy}px;width:${hw}px;height:${hh}px;font-size:${hs}px;display:flex;align-items:${fmt === '16x9' ? 'center' : 'flex-end'}">${esc(seg.head)}</div>` : '';
  return page({
    w,
    h,
    css: CSS,
    bg: BRAND.ink,
    body: `<div class="brand" style="left:${bx}px;top:${by}px">${LOGO_SVG(bs)}<b style="font-size:${Math.round(bs * 0.72)}px">Margokit</b><small style="font-size:${Math.round(bs * 0.48)}px">par VIT GLOBAL</small></div>
${headHtml}
<div class="vis" style="left:${visBox[0]}px;top:${visBox[1]}px;width:${visBox[2]}px;height:${visBox[3]}px">${visual(seg.scene, fmt, visBox)}</div>`,
  });
}

/** Subtitle chunks: ≤ max chars, cut on punctuation first, timed by length. */
function chunks(text, max) {
  const words = subText(text).split(/\s+/);
  const out = [];
  let cur = '';
  for (const w of words) {
    if (cur && (cur + ' ' + w).length > max) {
      out.push(cur);
      cur = w;
    } else cur = cur ? `${cur} ${w}` : w;
    if (/[.?!:]$/.test(w) && cur.length > max * 0.45) {
      out.push(cur);
      cur = '';
    }
  }
  if (cur) out.push(cur);
  return out;
}
function subHtml(text, fmt) {
  const [w, h] = FORMATS[fmt];
  const [sx, sy, sw, sh, fs] = L[fmt].sub;
  return `<!doctype html><html><head><meta charset="utf-8"><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&display=block" rel="stylesheet">
<style>*{margin:0;box-sizing:border-box}html,body{width:${w}px;height:${h}px;background:transparent;overflow:hidden}
.s{position:absolute;left:${sx}px;top:${sy}px;width:${sw}px;height:${sh}px;display:flex;align-items:center;justify-content:center}
.s span{font-family:'Plus Jakarta Sans';font-weight:800;font-size:${fs}px;line-height:1.2;color:#fff;background:rgba(15,23,42,.88);padding:14px 26px;border-radius:18px;text-align:center;box-shadow:0 10px 40px rgba(0,0,0,.4);text-wrap:balance}
</style></head><body><div class="s"><span>${esc(text)}</span></div></body></html>`;
}

const browserApp = await chromium.launch();
async function shot(html, file, [w, h], scale = 1, transparent = false) {
  const p = await browserApp.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: scale });
  await p.setContent(html, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: file, omitBackground: transparent });
  await p.close();
}

// ---------------------------------------------------------------------------
// 3. Assembly
// ---------------------------------------------------------------------------
for (const v of videos) {
  for (const fmt of v.formats) {
    const [W, H] = FORMATS[fmt];
    const dir = join(WORK, v.id, fmt);
    mkdirSync(dir, { recursive: true });
    mkdirSync(join(OUT, fmt), { recursive: true });
    const inputs = [];
    const filters = [];
    const overlays = [];
    let t = 0;
    v.segments.forEach((s, i) => {
      const last = i === v.segments.length - 1;
      s.len = s.dur + (last ? 1.2 : PAUSE);
      s.start = t;
      t += s.len;
    });
    // Scene images (rendered at 2x for a smooth zoom)
    for (const [i, s] of v.segments.entries()) {
      const f = join(dir, `scene-${i}.png`);
      await shot(sceneHtml(s, fmt), f, [W, H], 2);
      inputs.push('-i', f);
      const frames = Math.round(s.len * FPS);
      filters.push(`[${i}:v]zoompan=z='1+0.035*on/${frames}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=${frames}:s=${W}x${H}:fps=${FPS},setsar=1[s${i}]`);
    }
    filters.push(`${v.segments.map((_, i) => `[s${i}]`).join('')}concat=n=${v.segments.length}:v=1:a=0[base]`);
    // Subtitles
    let n = v.segments.length;
    const maxChars = fmt === '16x9' ? 60 : fmt === '1x1' ? 40 : 34;
    for (const [i, s] of v.segments.entries()) {
      const parts = chunks(s.vo, maxChars);
      const total = parts.reduce((a, p) => a + p.length, 0);
      let st = s.start;
      for (const [j, p] of parts.entries()) {
        const d = (s.dur * p.length) / total;
        const f = join(dir, `sub-${i}-${j}.png`);
        await shot(subHtml(p, fmt), f, [W, H], 1, true);
        inputs.push('-i', f);
        overlays.push({ idx: n++, a: st, b: st + d + (j === parts.length - 1 ? PAUSE * 0.8 : 0) });
        st += d;
      }
    }
    let prev = 'base';
    overlays.forEach((o, k) => {
      const outLabel = k === overlays.length - 1 ? 'vout' : `o${k}`;
      filters.push(`[${prev}][${o.idx}:v]overlay=0:0:enable='between(t,${o.a.toFixed(3)},${o.b.toFixed(3)})'[${outLabel}]`);
      prev = outLabel;
    });
    if (!overlays.length) filters.push('[base]null[vout]');
    // Voice: each sentence padded to its scene length
    const aBase = n;
    for (const s of v.segments) inputs.push('-i', s.wav);
    v.segments.forEach((s, i) => filters.push(`[${aBase + i}:a]aresample=48000,apad=whole_dur=${s.len.toFixed(3)}[a${i}]`));
    filters.push(`${v.segments.map((_, i) => `[a${i}]`).join('')}concat=n=${v.segments.length}:v=0:a=1,loudnorm=I=-15:TP=-1.5:LRA=7[aout]`);
    const script = join(dir, 'filter.txt');
    writeFileSync(script, filters.join(';\n'));
    const out = join(OUT, fmt, `${v.id}.mp4`);
    run('ffmpeg', ['-y', '-loglevel', 'error', ...inputs, '-/filter_complex', script, '-map', '[vout]', '-map', '[aout]', '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-r', String(FPS), '-c:a', 'aac', '-b:a', '160k', '-movflags', '+faststart', out]);
    run('ffmpeg', ['-y', '-loglevel', 'error', '-ss', '1.5', '-i', out, '-frames:v', '1', '-q:v', '3', out.replace(/\.mp4$/, '.jpg')]);
    console.log(`✓ ${fmt}/${v.id}.mp4  ${t.toFixed(1)} s`);
  }
}
await browserApp.close();
