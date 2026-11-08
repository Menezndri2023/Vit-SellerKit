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
const VIDS = join(homedir(), 'Desktop', 'Margokit-Videos');
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
const READY = ['01-calculateur-5-65-FR', '02-les-3-kits-FR'];
const ALL_POSTS = Object.entries(POSTS).flatMap(([k, ps]) => ps.map((p) => ({ ...p, net: k })));

// ── Aperçu (page de l'artefact, hors ligne) ─────────────────────────────────
{
  const html = readFileSync(join(HERE, 'OUVRIR-apercu-local.html'), 'utf8').replaceAll('src="visuels/', 'src="_apercu/visuels/').replaceAll('poster="videos/', 'poster="_apercu/videos/').replaceAll('src="videos/', 'src="_apercu/videos/');
  writeFileSync(join(DEST, 'OUVRIR - Apercu de la campagne.html'), html);
  for (const f of pngs) cp(join(VIS, f), '_apercu', 'visuels', f);
  for (const f of READY) for (const e of ['.mp4', '.jpg']) cp(join(VIDS, f + e), '_apercu', 'videos', f + e);
}

// ── 01 - Vidéos ─────────────────────────────────────────────────────────────
{
  const V = '01 - Videos';
  const usedBy = (file) => ALL_POSTS.filter((p) => p.visuals?.[0] === `video:${file}`).map((p) => `- ${NETWORKS[p.net].label} · ${day(p.date)} · ${p.time}`).join('\n');
  for (const f of READY) {
    cp(join(VIDS, `${f}.mp4`), V, 'Pretes a publier', `${f}.mp4`);
    cp(join(VIDS, `${f}.jpg`), V, 'Pretes a publier', `${f} (miniature).jpg`);
  }
  const ready = READY.map((f) => {
    const p = ALL_POSTS.find((x) => x.visuals?.[0] === `video:${f}.mp4`);
    return `${f}.mp4\nPubliée le :\n${usedBy(`${f}.mp4`)}\n\nTexte (Instagram) :\n${p?.caption ?? ''}\n${p?.hashtags ?? ''}`;
  }).join('\n\n────────────\n\n');
  writeFileSync(join(dir(V, 'Pretes a publier'), 'textes-et-dates.txt'), `VIDÉOS PRÊTES À PUBLIER\n\n${ready}\n`);
  for (const lang of ['EN', 'AR']) for (const e of ['.mp4', '.jpg']) cp(join(VIDS, `02-les-3-kits-${lang}${e}`), V, 'Pretes a publier', 'Autres langues', `02-les-3-kits-${lang}${e}`);

  // Vidéos à tourner : un fichier par vidéo (les posts TikTok portent les scripts les plus complets)
  const toShoot = new Map();
  for (const p of ALL_POSTS.filter((x) => x.status === 'à tourner')) {
    const key = p.visuals[0].slice(6);
    const cur = toShoot.get(key) ?? { posts: [], hook: '', screen: '', script: '', title: p.title };
    cur.posts.push(p);
    if (p.script && p.script.length > cur.script.length) Object.assign(cur, { hook: p.hook ?? cur.hook, screen: p.screen ?? cur.screen, script: p.script, title: p.title });
    toShoot.set(key, cur);
  }
  const first = (v) => v.posts.map((p) => p.date).sort()[0];
  [...toShoot.entries()].sort((a, b) => first(a[1]).localeCompare(first(b[1]))).forEach(([src, v], i) => {
    const txt = [`VIDÉO À TOURNER : ${v.title}`, `Source : ${src}`, '', `ACCROCHE ÉCRITE (0–3 s)\n${v.hook}`, '', `À L’ÉCRAN\n${v.screen}`, '', `VOIX OFF\n${v.script}`, '',
      'PUBLICATIONS QUI UTILISENT CETTE VIDÉO', ...v.posts.sort((a, b) => a.date.localeCompare(b.date)).map((p) => `- ${NETWORKS[p.net].label} · ${day(p.date)} · ${p.time}\n  Texte : ${p.caption.split('\n')[0]}…`), '',
      'Format : écran du téléphone + ta voix, 1080 × 1920, 15–30 s, sous-titres CapCut. Méthode complète : methode-de-tournage.md'];
    writeFileSync(join(dir(V, 'A tourner'), `${String(i + 1).padStart(2, '0')} - ${safe(v.title)}.txt`), txt.join('\n'));
  });
  cp(join(MK, 'content', 'tournage-semaine-1.md'), V, 'A tourner', 'methode-de-tournage.md');
  cp(join(MK, 'content', 'videos.md'), V, 'A tourner', '30-scripts-video (reserve).md');
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
writeFileSync(join(dir('04 - Stories'), 'planning-des-stories.txt'), `${STORIES.map((s) => `SEMAINE ${s.week}\n${s.items.map((x) => `- ${x}`).join('\n')}`).join('\n\n')}\n\nLes zones en pointillés indiquent où poser le sticker (sondage ou lien).\n`);

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
          if (existsSync(join(VIDS, f))) { copyFileSync(join(VIDS, f), join(d, f)); files.push(f); } else files.push(`(vidéo à tourner : voir 01 - Videos/A tourner)`);
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

01 - Videos                     Prêtes à publier (+ versions EN/AR) · À tourner : un fichier script par vidéo
02 - Presentation du projet     Présentation 10 slides (PDF + images), version texte, guide des kits
03 - Carrousels                 Les 6 carrousels : images numérotées + PDF à téléverser sur LinkedIn
04 - Stories                    4 stories + planning semaine par semaine
05 - Publications par reseau    Instagram, Facebook (+ groupes), TikTok, LinkedIn : un dossier par post (images + texte.txt)
06 - Strategie et calendrier    Stratégie complète et calendrier jour par jour

Publier un post : 05 - Publications par reseau → réseau → semaine → dossier du jour → images 01, 02… + texte.txt.
Le dossier « _apercu » sert seulement à la page d'aperçu : ne pas le déplacer.
`);
console.log(`✓ ${DEST}`);
