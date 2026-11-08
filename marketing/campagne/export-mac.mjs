/**
 * Copie toutes les campagnes Margokit dans un dossier rangé sur le Mac (par défaut ~/Desktop/Margokit-Campagnes).
 * Un sous-dossier par publication : images numérotées dans l'ordre + texte.txt prêt à copier-coller.
 *
 *   node marketing/campagne/export-mac.mjs [dossier]
 *
 * Ne copie jamais private/ (liens de livraison, secrets).
 */
import { mkdirSync, copyFileSync, writeFileSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { CAMPAIGN, WEEKS, NETWORKS, POSTS, STORIES, FB_GROUPS } from './posts.mjs';
import { makeCompletePdf } from './pdf-complet.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const MK = join(HERE, '..');
const VIS = join(HERE, 'visuels');
const OLD = join(MK, 'visuals', 'out');
const VIDS = join(homedir(), 'Desktop', 'Margokit-Videos');
const DEST = process.argv[2] ?? join(homedir(), 'Desktop', 'Margokit-Campagnes');

if (existsSync(DEST)) rmSync(DEST, { recursive: true });
const dir = (...p) => { const d = join(DEST, ...p); mkdirSync(d, { recursive: true }); return d; };
const cp = (src, ...to) => { if (existsSync(src)) { mkdirSync(dirname(join(DEST, ...to)), { recursive: true }); copyFileSync(src, join(DEST, ...to)); } };
const safe = (s) => {
  let t = s.replace(/[?*"<>|]/g, '').replace(/\s*:\s*/g, ' - ').replace(/[\/\\]/g, '-').replace(/\s+/g, ' ').trim();
  if (t.length > 95) t = t.slice(0, 95).replace(/\s+\S*$/, '') + '…';
  return t.replace(/[\s-]+$/, '');
};

const DAYS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MONTHS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const day = (iso) => { const d = new Date(`${iso}T12:00:00Z`); return `${DAYS[d.getUTCDay()]} ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`; };
const VIDEO_READY = { '01-calculateur-5-65-FR.mp4': '01-calculateur-5-65-FR.mp4', '02-les-3-kits-FR.mp4': '02-les-3-kits-FR.mp4' };

// 1. Aperçu (page + visuels + vidéos) à la racine
cp(join(HERE, 'OUVRIR-apercu-local.html'), 'OUVRIR-apercu-campagne.html');
for (const f of readdirSync(VIS).filter((f) => f.endsWith('.png'))) cp(join(VIS, f), 'visuels', f);
for (const f of readdirSync(join(HERE, 'videos'))) cp(join(HERE, 'videos', f), 'videos', f);

// 2. Stratégie, présentation, kits
const S = '01 - Strategie et presentation';
for (const f of ['01-strategie.md', '02-presentation-margokit.md', '03-guide-des-kits.md', 'calendrier.md']) cp(join(HERE, f), S, f);
cp(join(VIS, 'presentation-margokit.pdf'), S, 'presentation-margokit.pdf');
for (const f of readdirSync(VIS).filter((f) => f.startsWith('deck-'))) cp(join(VIS, f), S, 'slides', f);

// 3. Un dossier par réseau, un sous-dossier par publication
const NET_DIR = { instagram: '02 - Instagram', facebook: '03 - Facebook', tiktok: '04 - TikTok', linkedin: '05 - LinkedIn' };
for (const [key, posts] of Object.entries(POSTS)) {
  const N = NETWORKS[key];
  cp(join(HERE, `${key}.md`), NET_DIR[key], `${key}-tout-le-plan.md`);
  writeFileSync(join(dir(NET_DIR[key]), '00-profil-bio.txt'), `${N.label} — ${N.handle}\nRythme : ${N.rhythm}\n\nBIO\n${N.bio}\n\nLIEN DU PROFIL\n${N.link}\n`);
  for (const p of posts) {
    const W = WEEKS.find((w) => w.n === p.week);
    const folder = [NET_DIR[key], `Semaine ${p.week} - ${safe(W.theme)}`, safe(`${p.date} ${p.time.replace(':', 'h')} - ${p.format} - ${p.title.replace(/^Carrousel photo\s*:\s*/, '')}`) + (p.status === 'à tourner' ? ' (A TOURNER)' : '')];
    const d = dir(...folder);
    let n = 0;
    const files = [];
    for (const v of p.visuals ?? []) {
      if (v.startsWith('video:')) {
        const f = v.slice(6);
        if (existsSync(join(HERE, 'videos', f))) { copyFileSync(join(HERE, 'videos', f), join(d, `video-${f}`)); files.push(`video-${f}`); }
        else files.push(`(vidéo à tourner : ${f})`);
      } else if (v.startsWith('pdf:')) {
        const f = v.slice(4); if (existsSync(join(VIS, f))) { copyFileSync(join(VIS, f), join(d, f)); files.push(f); }
      } else if (!(p.visuals.some((x) => x.startsWith('pdf:')) && v.startsWith('car-'))) {
        n += 1; const name = `${String(n).padStart(2, '0')}-${v}`; copyFileSync(join(VIS, v), join(d, name)); files.push(name);
      }
    }
    const txt = [`${N.label} · ${day(p.date)} · ${p.time} (heure du Maroc)`, `Format : ${p.format}`, `Sujet : ${p.title}`, `Statut : ${p.status === 'à tourner' ? 'VIDÉO À TOURNER' : 'prêt à publier'}`, ''];
    if (p.note) txt.push(`⚠️ ${p.note}`, '');
    txt.push(`FICHIERS (dans l'ordre) : ${files.join(' · ') || 'aucun, post texte'}`, '');
    if (p.hook) txt.push('ACCROCHE ÉCRITE (0–3 s)', p.hook, '');
    if (p.screen) txt.push('À L’ÉCRAN', p.screen, '');
    if (p.script) txt.push('VOIX OFF', p.script, '');
    txt.push('━━━━━━━━ TEXTE À PUBLIER ━━━━━━━━', p.caption + (p.hashtags ? `\n\n${p.hashtags}` : ''), '');
    if (p.firstComment) txt.push('━━━━━━━━ 1er COMMENTAIRE (à épingler) ━━━━━━━━', p.firstComment, '');
    writeFileSync(join(d, 'texte.txt'), txt.join('\n'));
  }
}

// Stories (Instagram + Facebook)
const st = dir('02 - Instagram', 'Stories');
for (const f of readdirSync(VIS).filter((f) => f.startsWith('story-'))) copyFileSync(join(VIS, f), join(st, f));
writeFileSync(join(st, 'planning-stories.txt'), STORIES.map((s) => `SEMAINE ${s.week}\n${s.items.map((x) => `- ${x}`).join('\n')}`).join('\n\n') + '\n\nLaisse l’espace libre sous le texte pour poser le sticker (sondage ou lien) dans Instagram ou Facebook.\n');

// Groupes Facebook
const g = dir('03 - Facebook', 'Groupes Facebook');
writeFileSync(join(g, '00-mode-emploi.txt'), `${FB_GROUPS.intro}\n\nOÙ CHERCHER\n${FB_GROUPS.where.map((x) => `- ${x}`).join('\n')}\n`);
for (const p of FB_GROUPS.posts) writeFileSync(join(g, `semaine-${p.week} - ${safe(p.title)}.txt`), `Post de valeur, semaine ${p.week} (pas de lien dans le post)\n\n${p.text}\n`);

// 4. Campagnes existantes
cp(join(MK, 'content', 'pinterest.md'), '06 - Pinterest', 'pinterest-FR-octobre.md');
cp(join(MK, 'content', 'pinterest-planning-en.md'), '06 - Pinterest', 'pinterest-EN-planning.md');
for (const f of readdirSync(OLD).filter((f) => f.startsWith('pin-'))) cp(join(OLD, f), '06 - Pinterest', f.endsWith('-fr.png') ? 'epingles-FR' : 'epingles-EN', f);

cp(join(MK, 'content', 'outreach.md'), '07 - Prospection WhatsApp et DM', 'messages-de-prospection.md');
for (const f of readdirSync(OLD).filter((f) => f.startsWith('wa-'))) cp(join(OLD, f), '07 - Prospection WhatsApp et DM', 'captures-a-envoyer', f);
writeFileSync(join(dir('07 - Prospection WhatsApp et DM'), 'suivi-des-prospects.txt'), 'Suivi des prospects (statut envoyé / répondu / gagné) :\nhttps://claude.ai/artifact/EUdP5wAezigegYZNXmAqjt\n');

const V = '08 - Videos';
cp(join(MK, 'content', 'videos.md'), V, '30-scripts-video.md');
cp(join(MK, 'content', 'tournage-semaine-1.md'), V, 'methode-de-tournage.md');
if (existsSync(VIDS)) for (const f of readdirSync(VIDS).filter((f) => !f.startsWith('.'))) cp(join(VIDS, f), V, 'videos-pretes', f);

for (const f of readdirSync(OLD).filter((f) => /^(tracker|pack|pro)-/.test(f))) cp(join(OLD, f), '09 - Visuels boutique Gumroad', f);

// 4b. Tout le contenu d'un coup : un fichier texte par réseau + un PDF complet
const postText = (p, N) => {
  const out = [`■ ${day(p.date).toUpperCase()} · ${p.time} · ${N.label} · ${p.format}${p.status === 'à tourner' ? ' · VIDÉO À TOURNER' : ''}`, `Sujet : ${p.title}`];
  if (p.note) out.push(`⚠️ ${p.note}`);
  const vis = (p.visuals ?? []).map((v) => (v.startsWith('video:') ? `vidéo ${v.slice(6)}` : v.startsWith('pdf:') ? `PDF ${v.slice(4)}` : v)).filter((v) => !(p.visuals.some((x) => x.startsWith('pdf:')) && v.startsWith('car-')));
  if (vis.length) out.push(`Visuels : ${vis.join(' · ')}`);
  if (p.hook) out.push(`Accroche écrite : ${p.hook}`);
  if (p.screen) out.push(`À l’écran : ${p.screen}`);
  if (p.script) out.push(`Voix off : ${p.script}`);
  out.push('', '--- TEXTE À PUBLIER ---', p.caption + (p.hashtags ? `\n\n${p.hashtags}` : ''));
  if (p.firstComment) out.push('', '--- 1er COMMENTAIRE ---', p.firstComment);
  return out.join('\n');
};
for (const [key, posts] of Object.entries(POSTS)) {
  const N = NETWORKS[key];
  const body = WEEKS.map((W) => [`\n══════════ SEMAINE ${W.n} · ${W.dates} · ${W.theme} ══════════\n`, ...posts.filter((p) => p.week === W.n).map((p) => postText(p, N))].join('\n\n')).join('\n');
  writeFileSync(join(DEST, NET_DIR[key], `00 - TOUS LES TEXTES - ${N.label}.txt`), `${N.label.toUpperCase()} — campagne « ${CAMPAIGN.name} »\nProfil : ${N.handle} · ${N.rhythm}\nLien du profil : ${N.link}\n${body}\n`);
}

await makeCompletePdf(join(DEST, 'CAMPAGNE-COMPLETE.pdf'));

// 5. Lisez-moi
writeFileSync(join(DEST, '00 - LISEZ-MOI.txt'), `MARGOKIT — TOUTES LES CAMPAGNES
Généré le ${new Date().toLocaleDateString('fr-FR')} depuis le dépôt (marketing/campagne/export-mac.mjs).

▶ TOUT LE CONTENU EN UN SEUL DOCUMENT : « CAMPAGNE-COMPLETE.pdf » (52 publications, visuels, textes, 1ers commentaires, scripts).
▶ TOUS LES TEXTES À COPIER : dans chaque dossier réseau, le fichier « 00 - TOUS LES TEXTES - <réseau>.txt ».
▶ Double-clique sur « OUVRIR-apercu-campagne.html » pour voir toute la campagne « ${CAMPAIGN.name} » (${day(CAMPAIGN.start)} → ${day(CAMPAIGN.end)}).
  Aperçu en ligne : https://claude.ai/artifact/RZQJkBgYV7ypK9ZottEUkc

01 - Strategie et presentation   Stratégie, présentation du projet (PDF + slides), guide des kits, calendrier
02 - Instagram                    1 dossier par post : images numérotées + texte.txt · Stories
03 - Facebook                     1 dossier par post · Groupes Facebook (posts de valeur)
04 - TikTok                       1 dossier par vidéo ou carrousel photo (scripts dans texte.txt)
05 - LinkedIn                     1 dossier par post · PDF à téléverser comme « document »
06 - Pinterest                    Épingles FR et EN + plannings d'octobre
07 - Prospection WhatsApp et DM   Messages, captures à envoyer, lien du suivi des prospects
08 - Videos                       Vidéos prêtes, 30 scripts, méthode de tournage
09 - Visuels boutique Gumroad     Couvertures et vignettes des produits

Publier un post : ouvre son dossier → glisse les images dans l'ordre (01, 02…) → copie le texte de texte.txt → colle le 1er commentaire.
Vidéos : format 1080 × 1920 sans voix, ajoute un son tendance dans TikTok / Instagram au moment de publier.

Ce dossier est une copie : il est remplacé à chaque export. Les originaux sont dans Vit-SellerKit/marketing/.
`);
console.log(`✓ ${DEST}`);
