/**
 * Exporte TOUT le contenu de la campagne « Ce que tu gardes vraiment » (le contenu de l'artefact d'aperçu)
 * dans un dossier dédié sur le Mac, rangé par type de contenu :
 *
 *   ~/Desktop/Campagne Ce que tu gardes/
 *     OUVRIR - Apercu de la campagne.html   (la page d'aperçu, hors ligne)
 *     CAMPAGNE-COMPLETE.pdf                  (les 52 publications en un document)
 *     01 - Videos/                           (prêtes à publier + scripts des vidéos à tourner)
 *     02 - Presentation du projet/           (PDF 10 slides, slides PNG, présentation texte, guide des kits)
 *     03 - Carrousels/                       (6 carrousels : images numérotées + PDF pour LinkedIn)
 *     04 - Stories/
 *     05 - Publications par reseau/          (un dossier par post : images + texte.txt, et tous les textes)
 *     06 - Strategie et calendrier/
 *
 *   node marketing/campagne/export-campagne.mjs [dossier]
 */
import { mkdirSync, copyFileSync, writeFileSync, readFileSync, readdirSync, existsSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { homedir } from 'node:os';
import { CAMPAIGN, WEEKS, NETWORKS, POSTS, STORIES, FB_GROUPS } from './posts.mjs';
import { makeCompletePdf, day } from './pdf-complet.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const MK = join(HERE, '..');
const VIS = join(HERE, 'visuels');
const VIDS = join(HERE, 'videos'); // rempli par build.mjs (vidéos prêtes + vidéos produites)
const DEST = process.argv[2] ?? join(homedir(), 'Desktop', 'Campagne Ce que tu gardes');

if (existsSync(DEST)) rmSync(DEST, { recursive: true });
mkdirSync(DEST, { recursive: true });
const dir = (...p) => { const d = join(DEST, ...p); mkdirSync(d, { recursive: true }); return d; };
const cp = (src, ...to) => { if (!existsSync(src)) return false; mkdirSync(dirname(join(DEST, ...to)), { recursive: true }); copyFileSync(src, join(DEST, ...to)); return true; };
const safe = (s) => {
  let t = s.replace(/[?*"<>|]/g, '').replace(/\s*:\s*/g, ' - ').replace(/[\/\\]/g, '-').replace(/\s+/g, ' ').trim();
  if (t.length > 95) t = t.slice(0, 95).replace(/\s+\S*$/, '') + '…';
  return t.replace(/[\s-]+$/, '');
};
const pngs = readdirSync(VIS).filter((f) => f.endsWith('.png')).sort((a, b) => a.localeCompare(b, 'en', { numeric: true }));
const ALL_POSTS = Object.entries(POSTS).flatMap(([k, ps]) => ps.map((p) => ({ ...p, net: k })));

// ── Aperçu (page de l'artefact, hors ligne) ─────────────────────────────────
{
  const html = readFileSync(join(HERE, 'OUVRIR-apercu-local.html'), 'utf8').replaceAll('src="visuels/', 'src="_apercu/visuels/').replaceAll('poster="videos/', 'poster="_apercu/videos/').replaceAll('src="videos/', 'src="_apercu/videos/');
  writeFileSync(join(DEST, 'OUVRIR - Apercu de la campagne.html'), html);
  for (const f of pngs) cp(join(VIS, f), '_apercu', 'visuels', f);
  for (const f of readdirSync(VIDS)) cp(join(VIDS, f), '_apercu', 'videos', f);
}

// ── 01 - Vidéos ─────────────────────────────────────────────────────────────
{
  const V = '01 - Videos';
  const files = [...new Set(ALL_POSTS.map((p) => p.visuals?.[0]).filter((v) => v?.startsWith('video:')).map((v) => v.slice(6)))];
  const firstDate = (f) => ALL_POSTS.filter((p) => p.visuals?.[0] === `video:${f}`).map((p) => p.date).sort()[0];
  files.sort((a, b) => firstDate(a).localeCompare(firstDate(b)));
  const lines = [];
  for (const f of files) {
    const base = f.replace(/\.mp4$/, '');
    cp(join(VIDS, f), V, f);
    cp(join(VIDS, `${base}.jpg`), V, 'Miniatures', `${base}.jpg`);
    const uses = ALL_POSTS.filter((p) => p.visuals?.[0] === `video:${f}`).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
    lines.push(`${f}\n${uses.map((p) => `- ${NETWORKS[p.net].label} · ${day(p.date)} · ${p.time} : « ${p.caption.split('\n')[0]} »`).join('\n')}`);
  }
  writeFileSync(join(dir(V), '00 - Quelle video, quel jour.txt'), `LES ${files.length} VIDÉOS DE LA CAMPAGNE (prêtes à publier)\n\nFormat 1080 × 1920, sans voix : ajoute un son tendance dans TikTok / Instagram au moment de publier.\nLe texte complet de chaque post est dans 05 - Publications par reseau.\n\n${lines.join('\n\n')}\n`);
  const OTHER = join(homedir(), 'Desktop', 'Margokit-Videos');
  for (const lang of ['EN', 'AR']) for (const e of ['.mp4', '.jpg']) cp(join(OTHER, `02-les-3-kits-${lang}${e}`), V, 'Autres langues', `02-les-3-kits-${lang}${e}`);
}

// ── 02 - Présentation du projet ─────────────────────────────────────────────
{
  const P = '02 - Presentation du projet';
  cp(join(VIS, 'presentation-margokit.pdf'), P, 'Presentation Margokit (10 slides).pdf');
  pngs.filter((f) => f.startsWith('deck-')).forEach((f) => cp(join(VIS, f), P, 'Slides en images', `slide-${f.slice(5)}`));
  cp(join(HERE, '02-presentation-margokit.md'), P, 'Presentation Margokit (texte).md');
  cp(join(HERE, '03-guide-des-kits.md'), P, 'Guide des kits.md');
  cp(join(VIS, 'car-kits.pdf'), P, 'Les 4 kits (carrousel).pdf');
}

// ── 03 - Carrousels ─────────────────────────────────────────────────────────
{
  const NAMES = { 'car-calcul-25': '1 - Tu vends a 25 euros, tu gardes combien', 'car-kits': '2 - Les 4 outils Margokit', 'car-black-friday': '3 - Black Friday, verifie ta promo',
    'car-cod': '4 - COD, 30 pourcent de colis refuses', 'car-roas': '5 - ROAS de 3 = 0,23 euro', 'car-pro': '6 - Margokit Pro, devis et factures' };
  for (const [key, name] of Object.entries(NAMES)) {
    pngs.filter((f) => f.startsWith(`${key}-`)).forEach((f) => cp(join(VIS, f), '03 - Carrousels', name, `${String(f.match(/-(\d+)\.png$/)[1]).padStart(2, '0')}.png`));
    cp(join(VIS, `${key}.pdf`), '03 - Carrousels', name, `${name} (PDF pour LinkedIn).pdf`);
  }
}

// ── 04 - Stories ────────────────────────────────────────────────────────────
pngs.filter((f) => f.startsWith('story-')).forEach((f) => cp(join(VIS, f), '04 - Stories', f));
writeFileSync(join(dir('04 - Stories'), 'planning-des-stories.txt'), `${STORIES.map((s) => `SEMAINE ${s.week}\n${s.items.map((x) => `- ${x}`).join('\n')}`).join('\n\n')}\n\nLaisse l’espace libre sous le texte pour poser le sticker (sondage ou lien) dans Instagram ou Facebook.\n`);

// ── 05 - Publications par réseau ────────────────────────────────────────────
{
  const R = '05 - Publications par reseau';
  const NET_DIR = { instagram: 'Instagram', facebook: 'Facebook', tiktok: 'TikTok', linkedin: 'LinkedIn' };
  for (const [key, posts] of Object.entries(POSTS)) {
    const N = NETWORKS[key];
    writeFileSync(join(dir(R, NET_DIR[key]), '00 - Profil et bio.txt'), `${N.label} — ${N.handle}\nRythme : ${N.rhythm}\n\nBIO\n${N.bio}\n\nLIEN DU PROFIL\n${N.link}\n`);
    cp(join(HERE, `${key}.md`), R, NET_DIR[key], `00 - TOUS LES TEXTES - ${N.label}.md`);
    for (const p of posts) {
      const W = WEEKS.find((w) => w.n === p.week);
      const d = dir(R, NET_DIR[key], `Semaine ${p.week} - ${safe(W.theme)}`, safe(`${p.date} ${p.time.replace(':', 'h')} - ${p.format} - ${p.title.replace(/^Carrousel photo\s*:\s*/, '')}`) + (p.status === 'à tourner' ? ' (A TOURNER)' : ''));
      const files = [];
      const hasPdf = p.visuals?.some((x) => x.startsWith('pdf:'));
      let n = 0;
      for (const v of p.visuals ?? []) {
        if (v.startsWith('video:')) {
          const f = v.slice(6);
          if (existsSync(join(VIDS, f))) { copyFileSync(join(VIDS, f), join(d, f)); files.push(f); } else files.push(`(vidéo manquante : ${f})`);
        } else if (v.startsWith('pdf:')) {
          const f = v.slice(4); if (existsSync(join(VIS, f))) { copyFileSync(join(VIS, f), join(d, f)); files.push(f); }
        } else if (!(hasPdf && v.startsWith('car-'))) {
          n += 1; const name = `${String(n).padStart(2, '0')}.png`; copyFileSync(join(VIS, v), join(d, name)); files.push(name);
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
  writeFileSync(join(dir(R, 'Facebook', 'Groupes Facebook'), '00 - Mode d’emploi.txt'), `${FB_GROUPS.intro}\n\nOÙ CHERCHER\n${FB_GROUPS.where.map((x) => `- ${x}`).join('\n')}\n`);
  for (const g of FB_GROUPS.posts) writeFileSync(join(dir(R, 'Facebook', 'Groupes Facebook'), `Semaine ${g.week} - ${safe(g.title)}.txt`), `Post de valeur, semaine ${g.week} (pas de lien dans le post)\n\n${g.text}\n`);
}

// ── 06 - Stratégie et calendrier ────────────────────────────────────────────
cp(join(HERE, '01-strategie.md'), '06 - Strategie et calendrier', 'Strategie.md');
cp(join(HERE, 'calendrier.md'), '06 - Strategie et calendrier', 'Calendrier des 52 publications.md');

// ── Document complet + lisez-moi ────────────────────────────────────────────
await makeCompletePdf(join(DEST, 'CAMPAGNE-COMPLETE.pdf'));
writeFileSync(join(DEST, '00 - LISEZ-MOI.txt'), `CAMPAGNE « ${CAMPAIGN.name.toUpperCase()} » — MARGOKIT
Du ${day(CAMPAIGN.start)} au ${day(CAMPAIGN.end)} · Instagram, Facebook, TikTok, LinkedIn · ${ALL_POSTS.length} publications.
Tout le contenu de l'aperçu en ligne : https://claude.ai/artifact/RZQJkBgYV7ypK9ZottEUkc

▶ OUVRIR - Apercu de la campagne.html   La même page que l'aperçu en ligne, sans internet (double-clic)
▶ CAMPAGNE-COMPLETE.pdf                  Les ${ALL_POSTS.length} publications en un document : visuels, textes, 1ers commentaires, scripts

01 - Videos                     Les 16 vidéos prêtes à publier (+ miniatures, + versions EN/AR) et quel jour publier chacune
02 - Presentation du projet     Présentation 10 slides (PDF + images), version texte, guide des kits
03 - Carrousels                 Les 6 carrousels : images numérotées + PDF à téléverser sur LinkedIn
04 - Stories                    4 stories + planning semaine par semaine
05 - Publications par reseau    Instagram, Facebook (+ groupes), TikTok, LinkedIn : un dossier par post (images + texte.txt)
06 - Strategie et calendrier    Stratégie complète et calendrier jour par jour

Publier un post : 05 - Publications par reseau → réseau → semaine → dossier du jour → images 01, 02… + texte.txt.
Le dossier « _apercu » sert seulement à la page d'aperçu : ne pas le déplacer.
`);
console.log(`✓ ${DEST}`);
