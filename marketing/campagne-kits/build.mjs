/**
 * Campagne kits : génère 03-calendrier.md, calendrier.csv, 03-scripts-videos.md (depuis videos.mjs)
 * et le dossier ~/Desktop/Campagne Kits Margokit — Janvier 2027/ (+ copie iCloud Drive).
 *   node marketing/campagne-kits/build.mjs
 * Rien n'est publié : la campagne attend validation.
 */
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CAPTIONS, SCHEDULE, TAGS, link } from './posts.mjs';
import { VIDEOS } from './videos.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const R = join(HERE, 'rendu');
const NAME = 'Campagne Kits Margokit — Janvier 2027';
const DEST = join(homedir(), 'Desktop', NAME);
const ICLOUD = join(homedir(), 'Library', 'Mobile Documents', 'com~apple~CloudDocs', NAME);
const NET = { ig: 'Instagram', fb: 'Facebook', li: 'LinkedIn', tiktok: 'TikTok', story: 'Story Instagram + Facebook' };
const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const day = (d) => {
  const x = new Date(`${d}T12:00:00Z`);
  return `${DAYS[x.getUTCDay()]} ${x.getUTCDate()} janvier`;
};

/** Where "lien en bio" leads for each content. */
const TARGET = (id) =>
  /^(K03|KC3|KH3|KH4|K07|KC6)/.test(id)
    ? { url: 'https://margokit.gumroad.com/l/tracker', name: 'Tracker' }
    : /^(K04|KC4|KP3|K08|KH5|KS3)/.test(id)
      ? { url: 'https://margokit.gumroad.com/l/seller-pack', name: 'Seller Pack' }
      : { path: '/calculator', name: 'Calculateur' };
const targetUrl = (net, id) => {
  const t = TARGET(id);
  return t.url ? `${t.url}?utm_source=${net}&utm_medium=social&utm_campaign=vends-calcule-garde&utm_content=${id}` : link(net, id, t.path);
};

function assets(id, fmt) {
  if (['9x16', '16x9', '1x1'].includes(fmt)) return [join(R, fmt, `${id}.mp4`)];
  if (fmt === 'carrousel') return readdirSync(join(R, 'visuels', 'carrousels', id)).sort().map((f) => join(R, 'visuels', 'carrousels', id, f));
  if (fmt === 'document') return [id === 'PRES-kits' ? join(R, 'presentation', 'Margokit-kits-presentation.pdf') : join(R, 'visuels', 'carrousels', `${id}.pdf`)];
  if (fmt === 'image') return [join(R, 'visuels', 'posts', `${id}.png`)];
  if (fmt === 'story') return [join(R, 'visuels', 'stories', `${id}.png`)];
  return [];
}
function caption(net, id) {
  const c = CAPTIONS[id] ?? {};
  if (net === 'li') return `${c.li ?? c.ig ?? ''}\n\n👉 ${targetUrl('linkedin', id)}\n\n${TAGS.li}`;
  if (net === 'story') return c.ig ?? '';
  const tags = net === 'tiktok' ? TAGS.tiktok : net === 'fb' ? TAGS.fb : TAGS.ig;
  const text = net === 'fb' ? (c.ig ?? '').replace(/lien en bio\.?/gi, targetUrl('facebook', id)) : c.ig ?? '';
  return `${text}\n\n${tags}`;
}

// Calendar
const sorted = [...SCHEDULE].sort((a, b) => (a[0] + a[1]).localeCompare(b[0] + b[1]));
const WEEKS = ['Semaine 1 — Ton chiffre d’affaires te ment (calculateur)', 'Semaine 2 — Les colis refusés (Tracker)', 'Semaine 3 — La pub qui ment (Seller Pack)', 'Semaine 4 — Ta routine de vendeur (les 4 outils)'];
let md = `# Calendrier — « Vends. Calcule. Garde. » (4 → 31 janvier 2027) — NON PUBLIÉ\n\n${sorted.length} publications · heures du Maroc (GMT+1). Lien en bio du mois : le calculateur (semaine 1), le Tracker (semaine 2), le Seller Pack (semaine 3), margokit.com (semaine 4).\n`;
const csv = [['date', 'heure', 'reseau', 'contenu', 'format', 'fichiers', 'legende'].join(';')];
let lastDay = '';
let week = -1;
for (const [date, time, net, id, fmt] of sorted) {
  const w = Math.min(3, Math.floor((new Date(date) - new Date('2027-01-04')) / (7 * 86400000)));
  if (w !== week) md += `\n## ${WEEKS[(week = w)]}\n`;
  if (date !== lastDay) md += `\n### ${day((lastDay = date))}\n\n`;
  const text = caption(net, id);
  md += `**${time} · ${NET[net]}** — \`${id}\` (${fmt})\n\n\`\`\`text\n${text}\n\`\`\`\n\n`;
  csv.push([date, time, NET[net], id, fmt, assets(id, fmt).map((f) => f.split('/rendu/')[1]).join(' | '), JSON.stringify(text)].join(';'));
}
writeFileSync(join(HERE, '03-calendrier.md'), md);
writeFileSync(join(HERE, 'calendrier.csv'), `﻿${csv.join('\n')}\n`);

// Scripts document, generated from the single source
let scripts = `# Scripts vidéo — campagne « Vends. Calcule. Garde. »\n\nVoix off : Kokoro (voix ff_siwis). Écrans : calculateur réel (margokit.com, exemple marocain) et reproductions fidèles des Google Sheets (données d'exemple des fichiers livrés).\n`;
for (const v of VIDEOS) {
  scripts += `\n## ${v.id} — ${v.title}\n**Formats** : ${v.formats.join(', ')}\n\n| # | Voix off | Texte à l'écran |\n|---|---|---|\n`;
  v.segments.forEach((s, i) => (scripts += `| ${i + 1} | ${s.vo.replace(/\|/g, '/')} | ${s.head || '(écran de fin)'} |\n`));
}
writeFileSync(join(HERE, '03-scripts-videos.md'), scripts);
console.log(`✓ calendrier (${sorted.length}) + scripts (${VIDEOS.length} vidéos)`);

// Folder
const missing = [];
const copy = (src, dst) => {
  if (!existsSync(src)) return missing.push(src);
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
};
rmSync(DEST, { recursive: true, force: true });
copy(join(HERE, '01-strategie.md'), join(DEST, '01-Strategie', 'Strategie-campagne-kits.md'));
copy(join(HERE, '02-kits-et-parcours.md'), join(DEST, '02-Kits-et-parcours', 'Kits-et-parcours-d-utilisation.md'));
copy(join(HERE, '03-scripts-videos.md'), join(DEST, '03-Scripts', 'Scripts-videos.md'));
const FMT = { '9x16': 'Vertical 9x16 (Reels, TikTok, Stories)', '16x9': 'Horizontal 16x9 (LinkedIn, Facebook, YouTube)', '1x1': 'Carre 1x1 (fil Facebook, Instagram)' };
for (const fmt of Object.keys(FMT)) if (existsSync(join(R, fmt))) cpSync(join(R, fmt), join(DEST, '04-Videos', FMT[fmt]), { recursive: true });
cpSync(join(R, 'visuels'), join(DEST, '05-Visuels'), { recursive: true });
cpSync(join(R, 'presentation'), join(DEST, '06-Presentation'), { recursive: true });
copy(join(HERE, '03-calendrier.md'), join(DEST, '07-Calendrier', 'Calendrier-complet.md'));
copy(join(HERE, 'calendrier.csv'), join(DEST, '07-Calendrier', 'Calendrier.csv'));
for (const [date, time, net, id, fmt] of sorted) {
  const dir = join(DEST, '07-Calendrier', `${date} (${day(date)})`, `${time.replace(':', 'h')} ${NET[net].replace(/[^\w]+/g, '-')} — ${id}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'texte-a-copier.txt'), caption(net, id));
  for (const f of assets(id, fmt)) copy(f, join(dir, f.split('/').pop()));
}
copy(join(HERE, '04-prospection.md'), join(DEST, '08-Prospection', 'Prospection-et-reponses.md'));
writeFileSync(
  join(DEST, 'LISEZ-MOI.md'),
  `# Campagne kits Margokit — « Vends. Calcule. Garde. »\n\n**NON PUBLIÉE** — proposée du 4 au 31 janvier 2027, après la campagne Margokit Pro. Rien n'est programmé.\n\n| Dossier | Contenu |\n|---|---|\n| 01-Strategie | Niche (vendeurs en ligne, COD Maroc), message, chiffres réels, objectifs, rythme |\n| 02-Kits-et-parcours | Ce que contient chaque kit, à qui il sert, parcours d'utilisation pas à pas, prix |\n| 03-Scripts | Scripts des ${VIDEOS.length} vidéos (voix off + textes à l'écran) |\n| 04-Videos | Vidéos avec voix off et sous-titres : vertical, horizontal, carré + miniatures |\n| 05-Visuels | 6 carrousels (PNG + PDF LinkedIn), 5 posts, 3 stories |\n| 06-Presentation | Présentation des kits (PDF 10 pages + images) |\n| 07-Calendrier | Un dossier par jour et par publication : fichier + texte à copier |\n| 08-Prospection | Réponses CALCUL / COLIS / PACK, diagnostic, WhatsApp (FR + darija), groupes |\n\nChiffres : calculateur réel de margokit.com (249 MAD → 44 MAD ; 35 % de refus → 22,46 MAD ; 279 MAD → 74 MAD).\nGoogle Sheets montrés : reproductions fidèles des fichiers livrés, avec leurs données d'exemple.\n`,
);
if (missing.length) console.log(`⚠ manquants :\n${missing.join('\n')}`);
console.log(`✓ dossier : ${DEST}`);
if (existsSync(dirname(ICLOUD))) {
  rmSync(ICLOUD, { recursive: true, force: true });
  cpSync(DEST, ICLOUD, { recursive: true });
  console.log('✓ copie iCloud Drive');
}
