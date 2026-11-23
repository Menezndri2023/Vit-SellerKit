/**
 * Visuels de la campagne « Vends. Calcule. Garde. » (kits Margokit) : carrousels 1080×1350 (+ PDF LinkedIn),
 * posts 1080×1350, stories 1080×1920 et présentation 1920×1080 (+ PDF).
 *   node marketing/visuals/visuels-kits.mjs
 * Sortie : marketing/campagne-kits/rendu/visuels/… et rendu/presentation/Margokit-kits-presentation.pdf
 * Google Sheets : reproductions fidèles (templates.mjs, données d'exemple MAD des fichiers livrés).
 */
import { mkdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from './data.mjs';
import { BRAND, page, LOGO_SVG, browser as frame, sheetsApp, PACK_TABS, TRACKER_TABS, dashboard, ordersGrid, adsGrid, pricingView, productsGrid, customersGrid, contentGrid, budgetView } from './templates.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const CAP = join(ROOT, 'marketing', 'campagne-kits', 'captures');
const CAP_PRO = join(ROOT, 'marketing', 'campagne-pro', 'captures');
const OUT = join(ROOT, 'marketing', 'campagne-kits', 'rendu');
const { chromium } = await import(join(ROOT, 'app', 'node_modules', 'playwright', 'index.mjs'));

const esc = (s) => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const em = (s) => esc(s).replace(/\*(.+?)\*/g, '<em>$1</em>').replace(/\n/g, '<br>');
const uri = (name) => {
  for (const d of [CAP, CAP_PRO]) {
    const f = join(d, `${name}.png`);
    if (existsSync(f)) return `data:image/png;base64,${readFileSync(f).toString('base64')}`;
  }
  throw new Error(`capture manquante : ${name}`);
};

// Google Sheets reproductions (Morocco version, MAD)
const MA = build('ma');
const zoom = (html, z) => `<div style="zoom:${z}">${html}</div>`;
const tApp = (active, body) => sheetsApp({ title: MA.t.file, tabs: TRACKER_TABS.map((k) => [k, MA.t.sheets[k]]), active, body });
const pApp = (active, body) => sheetsApp({ title: MA.t.packFile, tabs: PACK_TABS.map((k) => [k, MA.t.sheets[k]]), active, body });
const SHEET = {
  trackerDashboard: [() => tApp('dashboard', zoom(dashboard(MA, { chartRows: 1 }), 0.8)), 760],
  trackerOrders: [() => tApp('orders', zoom(ordersGrid(MA, { pick: [1, 2, 6, 10, 18], rowH: 40, fill: 4, highlightProfit: true }), 1.3)), 640],
  trackerProducts: [() => tApp('products', zoom(productsGrid(MA, { pick: [1, 3, 5, 6, 7, 9], rowH: 40, fill: 3 }), 1.25)), 640],
  trackerCustomers: [() => tApp('customers', zoom(customersGrid(MA, { pick: [1, 4, 6, 7, 11], focusTags: true, rowH: 40, fill: 4 }), 1.4)), 640],
  packDashboard: [() => pApp('dashboard', zoom(dashboard(MA, { pack: true, chartRows: 1 }), 0.8)), 760],
  ads: [() => pApp('ads', zoom(adsGrid(MA, { pick: [2, 4, 9, 11, 12], rowH: 48, fill: 2, hlVerdict: true }), 1.4)), 640],
  content: [() => pApp('content', zoom(contentGrid(MA, { pick: [0, 1, 3, 5, 7], rowH: 40, fill: 4 }), 1.25)), 640],
  budget: [() => pApp('budget', zoom(budgetView(MA, { scale: 1 }), 0.9)), 760],
  pricing: [() => pApp('pricing', zoom(pricingView(MA, { scale: 1 }), 0.95)), 760],
};
/** A sheet reproduction scaled to `w` pixels wide. */
const sheet = (view, w = 940) => {
  const [html, h] = SHEET[view];
  return `<div style="zoom:${(w / 900).toFixed(3)}"><div class="sheetwrap">${frame(html(), { width: 900, height: h })}</div></div>`;
};
const crop = (img, { y = 0, h = 1200, w = 900 } = {}) => {
  const k = w / 1170;
  return `<div class="shot" style="width:${w}px;height:${Math.round(h * k)}px"><img src="${uri(img)}" style="width:${w}px;margin-top:-${Math.round(y * k)}px"></div>`;
};

const CSS = `
body{background:radial-gradient(120% 70% at 50% 0%,#1E293B 0%,#0F172A 62%);color:#fff;position:relative}
.brand{position:absolute;display:flex;align-items:center;gap:12px}
.brand b{font-family:'Plus Jakarta Sans';font-weight:800;letter-spacing:-.02em}
.brand small{color:#94A3B8;font-weight:500}
h1,h2,.k{font-family:'Plus Jakarta Sans';font-weight:800;letter-spacing:-.03em;line-height:1.06;text-wrap:balance}
em{font-style:normal;color:${BRAND.lime}}
p{line-height:1.4;text-wrap:pretty}
.muted{color:#94A3B8}
.pill{display:inline-block;background:${BRAND.lime};color:${BRAND.ink};font-weight:800;border-radius:999px;font-family:'Plus Jakarta Sans'}
.ghost{display:inline-block;border:2px solid #334155;color:#CBD5E1;font-weight:700;border-radius:999px}
.shot{border-radius:26px;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,.55);background:#fff}
.shot img{display:block}
.sheetwrap{border-radius:22px;overflow:hidden;box-shadow:0 40px 100px rgba(0,0,0,.55);background:#fff}
.box{background:#1E293B;border-radius:24px}
.num{flex:none;display:grid;place-items:center;border-radius:50%;background:${BRAND.lime};color:${BRAND.ink};font-family:'Plus Jakarta Sans';font-weight:800}
.row{display:flex;gap:18px;align-items:flex-start}
.swipe{position:absolute;right:70px;bottom:60px;color:#94A3B8;font-weight:700;font-size:30px}
.pager{position:absolute;left:70px;bottom:62px;color:#64748B;font-weight:700;font-size:26px}
.big{font-family:'Plus Jakarta Sans';font-weight:800;letter-spacing:-.04em;line-height:1}
`;
const brand = (x, y, s = 36) => `<div class="brand" style="left:${x}px;top:${y}px">${LOGO_SVG(s)}<b style="font-size:${Math.round(s * 0.72)}px">Margokit</b><small style="font-size:${Math.round(s * 0.5)}px">par VIT GLOBAL</small></div>`;
const S = (n, t, inner, swipe = true) => `${brand(70, 64)}${inner}<div class="pager">${n}/${t}</div>${swipe && n < t ? '<div class="swipe">Glisse →</div>' : ''}`;
const cover = (title, sub) => `<div style="position:absolute;left:70px;right:70px;top:250px"><h1 style="font-size:104px">${em(title)}</h1><p class="muted" style="font-size:40px;margin-top:36px">${em(sub)}</p></div>`;
const text = (kicker, title, body, big) => `${big ? `<div class="k" style="position:absolute;right:40px;bottom:-60px;font-size:620px;line-height:1;color:${BRAND.lime};opacity:.14">${esc(big)}</div>` : ''}<div style="position:absolute;left:70px;right:70px;top:${body ? 230 : 200}px">${kicker ? `<div class="pill" style="font-size:30px;padding:12px 26px">${esc(kicker)}</div>` : ''}<h2 style="font-size:${body ? 86 : 76}px;margin-top:38px">${em(title)}</h2>${body ? `<p style="font-size:42px;color:#CBD5E1;margin-top:40px;line-height:1.45">${em(body)}</p>` : ''}</div>`;
const withVis = (kicker, title, vis, top = 600) => `${text(kicker, title)}<div style="position:absolute;left:0;right:0;top:${top}px;display:flex;justify-content:center">${vis}</div>`;
const cta = (title, button, sub) => `<div style="position:absolute;left:70px;right:70px;top:290px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:42px">${LOGO_SVG(150)}<h2 style="font-size:84px">${em(title)}</h2><div class="pill" style="font-size:40px;padding:24px 44px">${esc(button)}</div><p class="muted" style="font-size:34px">${esc(sub)}</p><p class="muted" style="font-size:24px;letter-spacing:.08em;text-transform:uppercase">Margokit · un produit VIT GLOBAL</p></div>`;
const bigNum = (label, value, sub) => `<div style="position:absolute;left:70px;right:70px;top:300px;text-align:center"><p class="muted" style="font-size:44px;font-weight:600">${em(label)}</p><div class="big" style="font-size:230px;margin-top:30px;color:${BRAND.lime}">${esc(value)}</div><p style="font-size:44px;margin-top:30px;color:#CBD5E1">${em(sub)}</p></div>`;

const CAROUSELS = {
  'KC1-les-4-outils': [
    (n, t) => S(n, t, cover('Les *4 outils* Margokit', 'Du calcul de ton prix à ta facture. Lequel il te faut ?')),
    (n, t) => S(n, t, withVis('1 · Gratuit', 'Le *calculateur* : ce que tu gardes vraiment', crop('calc-resultats-mobile', { y: 380, h: 1450, w: 720 }), 560)),
    (n, t) => S(n, t, withVis('2 · 12 $', 'Le *Tracker* : bénéfice, stock, clients', sheet('trackerDashboard', 940), 600)),
    (n, t) => S(n, t, withVis('3 · 34 $', 'Le *Seller Pack* : la pub qui gagne', sheet('ads', 940), 620)),
    (n, t) => S(n, t, withVis('4 · Gratuit, puis 5 $/mois', '*Margokit Pro* : devis et factures', crop('dashboard-mobile', { y: 150, h: 1500, w: 720 }), 560)),
    (n, t) => S(n, t, cta('Commence par le *gratuit*', 'margokit.com/fr/calculator', 'Lien en bio'), false),
  ],
  'KC2-249-mad-44-mad': [
    (n, t) => S(n, t, cover('Vendu *249 MAD*.\nTu gardes combien ?', 'Paiement à la livraison, au Maroc. Calcul fait avec le calculateur Margokit.')),
    (n, t) => S(n, t, text('Tes coûts', 'Ce qui part *avant* ton bénéfice', 'Produit 90 MAD · emballage 5 · livraison 35 · retour 25 · pub 40 par commande · 1 colis sur 4 refusé')),
    (n, t) => S(n, t, bigNum('Tu gardes', '44 MAD', 'par commande livrée · marge 17,7 %')),
    (n, t) => S(n, t, bigNum('Avec *35 %* de colis refusés', '22 MAD', 'ton bénéfice est divisé par deux')),
    (n, t) => S(n, t, bigNum('Vendu *279 MAD* au lieu de 249', '74 MAD', '+30 MAD sur le prix = +68 % de bénéfice')),
    (n, t) => S(n, t, cta('Fais le calcul avec *tes* chiffres', 'Calculateur gratuit', 'Sans compte · lien en bio'), false),
  ],
  'KC3-tracker-6-onglets': [
    (n, t) => S(n, t, cover('Le *Tracker* en 6 onglets', 'Google Sheets · versions MAD, € et $ · 12 $ une fois')),
    (n, t) => S(n, t, withVis('🧾 Commandes', '10 secondes par commande, *bénéfice calculé*', sheet('trackerOrders', 960), 620)),
    (n, t) => S(n, t, withVis('📦 Produits & stock', 'Le stock se met à jour *tout seul*', sheet('trackerProducts', 960), 620)),
    (n, t) => S(n, t, withVis('👥 Clients', '⚠️ Les clients qui *refusent* les colis', sheet('trackerCustomers', 960), 620)),
    (n, t) => S(n, t, withVis('📊 Tableau de bord', 'Bénéfice net, retours, *meilleur produit*', sheet('trackerDashboard', 960), 600)),
    (n, t) => S(n, t, text('⚙️ Paramètres + 📖 Mode d’emploi', 'Tes canaux, tes frais, *tes transporteurs*', 'Réglés une fois en 10 minutes. Données d’exemple pour voir comment ça marche, à supprimer en 2 clics.')),
    (n, t) => S(n, t, cta('Ton vrai bénéfice, *commande par commande*', 'Tracker · 12 $', 'margokit.gumroad.com/l/tracker'), false),
  ],
  'KC4-seller-pack-11-onglets': [
    (n, t) => S(n, t, cover('Le *Seller Pack* : 11 onglets', 'Tout le Tracker + 5 onglets pour la pub, le contenu et ton argent. 34 $ une fois.')),
    (n, t) => S(n, t, withVis('📣 Publicité & ROAS', 'Un *verdict* pour chaque campagne', sheet('ads', 960), 620)),
    (n, t) => S(n, t, withVis('🧮 Calculateur de prix', 'Ton prix minimum *avant* de lancer', sheet('pricing', 960), 600)),
    (n, t) => S(n, t, withVis('🎬 Planning de contenu', 'Tes *meilleures accroches* ressortent', sheet('content', 960), 620)),
    (n, t) => S(n, t, withVis('💰 Budget + 💵 Trésorerie', 'Alertes à *80 % et 100 %*', sheet('budget', 960), 600)),
    (n, t) => S(n, t, text('Déjà le Tracker ?', 'Code *UPGRADE* : 22 $ au lieu de 34 $', 'Le prix du Tracker est déduit. Mêmes versions MAD, € et $. Remboursement 14 jours.')),
    (n, t) => S(n, t, cta('La pub qui *gagne*, enfin visible', 'Seller Pack · 34 $', 'margokit.gumroad.com/l/seller-pack'), false),
  ],
  'KC5-parcours-du-vendeur': [
    (n, t) => S(n, t, cover('Le *parcours* d’un vendeur qui garde son argent', '4 étapes, 4 outils. Commence où tu en es.')),
    (n, t) => S(n, t, text('Étape 1', 'Avant de lancer : *calcule*', 'Le calculateur gratuit : à ce prix, combien je garde ? Quel ROAS minimum ?', '1')),
    (n, t) => S(n, t, text('Étape 2', 'Les premières commandes : *note-les*', 'Le Tracker : bénéfice réel, stock, colis refusés, clients ⚠️.', '2')),
    (n, t) => S(n, t, text('Étape 3', 'La pub démarre : *juge-la*', 'Le Seller Pack : verdict par campagne, budget, trésorerie, contenu.', '3')),
    (n, t) => S(n, t, text('Étape 4', 'Des pros t’achètent : *facture-les*', 'Margokit Pro : devis et factures en 1 minute, envoi WhatsApp, relances.', '4')),
    (n, t) => S(n, t, cta('Tu en es à *quelle étape* ?', 'Dis-le en commentaire', 'On te dit par quoi commencer'), false),
  ],
  'KC6-routine-15-minutes': [
    (n, t) => S(n, t, cover('Ta routine de vendeur : *15 min / semaine*', 'Avec le Tracker ou le Seller Pack.')),
    (n, t) => S(n, t, text('Chaque commande', '*1 ligne*, 10 secondes', 'Tu changes le statut quand le colis part et quand il est livré (ou refusé).', '1')),
    (n, t) => S(n, t, text('Lundi', 'Tes pubs : *1 minute* par campagne', 'Dépense et commandes depuis ton gestionnaire de pub → verdict ✅ / ❌.', '2')),
    (n, t) => S(n, t, text('Avant d’expédier', 'Un œil sur les clients *⚠️*', 'Deux colis refusés ? Demande un acompte ou confirme par téléphone.', '3')),
    (n, t) => S(n, t, text('Dimanche', 'Ton *tableau de bord*', 'Bénéfice net, taux de retour, meilleur produit. Tu décides la semaine suivante avec des chiffres.', '4')),
    (n, t) => S(n, t, cta('15 minutes pour *savoir*', 'Tracker 12 $ · Pack 34 $', 'Lien en bio'), false),
  ],
};

const POSTS = {
  'KP1-lancement': `${brand(70, 64)}<div style="position:absolute;left:70px;right:70px;top:220px"><h1 style="font-size:118px">Vends.<br>Calcule.<br><em>Garde.</em></h1><p class="muted" style="font-size:40px;margin-top:40px">Les outils Margokit pour savoir ce que tu gardes vraiment sur chaque vente.</p><div style="margin-top:50px;display:flex;gap:16px;flex-wrap:wrap"><span class="pill" style="font-size:32px;padding:14px 28px">Calculateur gratuit</span><span class="ghost" style="font-size:30px;padding:12px 26px">Tracker 12 $</span><span class="ghost" style="font-size:30px;padding:12px 26px">Seller Pack 34 $</span></div></div>`,
  'KP2-quel-kit': `${brand(70, 64)}<div style="position:absolute;left:70px;right:70px;top:190px"><h2 style="font-size:84px">Quel kit <em>pour toi</em> ?</h2><div style="display:flex;flex-direction:column;gap:22px;margin-top:60px">${[['Tu lances un produit', 'Calculateur', 'Gratuit'], ['Tu as des commandes', 'Tracker', '12 $'], ['Tu fais de la pub', 'Seller Pack', '34 $'], ['Tu factures des pros', 'Margokit Pro', 'dès 0 $']].map(([a, b, c]) => `<div class="box" style="display:flex;justify-content:space-between;align-items:center;padding:30px 36px"><div><div class="muted" style="font-size:30px;font-weight:600">${a}</div><div class="k" style="font-size:52px;margin-top:6px">${b}</div></div><span class="pill" style="font-size:32px;padding:12px 26px">${c}</span></div>`).join('')}</div></div>`,
  'KP3-upgrade': `${brand(70, 64)}<div style="position:absolute;left:70px;right:70px;top:300px;text-align:center"><p class="muted" style="font-size:46px;font-weight:600">Tu as déjà le Tracker ?</p><div class="big" style="font-size:200px;margin-top:40px"><span style="color:#64748B;text-decoration:line-through">34 $</span> <em>22 $</em></div><p style="font-size:44px;margin-top:40px;color:#CBD5E1">Passe au Seller Pack avec le code</p><div class="pill" style="font-size:64px;padding:20px 50px;margin-top:30px">UPGRADE</div></div>`,
  'KP4-question-refus': `${brand(70, 64)}<div style="position:absolute;left:70px;right:70px;top:300px;text-align:center"><h1 style="font-size:96px">Ton taux de <em>colis refusés</em> ?</h1><div style="margin-top:70px;display:flex;flex-direction:column;gap:22px;align-items:center">${['A · moins de 15 %', 'B · 15 à 25 %', 'C · 25 à 35 %', 'D · je ne sais pas 😬'].map((x) => `<div class="box" style="font-size:44px;font-weight:700;padding:24px 40px;width:760px;text-align:left">${x}</div>`).join('')}</div><p class="muted" style="font-size:34px;margin-top:50px">Réponds en commentaire 👇</p></div>`,
  'KP5-colis-refuses': `${brand(70, 64)}<div style="position:absolute;left:70px;right:70px;top:200px"><h2 style="font-size:82px">Les colis refusés <em>divisent</em> ton bénéfice</h2><div style="display:grid;grid-template-columns:1fr 1fr;gap:24px;margin-top:70px">${[['25 % de refus', '44 MAD'], ['35 % de refus', '22 MAD']].map(([a, b], i) => `<div class="box" style="padding:50px 30px;text-align:center"><div class="muted" style="font-size:36px;font-weight:600">${a}</div><div class="big" style="font-size:110px;margin-top:20px;color:${i ? '#FCA5A5' : BRAND.lime}">${b}</div><div class="muted" style="font-size:28px;margin-top:12px">par commande livrée</div></div>`).join('')}</div><p class="muted" style="font-size:32px;margin-top:40px">Produit à 249 MAD, coût 90, livraison 35, retour 25, pub 40. Calculé avec le calculateur Margokit (gratuit).</p></div>`,
};
const STORIES = {
  'KS1-calculateur': `${brand(70, 160, 44)}<div style="position:absolute;left:70px;right:70px;top:330px"><h1 style="font-size:104px">Tu gardes <em>combien</em> sur une vente ?</h1></div><div style="position:absolute;left:0;right:0;top:760px;display:flex;justify-content:center">${crop('calc-resultats-mobile', { y: 380, h: 1300, w: 860 })}</div><div style="position:absolute;left:0;right:0;bottom:280px;text-align:center"><div class="pill" style="font-size:44px;padding:24px 44px">Calcule gratuitement ⬆️</div></div>`,
  'KS2-sondage-refus': `${brand(70, 160, 44)}<div style="position:absolute;left:70px;right:70px;top:420px;text-align:center"><h1 style="font-size:100px">Tu connais ton taux de <em>colis refusés</em> ?</h1><p class="muted" style="font-size:42px;margin-top:40px">(ajoute le sticker sondage ici)</p></div>`,
  'KS3-pack': `${brand(70, 160, 44)}<div style="position:absolute;left:70px;right:70px;top:320px"><h1 style="font-size:96px">Cette pub <em>perd</em> de l’argent ?</h1></div><div style="position:absolute;left:0;right:0;top:700px;display:flex;justify-content:center">${sheet('ads', 960)}</div><div style="position:absolute;left:0;right:0;bottom:300px;text-align:center"><div class="pill" style="font-size:44px;padding:24px 44px">Seller Pack ⬆️</div></div>`,
};

const D = (inner) => `${brand(90, 60, 40)}${inner}<div style="position:absolute;right:90px;bottom:50px;color:#64748B;font-size:22px">margokit.com · un produit VIT GLOBAL TECHNOLOGIES GROUP</div>`;
const two = (left, right) => `<div style="position:absolute;left:90px;top:200px;width:820px">${left}</div><div style="position:absolute;left:960px;top:150px;width:880px;height:820px;display:flex;align-items:center;justify-content:center">${right}</div>`;
const H = (t, s) => `<h2 style="font-size:70px">${em(t)}</h2>${s ? `<p style="font-size:32px;color:#CBD5E1;margin-top:28px">${em(s)}</p>` : ''}`;
const bl = (items) => `<div style="display:flex;flex-direction:column;gap:20px;margin-top:40px">${items.map((x, i) => `<div class="row"><span class="num" style="width:54px;height:54px;font-size:26px">${i + 1}</span><p style="font-size:30px;color:#E2E8F0;padding-top:6px">${em(x)}</p></div>`).join('')}</div>`;
const DECK = [
  D(`<div style="position:absolute;left:90px;top:250px;width:1100px"><h1 style="font-size:130px">Vends.<br>Calcule.<br><em>Garde.</em></h1><p class="muted" style="font-size:38px;margin-top:40px">Les kits Margokit pour les vendeurs en ligne :<br>savoir ce que tu gardes vraiment sur chaque vente.</p></div><div style="position:absolute;right:110px;top:220px">${sheet('trackerDashboard', 700)}</div>`),
  D(two(H('Le problème', 'Le chiffre d’affaires ne dit pas ce que tu gardes.') + bl(['Livraison, emballage et frais de plateforme', 'La pub payée à chaque commande', 'Les *colis refusés* en paiement à la livraison', 'Des commandes notées sur un cahier ou WhatsApp']), `<div class="box" style="padding:60px;text-align:center;width:760px"><p class="muted" style="font-size:34px">Vendu 249 MAD, il reste</p><div class="big" style="font-size:180px;color:${BRAND.lime};margin-top:20px">44 MAD</div><p class="muted" style="font-size:28px;margin-top:20px">par commande livrée (25 % de refus)</p></div>`)),
  D(`<div style="position:absolute;left:90px;right:90px;top:180px"><h2 style="font-size:72px">4 outils, <em>un parcours</em></h2><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:26px;margin-top:70px">${[['Calculateur', 'Gratuit', 'Avant de lancer : ce que je garde, mon prix minimum'], ['Tracker', '12 $', 'Mes commandes : bénéfice réel, stock, clients à risque'], ['Seller Pack', '34 $', 'Ma pub : verdict par campagne, budget, trésorerie'], ['Margokit Pro', 'dès 0 $', 'Mes clients pros : devis, factures, relances']].map(([a, b, c], i) => `<div class="box" style="padding:46px 30px"><div class="num" style="width:64px;height:64px;font-size:30px">${i + 1}</div><div class="k" style="font-size:48px;margin-top:26px">${a}</div><div class="pill" style="font-size:28px;padding:8px 20px;margin-top:16px">${b}</div><p style="font-size:28px;color:#CBD5E1;margin-top:24px">${c}</p></div>`).join('')}</div></div>`),
  D(two(H('*Calculateur* — gratuit', 'margokit.com/fr/calculator · sans compte · 10 devises') + bl(['Prix, coûts, pub et taux de refus', 'Ce que tu gardes par commande livrée', 'Prix minimum, prix pour 30 % et 50 % de marge', 'Pub max par commande et ROAS minimum']), crop('calc-resultats-mobile', { y: 380, h: 1500, w: 560 }))),
  D(two(H('*Tracker* Commandes & Stock — 12 $', 'Google Sheets · 6 onglets · versions MAD, € et $') + bl(['Commandes : 10 s par commande, bénéfice calculé', 'Produits & stock : mis à jour automatiquement', 'Clients : ⚠️ refus répétés, ⭐ fidèles', 'Tableau de bord : bénéfice net, retours, meilleur produit']), sheet('trackerOrders', 860))),
  D(two(H('*Seller Pack* — 34 $', 'Tout le Tracker + 5 onglets (11 onglets reliés)') + bl(['Publicité & ROAS : verdict ✅ / ❌ par campagne', 'Calculateur de prix : prix et ROAS minimum', 'Planning de contenu : vues, DM, meilleures accroches', 'Budget et trésorerie : alertes à 80 % et 100 %']), sheet('ads', 860))),
  D(two(H('Le *parcours* d’utilisation') + bl(['Jour 0 : « Créer une copie », le fichier est à toi', 'Jour 1 : paramètres en 10 minutes', 'Chaque commande : 1 ligne, 10 secondes', 'Chaque semaine : pubs (1 min / campagne), clients ⚠️, tableau de bord']), sheet('trackerCustomers', 860))),
  D(two(H('*Margokit Pro* pour les ventes aux pros', 'Quand une entreprise ou un revendeur t’achète.') + bl(['Devis → facture en 1 clic', 'Mentions du pays (ICE au Maroc), numérotation continue', 'Envoi par lien ou WhatsApp, relances automatiques', 'Gratuit 3 documents / mois, essai Pro 7 jours']), crop('devis-accepte-mobile', { y: 150, h: 1500, w: 560 }))),
  D(`<div style="position:absolute;left:90px;right:90px;top:180px"><h2 style="font-size:72px">Prix <em>simples</em>, paiement unique</h2><div style="display:grid;grid-template-columns:repeat(3,1fr);gap:28px;margin-top:70px">${[['0 $', 'Calculateur', 'Gratuit pour toujours'], ['12 $', 'Tracker', 'Une fois, mises à jour gratuites'], ['34 $', 'Seller Pack', '22 $ avec UPGRADE si tu as le Tracker']].map(([p, l, s]) => `<div class="box" style="padding:56px 30px;text-align:center"><div class="k" style="font-size:110px">${p}</div><div class="muted" style="font-size:36px;font-weight:600">${l}</div><p style="margin-top:22px;font-size:28px;color:#CBD5E1">${s}</p></div>`).join('')}</div><p class="muted" style="font-size:28px;margin-top:50px">Remboursement 14 jours · parité de pouvoir d’achat appliquée par Gumroad · carte refusée : paiement local via WhatsApp (Tracker 79 MAD, Pack 199 MAD).</p></div>`),
  D(`<div style="position:absolute;left:0;right:0;top:200px;display:flex;flex-direction:column;align-items:center;text-align:center;gap:44px">${LOGO_SVG(160)}<h1 style="font-size:96px">Commence par le <em>calculateur gratuit</em></h1><div class="pill" style="font-size:44px;padding:24px 48px">margokit.com/fr/calculator</div><p class="muted" style="font-size:30px">Tracker : margokit.gumroad.com/l/tracker · Seller Pack : margokit.gumroad.com/l/seller-pack</p><p class="muted" style="font-size:28px">contact@vit-global.tech · WhatsApp +212 6 07 74 26 72</p></div>`),
];

const browser = await chromium.launch();
async function render(html, w, h, file) {
  mkdirSync(dirname(file), { recursive: true });
  const p = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await p.setContent(page({ w, h, body: html, css: CSS, bg: BRAND.ink }), { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: file });
  await p.close();
}
async function toPdf(files, w, h, out) {
  const p = await browser.newPage();
  await p.setContent(`<html><head><style>@page{size:${w}px ${h}px;margin:0}body{margin:0}img{display:block;width:${w}px;height:${h}px;page-break-after:always}</style></head><body>${files.map((f) => `<img src="data:image/png;base64,${readFileSync(f).toString('base64')}">`).join('')}</body></html>`);
  await p.pdf({ path: out, width: `${w}px`, height: `${h}px`, printBackground: true });
  await p.close();
}
const V = join(OUT, 'visuels');
for (const [name, slides] of Object.entries(CAROUSELS)) {
  const files = [];
  for (const [i, s] of slides.entries()) {
    const f = join(V, 'carrousels', name, `${String(i + 1).padStart(2, '0')}.png`);
    await render(s(i + 1, slides.length), 1080, 1350, f);
    files.push(f);
  }
  await toPdf(files, 1080, 1350, join(V, 'carrousels', `${name}.pdf`));
  console.log(`✓ carrousel ${name} (${slides.length} + PDF)`);
}
for (const [name, html] of Object.entries(POSTS)) await render(html, 1080, 1350, join(V, 'posts', `${name}.png`));
console.log(`✓ ${Object.keys(POSTS).length} posts`);
for (const [name, html] of Object.entries(STORIES)) await render(html, 1080, 1920, join(V, 'stories', `${name}.png`));
console.log(`✓ ${Object.keys(STORIES).length} stories`);
const P = join(OUT, 'presentation');
const files = [];
for (const [i, html] of DECK.entries()) {
  const f = join(P, 'slides', `${String(i + 1).padStart(2, '0')}.png`);
  await render(html, 1920, 1080, f);
  files.push(f);
}
await toPdf(files, 1920, 1080, join(P, 'Margokit-kits-presentation.pdf'));
console.log(`✓ présentation (${DECK.length} slides + PDF)`);
await browser.close();
