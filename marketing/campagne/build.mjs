/**
 * Génère, à partir de posts.mjs :
 *   instagram.md · facebook.md · tiktok.md · linkedin.md · calendrier.md   (textes prêts à copier)
 *   visuels/car-*.pdf, visuels/presentation-margokit.pdf                  (carrousels LinkedIn, présentation)
 *   apercu.html                                                           (aperçu visuel de toute la campagne)
 *
 *   node marketing/campagne/build.mjs          # tout
 *   node marketing/campagne/build.mjs --no-pdf # sans refaire les PDF
 *
 * Les PNG viennent de `node marketing/visuals/render.mjs --no-shots car-` (et story-, deck-).
 * Les vidéos prêtes sont copiées depuis ~/Desktop/Margokit-Videos dans videos/ (ignoré par git).
 */
import { writeFileSync, readdirSync, readFileSync, existsSync, mkdirSync, copyFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { CAMPAIGN, WEEKS, NETWORKS, POSTS, STORIES, FB_GROUPS, ADS } from './posts.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const VIS = join(HERE, 'visuels');
const noPdf = process.argv.includes('--no-pdf');

const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];
const day = (iso) => { const d = new Date(`${iso}T12:00:00Z`); return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`; };
const cap = (s) => s[0].toUpperCase() + s.slice(1);
const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

// ---------------------------------------------------------------------------
// Videos (ready ones) → videos/
// ---------------------------------------------------------------------------
const VID_SRC = join(homedir(), 'Desktop', 'Margokit-Videos');
const VID_DIR = join(HERE, 'videos');
mkdirSync(VID_DIR, { recursive: true });
for (const f of ['01-calculateur-5-65-FR.mp4', '01-calculateur-5-65-FR.jpg', '02-les-3-kits-FR.mp4', '02-les-3-kits-FR.jpg']) {
  if (existsSync(join(VID_SRC, f)) && !existsSync(join(VID_DIR, f))) copyFileSync(join(VID_SRC, f), join(VID_DIR, f));
}
// Vidéos produites par marketing/visuals/videos-campagne.mjs
const VID_MADE = join(HERE, 'videos-campagne');
if (existsSync(VID_MADE)) for (const f of readdirSync(VID_MADE)) copyFileSync(join(VID_MADE, f), join(VID_DIR, f));

// ---------------------------------------------------------------------------
// Markdown per network
// ---------------------------------------------------------------------------
const visualLine = (v) => v.map((x) => x.startsWith('video:') ? `🎬 ${x.slice(6)}` : x.startsWith('pdf:') ? `📄 visuels/${x.slice(4)}` : `visuels/${x}`);

function postMd(p, i) {
  const out = [`### ${i}. ${cap(day(p.date))} · ${p.time} · ${p.format}${p.status === 'à tourner' ? ' · 🎥 à tourner' : ''}`, `**${p.title}**`, ''];
  if (p.note) out.push(`> ⚠️ ${p.note}`, '');
  if (p.visuals?.length) out.push(`**Visuels** : ${visualLine(p.visuals).map((x) => `\`${x}\``).join(' · ')}`, '');
  if (p.hook) out.push(`**Accroche écrite (0–3 s)** : ${p.hook}`, '');
  if (p.screen) out.push(`**À l’écran** : ${p.screen}`, '');
  if (p.script) out.push(`**Voix off** : ${p.script}`, '');
  out.push('**Texte à publier**', '', '```text', p.caption + (p.hashtags ? `\n\n${p.hashtags}` : ''), '```', '');
  if (p.firstComment) out.push('**1er commentaire (épinglé)**', '', '```text', p.firstComment, '```', '');
  return out.join('\n');
}

function networkMd(key) {
  const N = NETWORKS[key];
  const posts = POSTS[key];
  const md = [`# ${N.label} — campagne « ${CAMPAIGN.name} »`, '',
    `> Fichier généré par \`build.mjs\` à partir de \`posts.mjs\` : modifie \`posts.mjs\`, puis relance \`node marketing/campagne/build.mjs\`.`, '',
    `**Compte** : ${N.handle} · **Rythme** : ${N.rhythm} · **Heures** : heure du Maroc (GMT+1).`, '',
    '## Profil', '', '```text', N.bio, '```', '', `**Lien du profil** : ${N.link}`, ''];
  for (const W of WEEKS) {
    md.push(`## Semaine ${W.n} · ${W.dates} — ${W.theme}`, '', `_${W.goal}_`, '');
    posts.filter((p) => p.week === W.n).forEach((p, i) => md.push(postMd(p, i + 1)));
    if (key === 'instagram') {
      const S = STORIES.find((s) => s.week === W.n);
      if (S) md.push('#### Stories de la semaine (Instagram et Facebook)', '', ...S.items.map((x) => `- ${x}`), '');
    }
    if (key === 'facebook') {
      const G = FB_GROUPS.posts.find((g) => g.week === W.n);
      if (G) md.push(`#### Post de valeur dans les groupes : ${G.title}`, '', '```text', G.text, '```', '');
    }
  }
  if (key === 'facebook') {
    md.push('## Groupes Facebook : mode d’emploi', '', FB_GROUPS.intro, '', '**Où chercher** (barre de recherche Facebook → Groupes) :', '', ...FB_GROUPS.where.map((x) => `- ${x}`), '',
      '## Petit test publicitaire (semaine 3)', '', `**Budget** : ${ADS.budget}`, '', ...ADS.rules.map((x) => `- ${x}`), '');
  }
  if (key === 'tiktok') {
    md.push('## Rappels de tournage', '',
      '- Format : écran du téléphone + ta voix, sans visage, 15–30 s, 1080 × 1920. Méthode complète : `marketing/content/tournage-semaine-1.md`.',
      '- Les 3 premières secondes : l’accroche dite ET écrite en gros.',
      '- Sous-titres automatiques CapCut, chiffres corrigés à la main.',
      '- Carrousel photo : TikTok → + → Photo → sélectionne les PNG dans l’ordre → ajoute un son tendance à faible volume.',
      '- Tourne 5 vidéos d’un coup le dimanche (1 h) : c’est le seul moyen de tenir 5 publications par semaine.',
      '- Les Reels Instagram et vidéos Facebook réutilisent les mêmes fichiers.', '');
  }
  writeFileSync(join(HERE, `${key}.md`), md.join('\n'));
}

function calendarMd() {
  const all = Object.entries(POSTS).flatMap(([k, ps]) => ps.map((p) => ({ ...p, net: NETWORKS[k].label })));
  all.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const md = [`# Calendrier — « ${CAMPAIGN.name} »`, '', `Du ${day(CAMPAIGN.start)} au ${day(CAMPAIGN.end)} 2026 · ${all.length} publications · heure du Maroc.`, '',
    `> Généré par \`build.mjs\`. ✅ = prêt à publier.`, ''];
  for (const W of WEEKS) {
    md.push(`## Semaine ${W.n} · ${W.dates} — ${W.theme}`, '', '| Jour | Heure | Réseau | Format | Sujet | Statut |', '|---|---|---|---|---|---|');
    all.filter((p) => p.week === W.n).forEach((p) => md.push(`| ${cap(day(p.date))} | ${p.time} | ${p.net} | ${p.format} | ${p.title} | ${p.status === 'à tourner' ? '🎥' : '✅'} |`));
    md.push('');
  }
  const vids = [...new Set(all.map((p) => p.visuals?.[0]).filter((v) => v?.startsWith('video:')).map((v) => v.slice(6)))];
  md.push('## Vidéos', '', `${vids.length} vidéos prêtes (une vidéo sert sur TikTok, Reels et Facebook). Format 1080 × 1920 sans voix : ajoute un son tendance au moment de publier.`, '',
    ...vids.map((v) => `- ${v}`), '');
  writeFileSync(join(HERE, 'calendrier.md'), md.join('\n'));
}

for (const k of Object.keys(POSTS)) networkMd(k);
calendarMd();

// ---------------------------------------------------------------------------
// PDFs (LinkedIn documents + presentation)
// ---------------------------------------------------------------------------
if (!noPdf) {
  const { chromium } = await import(join(ROOT, 'app', 'node_modules', 'playwright', 'index.mjs'));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const pngs = readdirSync(VIS).filter((f) => f.endsWith('.png')).sort();
  const groups = {
    ...Object.fromEntries([...new Set(pngs.filter((f) => f.startsWith('car-')).map((f) => f.replace(/-\d+\.png$/, '')))].map((g) => [g, { w: 1080, h: 1350 }])),
    'presentation-margokit': { w: 1920, h: 1080, prefix: 'deck-' },
  };
  for (const [name, { w, h, prefix }] of Object.entries(groups)) {
    const files = pngs.filter((f) => (prefix ? f.startsWith(prefix) : f.startsWith(`${name}-`)))
      .sort((a, b) => Number(a.match(/(\d+)\.png$/)[1]) - Number(b.match(/(\d+)\.png$/)[1]));
    const html = `<html><head><style>@page{size:${w}px ${h}px;margin:0}body{margin:0}img{display:block;width:${w}px;height:${h}px;page-break-after:always}</style></head><body>${files.map((f) => `<img src="data:image/png;base64,${readFileSync(join(VIS, f)).toString('base64')}">`).join('')}</body></html>`;
    await page.setContent(html, { waitUntil: 'load' });
    await page.pdf({ path: join(VIS, `${name}.pdf`), width: `${w}px`, height: `${h}px`, printBackground: true });
    console.log(`✓ ${name}.pdf (${files.length} pages)`);
  }
  await browser.close();
}

// ---------------------------------------------------------------------------
// apercu.html
// ---------------------------------------------------------------------------
const NET_ORDER = ['instagram', 'facebook', 'tiktok', 'linkedin'];
const all = NET_ORDER.flatMap((k) => POSTS[k].map((p) => ({ ...p, net: k })));
all.sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) || NET_ORDER.indexOf(a.net) - NET_ORDER.indexOf(b.net));
const VIDEO_FILES = Object.fromEntries(readdirSync(VID_DIR).filter((f) => f.endsWith('.mp4')).map((f) => [f, `videos/${f.replace(/\.mp4$/, '')}`]));
const isTall = (f) => f.startsWith('story-');
const isWide = (f) => f.startsWith('deck-');

function media(p) {
  const v = p.visuals ?? [];
  const vid = v.find((x) => x.startsWith('video:'));
  if (vid) {
    const f = vid.slice(6);
    if (VIDEO_FILES[f]) return `<div class="media tall"><video controls preload="none" playsinline poster="${VIDEO_FILES[f]}.jpg" src="${VIDEO_FILES[f]}.mp4"></video></div>`;
    return `<div class="media tall script"><div class="shoot"><span class="chip warn">Vidéo à tourner</span><p class="hook">${esc(p.hook ?? '')}</p>${p.screen ? `<p><b>À l’écran</b> ${esc(p.screen)}</p>` : ''}${p.script ? `<p><b>Voix off</b> ${esc(p.script)}</p>` : ''}<p class="src">${esc(f)}</p></div></div>`;
  }
  const imgs = v.filter((x) => x.endsWith('.png'));
  if (!imgs.length) return `<div class="media textonly"><p>Post texte seul</p></div>`;
  const pdf = v.find((x) => x.startsWith('pdf:'));
  const cls = isWide(imgs[0]) ? 'wide' : isTall(imgs[0]) ? 'tall' : 'portrait';
  return `<div class="media ${cls}"><div class="strip" tabindex="0" aria-label="Visuels, faire défiler">${imgs.map((f, i) => `<img loading="lazy" src="visuels/${f}" alt="${esc(p.title)}, image ${i + 1} sur ${imgs.length}">`).join('')}</div>${imgs.length > 1 ? `<span class="count">${imgs.length} images${pdf ? ' · PDF' : ''}</span>` : ''}</div>`;
}

function card(p) {
  const N = NETWORKS[p.net];
  const text = p.caption + (p.hashtags ? `\n\n${p.hashtags}` : '');
  return `<article class="post" data-net="${p.net}" data-week="${p.week}">
  <header><span class="net net-${p.net}">${N.label}</span><span class="when">${cap(day(p.date))} · ${p.time}</span></header>
  ${media(p)}
  <div class="body">
    <div class="meta"><span class="fmt">${esc(p.format)}</span>${p.status === 'à tourner' ? '<span class="chip warn">À tourner</span>' : '<span class="chip ok">Prêt</span>'}</div>
    <h3>${esc(p.title)}</h3>
    ${p.note ? `<p class="note">${esc(p.note)}</p>` : ''}
    <p class="caption">${esc(text)}</p>
    <button type="button" class="copy" data-copy="${esc(text)}">Copier le texte</button>
    ${p.firstComment ? `<details><summary>1er commentaire</summary><p class="caption small">${esc(p.firstComment)}</p><button type="button" class="copy" data-copy="${esc(p.firstComment)}">Copier le commentaire</button></details>` : ''}
  </div></article>`;
}

const counts = Object.fromEntries(NET_ORDER.map((k) => [k, POSTS[k].length]));
const toShoot = all.filter((p) => p.status === 'à tourner').length;
const videoCount = new Set(all.map((p) => p.visuals?.[0]).filter((v) => v?.startsWith('video:'))).size;
const deck = readdirSync(VIS).filter((f) => f.startsWith('deck-') && f.endsWith('.png')).sort();
const stories = readdirSync(VIS).filter((f) => f.startsWith('story-') && f.endsWith('.png')).sort();

const html = `<title>Campagne Ce que tu gardes</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@700;800&display=swap" rel="stylesheet">
<style>
/* Margokit brand: lime on ink, slate neutrals. Layout: sticky filter bar, then a week-by-week feed of post cards. */
:root{
  --bg:#F8FAFC; --surface:#FFFFFF; --ink:#0F172A; --muted:#64748B; --line:#E2E8F0;
  --lime:#A3E635; --lime-ink:#4D7C0F; --lime-soft:#F7FEE7; --warn:#B45309; --warn-soft:#FEF3C7;
  --ig:#C13584; --fb:#1877F2; --tt:#0F172A; --li:#0A66C2;
  --display:'Plus Jakarta Sans',Inter,system-ui,sans-serif; --body:Inter,system-ui,-apple-system,sans-serif;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){
  --bg:#0B1120; --surface:#111A2E; --ink:#E2E8F0; --muted:#94A3B8; --line:#1E293B;
  --lime-ink:#A3E635; --lime-soft:#1A2E05; --warn:#FBBF24; --warn-soft:#3B2A06; --tt:#E2E8F0; --ig:#E879B9; --fb:#60A5FA; --li:#38BDF8; color-scheme:dark}}
:root[data-theme="dark"]{
  --bg:#0B1120; --surface:#111A2E; --ink:#E2E8F0; --muted:#94A3B8; --line:#1E293B;
  --lime-ink:#A3E635; --lime-soft:#1A2E05; --warn:#FBBF24; --warn-soft:#3B2A06; --tt:#E2E8F0; --ig:#E879B9; --fb:#60A5FA; --li:#38BDF8; color-scheme:dark}
*{box-sizing:border-box}
body{background:var(--bg);color:var(--ink);font-family:var(--body);font-size:15px;line-height:1.5;-webkit-font-smoothing:antialiased}
.wrap{max-width:1240px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px))}
h1,h2,h3{font-family:var(--display);letter-spacing:-.02em;text-wrap:balance;margin:0}
.hero{padding-block:40px 28px;display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);gap:32px;align-items:end}
.brand{display:flex;align-items:center;gap:10px;font-family:var(--display);font-weight:800;font-size:18px}
.brand svg{width:32px;height:32px}
.hero h1{font-size:clamp(32px,5vw,54px);line-height:1.04;margin-top:18px}
.hero h1 em{font-style:normal;background:var(--lime);color:#0F172A;padding:0 .12em;border-radius:6px;box-decoration-break:clone;-webkit-box-decoration-break:clone}
.hero p{color:var(--muted);max-width:60ch;margin:14px 0 0}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:1px;background:var(--line);border:1px solid var(--line);border-radius:14px;overflow:hidden}
.stats div{background:var(--surface);padding:14px 16px}
.stats b{display:block;font-family:var(--display);font-size:28px;font-variant-numeric:tabular-nums}
.stats span{color:var(--muted);font-size:13px}
body::before{content:"";position:fixed;inset:0 0 auto;height:env(safe-area-inset-top,0px);z-index:10;background:var(--bg)}
.bar{position:sticky;top:env(safe-area-inset-top,0px);z-index:5;background:color-mix(in srgb,var(--bg) 92%,transparent);backdrop-filter:blur(8px);border-bottom:1px solid var(--line)}
.bar .wrap{display:flex;flex-wrap:wrap;gap:8px;padding-block:12px;align-items:center}
.bar .lbl{font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--muted);margin-right:4px}
.f{appearance:none;border:1px solid var(--line);background:var(--surface);color:var(--ink);font:600 13px var(--body);padding:7px 12px;border-radius:999px;cursor:pointer}
.f[aria-pressed="true"]{background:var(--ink);color:var(--bg);border-color:var(--ink)}
.f:focus-visible,.copy:focus-visible,.strip:focus-visible,summary:focus-visible,.tab:focus-visible{outline:2px solid var(--lime);outline-offset:2px}
.sep{width:1px;height:22px;background:var(--line);margin:0 6px}
.tabs{display:flex;gap:4px;padding-block:20px 4px;flex-wrap:wrap}
.tab{appearance:none;border:0;background:none;color:var(--muted);font:700 15px var(--display);padding:8px 14px;border-radius:10px;cursor:pointer}
.tab[aria-selected="true"]{background:var(--lime);color:#0F172A}
section.week{padding-block:26px 8px}
.wk{display:flex;flex-wrap:wrap;align-items:baseline;gap:6px 16px;margin-bottom:16px}
.wk h2{font-size:24px}
.wk .d{font-weight:700;color:var(--lime-ink);font-variant-numeric:tabular-nums}
.wk p{flex-basis:100%;margin:0;color:var(--muted);max-width:75ch}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:18px;align-items:start}
.post{background:var(--surface);border:1px solid var(--line);border-radius:16px;overflow:hidden;display:flex;flex-direction:column;min-width:0}
.post>header{display:flex;justify-content:space-between;align-items:center;padding:10px 14px;gap:8px}
.net{font-weight:700;font-size:13px;display:inline-flex;align-items:center;gap:6px}
.net::before{content:"";width:9px;height:9px;border-radius:50%;background:currentColor}
.net-instagram{color:var(--ig)}.net-facebook{color:var(--fb)}.net-tiktok{color:var(--tt)}.net-linkedin{color:var(--li)}
.when{font-size:12px;color:var(--muted);font-variant-numeric:tabular-nums}
.media{position:relative;background:var(--line)}
.media.portrait{aspect-ratio:4/5}.media.tall{aspect-ratio:9/16;max-height:520px}.media.wide{aspect-ratio:16/9}
.media.textonly{aspect-ratio:auto;padding:22px 14px;color:var(--muted);text-align:center}
.strip{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;height:100%;scrollbar-width:thin}
.strip img{flex:0 0 100%;width:100%;height:100%;object-fit:contain;scroll-snap-align:start;display:block}
.media video{width:100%;height:100%;object-fit:cover;display:block;background:#000}
.count{position:absolute;right:10px;top:10px;background:rgba(15,23,42,.78);color:#fff;font-size:12px;font-weight:600;padding:3px 9px;border-radius:999px;pointer-events:none}
.media.script{background:var(--warn-soft);overflow:auto}
.shoot{padding:16px;display:flex;flex-direction:column;gap:10px;font-size:13.5px}
.shoot p{margin:0}.shoot .hook{font-family:var(--display);font-weight:800;font-size:20px;line-height:1.2}
.shoot .src{color:var(--muted);font-size:12px}
.body{padding:14px;display:flex;flex-direction:column;gap:10px;min-width:0}
.meta{display:flex;justify-content:space-between;align-items:center;gap:8px}
.fmt{font-size:12px;font-weight:600;color:var(--muted);text-transform:uppercase;letter-spacing:.05em}
.chip{font-size:12px;font-weight:700;padding:2px 9px;border-radius:999px;align-self:flex-start}
.chip.ok{background:var(--lime-soft);color:var(--lime-ink)}.chip.warn{background:var(--warn-soft);color:var(--warn)}
.post h3{font-size:17px;line-height:1.25}
.note{margin:0;font-size:13px;background:var(--warn-soft);color:var(--warn);padding:8px 10px;border-radius:8px}
.caption{white-space:pre-wrap;overflow-wrap:anywhere;margin:0;font-size:14px;max-height:240px;overflow:auto;padding-right:4px}
.caption.small{font-size:13px;color:var(--muted);max-height:none}
.copy{appearance:none;align-self:flex-start;border:1px solid var(--line);background:var(--bg);color:var(--ink);font:600 13px var(--body);padding:7px 12px;border-radius:8px;cursor:pointer}
.copy.done{background:var(--lime);color:#0F172A;border-color:var(--lime)}
details summary{cursor:pointer;font-weight:600;font-size:13px;color:var(--muted)}
details[open]{display:flex;flex-direction:column;gap:8px}
.panel[hidden]{display:none}
.deck{display:grid;grid-template-columns:repeat(auto-fill,minmax(360px,1fr));gap:16px;padding-block:20px 40px}
.deck img{width:100%;border-radius:12px;border:1px solid var(--line);display:block}
.deck figure{margin:0}.deck figcaption{font-size:13px;color:var(--muted);margin-top:6px}
.storyrow{display:grid;grid-template-columns:repeat(auto-fill,minmax(180px,1fr));gap:16px;padding-block:10px 40px}
.storyrow img{width:100%;border-radius:12px;border:1px solid var(--line);display:block}
.empty{color:var(--muted);padding:30px 0}
footer{padding-block:30px 50px;color:var(--muted);font-size:13px;border-top:1px solid var(--line);margin-top:30px}
@media (max-width:760px){.hero{grid-template-columns:1fr}.deck{grid-template-columns:1fr}.bar{position:static}}
@media (prefers-reduced-motion:reduce){*{scroll-behavior:auto!important}}
</style>

<div class="wrap">
  <div class="hero">
    <div>
      <div class="brand"><svg viewBox="0 0 64 64" aria-hidden="true"><rect width="64" height="64" rx="14" fill="#A3E635"/><path d="M16 46V18h7l9 14 9-14h7v28h-7V30l-9 13-9-13v16z" fill="#0F172A"/></svg>Margokit</div>
      <h1>Campagne « <em>Ce que tu gardes vraiment</em> »</h1>
      <p>Aperçu de toutes les publications avant mise en ligne, du ${day(CAMPAIGN.start)} au ${day(CAMPAIGN.end)} 2026, sur Instagram, Facebook, TikTok et LinkedIn. Chaque carte montre les visuels (fais défiler les carrousels), le texte prêt à copier et le statut.</p>
    </div>
    <div class="stats" role="list">
      <div role="listitem"><b>${all.length}</b><span>publications</span></div>
      <div role="listitem"><b>${all.length - all.filter((p) => p.status === 'à tourner').length}</b><span>prêtes</span></div>
      <div role="listitem"><b>${videoCount}</b><span>vidéos</span></div>
    </div>
  </div>
</div>

<div class="bar"><div class="wrap">
  <span class="lbl">Réseau</span>
  <button type="button" class="f" data-net="all" aria-pressed="true">Tous · ${all.length}</button>
  ${NET_ORDER.map((k) => `<button type="button" class="f" data-net="${k}" aria-pressed="false">${NETWORKS[k].label} · ${counts[k]}</button>`).join('')}
  <span class="sep" aria-hidden="true"></span>
  <span class="lbl">Statut</span>
  <button type="button" class="f" data-status="all" aria-pressed="true">Tous</button>
  <button type="button" class="f" data-status="video" aria-pressed="false">Vidéos</button>
</div></div>

<div class="wrap">
  <div class="tabs" role="tablist">
    <button type="button" class="tab" role="tab" id="t-cal" aria-controls="p-cal" aria-selected="true">Calendrier</button>
    <button type="button" class="tab" role="tab" id="t-deck" aria-controls="p-deck" aria-selected="false">Présentation du projet</button>
    <button type="button" class="tab" role="tab" id="t-story" aria-controls="p-story" aria-selected="false">Stories</button>
  </div>

  <div class="panel" id="p-cal" role="tabpanel" aria-labelledby="t-cal">
    ${WEEKS.map((W) => `<section class="week" data-week="${W.n}">
      <div class="wk"><h2>Semaine ${W.n} · ${esc(W.theme)}</h2><span class="d">${W.dates}</span><p>${esc(W.goal)}</p></div>
      <div class="grid">${all.filter((p) => p.week === W.n).map(card).join('')}</div>
      <p class="empty" hidden>Aucune publication pour ce filtre cette semaine.</p>
    </section>`).join('')}
  </div>

  <div class="panel" id="p-deck" role="tabpanel" aria-labelledby="t-deck" hidden>
    <div class="deck">${deck.map((f, i) => `<figure><img loading="lazy" src="visuels/${f}" alt="Présentation Margokit, slide ${i + 1}"><figcaption>Slide ${i + 1}</figcaption></figure>`).join('')}</div>
  </div>

  <div class="panel" id="p-story" role="tabpanel" aria-labelledby="t-story" hidden>
    <p class="empty" style="padding-bottom:0">Laisse l’espace libre sous le texte pour poser le sticker (sondage ou lien) dans Instagram ou Facebook.</p>
    <div class="storyrow">${stories.map((f) => `<img loading="lazy" src="visuels/${f}" alt="Story ${esc(f.replace('story-', '').replace('.png', ''))}">`).join('')}</div>
  </div>

  <footer>Sources : marketing/campagne/ dans le dépôt. Textes complets et liens suivis (UTM) dans instagram.md, facebook.md, tiktok.md et linkedin.md. Chiffres issus des formules du calculateur Margokit.</footer>
</div>

<script>
(function(){
  var state={net:'all',status:'all'};
  function apply(){
    document.querySelectorAll('.post').forEach(function(el){
      var okNet=state.net==='all'||el.dataset.net===state.net;
      var okSt=state.status==='all'||el.querySelector('video');
      el.hidden=!(okNet&&okSt);
    });
    document.querySelectorAll('section.week').forEach(function(s){
      var any=[].some.call(s.querySelectorAll('.post'),function(p){return !p.hidden});
      s.querySelector('.empty').hidden=any;
    });
  }
  document.querySelectorAll('.f').forEach(function(b){
    b.addEventListener('click',function(){
      var key=b.dataset.net?'net':'status';
      state[key]=b.dataset[key];
      document.querySelectorAll('.f[data-'+key+']').forEach(function(x){x.setAttribute('aria-pressed',String(x===b))});
      apply();
    });
  });
  document.querySelectorAll('.tab').forEach(function(t){
    t.addEventListener('click',function(){
      document.querySelectorAll('.tab').forEach(function(x){
        var on=x===t; x.setAttribute('aria-selected',String(on));
        document.getElementById(x.getAttribute('aria-controls')).hidden=!on;
      });
    });
  });
  document.querySelectorAll('.copy').forEach(function(b){
    b.addEventListener('click',function(){
      var txt=b.dataset.copy, label=b.textContent;
      function done(){b.textContent='Copié';b.classList.add('done');setTimeout(function(){b.textContent=label;b.classList.remove('done')},1600)}
      function fallback(){var p=b.previousElementSibling;if(!p)return;var r=document.createRange();r.selectNodeContents(p);var s=getSelection();s.removeAllRanges();s.addRange(r);b.textContent='Texte sélectionné, fais Copier'}
      try{navigator.clipboard.writeText(txt).then(done,fallback)}catch(e){fallback()}
    });
  });
})();
</script>
`;
writeFileSync(join(HERE, 'apercu.html'), html);
// Local version: full document so it opens directly in a browser (double-click).
writeFileSync(join(HERE, 'OUVRIR-apercu-local.html'), `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">${html.replace('<div class="wrap">', '</head><body><div class="wrap">')}</body></html>`);
console.log(`✓ apercu.html · ${all.length} publications · markdown x5`);
