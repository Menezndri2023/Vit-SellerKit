/**
 * Vidéos de la campagne « Vends. Calcule. Garde. » (kits Margokit). Même format que campagne-pro/videos.mjs.
 * Rendu : CAMPAIGN=kits node marketing/visuals/videos-pro.mjs [id…]
 * Captures : campagne-kits/captures (calculateur réel, exemple marocain) + campagne-pro/captures (Margokit Pro).
 * Scènes « sheet » : reproductions fidèles des Google Sheets (templates.mjs, données d'exemple des fichiers livrés).
 * Chiffres du calculateur : 249 MAD, coût 90, emballage 5, livraison 35, retour 25, pub 40, refus 25 % → 44,00 MAD ;
 * refus 35 % → 22,46 MAD ; prix 279 MAD → 74,00 MAD.
 */

const END = (cta, url = 'margokit.com') => ({ k: 'end', cta, url, slogan: 'Vends. Calcule. <em>Garde.</em>' });

export const VIDEOS = [
  {
    id: 'K01-les-4-outils',
    title: 'Les 4 outils Margokit',
    formats: ['9x16', '16x9', '1x1'],
    segments: [
      { head: 'Tu connais ton chiffre d’affaires…', vo: 'Tu connais ton chiffre d’affaires. Mais combien tu gardes vraiment, après la livraison, la pub et les colis refusés ?', scene: { k: 'big', text: 'CA ≠ bénéfice', sub: 'Ce qui compte, c’est ce que tu gardes' } },
      { head: '1 · Le calculateur — gratuit', vo: 'Un : le calculateur gratuit. Tu entres ton prix et tes coûts, il te dit ce que tu gardes sur chaque commande livrée.', scene: { k: 'phone', img: 'calc-resultats' } },
      { head: '2 · Le Tracker — 12 $', vo: 'Deux : le Tracker. Un Google Sheet où chaque commande calcule ton vrai bénéfice, met à jour ton stock et repère les clients qui refusent les colis.', scene: { k: 'sheet', view: 'trackerDashboard' } },
      { head: '3 · Le Seller Pack — 34 $', vo: 'Trois : le Seller Pack. Tout le Tracker, plus tes pubs, ton contenu, ta trésorerie et ton budget. Il te dit quelle pub gagne de l’argent.', scene: { k: 'sheet', view: 'ads' } },
      { head: '4 · Margokit Pro', vo: 'Quatre : Margokit Pro, pour tes devis et factures quand des professionnels t’achètent.', scene: { k: 'phone', img: 'pro:dashboard' } },
      { head: '', vo: 'Commence par le calculateur. Il est gratuit. Lien en bio.', scene: END('Calculateur gratuit · sans compte', 'margokit.com/fr/calculator') },
    ],
  },
  {
    id: 'K02-calculateur-249-mad',
    title: '249 MAD vendus, combien tu gardes ?',
    formats: ['9x16', '1x1'],
    segments: [
      { head: 'Vendu 249 MAD. Tu gardes combien ?', vo: 'Tu vends un produit deux cent quarante-neuf dirhams, en paiement à la livraison. Tu gardes combien ?', scene: { k: 'big', text: '249 MAD', sub: 'Tu gardes combien ?' } },
      { head: 'Tes vrais coûts', vo: 'Le produit te coûte quatre-vingt-dix. L’emballage cinq, la livraison trente-cinq, la pub quarante par commande. Et un colis sur quatre est refusé.', scene: { k: 'phone', img: 'calc' } },
      { head: '44 MAD par commande livrée', vo: 'Résultat : tu gardes quarante-quatre dirhams par commande livrée. Dix-sept pour cent de marge.', scene: { k: 'phone', img: 'calc-resultats' } },
      { head: 'Prix minimum · ROAS minimum', vo: 'Le calculateur te donne aussi ton prix minimum, ta pub maximum par commande, et le ROAS en dessous duquel tu perds de l’argent.', scene: { k: 'card', img: 'calc-resultats-mobile', y: 1300, h: 1100 } },
      { head: '+30 MAD sur le prix = 74 MAD', vo: 'Et si tu vends à deux cent soixante-dix-neuf ? Tu gardes soixante-quatorze dirhams. Trente dirhams de plus sur le prix, soixante-huit pour cent de bénéfice en plus.', scene: { k: 'phone', img: 'calc-prix-279-resultats' } },
      { head: '', vo: 'Fais le calcul avec tes chiffres. C’est gratuit, sans compte. Lien en bio.', scene: END('Calculateur gratuit · sans compte', 'margokit.com/fr/calculator') },
    ],
  },
  {
    id: 'K03-tracker-parcours',
    title: 'Le Tracker : de la copie à ta première commande',
    formats: ['9x16', '16x9'],
    segments: [
      { head: 'Tracker Commandes & Stock', vo: 'Le Tracker Margokit, c’est un Google Sheet. Après l’achat, tu cliques sur « Créer une copie » : le fichier est dans ton Drive, il est à toi.', scene: { k: 'sheet', view: 'trackerTabs' } },
      { head: '10 minutes de réglages', vo: 'Une seule fois, tu règles ta devise, tes canaux de vente, tes frais et tes transporteurs, avec le coût d’une livraison et d’un retour.', scene: { k: 'list', active: 1, items: ['Créer une copie', 'Paramètres : devise, canaux, transporteurs', 'Une ligne par commande', 'Le bénéfice se calcule seul'] } },
      { head: '10 secondes par commande', vo: 'Ensuite, une ligne par commande. Tu choisis le produit, le canal, le transporteur. La ligne change de couleur avec le statut : confirmée, expédiée, livrée ou retournée.', scene: { k: 'sheet', view: 'trackerOrders' } },
      { head: 'Bénéfice réel + stock automatique', vo: 'Le bénéfice réel se calcule tout seul, et le stock se met à jour. Tu es prévenu avant la rupture.', scene: { k: 'sheet', view: 'trackerProducts' } },
      { head: '⚠️ Les clients qui refusent', vo: 'L’onglet Clients se remplit tout seul. Un client a refusé deux colis ? Il est signalé. Demande-lui un acompte la prochaine fois.', scene: { k: 'sheet', view: 'trackerCustomers' } },
      { head: 'Ton tableau de bord', vo: 'Et ton tableau de bord te montre ton bénéfice net, ton taux de retour et ton meilleur produit.', scene: { k: 'sheet', view: 'trackerDashboardTall' } },
      { head: '', vo: 'Douze dollars, une fois. Versions en dirhams, euros et dollars. Lien en bio.', scene: END('Tracker · 12 $ · une fois', 'margokit.gumroad.com/l/tracker') },
    ],
  },
  {
    id: 'K04-seller-pack-parcours',
    title: 'Le Seller Pack, onglet par onglet',
    formats: ['9x16', '16x9'],
    segments: [
      { head: 'ROAS 3 ≠ bénéfice', vo: 'Ton gestionnaire de pubs affiche un ROAS de trois. Ton compte en banque n’est pas d’accord.', scene: { k: 'big', text: 'ROAS 3 ≠ bénéfice' } },
      { head: '11 onglets reliés', vo: 'Le Seller Pack, c’est tout le Tracker, plus cinq onglets : pubs, contenu, trésorerie, budget et calculateur de prix.', scene: { k: 'sheet', view: 'dashboard' } },
      { head: 'Avant de lancer : ton prix', vo: 'Avant de lancer un produit, le calculateur de prix te donne ton prix minimum et le ROAS en dessous duquel tu perds de l’argent.', scene: { k: 'sheet', view: 'pricing' } },
      { head: '1 minute par semaine', vo: 'Chaque semaine, tu recopies deux chiffres par campagne : la dépense et les commandes. Le Pack calcule le bénéfice réel, colis refusés compris.', scene: { k: 'sheet', view: 'ads' } },
      { head: '✅ garde · ❌ coupe', vo: 'Verdict : rentable ou perd de l’argent. Tu coupes les campagnes rouges, tu augmentes les vertes.', scene: { k: 'sheet', view: 'adsVerdict' } },
      { head: 'Ton contenu qui vend', vo: 'Le planning de contenu suit tes TikTok et tes Reels, avec les vues et les messages reçus. Tes meilleures accroches ressortent.', scene: { k: 'sheet', view: 'content' } },
      { head: 'Budget et trésorerie', vo: 'Et ton budget te prévient à quatre-vingts et à cent pour cent.', scene: { k: 'sheet', view: 'budget' } },
      { head: '', vo: 'Trente-quatre dollars, une fois. Tu as déjà le Tracker ? Le code UPGRADE le déduit. Lien en bio.', scene: END('Seller Pack · 34 $ · code UPGRADE', 'margokit.gumroad.com/l/seller-pack') },
    ],
  },
  {
    id: 'K05-colis-refuses',
    title: 'Les colis refusés divisent ton bénéfice',
    formats: ['9x16', '1x1'],
    segments: [
      { head: '25 % de refus → 44 MAD', vo: 'Avec un colis sur quatre refusé, tu gardes quarante-quatre dirhams par commande livrée.', scene: { k: 'phone', img: 'calc-resultats' } },
      { head: '35 % de refus → 22 MAD', vo: 'Monte à trente-cinq pour cent de refus : tu ne gardes plus que vingt-deux dirhams. Ton bénéfice est divisé par deux.', scene: { k: 'phone', img: 'calc-refus-35-resultats' } },
      { head: 'Repère les clients à risque', vo: 'Le Tracker signale les clients qui ont déjà refusé deux colis. Avant d’expédier, demande un acompte ou confirme par téléphone.', scene: { k: 'sheet', view: 'trackerCustomers' } },
      { head: '', vo: 'Calcule ton taux de refus maximum, gratuitement. Commente COLIS.', scene: END('Commente « COLIS »', 'margokit.com/fr/calculator') },
    ],
  },
  {
    id: 'K06-quel-kit-pour-toi',
    title: 'Quel kit Margokit pour toi ?',
    formats: ['9x16'],
    segments: [
      { head: 'Quel kit pour toi ?', vo: 'Quel outil Margokit pour toi ? Réponds en dix secondes.', scene: { k: 'big', text: 'Quel kit ?', sub: 'Réponse en 10 secondes' } },
      { head: 'Tu lances un produit ?', vo: 'Tu lances un produit ou une promo ? Le calculateur, gratuit.', scene: { k: 'list', active: 0, items: KITS() } },
      { head: 'Tu as des commandes ?', vo: 'Tu as des commandes et trop de retours ? Le Tracker, douze dollars.', scene: { k: 'list', active: 1, items: KITS() } },
      { head: 'Tu fais de la pub ?', vo: 'Tu fais de la pub Facebook ou TikTok ? Le Seller Pack, trente-quatre dollars.', scene: { k: 'list', active: 2, items: KITS() } },
      { head: 'Tu factures des pros ?', vo: 'Tu factures des professionnels ? Margokit Pro, gratuit pour commencer.', scene: { k: 'list', active: 3, items: KITS() } },
      { head: '', vo: 'Dis-moi en commentaire où tu en es, je te dis par quoi commencer.', scene: END('Dis-nous en commentaire 👇') },
    ],
  },
  {
    id: 'K07-ta-semaine-de-vendeur',
    title: 'Ta semaine de vendeur avec Margokit',
    formats: ['9x16'],
    segments: [
      { head: 'Ta routine : 15 minutes par semaine', vo: 'Ta semaine de vendeur avec Margokit : quinze minutes, pas plus.', scene: { k: 'big', text: '15 min / semaine' } },
      { head: 'Chaque commande : 10 secondes', vo: 'Chaque commande : une ligne, dix secondes. Tu changes le statut quand le colis part et quand il est livré.', scene: { k: 'list', active: 0, items: ROUTINE() } },
      { head: 'Lundi : tes pubs', vo: 'Le lundi : deux chiffres par campagne. Tu coupes ce qui perd de l’argent.', scene: { k: 'list', active: 1, items: ROUTINE() } },
      { head: 'Avant d’expédier : les clients ⚠️', vo: 'Avant d’expédier : un coup d’œil aux clients signalés.', scene: { k: 'list', active: 2, items: ROUTINE() } },
      { head: 'Dimanche : ton bénéfice', vo: 'Le dimanche : ton tableau de bord. Bénéfice net, taux de retour, meilleur produit.', scene: { k: 'list', active: 3, items: ROUTINE() } },
      { head: '', vo: 'Commence par le Tracker, ou par le calculateur gratuit. Lien en bio.', scene: END('Tracker 12 $ · Calculateur gratuit') },
    ],
  },
  {
    id: 'K08-upgrade-tracker-pack',
    title: 'Tu as le Tracker ? Passe au Pack pour 22 $',
    formats: ['9x16'],
    segments: [
      { head: 'Tu as déjà le Tracker ?', vo: 'Tu as déjà le Tracker et tu lances de la pub ?', scene: { k: 'sheet', view: 'trackerDashboard' } },
      { head: '+ 5 onglets', vo: 'Le Seller Pack ajoute la pub, le contenu, la trésorerie, le budget et le calculateur de prix.', scene: { k: 'sheet', view: 'ads' } },
      { head: 'Code UPGRADE : 22 $', vo: 'Avec le code UPGRADE, le prix du Tracker est déduit : vingt-deux dollars au lieu de trente-quatre.', scene: { k: 'big', text: '34 $ → 22 $', sub: 'code UPGRADE' } },
      { head: '', vo: 'Lien en bio.', scene: END('Code UPGRADE', 'margokit.gumroad.com/l/seller-pack') },
    ],
  },
  ...[
    ['KH1-ca-te-ment', 'Ton chiffre d’affaires te ment.', 'Ce qui compte, c’est ce que tu gardes. Le calculateur Margokit te le dit en trente secondes.', 'calc-resultats', 'Ton CA te ment.'],
    ['KH2-44-mad', 'Deux cent quarante-neuf dirhams vendus. Quarante-quatre gardés.', 'Livraison, pub, colis refusés : fais le calcul avec tes chiffres.', 'calc-resultats', '249 MAD → 44 MAD'],
    ['KH3-cahier', 'Tes commandes sont encore sur un cahier ?', 'Le Tracker calcule ton bénéfice et ton stock à chaque commande.', 'sheet:trackerOrders', 'Encore sur un cahier ?'],
    ['KH4-client-refuse', 'Ce client a déjà refusé deux colis.', 'Le Tracker te prévient avant que tu expédies le troisième.', 'sheet:trackerCustomers', '2 colis refusés… et un 3e ?'],
    ['KH5-pub-rouge', 'Cette pub te fait perdre de l’argent. Tu ne le sais pas encore.', 'Le Seller Pack te donne un verdict pour chaque campagne.', 'sheet:adsVerdict', 'Cette pub perd de l’argent'],
  ].map(([id, hook, follow, img, head]) => ({
    id,
    title: head,
    formats: ['9x16'],
    segments: [
      { head, vo: hook, scene: { k: 'big', text: head } },
      { head: 'Margokit', vo: follow, scene: img.startsWith('sheet:') ? { k: 'sheet', view: img.slice(6) } : { k: 'phone', img } },
      { head: '', vo: 'Lien en bio.', scene: END(img.startsWith('sheet:ads') ? 'Seller Pack · 34 $' : img.startsWith('sheet:') ? 'Tracker · 12 $' : 'Calculateur gratuit', img.startsWith('sheet:ads') ? 'margokit.gumroad.com/l/seller-pack' : img.startsWith('sheet:') ? 'margokit.gumroad.com/l/tracker' : 'margokit.com/fr/calculator') },
    ],
  })),
];

function KITS() {
  return ['Calculateur — gratuit', 'Tracker — 12 $', 'Seller Pack — 34 $', 'Margokit Pro — gratuit pour commencer'];
}
function ROUTINE() {
  return ['Chaque commande : 1 ligne, 10 s', 'Lundi : tes pubs, 1 min / campagne', 'Avant d’expédier : les clients ⚠️', 'Dimanche : ton tableau de bord'];
}

export const SAY = [
  [/\bROAS\b/g, 'ro-as'],
  [/Seller Pack/g, 'sélère pack'],
];
export const SUB = [];
