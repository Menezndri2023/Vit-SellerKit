/**
 * Génère le calendrier (03-calendrier.md + calendrier.csv) et le dossier prêt à publier :
 *   ~/Desktop/Campagne Margokit Pro — Décembre 2026/  (+ copie iCloud Drive si présent)
 *   node marketing/campagne-pro/build.mjs
 */
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CAPTIONS, SCHEDULE, TAGS, link } from './posts.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const R = join(HERE, 'rendu');
const DEST = join(homedir(), 'Desktop', 'Campagne Margokit Pro — Décembre 2026');
const ICLOUD = join(homedir(), 'Library', 'Mobile Documents', 'com~apple~CloudDocs', 'Campagne Margokit Pro — Décembre 2026');

const NET = { ig: 'Instagram', fb: 'Facebook', li: 'LinkedIn', tiktok: 'TikTok', story: 'Story Instagram + Facebook' };
const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const day = (d) => {
  const x = new Date(`${d}T12:00:00Z`);
  return `${DAYS[x.getUTCDay()]} ${x.getUTCDate()} ${x.getUTCMonth() === 10 ? 'novembre' : 'décembre'}`;
};

/** Files to publish for one post. */
function assets(id, fmt) {
  if (['9x16', '16x9', '1x1'].includes(fmt)) return [join(R, fmt, `${id}.mp4`)];
  if (fmt === 'carrousel') return readdirSync(join(R, 'visuels', 'carrousels', id)).sort().map((f) => join(R, 'visuels', 'carrousels', id, f));
  if (fmt === 'document') return [id === 'PRES-presentation' ? join(R, 'presentation', 'Margokit-presentation.pdf') : join(R, 'visuels', 'carrousels', `${id}.pdf`)];
  if (fmt === 'image') return [join(R, 'visuels', 'posts', `${id}.png`)];
  if (fmt === 'story') return [join(R, 'visuels', 'stories', `${id}.png`)];
  return [];
}

function caption(net, id) {
  const c = CAPTIONS[id] ?? {};
  if (net === 'li') {
    const text = c.li ?? c.ig ?? '';
    return id === 'BILAN-fondateur' ? text : `${text}\n\n👉 ${link('linkedin', id)}\n\n${TAGS.li}`;
  }
  if (net === 'story') return c.ig ?? '';
  const tags = net === 'tiktok' ? TAGS.tiktok : net === 'fb' ? TAGS.fb : TAGS.ig;
  // Facebook allows links in the post; Instagram and TikTok use the link in bio
  const withLink = net === 'fb' ? (c.ig ?? '').replace(/lien en bio\.?/gi, link('facebook', id)) : c.ig ?? '';
  return `${withLink}\n\n${tags}`;
}

// Calendar files
const sorted = [...SCHEDULE].sort((a, b) => (a[0] + a[1]).localeCompare(b[0] + b[1]));
const csv = [['date', 'heure', 'reseau', 'contenu', 'format', 'fichiers', 'legende'].join(';')];
let md = `# Calendrier — « Facture. Encaisse. Respire. » (30 nov → 27 déc 2026)\n\n${sorted.length} publications · heures du Maroc (GMT+1) · comptes VIT GLOBAL.\nLes fichiers de chaque jour sont dans \`06-Calendrier/<date>/\` (vidéo ou images + texte à copier).\n\n`;
let lastDay = '';
let week = 0;
const WEEKS = ['Semaine 1 — Le problème', 'Semaine 2 — La démo', 'Semaine 3 — Se faire payer', 'Semaine 4 — Préparer 2027'];
for (const [date, time, net, id, fmt] of sorted) {
  const w = Math.min(3, Math.floor((new Date(date) - new Date('2026-11-30')) / (7 * 86400000)));
  if (w !== week || !lastDay) {
    md += `\n## ${WEEKS[w]}\n`;
    week = w;
  }
  if (date !== lastDay) {
    md += `\n### ${day(date)}\n\n`;
    lastDay = date;
  }
  const text = caption(net, id);
  md += `**${time} · ${NET[net]}** — \`${id}\` (${fmt})\n\n\`\`\`text\n${text}\n\`\`\`\n\n`;
  csv.push([date, time, NET[net], id, fmt, assets(id, fmt).map((f) => f.split('/rendu/')[1]).join(' | '), JSON.stringify(text)].join(';'));
}
writeFileSync(join(HERE, '03-calendrier.md'), md);
writeFileSync(join(HERE, 'calendrier.csv'), `﻿${csv.join('\n')}\n`);
console.log(`✓ calendrier : ${sorted.length} publications`);

// Desktop folder
const missing = [];
const copy = (src, dst) => {
  if (!existsSync(src)) return missing.push(src);
  mkdirSync(dirname(dst), { recursive: true });
  copyFileSync(src, dst);
};
for (const d of ['01-Strategie', '02-Scripts', '03-Videos', '04-Visuels', '05-Presentation', '06-Calendrier', '07-Prospection']) rmSync(join(DEST, d), { recursive: true, force: true });
copy(join(HERE, '01-strategie.md'), join(DEST, '01-Strategie', 'Strategie-campagne.md'));
copy(join(HERE, '02-scripts-videos.md'), join(DEST, '02-Scripts', 'Scripts-videos.md'));
for (const fmt of ['9x16', '16x9', '1x1']) if (existsSync(join(R, fmt))) cpSync(join(R, fmt), join(DEST, '03-Videos', { '9x16': 'Vertical 9x16 (Reels, TikTok, Stories)', '16x9': 'Horizontal 16x9 (LinkedIn, Facebook, YouTube)', '1x1': 'Carre 1x1 (fil Facebook, LinkedIn)' }[fmt]), { recursive: true });
cpSync(join(R, 'visuels'), join(DEST, '04-Visuels'), { recursive: true });
cpSync(join(R, 'presentation'), join(DEST, '05-Presentation'), { recursive: true });
copy(join(HERE, '03-calendrier.md'), join(DEST, '06-Calendrier', 'Calendrier-complet.md'));
copy(join(HERE, 'calendrier.csv'), join(DEST, '06-Calendrier', 'Calendrier.csv'));
for (const [date, time, net, id, fmt] of sorted) {
  const dir = join(DEST, '06-Calendrier', `${date} (${day(date)})`, `${time.replace(':', 'h')} ${NET[net].replace(/[^\w]+/g, '-')} — ${id}`);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, 'texte-a-copier.txt'), caption(net, id));
  for (const f of assets(id, fmt)) copy(f, join(dir, f.split('/').pop()));
}
copy(join(HERE, '04-prospection.md'), join(DEST, '07-Prospection', 'Prospection-et-reponses.md'));
copy(join(HERE, '06-etat-publication.md'), join(DEST, 'ETAT-PUBLICATION.md'));
copy(join(HERE, '05-ancienne-campagne-a-retirer.md'), join(DEST, 'A-FAIRE-avant-le-30-nov — posts a retirer.md'));
writeFileSync(
  join(DEST, 'LISEZ-MOI.md'),
  `# Campagne Margokit Pro — « Facture. Encaisse. Respire. »\n\nDu lundi 30 novembre au dimanche 27 décembre 2026 · comptes VIT GLOBAL (Facebook, Instagram, LinkedIn, TikTok).\n\n| Dossier | Contenu |\n|---|---|\n| 00-Essai-voix | Les échantillons de voix comparés (voix retenue : A, Kokoro) |\n| 01-Strategie | Cible, message, objectifs, rythme, budget |\n| 02-Scripts | Scripts des 16 vidéos (voix off + textes à l'écran) |\n| 03-Videos | Les vidéos avec voix off et sous-titres, en vertical, horizontal et carré, + miniatures |\n| 04-Visuels | 5 carrousels (PNG + PDF pour LinkedIn), 6 posts, 3 stories, bannière LinkedIn |\n| 05-Presentation | Présentation commerciale (PDF 10 pages + images) |\n| 06-Calendrier | Un dossier par jour et par publication : le fichier à publier + le texte à copier |\n| 07-Prospection | Réponses aux commentaires, DM, WhatsApp, groupes, suivi hebdomadaire |\n\nToutes les captures viennent de la vraie application Margokit avec un compte de démonstration fictif (« Studio Atlas », Casablanca) : aucun vrai client.\nVoix off : Kokoro (licence Apache 2.0, usage commercial autorisé).\n`,
);
if (missing.length) console.log(`⚠ fichiers manquants :\n${missing.join('\n')}`);
console.log(`✓ dossier : ${DEST}`);
if (existsSync(dirname(ICLOUD))) {
  rmSync(ICLOUD, { recursive: true, force: true });
  cpSync(DEST, ICLOUD, { recursive: true });
  console.log('✓ copie iCloud Drive');
}
