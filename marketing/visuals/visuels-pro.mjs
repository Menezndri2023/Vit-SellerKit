/**
 * Visuels fixes de la campagne « Facture. Encaisse. Respire. » : carrousels (1080×1350), posts (1080×1350),
 * stories (1080×1920), bannière LinkedIn (1584×396) et présentation commerciale (1920×1080 → PDF).
 *
 *   node marketing/visuals/visuels-pro.mjs
 * Sortie : marketing/campagne-pro/rendu/visuels/… et rendu/presentation/Margokit-presentation.pdf
 */
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BRAND, page, LOGO_SVG } from './templates.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const CAP = join(ROOT, 'marketing', 'campagne-pro', 'captures');
const OUT = join(ROOT, 'marketing', 'campagne-pro', 'rendu');
const { chromium } = await import(join(ROOT, 'app', 'node_modules', 'playwright', 'index.mjs'));

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const em = (s) => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
const uri = (name) => {
  const f = join(CAP, name.endsWith('.png') ? name : `${name}.png`);
  if (!existsSync(f)) throw new Error(`capture manquante : ${f}`);
  return `data:image/png;base64,${readFileSync(f).toString('base64')}`;
};

const CSS = `
body{background:radial-gradient(120% 70% at 50% 0%,#1E293B 0%,#0F172A 62%);color:#fff;position:relative}
.light{background:${BRAND.bg};color:${BRAND.ink}}
.brand{position:absolute;display:flex;align-items:center;gap:12px}
.brand b{font-family:'Plus Jakarta Sans';font-weight:800;letter-spacing:-.02em}
.brand small{color:#94A3B8;font-weight:500}
h1,h2,.k{font-family:'Plus Jakarta Sans';font-weight:800;letter-spacing:-.03em;line-height:1.06;text-wrap:balance}
em{font-style:normal;color:${BRAND.lime}}
.light em{color:${BRAND.limeInk}}
p{line-height:1.4;text-wrap:pretty}
.muted{color:#94A3B8}
.pill{display:inline-block;background:${BRAND.lime};color:${BRAND.ink};font-weight:800;border-radius:999px;font-family:'Plus Jakarta Sans'}
.ghost{display:inline-block;border:2px solid #334155;color:#CBD5E1;font-weight:700;border-radius:999px}
.shot{border-radius:26px;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,.55);background:#fff}
.shot img{display:block}
.phone{background:#0B1220;border-radius:48px;padding:12px;box-shadow:0 40px 100px rgba(0,0,0,.6),0 0 0 2px #334155;display:inline-block}
.phone img{display:block;border-radius:38px}
.row{display:flex;gap:18px;align-items:flex-start}
.num{flex:none;display:grid;place-items:center;border-radius:50%;background:${BRAND.lime};color:${BRAND.ink};font-family:'Plus Jakarta Sans';font-weight:800}
.box{background:#1E293B;border-radius:24px}
.bad{color:#FCA5A5}.good{color:${BRAND.lime}}
.swipe{position:absolute;right:70px;bottom:60px;color:#94A3B8;font-weight:700;font-size:30px}
.pager{position:absolute;left:70px;bottom:62px;color:#64748B;font-weight:700;font-size:26px}
table{border-collapse:collapse;width:100%}
td{padding:18px 0;border-bottom:1px solid #334155;font-size:32px}
`;

const brand = (x, y, s = 36) => `<div class="brand" style="left:${x}px;top:${y}px">${LOGO_SVG(s)}<b style="font-size:${Math.round(s * 0.72)}px">Margokit</b><small style="font-size:${Math.round(s * 0.5)}px">par VIT GLOBAL</small></div>`;
/** Zoom on a region of a mobile full-page capture (pixels of the 1170-px-wide image). */
const crop = (img, { y = 0, h = 1200, w = 900 } = {}) => {
  const k = w / 1170;
  return `<div class="shot" style="width:${w}px;height:${Math.round(h * k)}px"><img src="${uri(img)}" style="width:${w}px;margin-top:-${Math.round(y * k)}px"></div>`;
};
const phone = (img, w = 520, cutH) => `<div class="phone"><div style="width:${w}px;${cutH ? `height:${cutH}px;` : ''}overflow:hidden;border-radius:38px"><img src="${uri(img)}" style="width:${w}px"></div></div>`;

// ---------------------------------------------------------------------------
// Carrousels 1080 × 1350
// ---------------------------------------------------------------------------
const S = (n, total, inner, { swipe = true } = {}) => `${brand(70, 64)}${inner}<div class="pager">${n}/${total}</div>${swipe && n < total ? '<div class="swipe">Glisse →</div>' : ''}`;
const cover = (title, sub, extra = '') => `<div style="position:absolute;left:70px;right:70px;top:250px"><h1 style="font-size:104px">${em(title)}</h1><p class="muted" style="font-size:40px;margin-top:36px">${esc(sub)}</p>${extra}</div>`;
const text = (kicker, title, body, big) => `${big ? `<div class="k" style="position:absolute;right:40px;bottom:-60px;font-size:620px;line-height:1;color:${BRAND.lime};opacity:.14">${esc(big)}</div>` : ''}<div style="position:absolute;left:70px;right:70px;top:${body ? 230 : 200}px">${kicker ? `<div class="pill" style="font-size:30px;padding:12px 26px">${esc(kicker)}</div>` : ''}<h2 style="font-size:${body ? 88 : 76}px;margin-top:38px">${em(title)}</h2>${body ? `<p style="font-size:44px;color:#CBD5E1;margin-top:44px;line-height:1.45">${em(body)}</p>` : ''}</div>`;
const withShot = (kicker, title, shotHtml, top = 560) => `${text(kicker, title)}<div style="position:absolute;left:0;right:0;top:${top}px;display:flex;justify-content:center">${shotHtml}</div>`;
const ctaSlide = (title, cta, sub = 'margokit.com — lien en bio') => `<div style="position:absolute;left:70px;right:70px;top:300px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:44px">${LOGO_SVG(150)}<h2 style="font-size:84px">${em(title)}</h2><div class="pill" style="font-size:42px;padding:24px 44px">${esc(cta)}</div><p class="muted" style="font-size:36px">${esc(sub)}</p><p class="muted" style="font-size:24px;letter-spacing:.08em;text-transform:uppercase">Margokit · un produit VIT GLOBAL</p></div>`;

const CAROUSELS = {
  'C1-word-vs-margokit': [
    (n, t) => S(n, t, cover('Tu factures encore sur *Word* ?', 'Ce que ça te coûte vraiment (et comment arrêter en 1 minute).')),
    (n, t) => S(n, t, text('Sur Word / Excel', 'Tu recopies, tu *cherches*, tu oublies.', '❌ le dernier numéro de facture (12 ou 13 ?)\n❌ l’ICE de ton client\n❌ la TVA à part\n❌ les mentions obligatoires')),
    (n, t) => S(n, t, withShot('Avec Margokit', 'Client, ligne, *c’est prêt*.', crop('editeur-mobile-full', { y: 2330, h: 2000, w: 640 }))),
    (n, t) => S(n, t, withShot('Numérotation', 'Un numéro *continu*, sans trou.', crop('facture-emise-haut-mobile-full', { y: 150, h: 1150, w: 900 }))),
    (n, t) => S(n, t, withShot('Envoi', 'Lien, e-mail ou *WhatsApp*.', crop('facture-emise-mobile', { y: 140, h: 1300, w: 820 }))),
    (n, t) => S(n, t, withShot('Relances (Pro)', 'Les relances partent *toutes seules*.', crop('settings-relances-mobile', { y: 120, h: 1150, w: 900 }))),
    (n, t) => S(n, t, ctaSlide('Facture. Encaisse. *Respire.*', 'Essaie Pro 7 jours — sans carte'), { swipe: false }),
  ],
  'C2-facture-maroc-article-145': [
    (n, t) => S(n, t, cover('Facture au Maroc : *5 oublis* fréquents', 'Ce que dit l’article 145 du Code général des impôts (édition DGI).')),
    ...[
      ['1', 'Ton *IF* + n° de taxe professionnelle', 'Article 145-III 2° : l’identifiant fiscal attribué par le service local des impôts, et le numéro d’article d’imposition à la taxe professionnelle.'],
      ['2', 'L’*ICE* de ton client', 'Article 145-III 4° : nom ou raison sociale, adresse et identifiant commun de l’entreprise (ICE) du client.'],
      ['3', 'La *TVA* à part', 'Article 145-III 6° : le montant de la TVA de manière distincte — ou la mention de l’exonération.'],
      ['4', 'Le *mode de paiement*', 'Article 145-III 7° : les références et le mode de paiement de la facture.'],
      ['5', 'Une numérotation *continue*', 'Factures pré-numérotées en série continue, ou éditées par un système informatique selon une série continue.'],
    ].map(([k, title, body]) => (n, t) => S(n, t, text(`Oubli n° ${k}`, title, body, k))),
    (n, t) => S(n, t, withShot('Margokit te prévient', 'Il manque ton IF ? *Tu le sais avant d’émettre.*', crop('warning-if-mobile', { y: 180, h: 1500, w: 760 }), 600)),
    (n, t) => S(n, t, text('À savoir', 'Les *auto-entrepreneurs* ont des règles particulières', 'L’article 145-XI exclut de ces dispositions les auto-entrepreneurs et la contribution professionnelle unique (CPU). Vérifie toujours ta situation avec ton comptable.')),
    (n, t) => S(n, t, ctaSlide('Le guide complet est *gratuit*', 'margokit.com/fr/guides', 'Enregistre ce post 📌'), { swipe: false }),
  ],
  'C3-se-faire-payer-plus-vite': [
    (n, t) => S(n, t, cover('Se faire *payer plus vite* : 5 réflexes', 'Sans être lourd avec tes clients.')),
    (n, t) => S(n, t, text('Réflexe 1', 'Une *échéance* écrite sur chaque facture', 'Sans date limite, « je te paie bientôt » n’a pas de fin.', '1')),
    (n, t) => S(n, t, text('Réflexe 2', 'Le *RIB* et un lien de paiement sur la facture', 'Moins d’étapes pour payer = paiement plus rapide.', '2')),
    (n, t) => S(n, t, withShot('Réflexe 3', 'Envoie-la là où ton client *répond* : WhatsApp', crop('vue-client-mobile', { y: 0, h: 1500, w: 760 }), 600)),
    (n, t) => S(n, t, withShot('Réflexe 4', 'Relance à *J+1, J+7, J+15* — automatiquement', crop('facture-retard-mobile', { y: 120, h: 700, w: 900 }), 640)),
    (n, t) => S(n, t, withShot('Réflexe 5', 'Regarde ton *reste à encaisser* chaque semaine', crop('revenus-mobile', { y: 160, h: 1450, w: 720 }), 600)),
    (n, t) => S(n, t, ctaSlide('Les 5 réflexes, *dans un seul outil*', 'Essaie Pro 7 jours — sans carte'), { swipe: false }),
  ],
  'C4-cloturer-2026': [
    (n, t) => S(n, t, cover('Clôture ton année *en 10 minutes*', 'Avant d’appeler ton comptable en janvier.')),
    (n, t) => S(n, t, withShot('1', 'Combien tu as *facturé et encaissé*', crop('revenus-clients-mobile-full', { y: 0, h: 1700, w: 760 }), 560)),
    (n, t) => S(n, t, withShot('2', 'Ce qui reste *à encaisser*', crop('documents-retard-mobile', { y: 150, h: 1500, w: 760 }), 560)),
    (n, t) => S(n, t, withShot('3', 'Tes *meilleurs clients*', crop('revenus-clients-mobile', { y: 1500, h: 900, w: 900 }), 600)),
    (n, t) => S(n, t, withShot('4', 'Prépare *janvier* : factures récurrentes', crop('recurrente-mobile', { y: 150, h: 1050, w: 900 }), 600)),
    (n, t) => S(n, t, ctaSlide('2027 commence *proprement*', 'Crée ton compte gratuit'), { swipe: false }),
  ],
  'C5-offre-pro': [
    (n, t) => S(n, t, cover('Margokit Pro : *7 jours gratuits*', 'Sans carte bancaire. En un clic depuis ton compte.')),
    (n, t) => S(n, t, text('Ce que Pro débloque', 'Illimité, *sans filigrane*', '✔ Devis, factures et avoirs illimités\n✔ Plus de filigrane « Fait avec Margokit »\n✔ Relances automatiques J+1 · J+7 · J+15\n✔ Factures récurrentes')),
    (n, t) => S(n, t, `<div style="position:absolute;left:70px;right:70px;top:210px"><h2 style="font-size:78px">À la fin de l’essai, <em>tu choisis</em></h2>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:60px">${[['0 $', 'Gratuit', '3 documents / mois'], ['5 $', 'par mois', 'résiliable'], ['49 $', 'par an', '2 mois offerts', 1], ['99 $', 'à vie', 'paiement unique']].map(([p, l, s, hl]) => `<div class="box" style="padding:44px 20px;text-align:center;${hl ? `border:3px solid ${BRAND.lime}` : ''}"><div class="k" style="font-size:96px">${p}</div><div class="muted" style="font-size:36px;font-weight:600">${l}</div><div style="margin-top:14px;font-size:28px;${hl ? `color:${BRAND.lime};font-weight:700` : 'color:#94A3B8'}">${s}</div></div>`).join('')}</div>
      <p class="muted" style="font-size:30px;margin-top:40px">Carte refusée ? Paiement local via WhatsApp.</p></div>`),
    (n, t) => S(n, t, ctaSlide('Essaie Pro *maintenant*', 'margokit.com'), { swipe: false }),
  ],
};

// ---------------------------------------------------------------------------
// Posts 1080 × 1350, stories 1080 × 1920, LinkedIn banner
// ---------------------------------------------------------------------------
const POSTS = {
  'P1-lancement': `${brand(70, 64)}<div style="position:absolute;left:70px;width:500px;top:200px"><h1 style="font-size:104px">Facture.<br>Encaisse.<br><em>Respire.</em></h1><p class="muted" style="font-size:36px;margin-top:34px">Devis et factures en 1 minute, relances automatiques. Pour les freelances et petites entreprises.</p></div><div style="position:absolute;right:50px;top:300px">${phone('dashboard-mobile', 400)}</div><div style="position:absolute;left:70px;bottom:90px"><div class="pill" style="font-size:34px;padding:18px 32px">Essai Pro 7 jours</div></div>`,
  'P2-nouveau-revenus': `${brand(70, 64)}<div style="position:absolute;left:70px;right:70px;top:190px"><div class="pill" style="font-size:28px;padding:10px 24px">Nouveau</div><h2 style="font-size:84px;margin-top:30px">Combien tu as <em>vraiment</em> encaissé en 2026 ?</h2></div><div style="position:absolute;left:0;right:0;top:620px;display:flex;justify-content:center">${crop('revenus-clients-mobile-full', { y: 0, h: 1500, w: 760 })}</div>`,
  'P3-nouveau-import': `${brand(70, 64)}<div style="position:absolute;left:70px;right:70px;top:190px"><div class="pill" style="font-size:28px;padding:10px 24px">Nouveau</div><h2 style="font-size:84px;margin-top:30px">Tes clients Excel dans Margokit <em>en 30 secondes</em></h2></div><div style="position:absolute;left:0;right:0;top:640px;display:flex;justify-content:center">${crop('clients-apres-import-mobile', { y: 150, h: 1300, w: 760 })}</div>`,
  'P4-whatsapp': `${brand(70, 64)}<div style="position:absolute;left:70px;right:70px;top:200px"><h2 style="font-size:88px">Ta facture, <em>sur WhatsApp</em>, en 1 clic.</h2><p class="muted" style="font-size:36px;margin-top:24px">Ton client l’ouvre sur son téléphone, avec ton RIB.</p></div><div style="position:absolute;left:0;right:0;top:600px;display:flex;justify-content:center">${crop('facture-emise-mobile', { y: 140, h: 1300, w: 760 })}</div>`,
  'P5-seller-pack': `${brand(70, 64)}<div style="position:absolute;left:70px;right:70px;top:220px"><h2 style="font-size:96px">ROAS 3.<br><em>Et tu perds de l’argent ?</em></h2><p class="muted" style="font-size:38px;margin-top:30px">Le Seller Pack (Google Sheets) calcule ton vrai bénéfice : livraison, frais, colis refusés et pub compris.</p><div style="margin-top:50px;display:flex;gap:18px;flex-wrap:wrap"><span class="pill" style="font-size:34px;padding:16px 30px">34 $ · une fois</span><span class="ghost" style="font-size:30px;padding:14px 28px">MAD · EUR · USD</span><span class="ghost" style="font-size:30px;padding:14px 28px">FR · EN</span></div></div>`,
  'P6-question': `${brand(70, 64)}<div style="position:absolute;left:70px;right:70px;top:300px;text-align:center"><h1 style="font-size:100px">Tu factures avec quoi aujourd’hui ?</h1><div style="margin-top:70px;display:flex;flex-direction:column;gap:22px;align-items:center">${['A · Word / Excel', 'B · Un carnet', 'C · Un logiciel', 'D · Je ne facture pas 😅'].map((x) => `<div class="box" style="font-size:44px;font-weight:700;padding:24px 40px;width:760px;text-align:left">${x}</div>`).join('')}</div><p class="muted" style="font-size:34px;margin-top:50px">Réponds en commentaire 👇</p></div>`,
};
const STORIES = {
  'S1-essai': `${brand(70, 160, 44)}<div style="position:absolute;left:70px;right:70px;top:330px"><h1 style="font-size:110px">7 jours de Pro, <em>gratuits</em>.</h1><p class="muted" style="font-size:44px;margin-top:30px">Sans carte bancaire.</p></div><div style="position:absolute;left:0;right:0;top:820px;display:flex;justify-content:center">${crop('plan-essai-mobile', { y: 760, h: 920, w: 900 })}</div><div style="position:absolute;left:0;right:0;bottom:300px;text-align:center"><div class="pill" style="font-size:44px;padding:24px 44px">Lien ⬆️</div></div>`,
  'S2-sondage': `${brand(70, 160, 44)}<div style="position:absolute;left:70px;right:70px;top:420px;text-align:center"><h1 style="font-size:100px">Un client t’a déjà payé avec <em>2 mois de retard</em> ?</h1><p class="muted" style="font-size:42px;margin-top:40px">(ajoute le sticker sondage ici)</p></div>`,
  'S3-revenus': `${brand(70, 160, 44)}<div style="position:absolute;left:70px;right:70px;top:320px"><h1 style="font-size:96px">Facturé <em>≠</em> encaissé.</h1></div><div style="position:absolute;left:0;right:0;top:640px;display:flex;justify-content:center">${crop('revenus-mobile', { y: 160, h: 1450, w: 820 })}</div>`,
};
const BANNER = `<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:space-between;padding:0 90px">
  <div style="display:flex;align-items:center;gap:30px">${LOGO_SVG(110)}<div><div class="k" style="font-size:64px">Facture. Encaisse. <em>Respire.</em></div><div class="muted" style="font-size:28px;margin-top:8px">Margokit — devis & factures en 1 minute · un produit VIT GLOBAL</div></div></div>
  <div class="pill" style="font-size:30px;padding:16px 30px">margokit.com</div></div>`;

// ---------------------------------------------------------------------------
// Présentation 1920 × 1080
// ---------------------------------------------------------------------------
const D = (inner) => `${brand(90, 60, 40)}${inner}<div style="position:absolute;right:90px;bottom:50px;color:#64748B;font-size:22px">margokit.com · un produit VIT GLOBAL TECHNOLOGIES GROUP</div>`;
const twoCol = (left, right) => `<div style="position:absolute;left:90px;top:200px;width:820px">${left}</div><div style="position:absolute;left:980px;top:150px;width:850px;height:820px;display:flex;align-items:center;justify-content:center">${right}</div>`;
const H = (t, s) => `<h2 style="font-size:72px">${em(t)}</h2>${s ? `<p style="font-size:34px;color:#CBD5E1;margin-top:30px">${em(s)}</p>` : ''}`;
const bullets = (items) => `<div style="display:flex;flex-direction:column;gap:22px;margin-top:40px">${items.map((x, i) => `<div class="row"><span class="num" style="width:56px;height:56px;font-size:28px">${i + 1}</span><p style="font-size:32px;color:#E2E8F0;padding-top:6px">${em(x)}</p></div>`).join('')}</div>`;
const DECK = [
  D(`<div style="position:absolute;left:90px;top:260px;width:1100px"><h1 style="font-size:130px">Facture.<br>Encaisse.<br><em>Respire.</em></h1><p class="muted" style="font-size:40px;margin-top:40px">Margokit — devis et factures en 1 minute, relances automatiques.<br>Pour les freelances et petites entreprises du Maroc, d’Afrique francophone et de France.</p></div><div style="position:absolute;right:120px;top:120px">${phone('dashboard-mobile', 400)}</div>`),
  D(twoCol(H('Le problème', 'Facturer prend du temps, et se faire payer encore plus.') + bullets(['Devis sur Word, facture sur Excel, relance sur WhatsApp', 'Numéros de facture à retrouver à la main', 'Mentions obligatoires oubliées (ICE, IF, TVA…)', 'Aucune vue claire de ce qui reste à encaisser']), `<div class="box" style="padding:60px;width:760px"><div class="k" style="font-size:52px">« Je te paie la semaine prochaine. »</div><p class="muted" style="font-size:30px;margin-top:20px">— il y a un mois</p></div>`)),
  D(twoCol(H('La solution : *Margokit*', 'Une application web simple, en français, en anglais et en arabe.') + bullets(['Devis → facture en 1 clic', 'Numérotation continue, mentions du pays, PDF propre', 'Envoi par lien, e-mail ou WhatsApp', 'Relances automatiques et page Revenus']), phone('devis-accepte-mobile', 380))),
  D(twoCol(H('*Conforme* par défaut', 'Les identifiants et mentions de ton pays, enregistrés une fois.') + bullets(['Maroc : ICE vérifié, IF, RC, taxe professionnelle (article 145 du CGI)', 'France : SIREN, TVA, mentions et pénalités de retard', 'Facture verrouillée à l’émission, correction par avoir', 'Exports facture électronique : Factur-X, UBL / Peppol']), crop('warning-if-mobile', { y: 180, h: 1500, w: 560 }))),
  D(twoCol(H('Payé *plus vite*') + bullets(['Partage WhatsApp : ton client ouvre la facture sur son téléphone', 'RIB et lien de paiement sur la facture', 'Relances par e-mail à J+1, J+7 et J+15, à ton nom (Pro)', 'Arrêt automatique dès que la facture est payée']), crop('vue-client-mobile', { y: 0, h: 1700, w: 560 }))),
  D(twoCol(H('Tes *revenus*, enfin clairs') + bullets(['Facturé et encaissé, mois par mois', 'Reste à encaisser et part en retard', 'Délai moyen de paiement, meilleurs clients', 'Comparaison avec l’année précédente']), `<div class="shot" style="width:850px"><img src="${uri('revenus-desktop')}" style="width:850px"></div>`)),
  D(twoCol(H('Gagne du temps *chaque mois*') + bullets(['Factures récurrentes : un brouillon prêt chaque mois, trimestre ou année', 'Import de tes clients depuis Excel (CSV)', 'Produits et prestations enregistrés', 'Fonctionne sur ordinateur et téléphone, rien à installer']), crop('recurrente-mobile', { y: 150, h: 1050, w: 700 }))),
  D(`<div style="position:absolute;left:90px;right:90px;top:180px"><h2 style="font-size:76px">Des prix <em>simples</em></h2><p class="muted" style="font-size:34px;margin-top:20px">Essai Pro 7 jours gratuit, sans carte bancaire.</p>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:28px;margin-top:70px">${[['0 $', 'Gratuit', '3 documents par mois, avec filigrane'], ['5 $', 'par mois', 'Pro, résiliable à tout moment'], ['49 $', 'par an', 'Pro, 2 mois offerts', 1], ['99 $', 'à vie', 'Pro, paiement unique']].map(([p, l, s, hl]) => `<div class="box" style="padding:56px 30px;text-align:center;${hl ? `border:3px solid ${BRAND.lime}` : ''}"><div class="k" style="font-size:110px">${p}</div><div class="muted" style="font-size:36px;font-weight:600">${l}</div><p style="margin-top:24px;font-size:28px;color:#CBD5E1">${s}</p></div>`).join('')}</div>
    <p class="muted" style="font-size:28px;margin-top:50px">Paiement par carte (Gumroad). Carte refusée ? Paiement local via WhatsApp.</p></div>`),
  D(twoCol(H('Pour les *e-commerçants* : le Seller Pack', 'Un Google Sheet en MAD, EUR ou USD, français et anglais.') + bullets(['Bénéfice réel par commande, colis refusés compris', 'Verdict par campagne de pub : rentable ou non', 'Prix minimum et ROAS d’équilibre', 'Trésorerie, budget et planning de contenu']), `<div class="box" style="padding:60px;text-align:center"><div class="k" style="font-size:120px">34 $</div><p class="muted" style="font-size:34px">paiement unique · margokit.gumroad.com</p></div>`)),
  D(`<div style="position:absolute;left:0;right:0;top:200px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:44px">${LOGO_SVG(160)}<h1 style="font-size:100px">Essaie Margokit <em>aujourd’hui</em></h1><div class="pill" style="font-size:44px;padding:24px 48px">margokit.com</div><p class="muted" style="font-size:32px">Une question ? contact@vit-global.tech · WhatsApp +212 6 07 74 26 72</p><p class="muted" style="font-size:26px;letter-spacing:.08em;text-transform:uppercase">Margokit est un produit de VIT GLOBAL TECHNOLOGIES GROUP</p></div>`),
];

// ---------------------------------------------------------------------------
const browser = await chromium.launch();
async function render(html, w, h, file) {
  mkdirSync(dirname(file), { recursive: true });
  const p = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await p.setContent(page({ w, h, body: html, css: CSS, bg: BRAND.ink }), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: file });
  await p.close();
}
const V = join(OUT, 'visuels');
async function toPdf(files, w, h, out) {
  const p = await browser.newPage();
  await p.setContent(`<html><head><style>@page{size:${w}px ${h}px;margin:0}body{margin:0}img{display:block;width:${w}px;height:${h}px;page-break-after:always}</style></head><body>${files.map((f) => `<img src="data:image/png;base64,${readFileSync(f).toString('base64')}">`).join('')}</body></html>`);
  await p.pdf({ path: out, width: `${w}px`, height: `${h}px`, printBackground: true });
  await p.close();
}
for (const [name, slides] of Object.entries(CAROUSELS)) {
  const files = [];
  for (const [i, s] of slides.entries()) {
    const f = join(V, 'carrousels', name, `${String(i + 1).padStart(2, '0')}.png`);
    await render(s(i + 1, slides.length), 1080, 1350, f);
    files.push(f);
  }
  // LinkedIn "document" posts take a PDF
  await toPdf(files, 1080, 1350, join(V, 'carrousels', `${name}.pdf`));
  console.log(`✓ carrousel ${name} (${slides.length} + PDF)`);
}
for (const [name, html] of Object.entries(POSTS)) await render(html, 1080, 1350, join(V, 'posts', `${name}.png`));
console.log(`✓ ${Object.keys(POSTS).length} posts`);
for (const [name, html] of Object.entries(STORIES)) await render(html, 1080, 1920, join(V, 'stories', `${name}.png`));
console.log(`✓ ${Object.keys(STORIES).length} stories`);
await render(BANNER, 1584, 396, join(V, 'banniere-linkedin-1584x396.png'));
// Presentation: PNG per slide + one PDF
const P = join(OUT, 'presentation');
const files = [];
for (const [i, html] of DECK.entries()) {
  const f = join(P, 'slides', `${String(i + 1).padStart(2, '0')}.png`);
  await render(html, 1920, 1080, f);
  files.push(f);
}
const pdf = await browser.newPage();
await pdf.setContent(`<html><head><style>@page{size:1920px 1080px;margin:0}body{margin:0}img{display:block;width:1920px;height:1080px;page-break-after:always}</style></head><body>${files.map((f) => `<img src="data:image/png;base64,${readFileSync(f).toString('base64')}">`).join('')}</body></html>`);
await pdf.pdf({ path: join(P, 'Margokit-presentation.pdf'), width: '1920px', height: '1080px', printBackground: true });
console.log(`✓ présentation (${DECK.length} slides + PDF)`);
await browser.close();
