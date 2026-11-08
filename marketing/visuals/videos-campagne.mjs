/**
 * Les 14 vidéos « à tourner » de la campagne « Ce que tu gardes vraiment », produites sans tournage :
 * 1080 × 1920, 24 i/s, sans voix (le son tendance s'ajoute dans TikTok / Instagram au moment de publier),
 * textes incrustés dans la zone sûre (hors interface TikTok), maquettes des vrais outils.
 *
 *   node marketing/visuals/videos-campagne.mjs            # les 14
 *   node marketing/visuals/videos-campagne.mjs colis      # seulement celles dont le nom contient « colis »
 *
 * Sortie : marketing/campagne/videos-campagne/NN-nom.mp4 + NN-nom.jpg (miniature). Non versionné (lourd).
 * Rendu image par image (temps maîtrisé, aucune animation en temps réel) puis assemblé par ffmpeg.
 * Chiffres : formules de app/src/lib/profit.ts (exemple 25 € → 5,65 €).
 */
import { spawn } from 'node:child_process';
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './data.mjs';
import { BRAND, page, logo, browser, sheetsApp, TRACKER_TABS, PACK_TABS, dashboard, ordersGrid, customersGrid, adsGrid } from './templates.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const OUT = join(ROOT, 'marketing', 'campagne', 'videos-campagne');
const ASSETS = join(HERE, 'assets');
const FPS = 24;
const { chromium } = await import(join(ROOT, 'app', 'node_modules', 'playwright', 'index.mjs'));

const D = build('fr');
const MA = build('ma');
const tabs = (d, keys) => keys.map((k) => [k, d.t.sheets[k]]);
const app = (d, { pack = false, active, body }) => sheetsApp({ title: pack ? d.t.packFile : d.t.file, tabs: tabs(d, pack ? PACK_TABS : TRACKER_TABS), active, body });
const zoom = (html, z) => `<div style="zoom:${z}">${html}</div>`;
const asset = (f) => `data:image/png;base64,${readFileSync(join(ASSETS, f)).toString('base64')}`;
const img = (f, style = '') => `<img src="${asset(f)}" class="shot" style="${style}">`;
/** Zoom sur une zone d'une capture (coordonnées en pixels de l'image), affichée sur 900 px de large. */
const crop = (f, natW, { sx, sy, sw, sh }) => {
  const k = 900 / sw;
  return `<div style="width:900px;height:${Math.round(sh * k)}px;overflow:hidden;border-radius:26px;box-shadow:0 40px 90px rgba(0,0,0,.45);background:#fff"><img src="${asset(f)}" style="display:block;width:${Math.round(natW * k)}px;max-width:none;margin-left:-${Math.round(sx * k)}px;margin-top:-${Math.round(sy * k)}px"></div>`;
};
const sheet = (html, w = 860, h = 760) => `<div class="sheetwrap">${browser(html, { width: w, height: h })}</div>`;

// Visuels réutilisés
const V = {
  dash: () => sheet(app(D, { active: 'dashboard', body: zoom(dashboard(D, { chartRows: 1 }), 0.8) }), 900, 700),
  dashTall: () => sheet(app(D, { active: 'dashboard', body: zoom(dashboard(D, { chartRows: 1 }), 1.15) }), 900, 1300),
  orders: () => sheet(app(D, { active: 'orders', body: zoom(ordersGrid(D, { pick: [1, 2, 6, 10, 18], rowH: 40, fill: 4 }), 1.3) }), 900, 640),
  customers: () => sheet(app(MA, { active: 'customers', body: zoom(customersGrid(MA, { pick: [1, 4, 6, 7, 11], focusTags: true, rowH: 40, fill: 4 }), 1.45) }), 900, 560),
  ads: () => sheet(app(D, { pack: true, active: 'ads', body: zoom(adsGrid(D, { pick: [2, 4, 9, 11, 12], rowH: 44, fill: 4, hlVerdict: true }), 1.25) }), 900, 620),
  adsSpend: () => sheet(app(D, { pack: true, active: 'ads', body: zoom(adsGrid(D, { pick: [2, 3, 4, 5], rowH: 44, fill: 4 }), 1.35) }), 900, 620),
};

// ---------------------------------------------------------------------------
// Les 14 vidéos. Types de séquence : hook, say, num, rows, list, shot, cta. d = durée (s).
// ---------------------------------------------------------------------------
const CTA_CALC = { type: 'cta', title: 'Calcule <em>ton</em> vrai bénéfice', sub: 'Gratuit · sans inscription', link: 'Lien en bio', d: 3 };
export const VIDEOS = [
  { slug: '01-ca-benefice', title: 'CA ≠ bénéfice', beats: [
    { type: 'hook', text: '« J’ai fait 10&nbsp;000&nbsp;€ ce mois-ci. »', sub: 'Non.', d: 3 },
    { type: 'say', text: 'Tu as <em>VENDU</em> 10&nbsp;000&nbsp;€.', d: 2.2 },
    { type: 'list', title: 'Il faut encore payer', items: ['Les produits', 'La livraison', 'La pub', 'Les frais', 'Les colis refusés'], d: 4 },
    { type: 'num', label: 'Ce qu’il reste, au mieux', value: '15 à 25&nbsp;%', d: 2.6 },
    { type: 'num', label: 'Soit', value: '1&nbsp;500 à 2&nbsp;500&nbsp;€', d: 2.6 },
    { type: 'shot', text: 'Connais <em>ton</em> chiffre avant de quitter ton travail.', visual: V.dash, d: 4 },
    CTA_CALC,
  ] },
  { slug: '02-3-erreurs', title: '3 erreurs qui tuent ta marge', beats: [
    { type: 'hook', text: '3 erreurs qui <em>tuent</em> ta marge', sub: '(la 3<sup>e</sup> est la pire)', d: 3 },
    { type: 'rows', title: 'Erreur 1 · Oublier l’emballage', rows: [['0,50&nbsp;€ × 1&nbsp;000 commandes', '500&nbsp;€', 'neg']], d: 3.2 },
    { type: 'rows', title: 'Erreur 2 · Ignorer les frais de paiement', rows: [['Sur chaque vente', '≈ 3&nbsp;%', 'neg']], d: 3.2 },
    { type: 'rows', title: 'Erreur 3 · Oublier les colis refusés', rows: [['Avec 20&nbsp;% de refus', '5,65&nbsp;€'], ['Avec 30&nbsp;% de refus', '3,42&nbsp;€', 'neg']], d: 4.2 },
    { type: 'say', text: 'Laquelle <em>tu fais</em>&nbsp;?', sub: 'Dis-le en commentaire 👇', d: 2.4 },
    CTA_CALC,
  ] },
  { slug: '03-prix-minimum', title: 'Le prix minimum', beats: [
    { type: 'hook', text: 'En dessous de ce prix, tu travailles <em>gratuitement</em>.', d: 3.2 },
    { type: 'shot', text: 'Produit vendu 25&nbsp;€', visual: () => img('calc-fr-hlPrice.png', 'width:860px'), d: 3.6 },
    { type: 'num', label: 'Prix minimum (0 bénéfice)', value: '19,18&nbsp;€', d: 2.8 },
    { type: 'rows', title: 'Ce que tu gardes', rows: [['À 19,99&nbsp;€', '0,79&nbsp;€', 'neg'], ['À 25,00&nbsp;€', '5,65&nbsp;€'], ['À 27,76&nbsp;€', '30&nbsp;% de marge', 'pos']], d: 4 },
    { type: 'say', text: 'Une promo sous ton prix minimum = <em>une perte</em> à chaque vente.', d: 3 },
    CTA_CALC,
  ] },
  { slug: '04-vendre-plus', title: 'Mythe : il faut vendre plus', beats: [
    { type: 'hook', text: 'Tu n’as pas besoin de <em>plus de ventes</em>.', sub: 'Tu as besoin de meilleures marges.', d: 3.4 },
    { type: 'rows', title: 'Option A', rows: [['100 ventes × 1&nbsp;€', '100&nbsp;€']], d: 2.6 },
    { type: 'rows', title: 'Option B', rows: [['50 ventes × 8&nbsp;€', '400&nbsp;€', 'pos']], d: 2.6 },
    { type: 'say', text: 'Moitié moins de travail. <em>4 fois</em> plus d’argent.', d: 3 },
    { type: 'say', text: 'Corrige ta marge. <em>Ensuite</em> accélère.', d: 2.6 },
    CTA_CALC,
  ] },
  { slug: '05-prix-plus-10', title: '+10 % de prix = +43 % de bénéfice', beats: [
    { type: 'hook', text: '+10&nbsp;% sur ton prix.', sub: 'Regarde ton bénéfice.', d: 3 },
    { type: 'rows', title: 'Même produit, mêmes coûts', rows: [['Vendu 25,00&nbsp;€', '5,65&nbsp;€'], ['Vendu 27,50&nbsp;€', '8,08&nbsp;€', 'pos']], d: 4 },
    { type: 'num', label: 'Bénéfice en plus', value: '+43&nbsp;%', d: 2.8 },
    { type: 'say', text: 'Ton client ne verra pas 2,50&nbsp;€.', sub: 'Ton compte en banque, si.', d: 3.2 },
    CTA_CALC,
  ] },
  { slug: '06-dropshipping-1-euro', title: 'Le dropshipping à 1 €', beats: [
    { type: 'hook', text: 'Ce produit rapporte <em>1,03&nbsp;€</em> par vente.', d: 3 },
    { type: 'rows', title: 'Sur le papier', rows: [['Prix de vente', '29,99&nbsp;€'], ['Coût du produit', '− 12,00&nbsp;€', 'neg'], ['« Marge »', '≈ 18&nbsp;€']], d: 3.6 },
    { type: 'list', title: 'Maintenant ajoute', items: ['15&nbsp;€ de pub par commande', 'Les frais Shopify et de paiement', '5&nbsp;% de remboursements'], d: 3.8 },
    { type: 'num', label: 'Ce que tu gardes vraiment', value: '1,03&nbsp;€', d: 2.8 },
    { type: 'say', text: 'Tu travailles pour <em>Facebook</em>.', d: 2.4 },
    CTA_CALC,
  ] },
  { slug: '07-colis-refuse', title: 'Le colis refusé (COD)', beats: [
    { type: 'hook', text: '30&nbsp;% de colis refusés → 15&nbsp;%', sub: '= +66&nbsp;% de bénéfice', d: 3.2 },
    { type: 'rows', title: 'Paiement à la livraison', rows: [['Prix', '199 DH'], ['Produit', '60 DH'], ['Emballage + livraison', '40 DH'], ['Pub par commande', '30 DH']], d: 3.6 },
    { type: 'num', label: 'Avec 30&nbsp;% de colis refusés', value: '32 DH', cls: 'neg', d: 2.6 },
    { type: 'num', label: 'Avec 15&nbsp;% de colis refusés', value: '54 DH', cls: 'pos', d: 2.6 },
    { type: 'say', text: 'Même pub. Même prix.', sub: 'Confirme tes commandes avant d’expédier.', d: 3 },
    { type: 'cta', title: 'Calcule en <em>DH</em>', sub: 'Gratuit · sans inscription', link: 'Lien en bio', d: 3 },
  ] },
  { slug: '08-script-confirmation', title: 'Le script de confirmation', beats: [
    { type: 'hook', text: 'L’appel de 20 secondes qui réduit tes <em>colis refusés</em>', d: 3.4 },
    { type: 'bubble', title: 'Avant d’expédier : appel ou vocal', text: 'Bonjour, c’est [ta boutique]. Je confirme ta commande de [produit], total [prix] DH, livrée demain à [ville]. Tu seras disponible&nbsp;?', d: 5.5 },
    { type: 'say', text: 'Pas de réponse <em>2 fois</em>&nbsp;?', sub: 'N’expédie pas.', d: 2.6 },
    { type: 'shot', text: 'Note-le dans ton suivi de commandes', visual: V.orders, d: 3.6 },
    { type: 'cta', title: 'Enregistre ce script <em>📌</em>', sub: 'Et calcule ton taux de refus limite', link: 'Lien en bio', d: 3 },
  ] },
  { slug: '09-roas-ment', title: 'Le ROAS qui ment', beats: [
    { type: 'hook', text: 'ROAS de 3.', sub: 'Tu gagnes 23 centimes.', d: 3 },
    { type: 'rows', title: 'Produit à 25&nbsp;€, 1 colis sur 5 refusé', rows: [['ROAS 2,5', '− 1,85&nbsp;€', 'neg'], ['ROAS 3', '+ 0,23&nbsp;€'], ['ROAS 4', '+ 2,84&nbsp;€', 'pos']], d: 4.2 },
    { type: 'shot', text: 'Ton seuil se calcule', visual: () => img('calc-fr-hlRoas.png', 'width:860px'), d: 3.4 },
    { type: 'num', label: 'ROAS minimum rentable', value: '2,93', d: 2.6 },
    { type: 'say', text: 'En dessous, chaque vente te <em>coûte</em> de l’argent.', d: 2.8 },
    { type: 'cta', title: 'Calcule <em>ton</em> ROAS minimum', sub: 'Gratuit · 10 secondes', link: 'Lien en bio', d: 3 },
  ] },
  { slug: '10-quelle-pub-couper', title: 'Quelle pub couper ?', beats: [
    { type: 'hook', text: '2 pubs sur 6 <em>perdaient</em> de l’argent.', sub: 'Le ROAS ne le montrait pas.', d: 3.4 },
    { type: 'shot', text: 'Le vrai bénéfice par campagne', visual: V.ads, d: 4.4 },
    { type: 'rows', title: 'Exemple', rows: [['Montre · ROAS 1,96', '− 20,86&nbsp;€', 'neg'], ['Sac cabas · ROAS 0,88', '− 5,55&nbsp;€', 'neg'], ['Sérum · ROAS 3,87', '+ 76,21&nbsp;€', 'pos']], d: 4 },
    { type: 'say', text: 'Rouge = <em>stop</em>.', d: 2.2 },
    { type: 'cta', title: 'Pack Vendeur', sub: 'Verdict ✅ / ❌ pour chaque campagne', link: 'Lien en bio', d: 3 },
  ] },
  { slug: '11-factures-word', title: 'Arrête les factures sur Word', beats: [
    { type: 'hook', text: 'Arrête de faire tes factures sur <em>Word</em>.', d: 3 },
    { type: 'list', title: 'Ça te parle&nbsp;?', items: ['facture_finale_v3.docx', 'Un mauvais calcul de TVA', 'Le numéro fiscal oublié', 'Le client qui « n’a rien reçu »'], d: 4.2 },
    { type: 'shot', text: 'Ta facture prête <em>en 1 minute</em>', visual: () => img('pdf-fr.png', 'height:900px'), d: 3.6 },
    { type: 'say', text: 'Devis → facture en 1 clic.', sub: 'Envoi par WhatsApp, e-mail ou lien.', d: 3 },
    { type: 'cta', title: 'Margokit Pro', sub: 'Gratuit jusqu’à 3 documents par mois', link: 'Lien en bio', d: 3 },
  ] },
  { slug: '12-devis-facture', title: 'Le devis qui devient facture', beats: [
    { type: 'hook', text: 'Le client a dit oui.', sub: 'La facture prend… 1 clic.', d: 3 },
    { type: 'shot', text: 'Ton devis est accepté', visual: () => crop('app-quote.png', 2560, { sx: 470, sy: 120, sw: 1250, sh: 1150 }), d: 3.6 },
    { type: 'shot', text: '1 clic : la facture est créée', visual: () => crop('app-invoice-fr.png', 2560, { sx: 470, sy: 120, sw: 1250, sh: 1150 }), d: 3.6 },
    { type: 'shot', text: 'Envoyée sur <em>WhatsApp</em>', visual: () => crop('app-share.png', 1792, { sx: 0, sy: 0, sw: 1150, sh: 510 }), d: 3.4 },
    { type: 'cta', title: 'Margokit Pro', sub: 'Gratuit jusqu’à 3 documents par mois', link: 'Lien en bio', d: 3 },
  ] },
  { slug: '13-tableau-de-bord', title: 'Le tableau de bord en 15 secondes', beats: [
    { type: 'hook', text: 'Tout vendeur a besoin de ce <em>tableau de bord</em>.', d: 3 },
    { type: 'pan', visual: V.dashTall, captions: ['Chiffre d’affaires', 'Bénéfice net', 'Taux de livraison', 'Taux de retour', 'Panier moyen', 'Meilleur canal'], d: 9 },
    { type: 'say', text: 'Tout se calcule <em>tout seul</em>', sub: 'depuis tes commandes.', d: 2.6 },
    { type: 'cta', title: 'Template Google Sheets', sub: 'Paiement unique · Remboursé sous 14 jours', link: 'Lien en bio', d: 3 },
  ] },
  { slug: '14-routine-dimanche', title: 'La routine du dimanche', beats: [
    { type: 'hook', text: 'La routine du dimanche d’un vendeur qui <em>connaît ses chiffres</em>', sub: '5 minutes', d: 3.4 },
    { type: 'shot', text: '1 · Mets à jour tes commandes', visual: V.orders, d: 3 },
    { type: 'shot', text: '2 · Ajoute ta dépense pub', visual: V.adsSpend, d: 3 },
    { type: 'shot', text: '3 · Regarde ton bénéfice', visual: V.dash, d: 3 },
    { type: 'shot', text: '4 · Coupe les pubs en <em>rouge</em>', visual: V.ads, d: 3 },
    { type: 'say', text: 'Terminé.', sub: '5 minutes par semaine.', d: 2 },
    { type: 'cta', title: 'Pack Vendeur', sub: 'Commandes, pub, contenu, trésorerie', link: 'Lien en bio', d: 3 },
  ] },
];

// ---------------------------------------------------------------------------
// HTML d'une vidéo + moteur de temps (window.__render(t))
// ---------------------------------------------------------------------------
const CSS = `
body{background:radial-gradient(1100px 900px at 85% -10%,rgba(163,230,53,.20),transparent 60%),radial-gradient(900px 700px at -10% 110%,rgba(163,230,53,.10),transparent 60%),${BRAND.ink};color:#fff}
.top{position:absolute;left:80px;right:80px;top:110px;display:flex;justify-content:space-between;align-items:center}
.prog{position:absolute;left:0;top:0;height:10px;background:${BRAND.lime}}
.beat{position:absolute;left:80px;right:150px;top:300px;bottom:430px;display:flex;flex-direction:column;justify-content:center;gap:40px;opacity:0}
h1,.cap{font-family:'Plus Jakarta Sans',Inter,sans-serif;font-weight:800;letter-spacing:-0.03em;line-height:1.06;text-wrap:balance}
em{font-style:normal;color:${BRAND.lime}}
.sub{font-size:58px;line-height:1.25;color:#CBD5E1;font-weight:600}
.lbl{font-size:52px;font-weight:700;color:#94A3B8}
.big{font-family:'Plus Jakarta Sans',Inter,sans-serif;font-weight:800;letter-spacing:-0.04em;line-height:.95;font-size:220px;color:${BRAND.lime};font-variant-numeric:tabular-nums}
.big.neg{color:#F87171}.big.pos{color:${BRAND.lime}}
.card{background:rgba(255,255,255,.07);border:2px solid rgba(255,255,255,.14);border-radius:36px;padding:20px 48px}
.row{display:flex;justify-content:space-between;align-items:baseline;gap:30px;font-size:58px;padding:28px 0;border-bottom:2px solid rgba(255,255,255,.12);font-variant-numeric:tabular-nums;opacity:0}
.row:last-child{border-bottom:0}.row b{font-weight:800;white-space:nowrap}.neg{color:#F87171}.pos{color:${BRAND.lime}}
.item{display:flex;gap:28px;align-items:center;font-size:56px;font-weight:600;opacity:0}
.item i{flex:none;width:64px;height:64px;border-radius:18px;background:${BRAND.lime};color:${BRAND.ink};font-style:normal;font-weight:800;display:grid;place-items:center;font-size:38px}
.vis{display:flex;justify-content:center;align-items:flex-start;max-height:980px;overflow:hidden;border-radius:30px}
.shot{border-radius:26px;display:block;box-shadow:0 40px 90px rgba(0,0,0,.45);max-width:100%}
.sheetwrap{border-radius:26px;overflow:hidden;box-shadow:0 40px 90px rgba(0,0,0,.45);background:#fff}
.bubble{background:#DCF8C6;color:#0F172A;border-radius:44px 44px 44px 10px;padding:44px 52px;font-size:50px;line-height:1.35;font-weight:500;box-shadow:0 30px 70px rgba(0,0,0,.35)}
.cta{align-items:flex-start}
.btn{display:inline-flex;align-items:center;gap:20px;background:${BRAND.lime};color:${BRAND.ink};font-weight:800;font-size:60px;border-radius:30px;padding:34px 52px;font-family:'Plus Jakarta Sans',Inter,sans-serif}
.panwrap{position:relative;height:1050px;overflow:hidden;border-radius:30px}
.pancap{position:absolute;left:0;right:0;bottom:0;padding:34px 40px;background:linear-gradient(transparent,rgba(15,23,42,.95) 40%);font-family:'Plus Jakarta Sans',Inter,sans-serif;font-weight:800;font-size:76px;color:#fff}
.pancap span{color:${BRAND.lime}}
`;

function beatHtml(b, i) {
  const vis = b.visual ? `<div class="vis"><div class="kb">${b.visual()}</div></div>` : '';
  switch (b.type) {
    case 'hook': return `<div class="beat" data-i="${i}"><h1 style="font-size:118px">${b.text}</h1>${b.sub ? `<div class="sub" style="font-size:66px;color:#fff">${b.sub}</div>` : ''}</div>`;
    case 'say': return `<div class="beat" data-i="${i}"><div class="cap" style="font-size:116px">${b.text}</div>${b.sub ? `<div class="sub">${b.sub}</div>` : ''}</div>`;
    case 'num': return `<div class="beat" data-i="${i}"><div class="lbl">${b.label}</div><div class="big pop ${b.cls ?? ''}">${b.value}</div></div>`;
    case 'rows': return `<div class="beat" data-i="${i}"><div class="cap" style="font-size:70px">${b.title}</div><div class="card">${b.rows.map(([l, v, c = '']) => `<div class="row stag"><span>${l}</span><b class="${c}">${v}</b></div>`).join('')}</div></div>`;
    case 'list': return `<div class="beat" data-i="${i}"><div class="cap" style="font-size:76px">${b.title}</div><div style="display:flex;flex-direction:column;gap:34px">${b.items.map((t) => `<div class="item stag"><i>+</i><span>${t}</span></div>`).join('')}</div></div>`;
    case 'shot': return `<div class="beat" data-i="${i}" style="justify-content:flex-start;gap:44px"><div class="cap" style="font-size:72px">${b.text}</div>${vis}</div>`;
    case 'bubble': return `<div class="beat" data-i="${i}"><div class="lbl">${b.title}</div><div class="bubble pop">${b.text}</div></div>`;
    case 'pan': return `<div class="beat" data-i="${i}" style="justify-content:flex-start"><div class="panwrap"><div class="panner">${b.visual()}</div>${b.captions.map((c, k) => `<div class="pancap" data-k="${k}" style="opacity:0"><span>${String(k + 1).padStart(2, '0')}</span> ${c}</div>`).join('')}</div></div>`;
    case 'cta': return `<div class="beat cta" data-i="${i}"><div>${logo(120, '#fff')}</div><h1 style="font-size:112px">${b.title}</h1><div class="sub">${b.sub}</div><div><span class="btn pop">${b.link} ↓</span></div><div class="sub" style="font-size:44px;color:#94A3B8">margokit.com</div></div>`;
  }
  throw new Error(`type ${b.type}`);
}

function videoHtml(v) {
  let t = 0;
  const timeline = v.beats.map((b) => { const s = t; t += b.d; return { s, d: b.d, type: b.type, n: b.captions?.length ?? 0 }; });
  const body = `<div class="prog" id="prog"></div><div class="top">${logo(64, '#fff')}<span style="font-size:34px;font-weight:700;color:#94A3B8">${v.title}</span></div>${v.beats.map(beatHtml).join('')}
<script>
const TL=${JSON.stringify(timeline)}, TOTAL=${t};
const ease=(x)=>1-Math.pow(1-Math.min(1,Math.max(0,x)),3);
window.__total=TOTAL;
window.__render=(t)=>{
  document.getElementById('prog').style.width=(100*t/TOTAL)+'%';
  document.querySelectorAll('.beat').forEach((el)=>{
    const b=TL[+el.dataset.i], lt=t-b.s, last=+el.dataset.i===TL.length-1;
    if(lt<0||lt>b.d){el.style.opacity=0;return;}
    const inn=ease(lt/0.35), out=last?1:1-ease((lt-(b.d-0.25))/0.25);
    el.style.opacity=Math.min(inn,out); el.style.transform='translateY('+((1-inn)*50)+'px)';
    el.querySelectorAll('.stag').forEach((s,k)=>{const p=ease((lt-0.3-k*0.4)/0.35);s.style.opacity=p;s.style.transform='translateX('+((1-p)*-40)+'px)';});
    el.querySelectorAll('.pop').forEach((s)=>{const p=ease((lt-0.15)/0.4);s.style.transform='scale('+(0.82+0.18*p)+')';s.style.transformOrigin='left center';});
    el.querySelectorAll('.kb').forEach((s)=>{s.style.transform='scale('+(1+0.05*lt/b.d)+')';s.style.transformOrigin='center top';});
    const pan=el.querySelector('.panner');
    if(pan){const wrapH=el.querySelector('.panwrap').clientHeight, h=pan.scrollHeight, travel=Math.max(0,h-wrapH);
      pan.style.transform='translateY('+(-travel*ease(lt/b.d))+'px)';
      el.querySelectorAll('.pancap').forEach((c)=>{const k=+c.dataset.k, seg=b.d/b.n, x=lt-k*seg; c.style.opacity=(x>=0&&x<seg)?Math.min(1,x/0.25,(seg-x)/0.2):0;});}
  });
};
</script>`;
  return { html: page({ w: 1080, h: 1920, body, css: CSS }), total: t };
}

// ---------------------------------------------------------------------------
// Rendu
// ---------------------------------------------------------------------------
async function renderVideo(browserInst, v) {
  const { html, total } = videoHtml(v);
  const pg = await browserInst.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await pg.setContent(html, { waitUntil: 'networkidle' });
  await pg.evaluate(() => document.fonts.ready);
  const file = join(OUT, `${v.slug}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-i', '-', '-f', 'lavfi', '-i', 'anullsrc=r=44100:cl=stereo',
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '64k', '-shortest', '-movflags', '+faststart', file]);
  const done = new Promise((res, rej) => ff.on('close', (c) => (c === 0 ? res() : rej(new Error(`ffmpeg ${c}`)))));
  const frames = Math.round(total * FPS);
  for (let f = 0; f < frames; f++) {
    await pg.evaluate((t) => window.__render(t), f / FPS);
    const buf = await pg.screenshot({ type: 'jpeg', quality: 88 });
    if (!ff.stdin.write(buf)) await new Promise((r) => ff.stdin.once('drain', r));
    if (f === Math.round(1.4 * FPS)) await pg.screenshot({ path: join(OUT, `${v.slug}.jpg`), type: 'jpeg', quality: 85 });
  }
  ff.stdin.end();
  await done;
  await pg.close();
  console.log(`✓ ${v.slug}.mp4  ${total.toFixed(1)} s`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  mkdirSync(OUT, { recursive: true });
  const filter = process.argv[2];
  const b = await chromium.launch();
  for (const v of VIDEOS.filter((x) => !filter || x.slug.includes(filter))) await renderVideo(b, v);
  await b.close();
}
