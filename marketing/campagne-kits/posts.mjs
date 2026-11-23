/**
 * Calendrier — campagne « Vends. Calcule. Garde. » (kits Margokit), 4 → 31 janvier 2027. NON PUBLIÉE.
 * Heures du Maroc (GMT+1). Généré par : node marketing/campagne-kits/build.mjs
 */
export const CAMPAIGN = 'vends-calcule-garde';
const SITE = 'https://margokit.com/fr';
export const link = (net, content, path = '') => `${SITE}${path}?utm_source=${net}&utm_medium=social&utm_campaign=${CAMPAIGN}&utm_content=${content}`;

export const TAGS = {
  ig: '#ecommercemaroc #vendreenligne #dropshipping #codmaroc #youcan #entrepreneurmaroc #boutiqueenligne #margokit',
  tiktok: '#ecommerce #maroc #dropshipping #vendreenligne #cod #astuce #margokit',
  fb: '#ecommerce #Maroc #vendreenligne #COD',
  li: '#ecommerce #Maroc #gestion #entrepreneuriat',
};

export const CAPTIONS = {
  'KP1-lancement': { ig: `Vends. Calcule. Garde. 💸\n\nPendant 4 semaines, on parle de ce que tu gardes VRAIMENT sur chaque vente : livraison, pub, colis refusés.\n\nCommence par le calculateur gratuit (sans compte) : lien en bio.\n\nDarija : Bghiti t3ref ch7al katrbe7 b sa7 f kol commande ? Jarreb le calculateur fabor.` },
  'KC1-les-4-outils': { ig: `Les 4 outils Margokit, du calcul de ton prix à ta facture 🧰\n\n1. Calculateur — gratuit\n2. Tracker — 12 $\n3. Seller Pack — 34 $\n4. Margokit Pro — gratuit pour commencer\n\nLequel il te faut ? Dis-nous où tu en es 👇`, li: `Quatre outils pour piloter une boutique en ligne : calculateur de bénéfice (gratuit), Tracker de commandes et de stock, Seller Pack (publicité, budget, trésorerie) et Margokit Pro pour la facturation. Le parcours commence par le calcul de ce que l'on garde réellement sur chaque vente.` },
  'K01-les-4-outils': { ig: `Les 4 outils Margokit en 1 minute ⏱️\n\nCommence par le gratuit : le calculateur. Lien en bio.\n\nCommente CALCUL et on t'envoie le lien 📩` },
  'K02-calculateur-249-mad': { ig: `Vendu 249 MAD. Tu gardes… 44 MAD. 😬\n\nLivraison, pub, 1 colis sur 4 refusé. Et à 279 MAD ? 74 MAD.\n\nFais le calcul avec TES chiffres : gratuit, sans compte, lien en bio.\n\nDarija : Bi3ti b 249 dh ? Katbqa lik 44 dh f l'commande. 7seb dyalk fabor.` },
  'KC2-249-mad-44-mad': { ig: `249 MAD vendus. 44 MAD gardés. 📉 Glisse pour voir où part le reste, et comment +30 MAD sur le prix font +68 % de bénéfice.\n\nCalcul fait avec le calculateur Margokit (gratuit) : lien en bio.`, li: `Exemple réel calculé : un produit vendu 249 MAD en paiement à la livraison (coût 90, livraison 35, retour 25, publicité 40 par commande, 25 % de refus) laisse 44 MAD par commande livrée. À 35 % de refus : 22 MAD. Vendu 279 MAD : 74 MAD. Le calculateur Margokit est gratuit.` },
  'KP4-question-refus': { ig: `Question du jour 👇 Ton taux de colis refusés ?\nA · moins de 15 %\nB · 15 à 25 %\nC · 25 à 35 %\nD · je ne sais pas 😬\n\nRéponds en commentaire, on te dit quoi faire.` },
  'K05-colis-refuses': { ig: `25 % de refus → 44 MAD gardés. 35 % → 22 MAD. 📦❌\n\nLes colis refusés divisent ton bénéfice. Le Tracker repère les clients qui refusent avant que tu expédies.\n\nCommente COLIS 📩\n\nDarija : Les colis li katraj3 kayakloulek rbe7 dyalek.` },
  'KP5-colis-refuses': { ig: `Les colis refusés DIVISENT ton bénéfice. Les chiffres 👆\n\nCalcule ton taux de refus maximum, gratuitement : lien en bio.` },
  'K03-tracker-parcours': { ig: `Le Tracker Margokit, de la copie à ta première commande 🧾\n\n10 min de réglages, 10 s par commande. Bénéfice réel, stock et clients ⚠️ automatiques.\n\n12 $ une fois · MAD / € / $. Lien en bio.`, li: `Démonstration du Tracker Margokit : un Google Sheet qui calcule le bénéfice réel de chaque commande (retours compris), met à jour le stock et signale les clients aux refus répétés.` },
  'KC3-tracker-6-onglets': { ig: `Le Tracker en 6 onglets 👉 glisse.\n\nCommandes, stock, clients ⚠️, tableau de bord, paramètres, mode d'emploi. Google Sheets, sur ordi et téléphone.\n\n12 $ une fois. Lien en bio.` },
  'K04-seller-pack-parcours': { ig: `Le Seller Pack onglet par onglet 📣\n\nVerdict par campagne, prix minimum, contenu, budget. Tu sais enfin quelle pub te fait gagner de l'argent.\n\n34 $ une fois (22 $ avec UPGRADE si tu as le Tracker). Commente PACK 📩`, li: `Le Seller Pack Margokit relie publicités, commandes, contenu et trésorerie dans un Google Sheet : bénéfice réel et verdict par campagne publicitaire, calculateur de prix, budget avec alertes.` },
  'KC4-seller-pack-11-onglets': { ig: `Le Seller Pack : 11 onglets reliés 👉 glisse.\n\nTout le Tracker + pub & ROAS, contenu, trésorerie, budget, calculateur de prix.\n\n34 $ une fois. Lien en bio.` },
  'KP3-upgrade': { ig: `Tu as déjà le Tracker ? Le Seller Pack te coûte 22 $ au lieu de 34 $ avec le code UPGRADE 🔓\n\nLien en bio.` },
  'KC5-parcours-du-vendeur': { ig: `Le parcours d'un vendeur qui garde son argent 🛣️\n\n1. Calculer · 2. Noter · 3. Juger sa pub · 4. Facturer les pros\n\nTu en es à quelle étape ? 👇`, li: `Quatre étapes pour une boutique en ligne rentable : calculer avant de lancer, noter chaque commande, juger chaque campagne publicitaire sur son bénéfice réel, facturer proprement les clients professionnels.` },
  'K06-quel-kit-pour-toi': { ig: `Quel kit Margokit pour toi ? Réponse en 10 secondes ⏱️\n\nDis-nous en commentaire où tu en es 👇` },
  'KP2-quel-kit': { ig: `Quel kit pour toi ? 🤔\n\nTu lances → Calculateur (gratuit)\nTu as des commandes → Tracker (12 $)\nTu fais de la pub → Seller Pack (34 $)\nTu factures des pros → Margokit Pro\n\nLien en bio.` },
  'K07-ta-semaine-de-vendeur': { ig: `Ta routine de vendeur : 15 minutes par semaine ⏳\n\nChaque commande : 10 s · Lundi : tes pubs · Avant d'expédier : clients ⚠️ · Dimanche : ton bénéfice.\n\nLien en bio.` },
  'KC6-routine-15-minutes': { ig: `Ta routine de vendeur en 15 min/semaine 👉 glisse et enregistre 📌` },
  'K08-upgrade-tracker-pack': { ig: `Tracker → Seller Pack pour 22 $ avec le code UPGRADE 🔓 Lien en bio.` },
  'KH1-ca-te-ment': { ig: `Ton chiffre d'affaires te ment. Calcule ce que tu gardes : lien en bio.` },
  'KH2-44-mad': { ig: `249 MAD vendus, 44 MAD gardés. Et toi ? Lien en bio.` },
  'KH3-cahier': { ig: `Tes commandes sont encore sur un cahier ? 📒 Le Tracker : 12 $, lien en bio.` },
  'KH4-client-refuse': { ig: `2 colis refusés… tu expédies le 3e ? 📦 Le Tracker te prévient. Lien en bio.` },
  'KH5-pub-rouge': { ig: `Cette pub perd de l'argent et tu ne le sais pas encore 📉 Seller Pack : lien en bio.` },
  'KS1-calculateur': { ig: 'Story : sticker lien → margokit.com/fr/calculator' },
  'KS2-sondage-refus': { ig: 'Story : sticker sondage « < 20 % / > 20 % / je ne sais pas »' },
  'KS3-pack': { ig: 'Story : sticker lien → margokit.gumroad.com/l/seller-pack' },
  'PRES-kits': { li: `Présentation des kits Margokit (10 pages) : calculateur, Tracker, Seller Pack, Margokit Pro, parcours d'utilisation et prix. À partager avec un vendeur en ligne qui pilote encore sa boutique au cahier.` },
};

/** [date, heure, réseau, contenu, format] */
export const SCHEDULE = [
  // S1 — Ton chiffre d'affaires te ment (calculateur)
  ['2027-01-04', '19:00', 'ig', 'KP1-lancement', 'image'],
  ['2027-01-04', '20:00', 'fb', 'KP1-lancement', 'image'],
  ['2027-01-04', '20:30', 'tiktok', 'KH1-ca-te-ment', '9x16'],
  ['2027-01-05', '19:00', 'ig', 'K02-calculateur-249-mad', '9x16'],
  ['2027-01-05', '20:30', 'tiktok', 'K02-calculateur-249-mad', '9x16'],
  ['2027-01-05', '12:00', 'story', 'KS1-calculateur', 'story'],
  ['2027-01-06', '20:00', 'fb', 'K02-calculateur-249-mad', '1x1'],
  ['2027-01-06', '09:00', 'li', 'KC2-249-mad-44-mad', 'document'],
  ['2027-01-07', '19:00', 'ig', 'KC1-les-4-outils', 'carrousel'],
  ['2027-01-07', '20:30', 'tiktok', 'K01-les-4-outils', '9x16'],
  ['2027-01-08', '20:00', 'fb', 'KC1-les-4-outils', 'carrousel'],
  ['2027-01-08', '20:30', 'tiktok', 'KH2-44-mad', '9x16'],
  ['2027-01-09', '19:00', 'ig', 'KC2-249-mad-44-mad', 'carrousel'],
  ['2027-01-10', '20:30', 'tiktok', 'K06-quel-kit-pour-toi', '9x16'],
  // S2 — Les colis refusés (Tracker)
  ['2027-01-11', '19:00', 'ig', 'KP4-question-refus', 'image'],
  ['2027-01-11', '20:00', 'fb', 'KP4-question-refus', 'image'],
  ['2027-01-11', '20:30', 'tiktok', 'K05-colis-refuses', '9x16'],
  ['2027-01-12', '19:00', 'ig', 'K05-colis-refuses', '9x16'],
  ['2027-01-12', '12:00', 'story', 'KS2-sondage-refus', 'story'],
  ['2027-01-13', '20:30', 'tiktok', 'K03-tracker-parcours', '9x16'],
  ['2027-01-13', '09:00', 'li', 'K03-tracker-parcours', '16x9'],
  ['2027-01-13', '20:00', 'fb', 'K03-tracker-parcours', '16x9'],
  ['2027-01-14', '19:00', 'ig', 'KC3-tracker-6-onglets', 'carrousel'],
  ['2027-01-14', '20:30', 'tiktok', 'KH3-cahier', '9x16'],
  ['2027-01-15', '19:00', 'ig', 'K03-tracker-parcours', '9x16'],
  ['2027-01-15', '20:00', 'fb', 'KP5-colis-refuses', 'image'],
  ['2027-01-16', '20:30', 'tiktok', 'KH4-client-refuse', '9x16'],
  ['2027-01-17', '19:00', 'ig', 'KP5-colis-refuses', 'image'],
  // S3 — La pub qui ment (Seller Pack)
  ['2027-01-18', '20:30', 'tiktok', 'KH5-pub-rouge', '9x16'],
  ['2027-01-18', '19:00', 'ig', 'K04-seller-pack-parcours', '9x16'],
  ['2027-01-18', '12:00', 'story', 'KS3-pack', 'story'],
  ['2027-01-19', '20:30', 'tiktok', 'K04-seller-pack-parcours', '9x16'],
  ['2027-01-19', '20:00', 'fb', 'K04-seller-pack-parcours', '16x9'],
  ['2027-01-20', '19:00', 'ig', 'KC4-seller-pack-11-onglets', 'carrousel'],
  ['2027-01-20', '09:00', 'li', 'K04-seller-pack-parcours', '16x9'],
  ['2027-01-21', '20:30', 'tiktok', 'K08-upgrade-tracker-pack', '9x16'],
  ['2027-01-21', '20:00', 'fb', 'KC4-seller-pack-11-onglets', 'carrousel'],
  ['2027-01-22', '19:00', 'ig', 'KP3-upgrade', 'image'],
  ['2027-01-23', '20:30', 'tiktok', 'K02-calculateur-249-mad', '9x16'],
  ['2027-01-24', '20:00', 'fb', 'KP3-upgrade', 'image'],
  // S4 — Ta routine (les 3 + Pro)
  ['2027-01-25', '19:00', 'ig', 'KC5-parcours-du-vendeur', 'carrousel'],
  ['2027-01-25', '20:30', 'tiktok', 'K07-ta-semaine-de-vendeur', '9x16'],
  ['2027-01-25', '20:00', 'fb', 'KC5-parcours-du-vendeur', 'carrousel'],
  ['2027-01-26', '19:00', 'ig', 'K07-ta-semaine-de-vendeur', '9x16'],
  ['2027-01-26', '12:00', 'story', 'KS1-calculateur', 'story'],
  ['2027-01-27', '09:00', 'li', 'PRES-kits', 'document'],
  ['2027-01-27', '20:30', 'tiktok', 'K06-quel-kit-pour-toi', '9x16'],
  ['2027-01-28', '19:00', 'ig', 'KP2-quel-kit', 'image'],
  ['2027-01-28', '20:00', 'fb', 'K01-les-4-outils', '16x9'],
  ['2027-01-29', '19:00', 'ig', 'KC6-routine-15-minutes', 'carrousel'],
  ['2027-01-29', '20:30', 'tiktok', 'K03-tracker-parcours', '9x16'],
  ['2027-01-30', '20:00', 'fb', 'KP2-quel-kit', 'image'],
  ['2027-01-31', '20:30', 'tiktok', 'K01-les-4-outils', '9x16'],
  ['2027-01-31', '19:00', 'ig', 'K01-les-4-outils', '1x1'],
];
