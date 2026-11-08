/**
 * Campagne « Ce que tu gardes vraiment » — 16 novembre → 13 décembre 2026.
 * SOURCE UNIQUE de tous les posts. Après une modification : `node marketing/campagne/build.mjs`
 * régénère facebook.md, instagram.md, tiktok.md, linkedin.md, calendrier.md et apercu.html.
 *
 * Chiffres : formules du calculateur (app/src/lib/profit.ts). Exemple de référence : prix 25 €, produit 6 €,
 * emballage 0,50 €, livraison 5 €, retour 3 €, paiement 2,9 %, pub 4 €/commande, 20 % de colis refusés → 5,65 €.
 */

export const CAMPAIGN = {
  name: 'Ce que tu gardes vraiment',
  slug: 'ce-que-tu-gardes',
  start: '2026-11-16',
  end: '2026-12-13',
  hashtag: '#CeQueTuGardes',
};

const UTM = (src, content, path = 'fr/calculator') =>
  `https://margokit.com/${path}?utm_source=${src}&utm_medium=social&utm_campaign=${CAMPAIGN.slug}&utm_content=${content}`;
const GUM = (product, src, content) => `https://margokit.gumroad.com/l/${product}?utm_source=${src}&utm_campaign=${CAMPAIGN.slug}&utm_content=${content}`;
export const LINKS = { UTM, GUM, whatsapp: 'https://wa.me/212607742672' };

export const WEEKS = [
  { n: 1, dates: '16 → 22 nov.', theme: 'Combien tu gardes vraiment ?', goal: 'Faire découvrir le problème et le calculateur gratuit. Récolter les premiers « CALCUL » en commentaire.' },
  { n: 2, dates: '23 → 29 nov.', theme: 'Black Friday sans perdre d’argent', goal: 'Profiter du Black Friday (vendredi 27) : tester sa promo avant de la lancer. Offre de lancement EARLY −25 %.' },
  { n: 3, dates: '30 nov. → 6 déc.', theme: 'Colis refusés et pubs qui mentent', goal: 'Montrer le Tracker (COD, clients à risque) et le Pack Vendeur (ROAS réel). Premiers petits tests publicitaires.' },
  { n: 4, dates: '7 → 13 déc.', theme: 'Factures de fin d’année', goal: 'Margokit Pro pour les freelances et petites entreprises (gratuit 3 documents/mois). Bilan et relance de l’offre.' },
];

export const NETWORKS = {
  instagram: { label: 'Instagram', handle: '@margokit', rhythm: '3 posts/semaine (lun · mer · ven, 19 h) + stories tous les jours', bio: 'Sache ce que tu gardes vraiment 💚\nCalculateur de bénéfice gratuit pour vendeurs en ligne\nGoogle Sheets · Devis & factures\n👇 Calcule ta marge en 10 s', link: UTM('instagram', 'bio') },
  facebook: { label: 'Facebook', handle: 'Page Margokit', rhythm: '3 posts/semaine sur la Page (lun · mer · ven, 20 h) + 1 post de valeur/semaine dans les groupes', bio: 'Outils simples pour connaître ton vrai bénéfice, suivre tes commandes et facturer comme un pro. Calculateur gratuit.', link: UTM('facebook', 'page') },
  tiktok: { label: 'TikTok', handle: '@margokit', rhythm: '5 vidéos ou carrousels/semaine (lun → ven, 20 h 30)', bio: 'Ton vrai bénéfice en 10 s 👇\nCalculateur gratuit', link: UTM('tiktok', 'bio') },
  linkedin: { label: 'LinkedIn', handle: 'Profil de Manasse + Page Margokit', rhythm: '2 posts/semaine (mar · jeu, 8 h 30) sur ton profil, repartagés par la Page', bio: 'Fondateur de Margokit · Outils de rentabilité et de facturation pour vendeurs en ligne et freelances', link: UTM('linkedin', 'profil', 'fr') },
};

const car = (name, n) => Array.from({ length: n }, (_, i) => `${name}-${i + 1}.png`);

// ---------------------------------------------------------------------------
// INSTAGRAM
// ---------------------------------------------------------------------------
const instagram = [
  { date: '2026-11-16', time: '19:00', format: 'Carrousel', week: 1, title: 'Tu vends à 25 €, tu gardes combien ?', visuals: car('car-calcul-25', 6),
    caption: `Tu vends à 25 €. Tu crois garder 19 €.
Tu gardes 5,65 €. 😬

Livraison, emballage, pub, frais de paiement… et surtout les colis refusés. Chaque colis qui revient, tu paies la livraison, le retour et la pub pour 0 € encaissé.

Glisse pour voir le calcul complet 👉

💬 Commente CALCUL avec ton prix de vente et ton coût produit : je te réponds avec ton vrai bénéfice.
🔗 Calculateur gratuit, sans inscription : lien en bio.`,
    hashtags: '#ecommerce #vendreenligne #entrepreneur #petitebusiness #codmaroc #CeQueTuGardes' },
  { date: '2026-11-18', time: '19:00', format: 'Reel', week: 1, title: 'Le calcul en 20 secondes', visuals: ['video:01-calculateur-5-65-FR.mp4'], status: 'prêt',
    caption: `Tu vends à 25 €, tu crois garder 19 €… tu gardes 5,65 €.
Livraison, pub et colis refusés compris : vérifie tes vrais chiffres en 10 secondes, gratuitement.
👉 Lien en bio.`,
    hashtags: '#ecommerce #vendreenligne #entrepreneur #codmaroc #petitebusiness' },
  { date: '2026-11-20', time: '19:00', format: 'Carrousel', week: 1, title: 'Les 4 outils Margokit', visuals: car('car-kits', 6),
    caption: `Margokit, c’est 4 outils pour savoir ce que tu gardes vraiment :

1️⃣ Calculateur (gratuit) : ton vrai bénéfice avant de lancer un produit
2️⃣ Tracker (12 $) : chaque commande, son vrai bénéfice, dans Google Sheets
3️⃣ Pack Vendeur (34 $) : quelle pub te rapporte vraiment
4️⃣ Margokit Pro (gratuit pour commencer) : devis et factures en 1 minute

Paiement unique pour les Google Sheets, pas d’abonnement. Remboursé sous 14 jours.

📌 Enregistre ce post pour savoir par où commencer.`,
    hashtags: '#googlesheets #ecommerce #freelance #petitebusiness #outilsentrepreneur' },

  { date: '2026-11-23', time: '19:00', format: 'Carrousel', week: 2, title: 'Black Friday : vérifie ta promo', visuals: car('car-black-friday', 5),
    caption: `−30 % pour le Black Friday ? Fais ce calcul avant. ⚠️

Sur un produit à 25 € qui rapporte 5,65 € :
• −15 % → tu gardes 2,01 €
• −20 % → 0,79 €
• −30 % → tu PERDS 1,63 € par vente

Ta livraison, ta pub et tes colis refusés ne baissent pas avec ton prix.

👉 Mets ton prix promo dans le calculateur gratuit (lien en bio) avant de lancer ta promo.
📤 Envoie ce post à un vendeur qui prépare son Black Friday.`,
    hashtags: '#blackfriday #ecommerce #vendreenligne #promo #entrepreneur #CeQueTuGardes' },
  { date: '2026-11-25', time: '19:00', format: 'Reel', week: 2, title: 'Les 3 kits en 22 secondes', visuals: ['video:02-les-3-kits-FR.mp4'], status: 'prêt',
    caption: `3 outils pour vendre et facturer, sur un seul site : un calculateur gratuit qui te montre ce que tu gardes vraiment, des Google Sheets qui suivent chaque commande, et Margokit Pro pour passer du devis à la facture en un clic.

🎁 Cette semaine : −25 % sur les Google Sheets avec le code EARLY (50 premiers).
👉 Lien en bio.`,
    hashtags: '#ecommerce #vendreenligne #freelance #facturation #petitebusiness' },
  { date: '2026-11-27', time: '19:00', format: 'Reel', week: 2, title: '+10 % de prix = +43 % de bénéfice', visuals: ['video:script n°4 (videos.md)'], status: 'à tourner',
    hook: '+10 % sur ton prix = +43 % de bénéfice.',
    screen: 'Calculateur avec l’exemple 25 € (lien ci-dessous), puis change le prix en 27,50.',
    script: '« Aujourd’hui tout le monde baisse ses prix. Regarde l’inverse. À 25 €, je garde 5,65. À 27,50, je garde 8,08. Dix pour cent de plus sur le prix, quarante-trois pour cent de plus dans la poche. Ton client ne verra pas 2,50 €. Ton compte en banque, si. Calculateur gratuit, lien en bio. »',
    caption: `Black Friday : tout le monde baisse ses prix. Et si tu faisais l’inverse ?
À 25 € tu gardes 5,65 €. À 27,50 € tu gardes 8,08 €. +43 %.
Teste avec tes chiffres, lien en bio.
🎁 Code EARLY : −25 % sur les Google Sheets Margokit jusqu’au 30 novembre.`,
    hashtags: '#blackfriday #prix #ecommerce #vendreenligne #entrepreneur' },

  { date: '2026-11-30', time: '19:00', format: 'Carrousel', week: 3, title: 'COD : 30 % de colis refusés', visuals: car('car-cod', 5),
    caption: `Paiement à la livraison : 30 % de colis refusés.
Sur un produit à 199 DH, tu gardes 32 DH.

Même produit, même pub, 15 % de refus → 54 DH. +66 %. 📈

3 réflexes :
1. Confirme chaque commande par appel ou WhatsApp
2. Demande un acompte aux clients qui ont déjà refusé un colis
3. Compare tes transporteurs

Le Tracker Margokit (version Maroc, en DH) repère tout seul les clients ⚠️ à risque.
💬 Écris COLIS en DM, je t’envoie 2 captures.`,
    hashtags: '#codmaroc #ecommercemaroc #vendreenligne #paiementalalivraison #dropshippingmaroc #youcan' },
  { date: '2026-12-02', time: '19:00', format: 'Reel', week: 3, title: 'Le colis refusé (COD Maroc)', visuals: ['video:script n°3 (tournage-semaine-1.md, vidéo 1)'], status: 'à tourner',
    hook: '30 % de colis refusés → 15 % = +66 % de bénéfice',
    screen: 'Lien pré-rempli de tournage-semaine-1.md (199 DH, 30 % de refus), puis remplace 30 par 15.',
    script: '« Paiement à la livraison, 199 dirhams. Avec 30 % de colis refusés, je garde 32. Même produit, 15 % de refus… 54. Même pub, même prix. Juste : confirme tes commandes avant d’expédier. Lien en bio. »',
    caption: `Les colis refusés tuent ta marge en silence.
Confirme chaque commande 📞 avant d’expédier.
Calcule ton taux limite gratuitement : lien en bio.`,
    hashtags: '#codmaroc #ecommerce #vendreenligne #maroc #entrepreneur' },
  { date: '2026-12-04', time: '19:00', format: 'Carrousel', week: 3, title: 'ROAS de 3 = 0,23 €', visuals: car('car-roas', 5),
    caption: `Ton gestionnaire de pub affiche un ROAS de 3. Bravo ?
Sur un produit à 25 € avec 1 colis sur 5 refusé, tu gagnes… 0,23 € par commande.

Il n’y a pas de « bon ROAS » universel. Il y a TON ROAS minimum : ici 2,93. En dessous, chaque vente te coûte de l’argent.

💬 Commente ROAS : je calcule le tien.
📊 Le Pack Vendeur donne un verdict ✅/❌ pour chaque campagne.`,
    hashtags: '#facebookads #tiktokads #roas #ecommerce #dropshipping #CeQueTuGardes' },

  { date: '2026-12-07', time: '19:00', format: 'Carrousel', week: 4, title: 'Devis → facture en 1 clic', visuals: car('car-pro', 5),
    caption: `Freelances, artisans, petites entreprises : ton client a dit oui ?
Ta facture est prête en 1 clic. ✅

Margokit Pro :
• Devis → facture → avoir, numérotation automatique
• Ton logo, tes mentions légales, PDF en français ou en anglais
• Envoi par lien, e-mail ou WhatsApp
• Tu vois qui a payé et qui est en retard
• Formats Factur-X et UBL pour la facture électronique

Gratuit jusqu’à 3 documents par mois. Lien en bio.`,
    hashtags: '#freelance #autoentrepreneur #facturation #devis #petiteentreprise #factureelectronique' },
  { date: '2026-12-09', time: '19:00', format: 'Reel', week: 4, title: 'Le devis qui devient facture', visuals: ['video:script n°30 mis à jour'], status: 'à tourner',
    hook: 'Le client a dit oui. La facture prend… 1 clic.',
    screen: 'Enregistrement d’écran sur margokit.com avec un compte de test : ouvre un devis, clique « Convertir en facture », ouvre le PDF, appuie sur « Envoyer par WhatsApp ».',
    script: '« Le client a dit oui. Avant : je recopiais tout dans Word. Maintenant : un clic, la facture est créée, numérotée, avec mes mentions. J’envoie le lien sur WhatsApp. Gratuit jusqu’à 3 documents par mois, lien en bio. »',
    caption: `Le client a dit oui → 1 clic → facture envoyée sur WhatsApp. 🧾
Margokit Pro, gratuit jusqu’à 3 documents par mois. Lien en bio.`,
    hashtags: '#freelance #facture #devis #autoentrepreneur #entrepreneur' },
  { date: '2026-12-11', time: '19:00', format: 'Reel', week: 4, title: 'Le tableau de bord en 15 secondes', visuals: ['video:script n°20 (videos.md)'], status: 'à tourner',
    hook: 'Tout vendeur a besoin de ce tableau de bord.',
    screen: 'Scroll lent du Tableau de bord du Tracker (copie de démonstration), 2 s par tuile, musique tendance, sans voix.',
    script: 'Sans voix. Texte à l’écran tuile par tuile : CA · Bénéfice net · Taux de livraison · Taux de retour · Panier moyen · Meilleur canal. Fin : « Template Google Sheets, lien en bio ».',
    caption: `CA, bénéfice net, taux de livraison, taux de retour, panier moyen, meilleur canal.
Tout se calcule tout seul depuis tes commandes. Google Sheets, paiement unique.
Lien en bio. 📊`,
    hashtags: '#googlesheets #ecommerce #vendreenligne #organisation #entrepreneur' },
];

export const STORIES = [
  { week: 1, items: [
    'Lun : repartage du carrousel + sticker « Nouveau post ».',
    'Mar : visuel story-sondage.png + sticker Sondage « Oui, au centime près / À peu près / Aucune idée ».',
    'Mer : repartage du Reel.',
    'Jeu : résultats du sondage + « Envoie-moi CALCUL en DM ».',
    'Ven : visuel story-calculateur.png + sticker Lien vers le calculateur.',
  ] },
  { week: 2, items: [
    'Lun : visuel story-black-friday.png + sticker Lien.',
    'Mar : sticker Question « Tu fais une promo Black Friday ? De combien ? » → réponds en calculant leur marge en story.',
    'Mer : visuel story-early.png + sticker Lien vers Gumroad + sticker Compte à rebours « Fin EARLY 30 nov. ».',
    'Ven (Black Friday) : story-early.png à nouveau + « Dernier week-end ».',
    'Dim 29 : « Plus que 24 h » avec le compte à rebours.',
  ] },
  { week: 3, items: [
    'Lun : repartage du carrousel COD + sticker Quiz « Ton taux de colis refusés ? <10 % / 10–20 % / 20–30 % / >30 % ».',
    'Mer : script de confirmation de commande en texte (vidéo n°14) à enregistrer 📌.',
    'Ven : repartage carrousel ROAS + sticker Question « Ton ROAS actuel ? ».',
  ] },
  { week: 4, items: [
    'Lun : repartage carrousel Pro + sticker Lien vers margokit.com/fr/signup.',
    'Mer : coulisses : capture d’une facture créée en 1 minute (compte de démo).',
    'Ven : bilan « Merci aux X personnes qui ont testé le calculateur ce mois-ci » (vrai chiffre de Vercel Analytics).',
  ] },
];

// ---------------------------------------------------------------------------
// FACEBOOK (Page + groupes)
// ---------------------------------------------------------------------------
const facebook = [
  { date: '2026-11-16', time: '20:00', format: 'Album (6 images)', week: 1, title: 'Tu vends à 25 €, tu gardes combien ?', visuals: car('car-calcul-25', 6),
    caption: `Question honnête aux vendeurs en ligne : sur une vente à 25 €, vous gardez combien ?

La plupart répondent 19 € (25 − 6 € de produit).
La vraie réponse, une fois tout compté : 5,65 €.

Ce qui manque dans le calcul :
→ emballage 0,50 €
→ livraison 5 €
→ pub 4 € par commande
→ frais de paiement 2,9 %
→ 1 colis sur 5 refusé, avec 3 € de frais de retour

Le prix minimum pour ne rien perdre : 19,18 €. Pour 30 % de marge : 27,76 €.

J’ai mis ce calcul dans un outil gratuit, sans inscription. Écrivez CALCUL en commentaire avec votre prix et votre coût produit, je vous réponds avec votre vrai bénéfice.`,
    firstComment: `Le calculateur gratuit : ${UTM('facebook', 'calcul-25')}`, hashtags: '' },
  { date: '2026-11-18', time: '20:00', format: 'Vidéo', week: 1, title: 'Le calcul en 20 secondes', visuals: ['video:01-calculateur-5-65-FR.mp4'], status: 'prêt',
    caption: `20 secondes pour comprendre pourquoi ton compte en banque ne suit pas ton chiffre d’affaires. 👇
Fais le test avec tes propres chiffres (gratuit) : lien en commentaire.`,
    firstComment: `👉 ${UTM('facebook', 'video-calcul')}`, hashtags: '' },
  { date: '2026-11-20', time: '20:00', format: 'Album (6 images)', week: 1, title: 'Les 4 outils Margokit', visuals: car('car-kits', 6),
    caption: `Je vous présente Margokit 💚

J’ai construit ces outils après avoir vu trop de vendeurs vendre beaucoup… et ne rien garder.

1. Calculateur — gratuit. Ton vrai bénéfice par vente, ton prix minimum, ton ROAS rentable.
2. Tracker — 12 $ une fois. Commandes, stock, clients et tableau de bord dans Google Sheets. Version Maroc en DH incluse.
3. Pack Vendeur — 34 $ une fois. Le Tracker + suivi des pubs avec verdict par campagne, planning de contenu, trésorerie, budget.
4. Margokit Pro — gratuit jusqu’à 3 documents/mois. Devis et factures en ligne, envoi par WhatsApp.

Pas d’abonnement pour les Google Sheets. Remboursé sous 14 jours. Paiement local possible par WhatsApp.

Par lequel vous commenceriez ? 👇`,
    firstComment: `Tout est ici : ${UTM('facebook', 'kits', 'fr')}`, hashtags: '',
    note: 'La 1re phrase raconte ton histoire : garde-la seulement si elle est vraie pour toi.' },

  { date: '2026-11-23', time: '20:00', format: 'Album (5 images)', week: 2, title: 'Black Friday : vérifie ta promo', visuals: car('car-black-friday', 5),
    caption: `Avant de mettre −30 % pour le Black Friday, lisez ça.

Produit à 25 €, qui rapporte 5,65 € par vente.
• Promo −15 % : il reste 2,01 €
• Promo −20 % : il reste 0,79 €
• Promo −30 % : vous perdez 1,63 € à chaque vente

À −20 %, il faut 7 fois plus de ventes pour gagner la même chose.

Ce qui marche mieux : un cadeau, un lot avec livraison offerte, ou une remise calculée qui reste au-dessus de votre prix minimum.

Testez votre promo dans le calculateur gratuit avant de la lancer (lien en commentaire).`,
    firstComment: `🧮 ${UTM('facebook', 'black-friday')}`, hashtags: '' },
  { date: '2026-11-25', time: '20:00', format: 'Vidéo', week: 2, title: 'Les 3 kits en 22 secondes + offre EARLY', visuals: ['video:02-les-3-kits-FR.mp4'], status: 'prêt',
    caption: `Offre de lancement 🎁
−25 % sur le Tracker et le Pack Vendeur avec le code EARLY, réservé aux 50 premiers, jusqu’au 30 novembre.

Paiement unique, remboursé sous 14 jours. Carte refusée ? Écrivez-moi sur WhatsApp, on trouve une solution locale.`,
    firstComment: `Tracker : ${GUM('tracker', 'facebook', 'early')}\nPack Vendeur : ${GUM('seller-pack', 'facebook', 'early')}`, hashtags: '' },
  { date: '2026-11-27', time: '20:00', format: 'Image', week: 2, title: 'Black Friday : le tableau qui résume tout', visuals: ['car-black-friday-2.png'],
    caption: `C’est le Black Friday. Avant d’appuyer sur « publier » pour votre promo, gardez ce tableau en tête. 👆

Et si vous voulez suivre le vrai bénéfice de chaque commande ce week-end, le code EARLY (−25 %) marche encore jusqu’à lundi.`,
    firstComment: `Calculateur : ${UTM('facebook', 'bf-jour-j')}`, hashtags: '' },

  { date: '2026-11-30', time: '20:00', format: 'Album (5 images)', week: 3, title: 'COD : 30 % de colis refusés', visuals: car('car-cod', 5),
    caption: `Vendeurs en paiement à la livraison 🇲🇦🇨🇮🇸🇳 : quel est votre taux de colis refusés ?

Sur un produit à 199 DH :
• 30 % de refus → vous gardez 32 DH par commande
• 15 % de refus → 54 DH. +66 %, sans changer de prix ni de pub.

Les 3 réflexes qui font baisser les refus :
1. Confirmer chaque commande par appel ou vocal WhatsApp
2. Demander un acompte aux clients qui ont déjà refusé
3. Comparer le taux de livraison de chaque transporteur

Le Tracker Margokit (version Maroc en DH) signale automatiquement les clients ⚠️ à risque. Écrivez COLIS en commentaire, je vous envoie les captures en privé.`,
    firstComment: '', hashtags: '' },
  { date: '2026-12-02', time: '20:00', format: 'Vidéo', week: 3, title: 'Le colis refusé (COD Maroc)', visuals: ['video:script n°3 (tournage-semaine-1.md, vidéo 1)'], status: 'à tourner',
    caption: `30 % → 15 % de colis refusés = +66 % de bénéfice. La démonstration en 25 secondes. 👇`,
    firstComment: `Faites le calcul en DH : ${UTM('facebook', 'cod-video')}`, hashtags: '' },
  { date: '2026-12-04', time: '20:00', format: 'Album (5 images)', week: 3, title: 'ROAS de 3 = 0,23 €', visuals: car('car-roas', 5),
    caption: `« Ma campagne a un ROAS de 3, elle est rentable. »
Pas forcément.

Produit à 25 €, 1 colis sur 5 refusé :
ROAS 2,5 → −1,85 € par commande
ROAS 3 → +0,23 €
ROAS 4 → +2,84 €

Votre ROAS minimum dépend de votre marge et de votre taux de livraison. Calculez-le avant de lancer votre prochaine campagne (gratuit, lien en commentaire).`,
    firstComment: `🧮 ${UTM('facebook', 'roas')}`, hashtags: '' },

  { date: '2026-12-07', time: '20:00', format: 'Album (5 images)', week: 4, title: 'Devis → facture en 1 clic', visuals: car('car-pro', 5),
    caption: `Freelances, artisans, petites entreprises : fini les factures sur Word. 🧾

Avec Margokit Pro :
✔ Devis transformé en facture en 1 clic
✔ Numérotation automatique, mentions légales, votre logo
✔ PDF en français ou en anglais
✔ Envoi par lien, e-mail ou WhatsApp
✔ Suivi payé / en retard
✔ Formats Factur-X et UBL pour la facture électronique

Gratuit jusqu’à 3 documents par mois.`,
    firstComment: `Créer un compte gratuit : ${UTM('facebook', 'pro', 'fr/signup')}`, hashtags: '' },
  { date: '2026-12-09', time: '20:00', format: 'Vidéo', week: 4, title: 'Le devis qui devient facture', visuals: ['video:script n°30 mis à jour'], status: 'à tourner',
    caption: `Le client a dit oui → 1 clic → facture envoyée sur WhatsApp. Démonstration. 👇`,
    firstComment: `Gratuit jusqu’à 3 documents/mois : ${UTM('facebook', 'pro-video', 'fr/signup')}`, hashtags: '' },
  { date: '2026-12-11', time: '20:00', format: 'Texte + question', week: 4, title: 'Bilan : quel outil vous manque ?', visuals: ['deck-03.png'],
    caption: `Un mois que je partage ici les calculs que trop de vendeurs ne font pas. Merci à tous ceux qui ont commenté, testé le calculateur et posé leurs questions. 🙏

Je prépare la suite de Margokit. Dites-moi en commentaire :
quel est le chiffre de votre activité que vous aimeriez connaître et que vous ne connaissez pas aujourd’hui ?

Je réponds à chaque commentaire.`,
    firstComment: '', hashtags: '' },
];

export const FB_GROUPS = {
  intro: `Les groupes Facebook sont l’endroit où tes clients posent leurs questions (« combien vendre ? », « mon ROAS est bon ? », « trop de retours »). Règle : de la valeur d’abord, jamais de lien dans le post. Le lien seulement en réponse à quelqu’un qui le demande. Lis le règlement de chaque groupe avant de poster.`,
  where: [
    'E-commerce Maroc, vendeurs YouCan, dropshipping Maroc, COD Maroc',
    'E-commerce Côte d’Ivoire / Sénégal / Afrique francophone',
    'Shopify France, dropshipping francophone, vendeurs TikTok Shop',
    'Freelances, auto-entrepreneurs et micro-entrepreneurs (semaine 4)',
  ],
  posts: [
    { week: 1, title: 'Le calcul complet d’une vente à 25 €', text: `J’ai fait le calcul complet d’une vente à 25 € pour un vendeur en ligne, et le résultat m’a surpris.

Produit 6 €, emballage 0,50 €, livraison 5 €, pub 4 € par commande, frais de paiement 2,9 %, et 1 colis sur 5 refusé (3 € de frais de retour).

Bénéfice réel par commande livrée : 5,65 €. Pas 19 €.
Prix minimum pour ne rien perdre : 19,18 €.

Vous comptez vos colis refusés dans votre marge, vous ? Je peux faire le calcul pour votre produit si vous me donnez vos chiffres en commentaire.` },
    { week: 2, title: 'Votre promo Black Friday est-elle rentable ?', text: `Petit calcul avant le Black Friday 👇

Un produit à 25 € qui rapporte 5,65 € par vente :
−15 % → 2,01 € de bénéfice
−20 % → 0,79 €
−30 % → −1,63 € (perte à chaque vente)

La livraison, la pub et les retours ne baissent pas avec le prix. Si vous voulez, donnez-moi votre prix, votre coût produit et votre remise prévue : je vous dis ce qu’il vous reste.` },
    { week: 3, title: 'Le script de confirmation qui réduit les refus', text: `Pour ceux qui vendent en paiement à la livraison : le script qui réduit les colis refusés.

Avant chaque expédition, appel ou vocal WhatsApp :
« Bonjour, c’est [boutique]. Je confirme ta commande de [produit], total [prix] DH, livrée demain à [ville]. Tu seras disponible ? »

Pas de réponse après 2 essais → on n’expédie pas.
Client qui a déjà refusé 2 colis → on demande un acompte.

Sur un produit à 199 DH, passer de 30 % à 15 % de refus fait passer le bénéfice de 32 à 54 DH par commande. Quel est votre taux en ce moment ?` },
    { week: 4, title: 'Factures : vous faites comment ?', text: `Question aux freelances et auto-entrepreneurs : vous faites vos devis et factures avec quoi ?

Word / Excel, un logiciel payant, ou autre ?

Je demande parce qu’en France, toutes les entreprises devront émettre des factures électroniques au plus tard en septembre 2027 (format Factur-X ou UBL), et beaucoup de petits indépendants ne sont pas encore prêts. Curieux de savoir où vous en êtes.` },
  ],
};

// ---------------------------------------------------------------------------
// TIKTOK
// ---------------------------------------------------------------------------
const tk = (date, week, title, o) => ({ date, time: '20:30', week, title, ...o });
const tiktok = [
  tk('2026-11-16', 1, 'Ce que tu gardes sur 25 €', { format: 'Vidéo', visuals: ['video:01-calculateur-5-65-FR.mp4'], status: 'prêt',
    caption: 'Tu vends à 25 €. Tu gardes 5,65 €. Voilà pourquoi 👇 Calculateur gratuit en bio.', hashtags: '#ecommerce #vendreenligne #entrepreneur #codmaroc' }),
  tk('2026-11-17', 1, 'CA ≠ bénéfice', { format: 'Vidéo', visuals: ['video:script n°12 (videos.md)'], status: 'à tourner',
    hook: '« J’ai fait 10 000 € ce mois-ci. » Non.', screen: 'Texte en gros, puis le Tableau de bord du Tracker (CA vs bénéfice net).',
    script: '« Tu as VENDU 10 000. Après produits, livraison, pub, frais et retours, il peut te rester 15 à 25 %, ou beaucoup moins. Soit 1 500 à 2 500 au mieux. Connais ton chiffre avant de quitter ton travail. »',
    caption: 'Chiffre d’affaires ≠ bénéfice. Calcule le tien, lien en bio.', hashtags: '#entrepreneur #ecommerce #argent #vendreenligne' }),
  tk('2026-11-18', 1, '3 erreurs qui tuent ta marge', { format: 'Vidéo', visuals: ['video:script n°11 (videos.md)'], status: 'à tourner',
    hook: '3 erreurs qui tuent ta marge (la 3e est la pire).', screen: '3 cartes texte + le calculateur pour chacune.',
    script: '« Un : oublier l’emballage, 50 centimes fois 1000 commandes, ça fait 500 euros. Deux : ignorer les frais de paiement, 3 % de chaque vente. Trois : ne pas compter les colis refusés. À 30 % de retours, 5,65 devient 3,42. Lien en bio. »',
    caption: 'Laquelle tu fais ? 👇', hashtags: '#ecommerce #entrepreneur #vendreenligne #conseilsbusiness' }),
  tk('2026-11-19', 1, 'Carrousel photo : le calcul complet', { format: 'Carrousel photo', visuals: car('car-calcul-25', 6),
    caption: 'Le calcul que personne ne fait. Glisse 👉 Commente CALCUL avec ton prix, je te réponds avec ton vrai bénéfice.', hashtags: '#ecommerce #vendreenligne #petitebusiness #CeQueTuGardes' }),
  tk('2026-11-20', 1, 'Les 3 kits', { format: 'Vidéo', visuals: ['video:02-les-3-kits-FR.mp4'], status: 'prêt',
    caption: '3 outils pour vendre et facturer, sur un seul site. Commence gratuitement 👉 lien en bio.', hashtags: '#ecommerce #freelance #facturation #googlesheets' }),

  tk('2026-11-23', 2, 'Carrousel photo : Black Friday', { format: 'Carrousel photo', visuals: car('car-black-friday', 5),
    caption: '−30 % pour le Black Friday = −1,63 € par vente. Vérifie ta promo avant de la lancer 👇', hashtags: '#blackfriday #ecommerce #promo #vendreenligne' }),
  tk('2026-11-24', 2, 'Le prix minimum', { format: 'Vidéo', visuals: ['video:script n°6 (videos.md)'], status: 'à tourner',
    hook: 'En dessous de ce prix, tu travailles gratuitement.', screen: 'Calculateur exemple 25 €, zoom sur « Prix minimum (sans perte) » = 19,18 €.',
    script: '« Avant ta promo Black Friday, connais ce chiffre : ton prix minimum. Pour ce produit, 19,18 €. Une promo qui descend en dessous, c’est de l’argent perdu à chaque vente. Calcule le tien, lien en bio. »',
    caption: 'Ton prix minimum, en 10 secondes. Lien en bio.', hashtags: '#blackfriday #prix #ecommerce #entrepreneur' }),
  tk('2026-11-25', 2, 'Mythe : il faut vendre plus', { format: 'Vidéo', visuals: ['video:script n°18 (videos.md)'], status: 'à tourner',
    hook: 'Tu n’as pas besoin de plus de ventes. Tu as besoin de meilleures marges.', screen: 'Les deux calculs en texte, puis le calculateur.',
    script: '« 100 ventes à 1 € de bénéfice = 100. 50 ventes à 8 € = 400. Moitié moins de travail, quatre fois plus d’argent. Corrige ta marge, ensuite accélère. »',
    caption: 'Marge d’abord, volume ensuite. 🎁 Code EARLY −25 % sur les Google Sheets Margokit cette semaine.', hashtags: '#ecommerce #entrepreneur #business #vendreenligne' }),
  tk('2026-11-26', 2, '+10 % de prix = +43 % de bénéfice', { format: 'Vidéo', visuals: ['video:script n°4 (videos.md)'], status: 'à tourner',
    hook: '+10 % sur ton prix. Regarde ton bénéfice.', screen: 'Calculateur exemple 25 €, puis prix 27,50.',
    script: '« 25 € : je garde 5,65. 27,50 : je garde 8,08. Dix pour cent de plus sur le prix, quarante-trois pour cent de plus dans ma poche. Lien en bio. »',
    caption: 'Petit changement de prix, gros changement de bénéfice.', hashtags: '#prix #ecommerce #vendreenligne #blackfriday' }),
  tk('2026-11-27', 2, 'Black Friday : le dropshipping à 1 €', { format: 'Vidéo', visuals: ['video:script n°2 (videos.md)'], status: 'à tourner',
    hook: 'Ce produit en dropshipping rapporte 1,03 € par vente.', screen: 'Préréglage Shopify, prix 29,99, coût 12, livraison 0, pub 15, retours 5 %.',
    script: '« Vendu 29,99. Coûte 12. Ça fait 18 euros de marge, non ? Ajoute 15 euros de pub par commande, les frais Shopify, 5 % de remboursements… 1,03 €. Et c’est avant ta promo Black Friday. Vérifie le tien, lien en bio. »',
    caption: 'Produit à 29,99 €, 1,03 € de bénéfice. Ta pub mange tout.', hashtags: '#dropshipping #shopify #blackfriday #ecommerce' }),

  tk('2026-11-30', 3, 'Carrousel photo : COD', { format: 'Carrousel photo', visuals: car('car-cod', 5),
    caption: '30 % de colis refusés → tu gardes 32 DH sur 199. Glisse pour les 3 réflexes 👉', hashtags: '#codmaroc #ecommercemaroc #vendreenligne #maroc' }),
  tk('2026-12-01', 3, 'Le colis refusé', { format: 'Vidéo', visuals: ['video:script n°3 (tournage-semaine-1.md, vidéo 1)'], status: 'à tourner',
    hook: '30 % de colis refusés → 15 % = +66 % de bénéfice', screen: 'Lien pré-rempli dans tournage-semaine-1.md.',
    script: '« Paiement à la livraison, 199 dirhams. Avec 30 % de colis refusés, je garde 32. Même produit, 15 % de refus… 54. Même pub, même prix. Juste : confirme tes commandes avant d’expédier. Lien en bio. »',
    caption: 'Les colis refusés tuent ta marge en silence. Confirme chaque commande 📞', hashtags: '#codmaroc #ecommerce #vendreenligne #maroc' }),
  tk('2026-12-02', 3, 'Le script de confirmation', { format: 'Vidéo', visuals: ['video:script n°14 (videos.md)'], status: 'à tourner',
    hook: 'L’appel de 20 secondes qui réduit tes colis refusés.', screen: 'Le script en texte + l’onglet Commandes avec le statut « Confirmée ».',
    script: '« Avant d’expédier : appel ou vocal. "Bonjour, c’est [boutique], je confirme ta commande de X, total Y, livrée demain à [ville]. Tu seras disponible ?" Pas de réponse deux fois ? N’expédie pas. Note-le dans ton tracker. »',
    caption: 'Enregistre ce script 📌', hashtags: '#codmaroc #ecommerce #vendreenligne #conseils' }),
  tk('2026-12-03', 3, 'Le ROAS qui ment', { format: 'Vidéo', visuals: ['video:script n°5 (videos.md)'], status: 'à tourner',
    hook: 'ROAS de 3. Tu gagnes 23 centimes.', screen: 'Calculateur exemple 25 €, zoom sur « ROAS minimum rentable » = 2,93.',
    script: '« Ton gestionnaire de pub affiche un ROAS de 3. Sur ce produit, avec 1 colis sur 5 refusé, ça fait 23 centimes par commande. Ton seuil, c’est 2,93. Calcule le tien, lien en bio. »',
    caption: 'ROAS ≠ bénéfice. Commente ROAS, je calcule ton seuil.', hashtags: '#facebookads #tiktokads #roas #ecommerce' }),
  tk('2026-12-04', 3, 'Quelle pub couper ?', { format: 'Vidéo', visuals: ['video:script n°21 (videos.md)'], status: 'à tourner',
    hook: '2 pubs sur 6 perdaient de l’argent. Le ROAS ne le montrait pas.', screen: 'Pack Vendeur (copie de démonstration), onglet Publicité, colonne Verdict.',
    script: '« Dans cet exemple : campagne montre, ROAS 1,96. Sac cabas, 0,88. Mais même au-dessus de 2, une campagne peut perdre de l’argent avec les retours. Cette colonne calcule le vrai bénéfice par campagne. Rouge = stop. »',
    caption: 'Le verdict ✅/❌ pour chaque campagne. Pack Vendeur, lien en bio.', hashtags: '#facebookads #tiktokads #ecommerce #googlesheets' }),

  tk('2026-12-07', 4, 'Arrête les factures sur Word', { format: 'Vidéo', visuals: ['video:script n°29 mis à jour'], status: 'à tourner',
    hook: 'Arrête de faire tes factures sur Word.', screen: 'Un fichier « facture_finale_v3.docx », puis margokit.com : création d’une facture.',
    script: '« Mauvais calculs, numéro fiscal oublié, "facture_finale_v3.docx"… Margokit Pro : devis en facture en un clic, PDF en français ou en anglais, envoyé par WhatsApp. Gratuit jusqu’à 3 documents par mois, lien en bio. »',
    caption: 'Freelances, celle-ci est pour vous. 🧾', hashtags: '#freelance #autoentrepreneur #facture #entrepreneur' }),
  tk('2026-12-08', 4, 'Le devis qui devient facture', { format: 'Vidéo', visuals: ['video:script n°30 mis à jour'], status: 'à tourner',
    hook: 'Le client a dit oui. La facture prend… 1 clic.', screen: 'Compte de test sur margokit.com : devis → « Convertir en facture » → PDF → « Envoyer par WhatsApp ».',
    script: '« Le client a dit oui. Un clic : la facture est créée, numérotée, avec mes mentions. J’envoie le lien sur WhatsApp. C’est tout. »',
    caption: 'Devis → facture → WhatsApp. Gratuit jusqu’à 3 documents/mois.', hashtags: '#freelance #facture #devis #autoentrepreneur' }),
  tk('2026-12-09', 4, 'Carrousel photo : Margokit Pro', { format: 'Carrousel photo', visuals: car('car-pro', 5),
    caption: 'Ton client a dit oui ? Facture en 1 clic 👉', hashtags: '#freelance #facturation #petiteentreprise #factureelectronique' }),
  tk('2026-12-10', 4, 'Le tableau de bord en 15 secondes', { format: 'Vidéo', visuals: ['video:script n°20 (videos.md)'], status: 'à tourner',
    hook: 'Tout vendeur a besoin de ce tableau de bord.', screen: 'Scroll lent du Tableau de bord du Tracker, musique tendance, sans voix.',
    script: 'Sans voix. Texte tuile par tuile, fin : « Template Google Sheets, lien en bio ».',
    caption: 'Tout se calcule depuis tes commandes. 📊', hashtags: '#googlesheets #ecommerce #organisation #vendreenligne' }),
  tk('2026-12-11', 4, 'La routine du dimanche', { format: 'Vidéo', visuals: ['video:script n°27 adapté'], status: 'à tourner',
    hook: 'La routine du dimanche d’un vendeur qui connaît ses chiffres (5 minutes).', screen: '4 écrans du Pack Vendeur (copie de démonstration), un par étape.',
    script: '« Un : mets à jour le statut de tes commandes. Deux : ajoute ta dépense pub par campagne. Trois : regarde ton bénéfice après pub. Quatre : coupe les campagnes en rouge. Terminé. »',
    caption: '5 minutes par semaine pour savoir ce que tu gardes vraiment.', hashtags: '#ecommerce #routine #entrepreneur #googlesheets' }),
];

// ---------------------------------------------------------------------------
// LINKEDIN (profil de Manasse)
// ---------------------------------------------------------------------------
const linkedin = [
  { date: '2026-11-17', time: '08:30', format: 'Texte + image', week: 1, title: 'Pourquoi j’ai construit Margokit', visuals: ['deck-01.png'],
    caption: `Il y a quelques mois, j’ai commencé à regarder de près les chiffres de petits vendeurs en ligne au Maroc et ailleurs.

Le même schéma revenait sans arrêt : beaucoup de commandes, un chiffre d’affaires qui monte, et un compte en banque qui ne suit pas.

La raison est presque toujours la même. On calcule « prix − coût du produit ». On oublie la livraison, l’emballage, les frais de paiement, la pub par commande… et surtout les colis refusés en paiement à la livraison.

Sur un produit vendu 25 €, ce vendeur pense garder 19 €. Il garde 5,65 €.

Alors j’ai construit Margokit : un calculateur gratuit, des Google Sheets qui suivent le vrai bénéfice de chaque commande, et une app de devis et factures pour les indépendants.

Je partagerai ici, deux fois par semaine, ce que j’apprends en lançant ce projet seul, depuis le Maroc.

Si vous accompagnez des e-commerçants ou des freelances, je serais ravi d’avoir votre regard.`,
    firstComment: `Le calculateur (gratuit, sans inscription) : ${UTM('linkedin', 'pourquoi')}`,
    note: 'Récit à ajuster à ton vécu réel avant de publier (comment tu as découvert le problème).' },
  { date: '2026-11-19', time: '08:30', format: 'Document PDF (carrousel)', week: 1, title: 'Le calcul complet d’une vente à 25 €', visuals: ['pdf:car-calcul-25.pdf', ...car('car-calcul-25', 6)],
    caption: `Le calcul que la plupart des vendeurs en ligne ne font jamais, en 6 pages. 👇

Le chiffre qui surprend le plus : le prix minimum. Pour ce produit, en dessous de 19,18 €, chaque vente fait perdre de l’argent. Beaucoup vendent à 19,99 € « parce que ça fait pas cher ».

Vous accompagnez des marques ou des e-commerçants : est-ce que vous voyez ce calcul fait correctement chez vos clients ?`,
    firstComment: `Pour refaire le calcul avec vos chiffres : ${UTM('linkedin', 'calcul-25')}` },

  { date: '2026-11-24', time: '08:30', format: 'Document PDF (carrousel)', week: 2, title: 'Black Friday : la promo qui coûte de l’argent', visuals: ['pdf:car-black-friday.pdf', ...car('car-black-friday', 5)],
    caption: `Le Black Friday est vendredi. Petit rappel de calcul pour les e-commerçants.

Une remise s’applique au prix. Pas aux coûts fixes par commande.

Produit à 25 €, 5,65 € de bénéfice :
• −20 % → 0,79 € de bénéfice. Il faut 7 fois plus de ventes pour gagner autant.
• −30 % → −1,63 € par vente.

Les alternatives qui protègent la marge : un cadeau, un lot (la livraison se paie une fois), ou une remise calculée au-dessus du prix minimum.

Le détail en 5 pages ci-dessous.`,
    firstComment: `Calculateur gratuit pour tester une remise : ${UTM('linkedin', 'black-friday')}` },
  { date: '2026-11-26', time: '08:30', format: 'Texte', week: 2, title: 'Ce que j’ai appris en 10 jours de lancement', visuals: [],
    caption: `10 jours de campagne pour Margokit. Ce que j’ai appris, sans filtre :

1. Pinterest seul ne suffit pas pour démarrer. J’avais 17 épingles programmées en octobre : le canal est lent, il faut des mois.
2. Les conversations rapportent plus que les publications. Un « CALCUL » en commentaire ouvre une vraie discussion.
3. Les gens ne veulent pas un outil. Ils veulent une réponse à « est-ce que je gagne de l’argent ? ».
4. [À compléter avec ton vrai chiffre : visites du calculateur, commentaires, inscriptions.]

Prochaine étape : les vendeurs en paiement à la livraison, là où la marge se perd le plus.

Fondateurs solo : quel canal vous a apporté vos 10 premiers clients ?`,
    firstComment: '' },

  { date: '2026-12-01', time: '08:30', format: 'Document PDF (carrousel)', week: 3, title: 'COD : le colis refusé, tueur de marge', visuals: ['pdf:car-cod.pdf', ...car('car-cod', 5)],
    caption: `En Afrique et au Maroc, une grande partie du e-commerce se paie à la livraison.

C’est un levier de confiance énorme pour le client. Et une source de pertes que peu de vendeurs mesurent : chaque colis refusé coûte la livraison, le retour et la pub, pour 0 encaissé.

Sur un produit à 199 DH, passer de 30 % à 15 % de colis refusés fait passer le bénéfice de 32 à 54 DH par commande. +66 %, sans toucher au prix ni à la pub.

Le détail et les 3 réflexes en 5 pages. 👇`,
    firstComment: `Version Maroc (DH) du Tracker : ${GUM('tracker', 'linkedin', 'cod')}` },
  { date: '2026-12-03', time: '08:30', format: 'Document PDF (carrousel)', week: 3, title: 'Il n’y a pas de bon ROAS', visuals: ['pdf:car-roas.pdf', ...car('car-roas', 5)],
    caption: `« Quel est un bon ROAS ? » est la mauvaise question.

La bonne : quel est MON ROAS minimum ?

Il dépend de la marge brute, des frais, de la livraison et du taux de retour. Pour un produit à 25 € avec 20 % de colis refusés, il est de 2,93. Une campagne à ROAS 3 rapporte 0,23 € par commande. Une campagne à 2,5 en perd 1,85.

Si vous gérez des budgets pub pour des e-commerçants, ce seuil devrait être la première ligne de chaque rapport.`,
    firstComment: `Calculer un ROAS minimum : ${UTM('linkedin', 'roas')}` },

  { date: '2026-12-08', time: '08:30', format: 'Document PDF (carrousel)', week: 4, title: 'Facture électronique : où en sont les indépendants ?', visuals: ['pdf:car-pro.pdf', ...car('car-pro', 5)],
    caption: `Depuis le 1er septembre 2026, toutes les entreprises en France doivent pouvoir recevoir des factures électroniques. Au 1er septembre 2027, les PME, TPE et micro-entrepreneurs devront aussi les émettre.

Beaucoup d’indépendants font encore leurs factures sur Word.

Avec Margokit Pro, j’ai voulu un outil simple :
• devis → facture → avoir, numérotation sans trou
• PDF en français ou en anglais, mentions légales par pays
• envoi par lien, e-mail ou WhatsApp, suivi des retards
• exports Factur-X et UBL (norme EN 16931), données hébergées en Europe

La transmission via une plateforme agréée arrive ensuite. Gratuit jusqu’à 3 documents par mois.

Experts-comptables et accompagnateurs d’indépendants : qu’est-ce qui bloque le plus vos clients dans cette transition ?`,
    firstComment: `Essayer Margokit Pro gratuitement : ${UTM('linkedin', 'pro', 'fr/signup')}` },
  { date: '2026-12-10', time: '08:30', format: 'Document PDF (présentation)', week: 4, title: 'Margokit en 10 slides', visuals: ['pdf:presentation-margokit.pdf', 'deck-01.png', 'deck-03.png', 'deck-09.png'],
    caption: `Un mois après le début de la campagne, voici Margokit en 10 slides : le problème, les 4 outils, pour qui, les prix.

Ce que j’en retiens : [à compléter avec ton bilan réel, visites, inscriptions, premières ventes].

Si vous connaissez un vendeur en ligne ou un freelance qui ne sait pas exactement ce qu’il gagne, partagez-lui ce document. Merci 🙏`,
    firstComment: `margokit.com : ${UTM('linkedin', 'deck', 'fr')}` },
];

export const POSTS = { instagram, facebook, tiktok, linkedin };

// ---------------------------------------------------------------------------
// Publicité (petit test, semaine 3)
// ---------------------------------------------------------------------------
export const ADS = {
  budget: '35 € au total (5 €/jour pendant 7 jours), du 30 novembre au 6 décembre.',
  rules: [
    'On ne booste que le post organique qui a le mieux marché en semaines 1–2 (le plus d’enregistrements et de partages, pas de « j’aime »).',
    'Objectif : Trafic vers le calculateur (lien avec utm_source=meta-ads). Pas de vente directe : l’audience est froide.',
    'Audience 1 : Maroc + Côte d’Ivoire + Sénégal, 20–45 ans, centres d’intérêt e-commerce, Shopify, dropshipping, YouCan, Facebook Ads.',
    'Audience 2 (si budget) : France + Belgique, mêmes intérêts. Comparer le coût par clic.',
    'On arrête si le coût par clic dépasse 0,30 € après 2 jours, ou si le taux de clic est inférieur à 1 %.',
    'TikTok : pas de pub payante pendant ce mois. Si une vidéo dépasse 5 000 vues naturellement, on la booste en Spark Ads (10 €).',
  ],
};
