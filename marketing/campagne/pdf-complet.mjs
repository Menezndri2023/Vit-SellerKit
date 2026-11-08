/**
 * Génère CAMPAGNE-COMPLETE.pdf : les 52 publications dans l'ordre du calendrier, avec miniatures des visuels,
 * texte complet, 1er commentaire et scripts vidéo. Utilisé par export-mac.mjs et export-campagne.mjs.
 */
import { writeFileSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { CAMPAIGN, WEEKS, NETWORKS, POSTS } from './posts.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const MK = join(HERE, '..');
const VIS = join(HERE, 'visuels');
const VIDS = join(homedir(), 'Desktop', 'Margokit-Videos');
const VIDEO_READY = { '01-calculateur-5-65-FR.mp4': true, '02-les-3-kits-FR.mp4': true };
const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
export const day = (iso) => { const d = new Date(`${iso}T12:00:00Z`); return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };

export async function makeCompletePdf(pdfPath) {
  const DEST = dirname(pdfPath);

  const esc = (t) => String(t ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const ORDER = ['instagram', 'facebook', 'tiktok', 'linkedin'];
  const COLOR = { instagram: '#C13584', facebook: '#1877F2', tiktok: '#0F172A', linkedin: '#0A66C2' };
  const all = ORDER.flatMap((k) => POSTS[k].map((p) => ({ ...p, net: k }))).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time) || ORDER.indexOf(a.net) - ORDER.indexOf(b.net));
  const img = (f) => `<img src="file://${join(VIS, f)}">`;
  const card = (p) => {
    const N = NETWORKS[p.net];
    const imgs = (p.visuals ?? []).filter((v) => v.endsWith('.png'));
    const vid = (p.visuals ?? []).find((v) => v.startsWith('video:'));
    const poster = vid && VIDEO_READY[vid.slice(6)] ? join(VIDS, vid.slice(6).replace('.mp4', '.jpg')) : null;
    return `<section class="post">
      <div class="head"><span class="net" style="background:${COLOR[p.net]}">${N.label}</span><b>${esc(day(p.date))} · ${p.time}</b><span>${esc(p.format)}</span>${p.status === 'à tourner' ? '<span class="shoot">Vidéo à tourner</span>' : '<span class="ok">Prêt</span>'}</div>
      <h3>${esc(p.title)}</h3>
      ${p.note ? `<p class="note">⚠️ ${esc(p.note)}</p>` : ''}
      ${imgs.length ? `<div class="imgs ${imgs[0].startsWith('deck-') ? 'wide' : ''}">${imgs.map(img).join('')}</div>` : ''}
      ${poster && existsSync(poster) ? `<div class="imgs"><img src="file://${poster}"><span class="vlabel">Vidéo prête : ${esc(vid.slice(6))}</span></div>` : ''}
      ${p.hook ? `<p class="script"><b>Accroche écrite :</b> ${esc(p.hook)}</p>` : ''}
      ${p.screen ? `<p class="script"><b>À l’écran :</b> ${esc(p.screen)}</p>` : ''}
      ${p.script ? `<p class="script"><b>Voix off :</b> ${esc(p.script)}</p>` : ''}
      <div class="lbl">Texte à publier</div><pre>${esc(p.caption + (p.hashtags ? `\n\n${p.hashtags}` : ''))}</pre>
      ${p.firstComment ? `<div class="lbl">1er commentaire</div><pre class="small">${esc(p.firstComment)}</pre>` : ''}
    </section>`;
  };
  const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><style>
    @page{size:A4;margin:14mm 12mm}
    body{font:11px/1.45 -apple-system,Helvetica,Arial,sans-serif;color:#0F172A;margin:0}
    .cover{height:250mm;display:flex;flex-direction:column;justify-content:center;gap:10px;page-break-after:always}
    .cover h1{font-size:34px;margin:0}.cover h1 em{font-style:normal;background:#A3E635;padding:0 6px;border-radius:6px}
    .cover p{font-size:13px;color:#475569;max-width:140mm;margin:0}
    table{border-collapse:collapse;margin-top:14px;font-size:11px}td,th{border:1px solid #E2E8F0;padding:4px 8px;text-align:left}
    h2{font-size:18px;margin:0 0 4px;padding-top:4px}.wgoal{color:#64748B;margin:0 0 10px}
    .week{page-break-before:always}
    .post{border:1px solid #E2E8F0;border-radius:10px;padding:10px 12px;margin:0 0 10px;page-break-inside:avoid}
    .head{display:flex;gap:8px;align-items:center;flex-wrap:wrap;font-size:11px}
    .net{color:#fff;font-weight:700;border-radius:999px;padding:1px 8px}.ok{background:#F7FEE7;color:#4D7C0F;border-radius:999px;padding:1px 8px;font-weight:700}
    .shoot{background:#FEF3C7;color:#B45309;border-radius:999px;padding:1px 8px;font-weight:700}
    h3{font-size:13px;margin:6px 0}
    .imgs{display:flex;gap:4px;flex-wrap:wrap;margin:6px 0;align-items:flex-end}.imgs img{height:120px;border-radius:4px;border:1px solid #E2E8F0}.imgs.wide img{height:80px}
    .vlabel{font-size:10px;color:#64748B;margin-left:6px}
    .lbl{font-size:9px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#64748B;margin-top:6px}
    pre{white-space:pre-wrap;font:11px/1.45 -apple-system,Helvetica,Arial,sans-serif;margin:2px 0 0;background:#F8FAFC;border-radius:6px;padding:6px 8px}
    pre.small{font-size:10px;color:#475569;word-break:break-all}
    .note{background:#FEF3C7;color:#92400E;padding:4px 8px;border-radius:6px;margin:4px 0}.script{margin:3px 0}
  </style></head><body>
  <div class="cover"><h1>Campagne « <em>${esc(CAMPAIGN.name)}</em> »</h1>
    <p>Margokit · Instagram, Facebook, TikTok, LinkedIn · ${esc(day(CAMPAIGN.start))} → ${esc(day(CAMPAIGN.end))}. ${all.length} publications dans l’ordre du calendrier, avec visuels, texte complet, 1er commentaire et scripts vidéo. Heures : heure du Maroc.</p>
    <p>Les images en taille réelle sont dans les dossiers de chaque réseau (un dossier par publication, images numérotées dans l’ordre).</p>
    <table><tr><th>Réseau</th><th>Publications</th><th>Profil</th><th>Lien du profil</th></tr>${ORDER.map((k) => `<tr><td>${NETWORKS[k].label}</td><td>${POSTS[k].length}</td><td>${esc(NETWORKS[k].handle)}</td><td style="word-break:break-all">${esc(NETWORKS[k].link)}</td></tr>`).join('')}</table>
  </div>
  ${WEEKS.map((W) => `<div class="week"><h2>Semaine ${W.n} · ${esc(W.theme)} · ${esc(W.dates)}</h2><p class="wgoal">${esc(W.goal)}</p>${all.filter((p) => p.week === W.n).map(card).join('')}</div>`).join('')}
  </body></html>`;
  const tmp = join(DEST, '.campagne-complete.html');
  writeFileSync(tmp, html);
  const { chromium } = await import(join(MK, '..', 'app', 'node_modules', 'playwright', 'index.mjs'));
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto(`file://${tmp}`, { waitUntil: 'load' });
  await page.pdf({ path: pdfPath, format: 'A4', printBackground: true, margin: { top: '14mm', bottom: '14mm', left: '12mm', right: '12mm' } });
  await browser.close();
  if (!process.env.KEEP_HTML) rmSync(tmp);

}
