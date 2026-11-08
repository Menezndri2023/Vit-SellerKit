/**
 * Visuals of the social campaign « Ce que tu gardes vraiment » (Nov–Dec 2026).
 * Output: marketing/campagne/visuels/ (see marketing/campagne/README.md).
 *
 *   - carousels 1080 × 1350 (Instagram, Facebook; LinkedIn gets them as PDF via marketing/campagne/build.mjs)
 *   - stories / TikTok covers 1080 × 1920
 *   - project presentation deck 1920 × 1080
 *
 * Every number comes from the real calculator formulas (app/src/lib/profit.ts), example of the
 * Seller Pack price calculator: price 25, product 6, packaging 0.50, shipping 5, return fee 3,
 * payment 2.9 %, ads 4 / order, 20 % returns → 5.65 profit.
 */
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './data.mjs';
import {
  BRAND, page, logo, browser, sheetsApp, TRACKER_TABS, PACK_TABS,
  dashboard, customersGrid, adsGrid, pricingView,
} from './templates.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
export const CAMPAIGN_OUT = join(HERE, '..', 'campagne', 'visuels');

const DATA = { fr: build('fr'), ma: build('ma') };
const tabs = (d, keys) => keys.map((k) => [k, d.t.sheets[k]]);
const app = (d, { pack = false, active, body }) =>
  sheetsApp({ title: pack ? d.t.packFile : d.t.file, tabs: tabs(d, pack ? PACK_TABS : TRACKER_TABS), active, body });
const zoom = (html, z) => `<div style="zoom:${z}">${html}</div>`;

const CSS = `
.sl{position:relative;overflow:hidden;display:flex;flex-direction:column}
.dark{background:radial-gradient(900px 600px at 90% -5%,rgba(163,230,53,.22),transparent 60%),${BRAND.ink};color:#fff}
.light{background:radial-gradient(800px 560px at 100% 0%,rgba(163,230,53,.26),transparent 60%),${BRAND.bg};color:${BRAND.ink}}
.lime{background:${BRAND.lime};color:${BRAND.ink}}
.kick{display:inline-flex;align-items:center;gap:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;border-radius:999px;align-self:flex-start}
.dark .kick{background:rgba(163,230,53,.14);color:${BRAND.lime};border:1px solid rgba(163,230,53,.35)}
.light .kick{background:#fff;color:${BRAND.limeInk};border:1px solid #D9F99D}
.lime .kick{background:${BRAND.ink};color:${BRAND.lime}}
h1,h2{font-family:'Plus Jakarta Sans',Inter,sans-serif;font-weight:800;letter-spacing:-0.025em;line-height:1.04;text-wrap:balance}
.dark em{font-style:normal;color:${BRAND.lime}}
.light em{font-style:normal;background:linear-gradient(transparent 60%,${BRAND.lime} 60%,${BRAND.lime} 92%,transparent 92%);padding:0 .05em}
.lime em{font-style:normal;text-decoration:underline;text-decoration-thickness:.08em;text-underline-offset:.1em}
.sub{line-height:1.4}
.dark .sub{color:#CBD5E1}.light .sub,.lime .sub{color:#334155}
.foot{flex:none;display:flex;align-items:center;justify-content:space-between}
.dark .foot{border-top:1px solid rgba(255,255,255,.12)}.light .foot{border-top:1px solid ${BRAND.line}}.lime .foot{border-top:1px solid rgba(15,23,42,.18)}
.pg{font-weight:700;font-variant-numeric:tabular-nums}
.dark .pg{color:#94A3B8}.light .pg,.lime .pg{color:#475569}
.shot{border-radius:22px;box-shadow:0 30px 70px rgba(2,6,23,.35),0 0 0 1px rgba(15,23,42,.08);display:block}
.big{font-family:'Plus Jakarta Sans',Inter,sans-serif;font-weight:800;letter-spacing:-0.04em;line-height:.95;font-variant-numeric:tabular-nums}
.rows{display:flex;flex-direction:column}
.row{display:flex;justify-content:space-between;align-items:baseline;font-variant-numeric:tabular-nums}
.dark .row{border-bottom:1px solid rgba(255,255,255,.12)}.light .row{border-bottom:1px solid ${BRAND.line}}.lime .row{border-bottom:1px solid rgba(15,23,42,.15)}
.row b{font-weight:800}
.neg{color:#F87171}.light .neg{color:#DC2626}
.pos{color:${BRAND.lime}}.light .pos{color:${BRAND.limeInk}}
.card{border-radius:24px}
.dark .card{background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.12)}
.light .card{background:#fff;border:1px solid ${BRAND.line};box-shadow:0 10px 30px rgba(15,23,42,.06)}
.lime .card{background:rgba(255,255,255,.55);border:1px solid rgba(15,23,42,.12)}
.price{display:inline-block;font-weight:800;border-radius:999px;padding:8px 18px;background:${BRAND.ink};color:${BRAND.lime}}
.dark .price{background:${BRAND.lime};color:${BRAND.ink}}
.cta{display:inline-flex;align-items:center;gap:14px;font-weight:800;border-radius:18px;background:${BRAND.ink};color:#fff}
.dark .cta{background:${BRAND.lime};color:${BRAND.ink}}
.tick{display:flex;gap:16px;align-items:flex-start;line-height:1.35}
.tick i{flex:none;font-style:normal;width:44px;height:44px;border-radius:12px;background:${BRAND.lime};color:${BRAND.ink};font-weight:800;display:grid;place-items:center;font-size:24px}
.dark .tick i{background:rgba(163,230,53,.18);color:${BRAND.lime}}
.lime .tick i{background:${BRAND.ink};color:${BRAND.lime}}
.nw{white-space:nowrap}
`;

const FOOT = 'Sache ce que tu gardes vraiment.';

// ---------------------------------------------------------------------------
// Carousel slide (1080 × 1350)
// ---------------------------------------------------------------------------

function slide({ theme = 'light', kick, title, size = 96, sub, body = '', n, total, swipe = false }) {
  const html = `<div class="sl ${theme}" style="width:1080px;height:1350px">
    <div style="flex:1;min-height:0;display:flex;flex-direction:column;padding:80px 80px 0;gap:30px;position:relative">
      ${kick ? `<span class="kick" style="font-size:22px;padding:11px 20px">${kick}</span>` : ''}
      ${title ? `<h1 style="font-size:${size}px">${title}</h1>` : ''}
      ${sub ? `<div class="sub" style="font-size:36px">${sub}</div>` : ''}
      <div style="flex:1;min-height:0;position:relative;overflow:hidden">${body}</div>
    </div>
    <div class="foot" style="height:130px;padding:0 80px;margin-top:20px">${logo(54, theme === 'dark' ? '#fff' : BRAND.ink, theme === 'lime')}
      <span class="pg" style="font-size:26px">${swipe ? 'Glisse →&nbsp;&nbsp;' : ''}${n}/${total}</span></div></div>`;
  return page({ w: 1080, h: 1350, body: html, css: CSS });
}

const rows = (items, fs = 40, pad = 22) => `<div class="rows">${items.map(([l, v, cls = '']) =>
  `<div class="row" style="font-size:${fs}px;padding:${pad}px 0"><span>${l}</span><b class="${cls}">${v}</b></div>`).join('')}</div>`;
const ticks = (items, fs = 36, gap = 30) => `<div style="display:flex;flex-direction:column;gap:${gap}px">${items.map(([i, t]) =>
  `<div class="tick" style="font-size:${fs}px"><i>${i}</i><div>${t}</div></div>`).join('')}</div>`;
const imgFit = (src, style = '') => `<div style="position:absolute;inset:0;display:flex;justify-content:center;align-items:flex-start"><img class="shot" src="${src}" style="max-width:100%;max-height:100%;${style}"></div>`;
const cta = (txt, fs = 38) => `<span class="cta" style="font-size:${fs}px;padding:26px 34px">${txt}</span>`;

function carousel(name, slides) {
  const total = slides.length;
  return slides.map((s, i) => ({ name: `${name}-${i + 1}`, w: 1080, h: 1350, html: slide({ ...s, n: i + 1, total, swipe: i === 0 }) }));
}

// ---------------------------------------------------------------------------
// Carousels
// ---------------------------------------------------------------------------

function carCalcul(S) {
  return carousel('car-calcul-25', [
    { theme: 'dark', kick: 'Calcul réel', title: 'Tu vends à 25&nbsp;€.<br>Tu gardes <em>combien&nbsp;?</em>', size: 120,
      sub: 'La plupart des vendeurs répondent 19&nbsp;€. La vraie réponse fait mal.',
      body: `<div class="big" style="position:absolute;right:0;bottom:30px;font-size:300px;color:rgba(163,230,53,.16)">?</div>` },
    { theme: 'light', kick: 'Le calcul que tout le monde fait', title: 'Prix − coût du produit = <em>bénéfice</em>', size: 88,
      body: `<div class="card" style="padding:50px 56px;margin-top:20px">${rows([['Prix de vente', '25,00 €'], ['Coût du produit', '− 6,00 €', 'neg'], ['« Bénéfice »', '19,00 €']], 52, 30)}</div>
      <div class="sub" style="font-size:36px;margin-top:44px">Sauf qu’il manque presque tout. Slide suivante.</div>` },
    { theme: 'light', kick: 'Ce que le calcul oublie', title: 'Les coûts <em>invisibles</em>', size: 96,
      body: `<div class="card" style="padding:30px 56px">${rows([
        ['Emballage', '0,50 €'], ['Livraison', '5,00 €'], ['Pub par commande', '4,00 €'], ['Frais de paiement', '2,9 %'],
        ['Colis refusés', '1 sur 5'], ['Frais de retour', '3,00 €']], 40, 24)}</div>
      <div class="sub" style="font-size:32px;margin-top:34px">Chaque colis refusé : tu paies la livraison, le retour et la pub… pour 0&nbsp;€ encaissé.</div>` },
    { theme: 'dark', kick: 'Résultat', title: 'Tu gardes <em>5,65&nbsp;€</em>.<br>Pas 19&nbsp;€.', size: 112,
      sub: 'Marge nette&nbsp;: 23&nbsp;%. Le reste part en livraison, pub et colis refusés.',
      body: imgFit(S.results, 'height:100%;max-height:none') },
    { theme: 'light', kick: 'Les 3 chiffres à connaître', title: 'Avant de fixer ton prix', size: 92,
      body: `<div class="card" style="padding:30px 56px">${rows([
        ['Prix minimum (0 bénéfice)', '19,18 €'], ['Prix pour 30 % de marge', '27,76 €'], ['Pub max. par commande', '8,52 €'], ['ROAS minimum rentable', '2,93']], 40, 30)}</div>
      <div class="sub" style="font-size:32px;margin-top:34px">À 27,50&nbsp;€ (+10&nbsp;%), le bénéfice passe à 8,08&nbsp;€&nbsp;: <b>+43&nbsp;%</b>.</div>` },
    { theme: 'lime', kick: 'Gratuit · sans inscription', title: 'Fais le calcul avec <em>tes</em> chiffres', size: 104,
      sub: '10 secondes sur margokit.com. Ou commente <b>CALCUL</b>&nbsp;: je fais le calcul pour ton produit.',
      body: `<div style="position:absolute;left:0;bottom:40px">${cta('margokit.com/calculator →', 44)}</div>` },
  ]);
}

function carKits(S, A) {
  const d = DATA.fr;
  return carousel('car-kits', [
    { theme: 'dark', kick: 'Margokit', title: '4 outils pour savoir ce que tu <em>gardes vraiment</em>', size: 104,
      sub: 'Pour les vendeurs en ligne et les freelances. Un outil gratuit, trois pour aller plus loin.',
      body: `<div style="position:absolute;left:0;right:0;bottom:30px;display:grid;grid-template-columns:1fr 1fr;gap:20px">${[
        ['Calculateur', 'Gratuit'], ['Tracker', '12 $'], ['Pack Vendeur', '34 $'], ['Margokit Pro', 'Gratuit · 5 $/mois']].map(([a, b]) =>
        `<div class="card" style="padding:28px 30px"><div class="jk" style="font-weight:800;font-size:38px">${a}</div><div style="font-size:28px;color:${BRAND.lime};font-weight:700;margin-top:6px">${b}</div></div>`).join('')}</div>` },
    { theme: 'light', kick: '1 · Calculateur · gratuit', title: 'Avant de lancer un produit', size: 92,
      sub: 'Ton vrai bénéfice par vente, ton prix minimum et ton ROAS rentable. En ligne, sans compte.',
      body: imgFit(S.hlFive, 'max-height:700px') },
    { theme: 'light', kick: '2 · Tracker · 12 $ une fois', title: 'Chaque commande, <em>son vrai bénéfice</em>', size: 84,
      sub: 'Commandes, stock, clients et tableau de bord dans un Google Sheet. Les colis refusés sont comptés.',
      body: `<div style="position:absolute;left:-40px;top:0">${browser(app(d, { active: 'dashboard', body: zoom(dashboard(d, { chartRows: 1 }), 0.86) }), { width: 1000, height: 640 })}</div>` },
    { theme: 'dark', kick: '3 · Pack Vendeur · 34 $ une fois', title: 'Quelle pub te rapporte <em>vraiment</em>', size: 86,
      sub: 'Le Tracker + pub &amp; ROAS, planning de contenu, trésorerie, budget et calculateur de prix. 11 onglets.',
      body: `<div style="position:absolute;left:-40px;top:0">${browser(app(d, { pack: true, active: 'ads', body: zoom(adsGrid(d, { pick: [2, 4, 9, 11, 12], rowH: 42, fill: 6, hlVerdict: true }), 1.3) }), { width: 1000, height: 600 })}</div>` },
    { theme: 'light', kick: '4 · Margokit Pro · gratuit pour commencer', title: 'Devis et factures <em>en 1 minute</em>', size: 88,
      sub: 'Devis → facture en 1 clic, envoi par lien, e-mail ou WhatsApp, payé / en retard. PDF en français ou en anglais.',
      body: imgFit(A.pdfFr, 'height:100%;max-height:none') },
    { theme: 'lime', kick: 'Lequel choisir ?', title: 'Commence par le <em>gratuit</em>', size: 100,
      body: ticks([
        ['1', 'Tu ne connais pas ta marge → <b>Calculateur</b> (gratuit)'],
        ['2', 'Tu as des commandes à suivre → <b>Tracker</b> (12 $)'],
        ['3', 'Tu fais de la pub Facebook / TikTok → <b>Pack Vendeur</b> (34 $)'],
        ['4', 'Tu envoies des devis et factures → <b>Margokit Pro</b> (3 documents/mois gratuits)'],
      ], 36, 30) + `<div style="position:absolute;left:0;bottom:30px">${cta('margokit.com →', 42)}</div>` },
  ]);
}

function carCod() {
  const d = DATA.ma;
  return carousel('car-cod', [
    { theme: 'dark', kick: 'Paiement à la livraison', title: '30&nbsp;% de colis refusés.<br>Tu gardes <em>32&nbsp;DH</em> sur 199.', size: 100,
      sub: 'Le colis refusé est le tueur silencieux de la marge en COD.',
      body: `<div class="card" style="position:absolute;left:0;right:0;bottom:30px;padding:24px 44px">${rows([
        ['Prix', '199 DH'], ['Produit', '60 DH'], ['Emballage + livraison', '40 DH'], ['Pub par commande', '30 DH'], ['Retour d’un colis refusé', '15 DH']], 34, 16)}</div>` },
    { theme: 'light', kick: 'Même produit, même pub', title: '15&nbsp;% de refus au lieu de 30&nbsp;%', size: 92,
      body: `<div style="display:grid;grid-template-columns:1fr 1fr;gap:28px;margin-top:20px">
        <div class="card" style="padding:44px 40px"><div style="font-size:30px;font-weight:700;color:#64748B">30 % refusés</div><div class="big neg" style="font-size:150px;margin-top:20px">32</div><div style="font-size:30px;font-weight:700">DH par commande</div></div>
        <div class="card" style="padding:44px 40px;box-shadow:0 0 0 4px ${BRAND.lime}"><div style="font-size:30px;font-weight:700;color:${BRAND.limeInk}">15 % refusés</div><div class="big" style="font-size:150px;margin-top:20px">54</div><div style="font-size:30px;font-weight:700">DH par commande</div></div></div>
        <div class="big" style="font-size:120px;margin-top:60px">+66&nbsp;%<span style="font-size:44px;letter-spacing:0;font-weight:700"> de bénéfice</span></div>
        <div class="sub" style="font-size:34px;margin-top:20px">Sans changer de prix, ni de pub.</div>` },
    { theme: 'light', kick: 'Repère les clients à risque', title: '⚠️ 2 colis refusés = <em>acompte</em>', size: 92,
      sub: 'Le Tracker crée ta liste de clients tout seul et signale ceux qui refusent les colis.',
      body: `<div style="position:absolute;left:-40px;top:10px">${browser(app(d, { active: 'customers', body: zoom(customersGrid(d, { pick: [1, 4, 6, 7, 11], focusTags: true, rowH: 40, fill: 6 }), 1.5) }), { width: 1000, height: 620 })}</div>` },
    { theme: 'dark', kick: '3 réflexes', title: 'Moins de colis refusés', size: 104,
      body: ticks([
        ['1', '<b>Confirme chaque commande</b> par appel ou WhatsApp avant d’expédier.'],
        ['2', '<b>Demande un acompte</b> aux clients qui ont déjà refusé un colis.'],
        ['3', '<b>Compare tes transporteurs</b>&nbsp;: le taux de livraison change beaucoup de l’un à l’autre.'],
      ], 40, 44) },
    { theme: 'lime', kick: 'Version Maroc · en DH', title: 'Suis chaque colis dans <em>Google Sheets</em>', size: 92,
      sub: 'Commandes, stock, clients ⚠️/⭐ et ton vrai bénéfice. Sur ton téléphone. Paiement unique.',
      body: ticks([['✓', 'Paiement local possible par WhatsApp'], ['✓', 'Remboursé sous 14 jours si ça ne te sert pas']], 34, 20)
        + `<div style="position:absolute;left:0;bottom:30px">${cta('Écris « COLIS » en DM →', 42)}</div>` },
  ]);
}

function carBlackFriday() {
  return carousel('car-black-friday', [
    { theme: 'dark', kick: 'Black Friday · 27 novembre', title: '−30&nbsp;% sur ton produit&nbsp;?<br><em>Vérifie d’abord.</em>', size: 104,
      sub: 'Sur un produit à 25&nbsp;€ qui rapporte 5,65&nbsp;€, une promo de 30&nbsp;% te fait perdre de l’argent à chaque vente.',
      body: `<div style="position:absolute;left:0;bottom:20px"><div style="font-size:34px;font-weight:700;color:#94A3B8">Par vente, à −30&nbsp;%</div><div class="big neg" style="font-size:250px;margin-top:10px">−1,63&nbsp;€</div></div>` },
    { theme: 'light', kick: 'Même produit, mêmes coûts', title: 'Ce que tu gardes <em>par vente</em>', size: 92,
      body: `<div class="card" style="padding:30px 56px">${rows([
        ['Prix normal · 25,00 €', '+ 5,65 €', 'pos'], ['−15 % · 21,25 €', '+ 2,01 €'], ['−20 % · 20,00 €', '+ 0,79 €'], ['−30 % · 17,50 €', '− 1,63 €', 'neg']], 42, 34)}</div>
      <div class="sub" style="font-size:32px;margin-top:34px">Livraison 5&nbsp;€, pub 4&nbsp;€, 1 colis sur 5 refusé. Ces coûts ne baissent pas avec ton prix.</div>` },
    { theme: 'dark', kick: 'Le piège', title: 'À −20&nbsp;%, il faut <em>7 fois</em> plus de ventes', size: 100,
      sub: 'pour gagner autant qu’au prix normal. 0,79&nbsp;€ au lieu de 5,65&nbsp;€ par commande.',
      body: `<div class="big" style="position:absolute;left:0;bottom:20px;font-size:330px;color:${BRAND.lime}">×7</div>` },
    { theme: 'light', kick: 'À la place', title: 'Des promos qui <em>protègent</em> ta marge', size: 92,
      body: ticks([
        ['1', '<b>Un cadeau</b> plutôt qu’une remise (échantillon, emballage offert).'],
        ['2', '<b>Un lot</b>&nbsp;: 2 achetés, livraison offerte. La livraison se paie une seule fois.'],
        ['3', '<b>Une remise calculée</b>&nbsp;: reste au-dessus de ton prix minimum.'],
      ], 38, 40) },
    { theme: 'lime', kick: 'Gratuit · 10 secondes', title: 'Teste ta promo <em>avant</em> de la lancer', size: 100,
      sub: 'Mets ton prix promo dans le calculateur. Il te dit ce que tu gardes vraiment.',
      body: `<div style="position:absolute;left:0;bottom:40px">${cta('margokit.com/calculator →', 44)}</div>` },
  ]);
}

function carRoas() {
  return carousel('car-roas', [
    { theme: 'dark', kick: 'Facebook · TikTok Ads', title: 'ROAS de 3.<br>Tu gagnes <em>0,23&nbsp;€</em>.', size: 120,
      sub: 'Ton gestionnaire de pub dit que la campagne marche. Ton compte en banque n’est pas d’accord.',
      body: `<div style="position:absolute;left:0;right:0;bottom:20px;display:grid;grid-template-columns:1fr 1fr;gap:24px"><div class="card" style="padding:36px"><div style="font-size:28px;color:#94A3B8;font-weight:700">Ce que tu vois</div><div class="big" style="font-size:130px;margin-top:14px">3,00x</div></div><div class="card" style="padding:36px"><div style="font-size:28px;color:#94A3B8;font-weight:700">Ce que tu gardes</div><div class="big pos" style="font-size:130px;margin-top:14px">0,23&nbsp;€</div></div></div>` },
    { theme: 'light', kick: 'Produit à 25 €, 1 colis sur 5 refusé', title: 'Ce que tu gardes <em>par commande</em>', size: 88,
      body: `<div class="card" style="padding:30px 56px">${rows([
        ['ROAS 2,5', '− 1,85 €', 'neg'], ['ROAS 2,93 (seuil)', '0,00 €'], ['ROAS 3', '+ 0,23 €'], ['ROAS 4', '+ 2,84 €', 'pos']], 46, 36)}</div>
      <div class="sub" style="font-size:32px;margin-top:34px">Le ROAS ne voit que le chiffre d’affaires. Pas le coût du produit, la livraison, ni les colis refusés.</div>` },
    { theme: 'dark', kick: 'Il n’y a pas de « bon ROAS »', title: 'Il y a <em>ton</em> ROAS minimum', size: 104,
      sub: 'Il dépend de ta marge et de ton taux de livraison. Pour ce produit&nbsp;: 2,93. En dessous, chaque vente te coûte de l’argent.',
      body: `<div style="position:absolute;left:0;bottom:10px"><div style="font-size:34px;font-weight:700;color:#94A3B8">ROAS minimum rentable</div><div class="big pos" style="font-size:300px">2,93</div></div>` },
    { theme: 'light', kick: 'Pack Vendeur · onglet Publicité', title: 'Le verdict <em>par campagne</em>', size: 92,
      sub: 'Une ligne par campagne, 2 chiffres à recopier par semaine. ✅ rentable ou ❌ perd de l’argent.',
      body: `<div style="position:absolute;left:-40px;top:10px">${browser(app(DATA.fr, { pack: true, active: 'ads', body: zoom(adsGrid(DATA.fr, { pick: [2, 4, 9, 11, 12], rowH: 42, fill: 6, hlVerdict: true }), 1.3) }), { width: 1000, height: 640 })}</div>` },
    { theme: 'lime', kick: 'Gratuit', title: 'Calcule ton ROAS <em>minimum</em>', size: 104,
      sub: 'Dans le calculateur Margokit, en 10 secondes. Ou commente <b>ROAS</b> et je le calcule pour toi.',
      body: `<div style="position:absolute;left:0;bottom:40px">${cta('margokit.com/calculator →', 44)}</div>` },
  ]);
}

function carPro(A) {
  return carousel('car-pro', [
    { theme: 'dark', kick: 'Freelances · petites entreprises', title: 'Ton client a dit oui.<br><em>Facture en 1 clic.</em>', size: 104,
      sub: 'Margokit Pro transforme ton devis accepté en facture, sans tout ressaisir.',
      body: imgFit(A.quote, 'width:100%;max-height:none') },
    { theme: 'light', kick: 'Un document pro en 1 minute', title: 'Ton logo, <em>tes mentions</em>, ton PDF', size: 92,
      sub: 'Numérotation automatique sans trou, identifiants fiscaux, plusieurs taux de TVA et devises. PDF en français ou en anglais.',
      body: imgFit(A.pdfFr, 'max-height:640px') },
    { theme: 'dark', kick: 'Envoie. Encaisse.', title: 'Lien, e-mail <em>ou WhatsApp</em>', size: 100,
      sub: 'Tu vois ce qui est payé et ce qui est en retard. Fini le tableau Excel des relances.',
      body: imgFit(A.share, 'width:100%;max-height:none') },
    { theme: 'light', kick: 'Facture électronique', title: 'Formats <em class="nw">Factur-X</em> et <em>UBL</em> déjà là', size: 92,
      sub: 'Exports conformes à la norme européenne EN 16931. En France, toutes les entreprises devront émettre des factures électroniques au plus tard le 1er septembre 2027.',
      body: `<div style="position:absolute;left:0;right:0;bottom:20px;display:flex;flex-direction:column;gap:20px">${[['1er sept. 2026', 'Toutes les entreprises en France doivent pouvoir <b>recevoir</b> des factures électroniques.'], ['1er sept. 2027', 'Les PME, TPE et micro-entrepreneurs doivent aussi les <b>émettre</b>.']].map(([a, b]) => `<div class="card" style="padding:30px 36px;display:grid;grid-template-columns:300px 1fr;gap:24px;align-items:center"><div class="big" style="font-size:50px;letter-spacing:-.02em">${a}</div><div style="font-size:30px;line-height:1.35">${b}</div></div>`).join('')}<div class="sub" style="font-size:26px">Margokit Pro produit déjà les formats. La transmission par une plateforme agréée arrive.</div></div>` },
    { theme: 'lime', kick: 'Gratuit pour commencer', title: '3 documents par mois, <em>gratuits</em>', size: 100,
      body: `<div class="card" style="padding:30px 50px">${rows([['Gratuit', '0 $ · 3 docs/mois'], ['Pro mensuel', '5 $ / mois'], ['Pro à vie', '39 $ une fois']], 42, 30)}</div>
      <div style="position:absolute;left:0;bottom:40px">${cta('margokit.com → Commencer gratuitement', 38)}</div>` },
  ]);
}

// ---------------------------------------------------------------------------
// Stories / TikTok covers (1080 × 1920)
// ---------------------------------------------------------------------------

function story({ theme, kick, title, size = 110, sub, body = '' }) {
  return page({ w: 1080, h: 1920, css: CSS, body: `<div class="sl ${theme}" style="width:1080px;height:1920px">
    <div style="padding:260px 90px 0;display:flex;flex-direction:column;gap:36px;flex:1;position:relative">
      ${kick ? `<span class="kick" style="font-size:26px;padding:12px 22px">${kick}</span>` : ''}
      <h1 style="font-size:${size}px">${title}</h1>${sub ? `<div class="sub" style="font-size:42px">${sub}</div>` : ''}
      <div style="flex:1;position:relative">${body}</div></div>
    <div class="foot" style="height:300px;padding:0 90px 120px;border:0">${logo(64, theme === 'dark' ? '#fff' : BRAND.ink, theme === 'lime')}</div></div>` });
}

function stories(S) {
  return [
    { name: 'story-sondage', html: story({ theme: 'dark', kick: 'Question du jour', title: 'Tu connais ta <em>marge nette</em> par commande&nbsp;?', size: 116,
      sub: 'Livraison, pub et colis refusés compris.',
      body: `<div style="position:absolute;left:0;right:0;top:80px;height:340px;border:3px dashed rgba(163,230,53,.5);border-radius:32px;display:grid;place-items:center;color:#94A3B8;font-size:30px">zone du sticker Sondage</div>` }) },
    { name: 'story-calculateur', html: story({ theme: 'light', kick: 'Gratuit · sans inscription', title: '25&nbsp;€ vendu = <em>5,65&nbsp;€</em> gardés', size: 116,
      sub: 'Fais le calcul avec tes chiffres.',
      body: `${imgFit(S.results, 'max-height:600px')}<div style="position:absolute;left:0;right:0;bottom:30px;height:150px;border:3px dashed #A3E635;border-radius:32px;display:grid;place-items:center;color:#64748B;font-size:30px">zone du sticker Lien</div>` }) },
    { name: 'story-black-friday', html: story({ theme: 'lime', kick: 'Black Friday', title: '−30&nbsp;% = <em>−1,63&nbsp;€</em> par vente', size: 124,
      sub: 'Sur un produit à 25&nbsp;€ qui rapportait 5,65&nbsp;€. Teste ta promo avant de la lancer.',
      body: `<div style="position:absolute;left:0;right:0;bottom:30px;height:150px;border:3px dashed rgba(15,23,42,.4);border-radius:32px;display:grid;place-items:center;color:#334155;font-size:30px">zone du sticker Lien</div>` }) },
    { name: 'story-early', html: story({ theme: 'dark', kick: 'Offre de lancement', title: '<em>−25&nbsp;%</em> sur les Google Sheets Margokit', size: 116,
      sub: 'Code <b style="color:#fff">EARLY</b>, réservé aux 50 premiers. Tracker, Pack Vendeur.',
      body: ticks([['✓', 'Paiement unique, pas d’abonnement'], ['✓', 'Remboursé sous 14 jours'], ['✓', 'Paiement local possible par WhatsApp']], 40, 30) }) },
  ].map((v) => ({ ...v, w: 1080, h: 1920 }));
}

// ---------------------------------------------------------------------------
// Presentation deck (1920 × 1080)
// ---------------------------------------------------------------------------

function deckSlide({ theme = 'light', kick, title, size = 84, sub, left, right, n }) {
  return page({ w: 1920, h: 1080, css: CSS, body: `<div class="sl ${theme}" style="width:1920px;height:1080px">
    <div style="flex:1;min-height:0;display:grid;grid-template-columns:${right ? '820px 1fr' : '1fr'};gap:80px;padding:90px 110px 0">
      <div style="display:flex;flex-direction:column;gap:30px;min-width:0">
        ${kick ? `<span class="kick" style="font-size:20px;padding:10px 18px">${kick}</span>` : ''}
        <h2 style="font-size:${size}px">${title}</h2>${sub ? `<div class="sub" style="font-size:30px">${sub}</div>` : ''}
        ${left ?? ''}</div>
      ${right ? `<div style="position:relative;min-width:0">${right}</div>` : ''}</div>
    <div class="foot" style="height:110px;padding:0 110px;margin-top:20px">${logo(46, theme === 'dark' ? '#fff' : BRAND.ink, theme === 'lime')}
      <span class="pg" style="font-size:22px">${FOOT}&nbsp;&nbsp;·&nbsp;&nbsp;${n}</span></div></div>` });
}

function deck(S, A) {
  const d = DATA.fr;
  const D = [
    { theme: 'dark', kick: 'Présentation · novembre 2026', title: 'Margokit.<br><em>Sache ce que tu gardes vraiment.</em>', size: 120,
      sub: 'Des outils simples pour que les vendeurs en ligne et les freelances connaissent leur vrai bénéfice, suivent leurs commandes et facturent comme des pros.',
      right: `<div style="position:absolute;inset:0;display:grid;place-items:center"><div class="big" style="font-size:300px;color:${BRAND.lime}">5,65&nbsp;€</div></div>` },
    { theme: 'light', kick: 'Le problème', title: 'Les vendeurs connaissent leur chiffre d’affaires. <em>Pas leur bénéfice.</em>', size: 72,
      left: ticks([
        ['1', 'Livraison, emballage, frais de plateforme et de paiement mangent la marge en silence.'],
        ['2', 'En paiement à la livraison, chaque colis refusé coûte la livraison, le retour et la pub.'],
        ['3', 'Le ROAS affiché par Facebook ou TikTok ignore tous ces coûts.'],
        ['4', 'Les freelances perdent du temps sur Word et Excel pour leurs devis et factures, et oublient les relances.'],
      ], 30, 26),
      right: `<div class="card" style="padding:40px 50px;margin-top:40px">${rows([['Prix de vente', '25,00&nbsp;€'], ['Ce qu’il croit gagner', '19,00&nbsp;€'], ['Ce qu’il gagne vraiment', '5,65&nbsp;€', 'pos']], 38, 30)}<div class="sub" style="font-size:24px;margin-top:24px">Exemple du calculateur&nbsp;: produit 6&nbsp;€, livraison 5&nbsp;€, pub 4&nbsp;€, 1 colis sur 5 refusé.</div></div>` },
    { theme: 'dark', kick: 'La solution', title: 'Un parcours en <em>4 outils</em>', size: 84,
      sub: 'On commence gratuitement, on paie quand l’outil fait gagner du temps ou de l’argent.',
      right: `<div style="display:flex;flex-direction:column;gap:20px;margin-top:10px">${[
        ['Calculateur', 'Gratuit', 'Le vrai bénéfice d’un produit, avant de le lancer.'],
        ['Tracker', '12 $ une fois', 'Le suivi des commandes, du stock et des clients dans Google Sheets.'],
        ['Pack Vendeur', '34 $ une fois', 'Le Tracker + pub &amp; ROAS, contenu, trésorerie, budget, prix.'],
        ['Margokit Pro', 'Gratuit, puis 5 $/mois ou 39 $', 'Les devis, factures et avoirs en ligne.']].map(([a, b, c]) =>
        `<div class="card" style="padding:26px 34px;display:grid;grid-template-columns:290px 1fr;gap:20px;align-items:center"><div><div class="jk" style="font-weight:800;font-size:36px">${a}</div><div style="color:${BRAND.lime};font-weight:700;font-size:22px;margin-top:4px">${b}</div></div><div style="font-size:26px;color:#CBD5E1;line-height:1.35">${c}</div></div>`).join('')}</div>` },
    { theme: 'light', kick: 'Outil 1 · Calculateur gratuit', title: 'Le vrai bénéfice <em>en 10 secondes</em>', size: 80,
      left: ticks([['→', 'Prix, coûts, frais, pub et taux de colis refusés.'], ['→', 'Bénéfice réel, marge, prix minimum, prix pour 30 % et 50 % de marge.'], ['→', 'Pub max. par commande et ROAS minimum rentable.'], ['→', 'En ligne sur margokit.com/calculator, sans compte, en €, $ ou DH.']], 30, 24),
      right: imgFit(S.hlFive, 'max-height:800px') },
    { theme: 'light', kick: 'Outil 2 · Tracker · 12 $', title: 'Chaque commande, <em>son vrai bénéfice</em>', size: 76,
      left: ticks([['1', 'Tableau de bord&nbsp;: CA, bénéfice net, taux de livraison et de retour.'], ['2', 'Commandes avec statuts colorés, bénéfice calculé tout seul.'], ['3', 'Stock mis à jour, alertes de rupture.'], ['4', 'Clients ⚠️ à risque et ⭐ fidèles.'], ['5', '3 versions&nbsp;: anglais $, français €, Maroc DH.']], 28, 20),
      right: `<div style="position:absolute;left:0;top:0">${browser(app(d, { active: 'dashboard', body: zoom(dashboard(d, { chartRows: 1 }), 0.86) }), { width: 900, height: 760 })}</div>` },
    { theme: 'dark', kick: 'Outil 3 · Pack Vendeur · 34 $', title: 'Quelle pub te rapporte <em>vraiment</em>', size: 76,
      left: ticks([['1', 'Publicité &amp; ROAS&nbsp;: bénéfice réel et verdict par campagne.'], ['2', 'Planning de contenu&nbsp;: vues, engagement, meilleures accroches.'], ['3', 'Trésorerie et budget mensuel avec alertes.'], ['4', 'Calculateur de prix intégré.'], ['5', 'Tout le Tracker inclus. 11 onglets reliés.']], 28, 20),
      right: `<div style="position:absolute;left:0;top:0">${browser(app(d, { pack: true, active: 'pricing', body: zoom(pricingView(d, { scenarios: true, outputs: true }), 0.8) }), { width: 900, height: 760 })}</div>` },
    { theme: 'light', kick: 'Outil 4 · Margokit Pro', title: 'Devis et factures <em>en 1 minute</em>', size: 80,
      left: ticks([['1', 'Devis → facture → avoir, numérotation sans trou.'], ['2', 'Envoi par lien, e-mail ou WhatsApp. Suivi payé / en retard.'], ['3', 'PDF français ou anglais, logo, mentions légales, QR code SEPA.'], ['4', 'Exports Factur-X et UBL (norme EN 16931). Données hébergées en Europe.']], 28, 22),
      right: imgFit(A.pdfFr, 'height:100%;max-height:none') },
    { theme: 'light', kick: 'Pour qui', title: 'Trois profils, <em>un même besoin</em>', size: 80,
      right: `<div style="display:flex;flex-direction:column;gap:22px">${[
        ['Vendeur COD (Maroc, Afrique de l’Ouest)', 'Vend sur Instagram, TikTok, WhatsApp ou YouCan, paiement à la livraison. Perd sa marge dans les colis refusés.', 'Tracker version DH'],
        ['E-commerçant qui fait de la pub', 'Shopify, dropshipping, TikTok Shop. Dépense en Facebook et TikTok Ads sans savoir quelle campagne rapporte.', 'Pack Vendeur'],
        ['Freelance, artisan, petite entreprise', 'Envoie des devis et factures sur Word. Veut des documents propres et savoir qui n’a pas payé.', 'Margokit Pro']].map(([a, b, c]) =>
        `<div class="card" style="padding:28px 34px"><div class="jk" style="font-weight:800;font-size:32px">${a}</div><div style="font-size:24px;color:#475569;line-height:1.4;margin-top:8px">${b}</div><div style="margin-top:14px"><span class="price" style="font-size:20px">${c}</span></div></div>`).join('')}</div>`,
      left: `<div class="sub" style="font-size:30px">Savoir ce qu’on gagne vraiment, sans logiciel compliqué ni abonnement cher.</div>` },
    { theme: 'dark', kick: 'Tarifs', title: 'Simple, <em>sans surprise</em>', size: 90,
      sub: 'Templates en paiement unique. Remboursement sous 14 jours. Prix adaptés au pouvoir d’achat de chaque pays. Paiement local possible par WhatsApp.',
      right: `<div class="card" style="padding:30px 50px">${rows([['Calculateur', 'Gratuit'], ['Tracker', '12 $ une fois'], ['Pack Vendeur', '34 $ une fois'], ['Margokit Pro · gratuit', '3 documents/mois'], ['Margokit Pro · mensuel', '5 $ / mois'], ['Margokit Pro · à vie', '39 $ une fois']], 34, 22)}</div>` },
    { theme: 'lime', kick: 'Commencer', title: 'Trois étapes, <em>zéro risque</em>', size: 96,
      left: ticks([['1', 'Teste ton produit sur <b>margokit.com/calculator</b>'], ['2', 'Crée ton compte gratuit Margokit Pro sur <b>margokit.com</b>'], ['3', 'Prends le Tracker ou le Pack sur <b>margokit.gumroad.com</b>']], 34, 30),
      right: `<div class="card" style="padding:40px 50px;margin-top:40px"><div class="jk" style="font-weight:800;font-size:40px">Contact</div><div style="font-size:30px;line-height:1.6;margin-top:16px">hello@margokit.com<br>WhatsApp +212 607 742 672<br>margokit.com</div></div>` },
  ];
  return D.map((s, i) => ({ name: `deck-${String(i + 1).padStart(2, '0')}`, w: 1920, h: 1080, html: deckSlide({ ...s, n: i + 1 }) }));
}

/** S = calculator screenshots in French ({ results, hlFive, ... }), A = Margokit Pro screenshots. */
export function campaignVisuals(S, A) {
  return [...carCalcul(S), ...carKits(S, A), ...carCod(), ...carBlackFriday(), ...carRoas(), ...carPro(A), ...stories(S), ...deck(S, A)]
    .map((v) => ({ ...v, out: CAMPAIGN_OUT }));
}
