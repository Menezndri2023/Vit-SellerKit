/**
 * Margokit — générateur Google Sheets (Order & Inventory Tracker + Seller Pack)
 *
 * Utilisation :
 *   1. https://script.google.com → Nouveau projet → coller ce fichier à la place de Code.gs
 *   2. Choisir une fonction → Exécuter :
 *        buildTrackerEN / buildTrackerFR / buildTrackerMA  (ou buildAll pour les 3)
 *        buildSellerPackEN / buildSellerPackFR / buildSellerPackMA  (ou buildAllPacks pour les 3)
 *   3. Autoriser l'accès → l'URL du fichier créé s'affiche dans le journal d'exécution
 *
 * Le fichier généré ne contient AUCUN script : il fonctionne uniquement avec des formules
 * (pas d'écran d'autorisation effrayant pour l'acheteur).
 */

const WITH_SAMPLE_DATA = true;

function buildTrackerEN() { buildTracker_('en'); }
function buildTrackerFR() { buildTracker_('fr'); }
function buildTrackerMA() { buildTracker_('ma'); }
function buildAll() { ['en', 'fr', 'ma'].forEach(k => buildTracker_(k)); }

function buildSellerPackEN() { buildTracker_('en', true); }
function buildSellerPackFR() { buildTracker_('fr', true); }
function buildSellerPackMA() { buildTracker_('ma', true); }
function buildAllPacks() { ['en', 'fr', 'ma'].forEach(k => buildTracker_(k, true)); }

// ---------------------------------------------------------------------------
// Marque
// ---------------------------------------------------------------------------

const C = {
  primary: '#A3E635', primarySoft: '#F7FEE7', primaryInk: '#4D7C0F', ink: '#0F172A', muted: '#475569',
  border: '#E2E8F0', bg: '#F8FAFC', profit: '#16A34A', loss: '#DC2626', warn: '#D97706',
};
const FONT = 'Inter';
const MONEY = '#,##0.00';
const PCT = '0.0%';

// ---------------------------------------------------------------------------
// Variantes (langue + devise + transporteurs)
// ---------------------------------------------------------------------------

const VARIANTS = {
  en: {
    lang: 'en', locale: 'en_US', currency: '$', money: 1, suffix: '',
    carriers: [['USPS', 6, 6], ['UPS', 9, 9], ['DHL Express', 18, 18], ['Local courier', 5, 3], ['Other', 0, 0]],
  },
  fr: {
    lang: 'fr', locale: 'fr_FR', currency: '€', money: 1, suffix: '',
    carriers: [['Colissimo', 6, 6], ['Mondial Relay', 4, 4], ['Chronopost', 12, 12], ['Livreur local', 5, 3], ['Autre', 0, 0]],
  },
  ma: {
    lang: 'fr', locale: 'fr_FR', currency: 'MAD', money: 10, suffix: ' (Maroc)',
    carriers: [['Amana', 35, 20], ['Cathedis', 35, 15], ['Ozon Express', 30, 15], ['Livreur local', 25, 10], ['Autre', 0, 0]],
    customers: [
      ['Salma Bennani', '0612345678', 'Casablanca', 'Maroc'],
      ['Youssef Alaoui', '0661234567', 'Rabat', 'Maroc'],
      ['Imane Tazi', '0698765432', 'Marrakech', 'Maroc'],
      ['Omar Chraibi', '0655443322', 'Tanger', 'Maroc'],
      ['Nadia Berrada', '0677889900', 'Fès', 'Maroc'],
    ],
  },
};

// ---------------------------------------------------------------------------
// Textes
// ---------------------------------------------------------------------------

const I18N = {
  en: {
    file: 'Margokit — Order & Inventory Tracker',
    dateFormat: 'mm/dd/yyyy',
    sheets: { dashboard: 'Dashboard', orders: 'Orders', products: 'Products', customers: 'Customers', settings: 'Settings', guide: 'How to use' },
    orders: ['Date', 'Order #', 'Customer', 'Phone', 'City', 'Country', 'Product', 'Qty', 'Unit price', 'Shipping charged',
      'Channel', 'Payment', 'Status', 'Carrier', 'Tracking #', 'Shipping cost (you pay)', 'Notes'],
    ordersCalc: ['Total', 'Profit', 'Margin', 'Month', 'Customer key'],
    notes: {
      shippingCost: 'Leave empty to use the carrier default cost from Settings.',
      auto: 'Automatic column — do not type here.',
      status: 'Update the status as the parcel moves. Profit is counted when Delivered (or lost when Returned).',
      product: 'Pick a product from the Products tab.',
      restock: 'Total units received after the initial stock. E.g. 20 → 50 after receiving 30 more.',
    },
    products: ['SKU', 'Product', 'Category', 'Unit cost', 'Packaging / unit', 'Sale price', 'Initial stock', 'Restocked (+)', 'Low-stock alert at'],
    productsCalc: ['Sold', 'In stock', 'Stock status', 'Stock value', 'Revenue', 'Profit'],
    stock: { ok: 'OK', low: 'Low', out: 'Out of stock' },
    customers: ['Phone / ID', 'Name', 'City', 'Country', 'Orders', 'Delivered', 'Returned', 'Delivery rate', 'Total spent', 'Profit', 'Last order', 'Tag'],
    tags: { risky: '⚠️ Risky', loyal: '⭐ Loyal' },
    statusMeaning: ['New order', 'Confirmed by customer', 'Shipped (left your stock)', 'Delivered (profit counted)', 'Returned / refused (loss counted)', 'Cancelled (ignored)'],
    statuses: ['New', 'Confirmed', 'Shipped', 'Delivered', 'Returned', 'Cancelled'],
    settings: {
      title: '⚙️ Settings', currency: 'Currency', business: 'Shop name', businessDefault: 'My shop', lowDefault: 'Default low-stock alert',
      statusHeader: ['Meaning (do not change)', 'Your label (editable)'],
      listsNote: 'These lists feed the dropdowns. Add your own on the empty lines. Fees are examples — check your platform’s current fees.',
      channel: ['Sales channel', 'Fee %', 'Fixed fee'], payment: ['Payment method', 'Fee %', 'Fixed fee'], carrier: ['Carrier', 'Shipping cost', 'Return cost'],
    },
    channels: [['Instagram', 0, 0], ['TikTok', 0, 0], ['Facebook', 0, 0], ['WhatsApp', 0, 0], ['TikTok Shop', 0.06, 0], ['Etsy', 0.065, 0.2], ['Website / Shopify', 0, 0]],
    payments: [['Card / online', 0.029, 0.3], ['Cash on delivery', 0, 0], ['Bank transfer', 0, 0], ['PayPal', 0.0349, 0.49]],
    dash: {
      subtitle: 'Your real numbers, updated automatically.', from: 'From', to: 'To', periodHint: 'Leave both empty = all time',
      revenue: 'Revenue', profit: 'Net profit', margin: 'Net margin', orders: 'Orders',
      deliveryRate: 'Delivery rate', returnRate: 'Return rate', aov: 'Avg order value', transit: 'In transit',
      stockValue: 'Stock value', alerts: 'Stock alerts', bestChannel: 'Best channel', bestProduct: 'Best product',
      data: 'Chart data (automatic — do not edit)', month: 'Month', status: 'Status', channel: 'Channel', product: 'Product', count: 'Orders',
      chartMonthly: 'Revenue & profit — last 12 months', chartStatus: 'Orders by status', chartChannel: 'Revenue by channel', chartTop: 'Top 5 products by profit',
    },
    sampleProducts: [
      ['TS-01', 'Oversized T-shirt', 'Apparel', 6, 0.5, 25, 60, 0, 10],
      ['SR-01', 'Vitamin C serum', 'Beauty', 4, 0.8, 29, 40, 20, 8],
      ['WT-01', 'Classic watch', 'Accessories', 12, 1.5, 49, 25, 0, 5],
      ['PC-01', 'iPhone case', 'Accessories', 1.5, 0.3, 15, 100, 0, 15],
      ['BG-01', 'Tote bag', 'Bags', 5, 0.7, 22, 6, 0, 5],
    ],
    sampleCustomers: [
      ['Emma Johnson', '+1 415 555 0142', 'San Francisco', 'USA'],
      ['Liam Smith', '+44 7700 900123', 'London', 'UK'],
      ['Olivia Brown', '+1 212 555 0199', 'New York', 'USA'],
      ['Noah Wilson', '+61 412 345 678', 'Sydney', 'Australia'],
      ['Ava Martin', '+1 647 555 0110', 'Toronto', 'Canada'],
    ],
    guideTitle: '📖 How to use your Margokit tracker',
    guide: [
      ['Start', 'This file contains SAMPLE DATA so you can see how everything works. When you are ready: in Orders, select rows 2 to 19 → right-click → Delete rows. Do the same for rows 2 to 6 in Products.'],
      ['1. Settings', 'Set your currency and shop name. Then fill your sales channels (with their fees), payment methods (with their fees) and carriers (with the shipping and return cost you pay). Fees are examples: check your platform’s current fees.'],
      ['2. Products', 'One line per product. Unit cost = what you pay your supplier. Packaging = cost per unit (box, bag, sticker). When you receive new stock, add it to "Restocked (+)".'],
      ['3. Orders', 'One line per product ordered (an order with 2 products = 2 lines with the same Order #). Choose the product, channel, payment, status and carrier from the dropdowns. Update the status as the parcel moves.'],
      ['Green columns', 'Columns with a green header are automatic. Never type in them.'],
      ['How profit is calculated', 'Delivered: total − product cost − packaging − shipping − channel fee − payment fee.\nReturned / refused: − (shipping + return shipping + packaging). The product goes back to stock.\nNew, Confirmed, Shipped, Cancelled: no profit counted yet.'],
      ['Shipping cost', 'Leave "Shipping cost (you pay)" empty to use the carrier cost from Settings, or type the real cost for that order.'],
      ['Stock', 'A unit leaves your stock when the order is Shipped or Delivered. Returned and Cancelled units stay in stock. Rows turn orange (Low) or red (Out of stock) in Products.'],
      ['4. Customers', 'Built automatically from your orders (by phone number, or by name if no phone). ⚠️ Risky = 2+ returned/refused parcels: ask for a deposit before shipping. ⭐ Loyal = 3+ delivered orders: reward them.'],
      ['5. Dashboard', 'Choose a period with From / To (or leave empty for all time). The monthly chart always shows the last 12 months.'],
      ['On your phone', 'Install the Google Sheets app, open this file and star it. Tap a cell to open the dropdowns. Tip: add new orders at the first empty line.'],
      ['Do not', 'Do not rename the Settings tab, do not delete the header rows, do not type in green columns. You can rename status labels in Settings, but keep the 6 lines in the same order.'],
      ['Currency symbol', 'To display a symbol in cells: select the columns → Format → Number → Custom currency.'],
      ['Help', 'Questions? Reply to your purchase email — we answer within 24h.'],
    ],
  },

  fr: {
    file: 'Margokit — Suivi Commandes & Stock',
    dateFormat: 'dd/mm/yyyy',
    sheets: { dashboard: 'Tableau de bord', orders: 'Commandes', products: 'Produits', customers: 'Clients', settings: 'Paramètres', guide: 'Mode d’emploi' },
    orders: ['Date', 'N° commande', 'Client', 'Téléphone', 'Ville', 'Pays', 'Produit', 'Qté', 'Prix unitaire', 'Livraison facturée',
      'Canal', 'Paiement', 'Statut', 'Transporteur', 'N° de suivi', 'Coût livraison (payé par toi)', 'Notes'],
    ordersCalc: ['Total', 'Bénéfice', 'Marge', 'Mois', 'Clé client'],
    notes: {
      shippingCost: 'Laisse vide pour utiliser le coût par défaut du transporteur (Paramètres).',
      auto: 'Colonne automatique — ne rien saisir ici.',
      status: 'Mets à jour le statut au fil de la livraison. Le bénéfice est compté à « Livrée » (ou la perte à « Retournée »).',
      product: 'Choisis un produit de l’onglet Produits.',
      restock: 'Total des unités reçues après le stock initial. Ex. 20 → 50 après en avoir reçu 30 de plus.',
    },
    products: ['Réf.', 'Produit', 'Catégorie', 'Coût unitaire', 'Emballage / unité', 'Prix de vente', 'Stock initial', 'Réassort (+)', 'Alerte stock bas à'],
    productsCalc: ['Vendus', 'En stock', 'État du stock', 'Valeur du stock', 'CA', 'Bénéfice'],
    stock: { ok: 'OK', low: 'Bas', out: 'Rupture' },
    customers: ['Téléphone / ID', 'Nom', 'Ville', 'Pays', 'Commandes', 'Livrées', 'Retournées', 'Taux de livraison', 'Total dépensé', 'Bénéfice', 'Dernière commande', 'Tag'],
    tags: { risky: '⚠️ À risque', loyal: '⭐ Fidèle' },
    statusMeaning: ['Nouvelle commande', 'Confirmée par le client', 'Expédiée (sortie du stock)', 'Livrée (bénéfice compté)', 'Retournée / refusée (perte comptée)', 'Annulée (ignorée)'],
    statuses: ['Nouvelle', 'Confirmée', 'Expédiée', 'Livrée', 'Retournée', 'Annulée'],
    settings: {
      title: '⚙️ Paramètres', currency: 'Devise', business: 'Nom de la boutique', businessDefault: 'Ma boutique', lowDefault: 'Alerte stock bas par défaut',
      statusHeader: ['Signification (ne pas modifier)', 'Ton libellé (modifiable)'],
      listsNote: 'Ces listes alimentent les menus déroulants. Ajoute les tiennes sur les lignes vides. Les frais sont des exemples — vérifie les frais actuels de ta plateforme.',
      channel: ['Canal de vente', 'Frais %', 'Frais fixes'], payment: ['Mode de paiement', 'Frais %', 'Frais fixes'], carrier: ['Transporteur', 'Coût livraison', 'Coût retour'],
    },
    channels: [['Instagram', 0, 0], ['TikTok', 0, 0], ['Facebook', 0, 0], ['WhatsApp', 0, 0], ['TikTok Shop', 0.06, 0], ['Etsy', 0.065, 0.2], ['Site / Shopify', 0, 0]],
    payments: [['Carte / en ligne', 0.029, 0.3], ['Paiement à la livraison', 0, 0], ['Virement', 0, 0], ['PayPal', 0.0349, 0.49]],
    dash: {
      subtitle: 'Tes vrais chiffres, mis à jour automatiquement.', from: 'Du', to: 'Au', periodHint: 'Laisse vide = depuis le début',
      revenue: 'Chiffre d’affaires', profit: 'Bénéfice net', margin: 'Marge nette', orders: 'Commandes',
      deliveryRate: 'Taux de livraison', returnRate: 'Taux de retour', aov: 'Panier moyen', transit: 'En cours de livraison',
      stockValue: 'Valeur du stock', alerts: 'Alertes stock', bestChannel: 'Meilleur canal', bestProduct: 'Meilleur produit',
      data: 'Données des graphiques (automatique — ne pas modifier)', month: 'Mois', status: 'Statut', channel: 'Canal', product: 'Produit', count: 'Commandes',
      chartMonthly: 'CA & bénéfice — 12 derniers mois', chartStatus: 'Commandes par statut', chartChannel: 'CA par canal', chartTop: 'Top 5 produits (bénéfice)',
    },
    sampleProducts: [
      ['TS-01', 'T-shirt oversize', 'Vêtements', 6, 0.5, 25, 60, 0, 10],
      ['SR-01', 'Sérum vitamine C', 'Beauté', 4, 0.8, 29, 40, 20, 8],
      ['MT-01', 'Montre classique', 'Accessoires', 12, 1.5, 49, 25, 0, 5],
      ['CQ-01', 'Coque iPhone', 'Accessoires', 1.5, 0.3, 15, 100, 0, 15],
      ['SC-01', 'Sac cabas', 'Sacs', 5, 0.7, 22, 6, 0, 5],
    ],
    sampleCustomers: [
      ['Sarah Benali', '06 12 34 56 78', 'Paris', 'France'],
      ['Yassine El Idrissi', '06 61 23 45 67', 'Casablanca', 'Maroc'],
      ['Chloé Dubois', '07 45 67 89 01', 'Lyon', 'France'],
      ['Aminata Diallo', '77 123 45 67', 'Dakar', 'Sénégal'],
      ['Karim Haddad', '0470 12 34 56', 'Bruxelles', 'Belgique'],
    ],
    guideTitle: '📖 Mode d’emploi de ton suivi Margokit',
    guide: [
      ['Pour commencer', 'Ce fichier contient des DONNÉES D’EXEMPLE pour que tu voies comment tout fonctionne. Quand tu es prêt(e) : dans Commandes, sélectionne les lignes 2 à 19 → clic droit → Supprimer les lignes. Fais pareil pour les lignes 2 à 6 dans Produits.'],
      ['1. Paramètres', 'Indique ta devise et le nom de ta boutique. Remplis ensuite tes canaux de vente (avec leurs frais), tes modes de paiement (avec leurs frais) et tes transporteurs (avec le coût de livraison et de retour que TU paies). Les frais sont des exemples : vérifie ceux de ta plateforme.'],
      ['2. Produits', 'Une ligne par produit. Coût unitaire = ce que tu paies à ton fournisseur. Emballage = coût par unité (boîte, sachet, sticker). Quand tu reçois du stock, ajoute-le dans « Réassort (+) ».'],
      ['3. Commandes', 'Une ligne par produit commandé (une commande de 2 produits = 2 lignes avec le même N° de commande). Choisis le produit, le canal, le paiement, le statut et le transporteur dans les menus. Mets à jour le statut au fil de la livraison.'],
      ['Colonnes vertes', 'Les colonnes à en-tête vert sont automatiques. N’écris jamais dedans.'],
      ['Calcul du bénéfice', 'Livrée : total − coût produit − emballage − livraison − frais du canal − frais de paiement.\nRetournée / refusée : − (livraison + retour + emballage). Le produit revient en stock.\nNouvelle, Confirmée, Expédiée, Annulée : pas encore de bénéfice compté.'],
      ['Coût de livraison', 'Laisse « Coût livraison (payé par toi) » vide pour utiliser le coût du transporteur (Paramètres), ou saisis le coût réel de cette commande.'],
      ['Stock', 'Une unité sort du stock quand la commande est Expédiée ou Livrée. Les unités Retournées et Annulées restent en stock. Les lignes passent en orange (Bas) ou rouge (Rupture) dans Produits.'],
      ['4. Clients', 'Liste créée automatiquement à partir des commandes (par téléphone, ou par nom sans téléphone). ⚠️ À risque = 2 colis retournés/refusés ou plus : demande un acompte avant d’expédier. ⭐ Fidèle = 3 commandes livrées ou plus : récompense-le.'],
      ['5. Tableau de bord', 'Choisis une période avec Du / Au (ou laisse vide pour tout voir). Le graphique mensuel montre toujours les 12 derniers mois.'],
      ['Sur ton téléphone', 'Installe l’application Google Sheets, ouvre ce fichier et ajoute-le aux favoris. Touche une cellule pour ouvrir les menus. Astuce : ajoute les nouvelles commandes sur la première ligne vide.'],
      ['À éviter', 'Ne renomme pas l’onglet Paramètres, ne supprime pas les lignes d’en-tête, n’écris pas dans les colonnes vertes. Tu peux renommer les statuts dans Paramètres, mais garde les 6 lignes dans le même ordre.'],
      ['Symbole de devise', 'Pour afficher un symbole dans les cellules : sélectionne les colonnes → Format → Nombre → Devise personnalisée.'],
      ['Aide', 'Une question ? Réponds à l’e-mail d’achat — réponse sous 24 h.'],
    ],
  },
};

// Commandes d'exemple : [ilya X jours, client, produit, qté, canal, paiement, statut, transporteur, livraison facturée]
// Statuts : 0 nouvelle, 1 confirmée, 2 expédiée, 3 livrée, 4 retournée, 5 annulée
const SAMPLE_ORDERS = [
  [85, 0, 0, 2, 0, 1, 3, 0, 0], [80, 1, 1, 1, 1, 0, 3, 1, 0], [72, 2, 2, 1, 3, 1, 4, 0, 0],
  [65, 3, 3, 3, 4, 0, 3, 2, 0], [58, 0, 1, 1, 0, 1, 3, 0, 0], [50, 2, 0, 1, 2, 1, 4, 1, 0],
  [44, 1, 2, 1, 1, 0, 3, 2, 0], [38, 4, 4, 2, 3, 1, 3, 0, 0], [30, 3, 0, 1, 0, 1, 3, 1, 0],
  [25, 0, 3, 2, 6, 0, 3, 2, 0], [20, 4, 1, 2, 1, 1, 3, 0, 0], [15, 1, 2, 1, 0, 1, 5, 0, 0],
  [10, 2, 4, 1, 3, 1, 3, 1, 0], [7, 3, 1, 1, 1, 0, 2, 2, 0], [5, 0, 0, 3, 0, 1, 2, 0, 0],
  [3, 4, 3, 1, 4, 0, 1, 1, 0], [1, 1, 2, 1, 3, 1, 0, 0, 0], [0, 2, 1, 2, 0, 1, 0, 0, 0],
];

// ---------------------------------------------------------------------------
// Seller Pack — textes et données d'exemple
// ---------------------------------------------------------------------------

I18N.en.pack = {
  file: 'Margokit — Seller Pack',
  guideTitle: '📖 How to use your Margokit Seller Pack',
  sheets: { ads: 'Ads', content: 'Content', cash: 'Cash', budget: 'Budget', pricing: 'Price calculator' },
  settings: { adPlatforms: 'Ad platform', contentPlatforms: 'Content platform', categories: ['Budget category', 'Monthly budget'], accounts: 'Account' },
  adPlatforms: ['Meta Ads', 'TikTok Ads', 'Google Ads', 'Snapchat Ads', 'Influencer', 'Other'],
  contentPlatforms: ['TikTok', 'Instagram Reels', 'Instagram Post', 'Instagram Story', 'Facebook', 'YouTube Shorts', 'Pinterest', 'WhatsApp Status'],
  categories: [['Sales payout', 0], ['Supplier / stock', 500], ['Ads', 300], ['Shipping', 150], ['Packaging', 50],
    ['Tools & subscriptions', 30], ['Personal', 400], ['Rent & bills', 0], ['Taxes', 0], ['Other', 50]],
  accounts: ['Cash', 'Bank', 'Card / wallet'],

  ads: ['Start date', 'Platform', 'Campaign', 'Product', 'Ad spend', 'Orders (ads manager)', 'Revenue (ads manager)'],
  adsCalc: ['Revenue used', 'Cost per order', 'ROAS', 'Profit / order before ads', 'Real profit', 'Verdict', 'Month'],
  adsNotes: {
    revenue: 'Optional. Empty = orders × product sale price.',
    profit: 'Average REAL profit per order for this product, from your Orders history (returns included). If no history yet: sale price − cost − packaging − first carrier cost.',
    real: 'Orders × profit per order − ad spend. This is what ROAS alone hides.',
  },
  verdict: { win: '✅ Profitable', lose: '❌ Losing money' },
  sampleAds: [[60, 0, 'Serum — broad', 1, 30, 4], [45, 1, 'T-shirt UGC', 0, 20, 3], [30, 0, 'Watch retargeting', 2, 25, 1],
    [20, 1, 'Serum — hook v2', 1, 20, 3], [10, 0, 'Tote bag test', 4, 25, 1], [5, 1, 'Case promo', 3, 10, 2]],

  content: ['Date', 'Platform', 'Format', 'Hook / idea', 'Product', 'Status', 'Link', 'Views', 'Likes', 'Comments', 'Shares', 'Saves', 'DMs / clicks', 'Orders'],
  contentCalc: ['Engagement', 'Day'],
  formats: ['Video', 'Carousel', 'Photo', 'Story', 'Live'],
  contentStatuses: ['Idea', 'Script', 'Filmed', 'Edited', 'Scheduled', 'Published'],
  contentNote: 'Engagement = (likes + comments + shares + saves) ÷ views.',
  sampleContent: [
    [-3, 0, 0, 'You sell at {P}… here’s what you ACTUALLY keep', -1, 0],
    [-1, 1, 0, '3 mistakes that kill your margin', -1, 1],
    [0, 0, 0, 'Unboxing the Vitamin C serum', 1, 4],
    [2, 0, 0, 'POV: your cash-on-delivery parcel gets refused', -1, 5, 12400, 890, 64, 120, 210, 35, 6],
    [4, 1, 1, '5 ways to style the oversized tee', 0, 5, 3100, 240, 18, 22, 95, 12, 3],
    [6, 3, 3, 'Behind the scenes: packing 30 orders', -1, 5, 1800, 95, 6, 4, 10, 5, 1],
    [9, 0, 0, 'Cheap watch vs. luxury watch — can you tell?', 2, 5, 25600, 1900, 210, 340, 420, 60, 8],
    [12, 4, 2, 'New tote bag drop', 4, 5, 900, 40, 3, 1, 4, 2, 0],
    [15, 6, 2, 'Summer tote outfit', 4, 5, 2200, 30, 0, 12, 85, 9, 1],
    [20, 0, 0, 'How I track 100 orders a day with one Google Sheet', -1, 5, 8900, 610, 48, 75, 390, 22, 0],
  ],

  cash: ['Date', 'Type', 'Category', 'Description', 'Amount', 'Account', 'Pro / Personal'],
  cashCalc: ['Signed amount', 'Month', 'Balance'],
  cashNote: 'Amount is always positive: the Type decides + or −. Balance follows the row order.',
  types: ['Income', 'Expense'],
  scope: ['Pro', 'Personal'],
  sampleCash: [
    [30, 0, 9, 'Opening balance', 500, 1, 0], [28, 0, 0, 'Payout — delivery company (COD)', 420, 1, 0], [27, 1, 1, 'Supplier order — serums', 160, 1, 0],
    [25, 1, 2, 'Meta Ads top-up', 120, 2, 0], [22, 1, 3, 'Shipping labels', 45, 0, 0], [20, 1, 6, 'Groceries', 85, 0, 1],
    [18, 1, 5, 'Canva Pro', 12, 2, 0], [15, 0, 0, 'Payout — delivery company (COD)', 380, 1, 0], [14, 1, 2, 'TikTok Ads top-up', 80, 2, 0],
    [12, 1, 7, 'Rent', 300, 1, 1], [10, 1, 4, 'Boxes & stickers', 30, 0, 0], [7, 1, 1, 'Supplier order — tote bags', 90, 1, 0],
    [5, 0, 0, 'Payout — Etsy', 145, 1, 0], [3, 1, 2, 'Meta Ads top-up', 60, 2, 0], [1, 1, 6, 'Phone plan', 20, 1, 1],
  ],

  budget: {
    title: '💰 Budget & cash', month: 'Month', monthHint: 'Empty = current month',
    kpis: ['Income', 'Expenses', 'Net', 'Cash balance (all time)', 'Pro expenses', 'Personal expenses'],
    table: ['Category', 'Monthly budget', 'Spent', 'Remaining', 'Used'],
    history: ['Month', 'Income', 'Expenses', 'Net'],
    chart: 'Income vs expenses — last 6 months',
  },

  pricing: {
    title: '🧮 Price calculator', subtitle: 'Find the right price BEFORE you sell. Change the green cells.',
    inputsHeader: 'Your numbers', outputsHeader: 'Results', currencyLabel: 'Amounts in',
    inputs: ['Sale price', 'Product cost', 'Packaging', 'Shipping cost (you pay)', 'Return cost per refused parcel',
      'Platform fee %', 'Platform fixed fee', 'Payment fee %', 'Ad cost per order', 'Delivery rate %', 'Target margin %', 'Ad budget to recoup'],
    outputs: ['Profit per delivered order', 'Net margin', 'Real cost per delivered order', 'Break-even price (no loss)',
      'Price for 30% margin', 'Price for 50% margin', 'Price for your target margin', 'Max ad cost per order', 'Break-even ROAS', 'Orders to recoup ad budget'],
    scenarios: ['Price', 'Profit / delivered order', 'Margin'],
    scenariosTitle: 'What if I change my price?',
    status: { loss: '❌ You lose money on every delivered order. Raise the price or cut costs.', thin: '⚠️ Thin margin: one bad week of returns and you lose money.', ok: '✅ Healthy margin.' },
    notes: {
      delivery: 'Share of shipped orders actually delivered and paid. 100% if customers pay online.',
      ads: 'What one order costs you in ads (ad spend ÷ orders). 0 if you sell organically.',
      roas: 'Minimum ROAS shown in your ads manager to break even.',
    },
  },

  dash: { adSpend: 'Ad spend', roas: 'Ad ROAS', afterAds: 'Profit after ads', cpa: 'Cost per order (ads)',
    cashBalance: 'Cash balance', cashNet: 'Cash net (period)', posts: 'Posts published', views: 'Total views' },

  guide: [
    ['6. Ads', 'One line per campaign (or per week of a campaign). Copy spend and orders from your ads manager. "Real profit" uses your REAL profit per order from Orders (returns included) — that is what ROAS alone hides. ❌ = stop or fix the campaign.'],
    ['7. Content', 'Plan your posts (Idea → Published), then fill views and results 2–3 days after posting. Today’s posts are highlighted. Re-use the hooks with the most views.'],
    ['8. Cash', 'Every money movement, business AND personal: payouts, supplier, ads, rent… Amount always positive, the Type decides + or −. Add lines in date order (the balance follows the row order).'],
    ['9. Budget', 'Set a monthly budget per category in Settings. The Budget tab shows what you spent this month (or the month you pick), what is left, and 6 months of history.'],
    ['10. Price calculator', 'Before launching a product: enter its costs, fees, ad cost and delivery rate. You get the minimum price, the price for 30% / 50% margin and the max you can pay per order in ads.'],
  ],
};

I18N.fr.pack = {
  file: 'Margokit — Pack Vendeur',
  guideTitle: '📖 Mode d’emploi de ton Pack Vendeur Margokit',
  sheets: { ads: 'Publicité', content: 'Contenu', cash: 'Trésorerie', budget: 'Budget', pricing: 'Calculateur de prix' },
  settings: { adPlatforms: 'Plateforme pub', contentPlatforms: 'Réseau (contenu)', categories: ['Catégorie de budget', 'Budget mensuel'], accounts: 'Compte' },
  adPlatforms: ['Meta Ads', 'TikTok Ads', 'Google Ads', 'Snapchat Ads', 'Influenceur', 'Autre'],
  contentPlatforms: ['TikTok', 'Instagram Reels', 'Instagram Post', 'Instagram Story', 'Facebook', 'YouTube Shorts', 'Pinterest', 'Statut WhatsApp'],
  categories: [['Encaissement ventes', 0], ['Fournisseur / stock', 500], ['Publicité', 300], ['Livraison', 150], ['Emballage', 50],
    ['Outils & abonnements', 30], ['Personnel', 400], ['Loyer & factures', 0], ['Impôts', 0], ['Autre', 50]],
  accounts: ['Espèces', 'Banque', 'Carte / portefeuille'],

  ads: ['Date de début', 'Plateforme', 'Campagne', 'Produit', 'Dépense pub', 'Commandes (gestionnaire pub)', 'CA (gestionnaire pub)'],
  adsCalc: ['CA retenu', 'Coût par commande', 'ROAS', 'Bénéfice / commande avant pub', 'Bénéfice réel', 'Verdict', 'Mois'],
  adsNotes: {
    revenue: 'Facultatif. Vide = commandes × prix de vente du produit.',
    profit: 'Bénéfice RÉEL moyen par commande pour ce produit, calculé depuis tes Commandes (retours inclus). Sans historique : prix − coût − emballage − coût du 1er transporteur.',
    real: 'Commandes × bénéfice par commande − dépense pub. C’est ce que le ROAS seul ne montre pas.',
  },
  verdict: { win: '✅ Rentable', lose: '❌ Perd de l’argent' },
  sampleAds: [[60, 0, 'Sérum — large', 1, 30, 4], [45, 1, 'T-shirt UGC', 0, 20, 3], [30, 0, 'Montre retargeting', 2, 25, 1],
    [20, 1, 'Sérum — accroche v2', 1, 20, 3], [10, 0, 'Test sac cabas', 4, 25, 1], [5, 1, 'Promo coque', 3, 10, 2]],

  content: ['Date', 'Réseau', 'Format', 'Accroche / idée', 'Produit', 'Statut', 'Lien', 'Vues', 'J’aime', 'Commentaires', 'Partages', 'Enregistrements', 'DM / clics', 'Commandes'],
  contentCalc: ['Engagement', 'Jour'],
  formats: ['Vidéo', 'Carrousel', 'Photo', 'Story', 'Live'],
  contentStatuses: ['Idée', 'Script', 'Tourné', 'Monté', 'Programmé', 'Publié'],
  contentNote: 'Engagement = (j’aime + commentaires + partages + enregistrements) ÷ vues.',
  sampleContent: [
    [-3, 0, 0, 'Tu vends à {P}… voilà ce que tu gardes VRAIMENT', -1, 0],
    [-1, 1, 0, '3 erreurs qui tuent ta marge', -1, 1],
    [0, 0, 0, 'Déballage du sérum vitamine C', 1, 4],
    [2, 0, 0, 'POV : ton colis en paiement à la livraison est refusé', -1, 5, 12400, 890, 64, 120, 210, 35, 6],
    [4, 1, 1, '5 façons de porter le t-shirt oversize', 0, 5, 3100, 240, 18, 22, 95, 12, 3],
    [6, 3, 3, 'Coulisses : j’emballe 30 commandes', -1, 5, 1800, 95, 6, 4, 10, 5, 1],
    [9, 0, 0, 'Montre pas chère vs montre de luxe : tu vois la différence ?', 2, 5, 25600, 1900, 210, 340, 420, 60, 8],
    [12, 4, 2, 'Nouveau : le sac cabas', 4, 5, 900, 40, 3, 1, 4, 2, 0],
    [15, 6, 2, 'Tenue d’été avec le sac cabas', 4, 5, 2200, 30, 0, 12, 85, 9, 1],
    [20, 0, 0, 'Comment je gère 100 commandes par jour avec un seul Google Sheet', -1, 5, 8900, 610, 48, 75, 390, 22, 0],
  ],

  cash: ['Date', 'Type', 'Catégorie', 'Description', 'Montant', 'Compte', 'Pro / Perso'],
  cashCalc: ['Montant signé', 'Mois', 'Solde'],
  cashNote: 'Le montant est toujours positif : le Type décide + ou −. Le solde suit l’ordre des lignes.',
  types: ['Entrée', 'Sortie'],
  scope: ['Pro', 'Perso'],
  sampleCash: [
    [30, 0, 9, 'Solde d’ouverture', 500, 1, 0], [28, 0, 0, 'Versement société de livraison (COD)', 420, 1, 0], [27, 1, 1, 'Commande fournisseur — sérums', 160, 1, 0],
    [25, 1, 2, 'Recharge Meta Ads', 120, 2, 0], [22, 1, 3, 'Étiquettes d’expédition', 45, 0, 0], [20, 1, 6, 'Courses', 85, 0, 1],
    [18, 1, 5, 'Canva Pro', 12, 2, 0], [15, 0, 0, 'Versement société de livraison (COD)', 380, 1, 0], [14, 1, 2, 'Recharge TikTok Ads', 80, 2, 0],
    [12, 1, 7, 'Loyer', 300, 1, 1], [10, 1, 4, 'Boîtes & stickers', 30, 0, 0], [7, 1, 1, 'Commande fournisseur — sacs', 90, 1, 0],
    [5, 0, 0, 'Versement Etsy', 145, 1, 0], [3, 1, 2, 'Recharge Meta Ads', 60, 2, 0], [1, 1, 6, 'Forfait téléphone', 20, 1, 1],
  ],

  budget: {
    title: '💰 Budget & trésorerie', month: 'Mois', monthHint: 'Vide = mois en cours',
    kpis: ['Entrées', 'Sorties', 'Net', 'Solde de trésorerie (total)', 'Dépenses pro', 'Dépenses perso'],
    table: ['Catégorie', 'Budget mensuel', 'Dépensé', 'Reste', 'Utilisé'],
    history: ['Mois', 'Entrées', 'Sorties', 'Net'],
    chart: 'Entrées vs sorties — 6 derniers mois',
  },

  pricing: {
    title: '🧮 Calculateur de prix', subtitle: 'Trouve le bon prix AVANT de vendre. Modifie les cellules vertes.',
    inputsHeader: 'Tes chiffres', outputsHeader: 'Résultats', currencyLabel: 'Montants en',
    inputs: ['Prix de vente', 'Coût du produit', 'Emballage', 'Coût de livraison (payé par toi)', 'Coût de retour par colis refusé',
      'Frais plateforme %', 'Frais plateforme fixes', 'Frais de paiement %', 'Coût pub par commande', 'Taux de livraison %', 'Marge visée %', 'Budget pub à rentabiliser'],
    outputs: ['Bénéfice par commande livrée', 'Marge nette', 'Coût réel par commande livrée', 'Prix minimum (sans perte)',
      'Prix pour 30 % de marge', 'Prix pour 50 % de marge', 'Prix pour ta marge visée', 'Coût pub max par commande', 'ROAS minimum rentable', 'Commandes pour rentabiliser le budget pub'],
    scenarios: ['Prix', 'Bénéfice / commande livrée', 'Marge'],
    scenariosTitle: 'Et si je change mon prix ?',
    status: { loss: '❌ Tu perds de l’argent sur chaque commande livrée. Augmente le prix ou baisse les coûts.', thin: '⚠️ Marge fine : une mauvaise semaine de retours et tu perds de l’argent.', ok: '✅ Marge saine.' },
    notes: {
      delivery: 'Part des colis expédiés réellement livrés et payés. 100 % si le client paie en ligne.',
      ads: 'Ce qu’une commande te coûte en pub (dépense ÷ commandes). 0 si tu vends sans pub.',
      roas: 'ROAS minimum affiché dans ton gestionnaire de pub pour ne pas perdre d’argent.',
    },
  },

  dash: { adSpend: 'Dépense pub', roas: 'ROAS pub', afterAds: 'Bénéfice après pub', cpa: 'Coût par commande (pub)',
    cashBalance: 'Solde de trésorerie', cashNet: 'Trésorerie nette (période)', posts: 'Posts publiés', views: 'Vues totales' },

  guide: [
    ['6. Publicité', 'Une ligne par campagne (ou par semaine de campagne). Recopie la dépense et les commandes depuis ton gestionnaire de pub. « Bénéfice réel » utilise ton VRAI bénéfice par commande (retours inclus) — c’est ce que le ROAS seul ne montre pas. ❌ = arrête ou corrige la campagne.'],
    ['7. Contenu', 'Planifie tes posts (Idée → Publié), puis remplis les vues et résultats 2–3 jours après publication. Les posts du jour sont surlignés. Réutilise les accroches qui font le plus de vues.'],
    ['8. Trésorerie', 'Chaque mouvement d’argent, pro ET perso : versements reçus, fournisseur, pub, loyer… Montant toujours positif, le Type décide + ou −. Ajoute les lignes dans l’ordre des dates (le solde suit l’ordre des lignes).'],
    ['9. Budget', 'Fixe un budget mensuel par catégorie dans Paramètres. L’onglet Budget montre ce que tu as dépensé ce mois-ci (ou le mois choisi), ce qu’il reste, et 6 mois d’historique.'],
    ['10. Calculateur de prix', 'Avant de lancer un produit : saisis ses coûts, frais, coût pub et taux de livraison. Tu obtiens le prix minimum, le prix pour 30 % / 50 % de marge et le maximum que tu peux payer en pub par commande.'],
  ],
};

// Valeurs par défaut du calculateur de prix (les montants sont multipliés par variant.money)
const PRICING_DEFAULTS = [25, 6, 0.5, 5, 3, 0, 0, 0.029, 4, 0.8, 0.3, 300];
const PRICING_MONEY_ROWS = [0, 1, 2, 3, 4, 6, 8, 11];
const PRICING_PCT_ROWS = [5, 7, 9, 10];

// ---------------------------------------------------------------------------
// Construction
// ---------------------------------------------------------------------------

function buildTracker_(variantKey, pack) {
  const v = VARIANTS[variantKey];
  const t = I18N[v.lang];
  const fileName = (pack ? t.pack.file : t.file) + v.suffix;
  const ss = SpreadsheetApp.create(fileName);
  // Les formules sont écrites avec la syntaxe en_US (virgules) : on garde cette locale
  // pendant la construction et on applique la locale finale tout à la fin (Sheets convertit).
  ss.setSpreadsheetLocale('en_US');

  const keys = pack
    ? ['dashboard', 'orders', 'products', 'customers', 'ads', 'content', 'cash', 'budget', 'pricing', 'settings', 'guide']
    : ['dashboard', 'orders', 'products', 'customers', 'settings', 'guide'];
  const names = Object.assign({}, t.sheets, pack ? t.pack.sheets : {});
  const sh = {};
  const N = {};
  keys.forEach((k, i) => {
    sh[k] = i === 0 ? ss.getSheets()[0].setName(names[k]) : ss.insertSheet(names[k]);
    sh[k].getRange(1, 1, sh[k].getMaxRows(), sh[k].getMaxColumns()).setFontFamily(FONT).setFontColor(C.ink);
    N[k] = "'" + names[k].replace(/'/g, "''") + "'";
  });

  buildSettings_(ss, sh.settings, t, v, pack);
  buildProducts_(sh.products, t, v, N);
  buildOrders_(sh.orders, t, v, N, sh.products);
  buildCustomers_(sh.customers, t, N);
  if (pack) {
    buildAds_(sh.ads, t, v, N, sh.products);
    buildContent_(sh.content, t, v, sh.products);
    buildCash_(sh.cash, t, v);
    buildBudget_(ss, sh.budget, t, N);
    buildPricing_(sh.pricing, t, v);
  }
  buildDashboard_(ss, sh.dashboard, t, N, pack);
  buildGuide_(sh.guide, t, pack);

  keys.forEach(k => {
    const color = k === 'dashboard' ? C.primary : (k === 'settings' || k === 'guide') ? C.muted
      : k === 'pricing' ? C.primaryInk : C.ink;
    sh[k].setTabColor(color);
  });
  ss.setActiveSheet(sh.dashboard);

  SpreadsheetApp.flush();
  ss.setSpreadsheetLocale(v.locale);
  SpreadsheetApp.flush();
  Logger.log(`${fileName} → ${ss.getUrl()}`);
}

// ---- Paramètres -----------------------------------------------------------

function buildSettings_(ss, sh, t, v, pack) {
  const st = t.settings;
  sh.getRange('A1').setValue(st.title).setFontSize(16).setFontWeight('bold');

  sh.getRange('A3:B5').setValues([
    [st.currency, v.currency],
    [st.business, st.businessDefault],
    [st.lowDefault, 5],
  ]);
  sh.getRange('A3:A5').setFontWeight('bold');
  sh.getRange('B3:B5').setBackground(C.primarySoft);

  styleHeader_(sh.getRange('A7:B7').setValues([st.statusHeader]), false);
  sh.getRange('A8:B13').setValues(t.statusMeaning.map((m, i) => [m, t.statuses[i]]));
  sh.getRange('A8:A13').setFontColor(C.muted);
  sh.getRange('B8:B13').setBackground(C.primarySoft).setFontWeight('bold');
  sh.getRange('A8:A13').protect().setWarningOnly(true).setDescription('Status meanings');

  sh.getRange('A15').setValue(st.listsNote).setFontColor(C.muted).setFontStyle('italic');

  const LIST_ROWS = 30; // lignes 18 à 47
  const lists = [
    { col: 1, header: st.channel, rows: t.channels.map(r => [r[0], r[1], r[2] * v.money]) },
    { col: 5, header: st.payment, rows: t.payments.map(r => [r[0], r[1], r[2] * v.money]) },
    { col: 9, header: st.carrier, rows: v.carriers },
  ];
  lists.forEach(l => {
    styleHeader_(sh.getRange(17, l.col, 1, 3).setValues([l.header]), false);
    sh.getRange(18, l.col, l.rows.length, 3).setValues(l.rows);
    sh.getRange(18, l.col, LIST_ROWS, 3).setBorder(true, true, true, true, true, true, C.border, SpreadsheetApp.BorderStyle.SOLID);
  });
  sh.getRange('B18:B47').setNumberFormat(PCT);
  sh.getRange('F18:F47').setNumberFormat(PCT);
  sh.getRange('C18:C47').setNumberFormat(MONEY);
  sh.getRange('G18:G47').setNumberFormat(MONEY);
  sh.getRange('J18:K47').setNumberFormat(MONEY);
  const pct = SpreadsheetApp.newDataValidation().requireNumberBetween(0, 1).setAllowInvalid(false)
    .setHelpText('0% – 100%').build();
  sh.getRange('B18:B47').setDataValidation(pct);
  sh.getRange('F18:F47').setDataValidation(pct);

  sh.setColumnWidth(1, 260);
  sh.setColumnWidth(2, 170);
  [3, 7, 10, 11].forEach(c => sh.setColumnWidth(c, 110));
  [5, 9].forEach(c => sh.setColumnWidth(c, 190));
  [4, 8].forEach(c => sh.setColumnWidth(c, 24));

  const named = {
    MK_CURRENCY: 'B3', MK_BUSINESS: 'B4', MK_LOW_DEFAULT: 'B5',
    MK_ST_NEW: 'B8', MK_ST_CONFIRMED: 'B9', MK_ST_SHIPPED: 'B10',
    MK_ST_DELIVERED: 'B11', MK_ST_RETURNED: 'B12', MK_ST_CANCELLED: 'B13',
    MK_LIST_STATUS: 'B8:B13',
    MK_CHANNELS: 'A18:C47', MK_LIST_CHANNEL: 'A18:A47',
    MK_PAYMENTS: 'E18:G47', MK_LIST_PAYMENT: 'E18:E47',
    MK_CARRIERS: 'I18:K47', MK_LIST_CARRIER: 'I18:I47',
  };
  if (pack) {
    const k = t.pack.settings;
    const packLists = [
      { col: 13, header: [k.adPlatforms], rows: t.pack.adPlatforms.map(x => [x]) },
      { col: 15, header: [k.contentPlatforms], rows: t.pack.contentPlatforms.map(x => [x]) },
      { col: 17, header: k.categories, rows: t.pack.categories.map(r => [r[0], r[1] * v.money]) },
      { col: 20, header: [k.accounts], rows: t.pack.accounts.map(x => [x]) },
    ];
    packLists.forEach(l => {
      const w = l.header.length;
      styleHeader_(sh.getRange(17, l.col, 1, w).setValues([l.header]), false);
      sh.getRange(18, l.col, l.rows.length, w).setValues(l.rows);
      sh.getRange(18, l.col, LIST_ROWS, w).setBorder(true, true, true, true, true, true, C.border, SpreadsheetApp.BorderStyle.SOLID);
    });
    sh.getRange('R18:R47').setNumberFormat(MONEY);
    [13, 15, 17, 20].forEach(c => sh.setColumnWidth(c, 180));
    [14, 16, 19].forEach(c => sh.setColumnWidth(c, 24));
    sh.setColumnWidth(18, 120);
    Object.assign(named, {
      MK_LIST_ADPLAT: 'M18:M47', MK_LIST_CONTENTPLAT: 'O18:O47',
      MK_CATEGORIES: 'Q18:R47', MK_LIST_CATEGORY: 'Q18:Q47', MK_LIST_ACCOUNT: 'T18:T47',
    });
  }
  Object.keys(named).forEach(n => ss.setNamedRange(n, sh.getRange(named[n])));
}

// ---- Produits -------------------------------------------------------------

function buildProducts_(sh, t, v, N) {
  const O = N.orders;
  const h = t.productsCalc;
  styleHeader_(sh.getRange(1, 1, 1, 9).setValues([t.products]), false);

  sh.getRange('J1').setFormula(`={${s(h[0])}; MAP(B2:B, LAMBDA(k_p, IF(k_p="", , SUMIFS(${O}!H2:H, ${O}!G2:G, k_p, ${O}!M2:M, MK_ST_SHIPPED) + SUMIFS(${O}!H2:H, ${O}!G2:G, k_p, ${O}!M2:M, MK_ST_DELIVERED))))}`);
  sh.getRange('K1').setFormula(`={${s(h[1])}; ARRAYFORMULA(IF(B2:B="", , G2:G + H2:H - J2:J))}`);
  sh.getRange('L1').setFormula(`={${s(h[2])}; ARRAYFORMULA(IF(B2:B="", , IF(K2:K<=0, ${s(t.stock.out)}, IF(K2:K<=IF(I2:I="", MK_LOW_DEFAULT, I2:I), ${s(t.stock.low)}, ${s(t.stock.ok)}))))}`);
  sh.getRange('M1').setFormula(`={${s(h[3])}; ARRAYFORMULA(IF(B2:B="", , IF(K2:K>0, K2:K*D2:D, 0)))}`);
  sh.getRange('N1').setFormula(`={${s(h[4])}; MAP(B2:B, LAMBDA(k_p, IF(k_p="", , SUMIFS(${O}!R2:R, ${O}!G2:G, k_p, ${O}!M2:M, MK_ST_DELIVERED))))}`);
  sh.getRange('O1').setFormula(`={${s(h[5])}; MAP(B2:B, LAMBDA(k_p, IF(k_p="", , SUMIFS(${O}!S2:S, ${O}!G2:G, k_p))))}`);
  styleHeader_(sh.getRange('J1:O1'), true);
  sh.getRange('J1').setNote(t.notes.auto);
  sh.getRange('H1').setNote(t.notes.restock);
  sh.getRange('J1:O').protect().setWarningOnly(true).setDescription('Automatic columns');

  sh.getRange('D2:F').setNumberFormat(MONEY);
  sh.getRange('M2:O').setNumberFormat(MONEY);
  sh.getRange('G2:K').setNumberFormat('0');

  const nonNeg = SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false).build();
  sh.getRange('D2:I').setDataValidation(nonNeg);

  const rules = [
    rule_(sh.getRange('B2:B')).whenFormulaSatisfied('=AND($B2<>"", COUNTIF($B$2:$B, $B2)>1)').setBackground('#FEE2E2').setFontColor(C.loss).build(),
    rule_(sh.getRange('L2:L')).whenTextEqualTo(t.stock.out).setBackground('#FEE2E2').setFontColor(C.loss).setBold(true).build(),
    rule_(sh.getRange('L2:L')).whenTextEqualTo(t.stock.low).setBackground('#FEF3C7').setFontColor(C.warn).setBold(true).build(),
    rule_(sh.getRange('L2:L')).whenTextEqualTo(t.stock.ok).setFontColor(C.profit).build(),
    rule_(sh.getRange('O2:O')).whenNumberLessThan(0).setFontColor(C.loss).setBold(true).build(),
  ];
  sh.setConditionalFormatRules(rules);

  sh.setFrozenRows(1);
  sh.setRowHeight(1, 40);
  sh.setColumnWidth(1, 80);
  sh.setColumnWidth(2, 200);
  sh.setColumnWidth(3, 130);
  for (let c = 4; c <= 15; c++) sh.setColumnWidth(c, 110);

  if (WITH_SAMPLE_DATA) {
    const rows = t.sampleProducts.map(r => r.map((x, i) => (i >= 3 && i <= 5 ? x * v.money : x)));
    sh.getRange(2, 1, rows.length, 9).setValues(rows);
  }
}

// ---- Commandes ------------------------------------------------------------

function buildOrders_(sh, t, v, N, productsSheet) {
  const P = N.products;
  const h = t.ordersCalc;
  styleHeader_(sh.getRange(1, 1, 1, 17).setValues([t.orders]), false);

  // R — Total
  sh.getRange('R1').setFormula(`={${s(h[0])}; ARRAYFORMULA(IF(G2:G="", , H2:H*I2:I + J2:J))}`);
  // S — Bénéfice (Livrée = gain réel ; Retournée = perte ; autres statuts = vide)
  sh.getRange('S1').setFormula(`={${s(h[1])}; MAP(G2:G, H2:H, I2:I, J2:J, K2:K, L2:L, M2:M, N2:N, P2:P, ` +
    `LAMBDA(p_prod, p_qty, p_price, p_shipin, p_chan, p_pay, p_st, p_car, p_cost, ` +
    `IF(OR(p_prod="", AND(p_st<>MK_ST_DELIVERED, p_st<>MK_ST_RETURNED)), , ` +
    `LET(v_total, p_qty*p_price + p_shipin, ` +
    `v_unit, IFERROR(VLOOKUP(p_prod, ${P}!B2:E, 3, FALSE), 0), ` +
    `v_pack, IFERROR(VLOOKUP(p_prod, ${P}!B2:E, 4, FALSE), 0), ` +
    `v_ship, IF(p_cost<>"", p_cost, IFERROR(VLOOKUP(p_car, MK_CARRIERS, 2, FALSE), 0)), ` +
    `v_ret, IFERROR(VLOOKUP(p_car, MK_CARRIERS, 3, FALSE), 0), ` +
    `v_chan, IFERROR(v_total*VLOOKUP(p_chan, MK_CHANNELS, 2, FALSE) + VLOOKUP(p_chan, MK_CHANNELS, 3, FALSE), 0), ` +
    `v_pay, IFERROR(v_total*VLOOKUP(p_pay, MK_PAYMENTS, 2, FALSE) + VLOOKUP(p_pay, MK_PAYMENTS, 3, FALSE), 0), ` +
    `IF(p_st=MK_ST_DELIVERED, v_total - p_qty*(v_unit + v_pack) - v_ship - v_chan - v_pay, -(v_ship + v_ret + p_qty*v_pack))))))}`);
  // T — Marge (commandes livrées uniquement)
  sh.getRange('T1').setFormula(`={${s(h[2])}; ARRAYFORMULA(IF(M2:M<>MK_ST_DELIVERED, , IFERROR(S2:S/R2:R, "")))}`);
  // U — Mois (1er jour du mois, pour les regroupements)
  sh.getRange('U1').setFormula(`={${s(h[3])}; ARRAYFORMULA(IF(A2:A="", , IFERROR(DATE(YEAR(A2:A), MONTH(A2:A), 1), "")))}`);
  // V — Clé client (téléphone, sinon nom) — colonne masquée
  sh.getRange('V1').setFormula(`={${s(h[4])}; ARRAYFORMULA(IF(D2:D<>"", TRIM(D2:D), TRIM(C2:C)))}`);

  styleHeader_(sh.getRange('R1:V1'), true);
  sh.getRange('R1').setNote(t.notes.auto);
  sh.getRange('P1').setNote(t.notes.shippingCost);
  sh.getRange('M1').setNote(t.notes.status);
  sh.getRange('G1').setNote(t.notes.product);
  sh.getRange('R1:V').protect().setWarningOnly(true).setDescription('Automatic columns');

  sh.getRange('A2:A').setNumberFormat(t.dateFormat);
  sh.getRange('B2:B').setNumberFormat('@');
  sh.getRange('D2:D').setNumberFormat('@');
  sh.getRange('O2:O').setNumberFormat('@');
  sh.getRange('H2:H').setNumberFormat('0');
  sh.getRange('I2:J').setNumberFormat(MONEY);
  sh.getRange('P2:P').setNumberFormat(MONEY);
  sh.getRange('R2:S').setNumberFormat(MONEY);
  sh.getRange('T2:T').setNumberFormat('0%');
  sh.getRange('U2:U').setNumberFormat('mmm yyyy');

  const ss = sh.getParent();
  const list = (name, strict) => SpreadsheetApp.newDataValidation()
    .requireValueInRange(ss.getRangeByName(name), true).setAllowInvalid(!strict).build();
  sh.getRange('A2:A').setDataValidation(SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(false).build());
  sh.getRange('G2:G').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInRange(productsSheet.getRange('B2:B'), true).setAllowInvalid(true).build());
  sh.getRange('H2:H').setDataValidation(SpreadsheetApp.newDataValidation().requireNumberGreaterThan(0).setAllowInvalid(false).build());
  const nonNeg = SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false).build();
  sh.getRange('I2:J').setDataValidation(nonNeg);
  sh.getRange('P2:P').setDataValidation(nonNeg);
  sh.getRange('K2:K').setDataValidation(list('MK_LIST_CHANNEL', false));
  sh.getRange('L2:L').setDataValidation(list('MK_LIST_PAYMENT', false));
  sh.getRange('M2:M').setDataValidation(list('MK_LIST_STATUS', true));
  sh.getRange('N2:N').setDataValidation(list('MK_LIST_CARRIER', false));

  // Couleur de ligne selon le statut (les libellés viennent de Paramètres!B8:B13)
  const tints = ['#EFF6FF', '#F5F3FF', '#FFFBEB', '#F0FDF4', '#FEF2F2', '#F1F5F9'];
  const rules = [
    rule_(sh.getRange('S2:S')).whenNumberLessThan(0).setFontColor(C.loss).setBold(true).build(),
    rule_(sh.getRange('S2:S')).whenNumberGreaterThan(0).setFontColor(C.profit).setBold(true).build(),
  ];
  tints.forEach((bg, i) => {
    const b = rule_(sh.getRange('A2:Q'))
      .whenFormulaSatisfied(`=$M2=INDIRECT("${N.settings}!$B$${8 + i}")`).setBackground(bg);
    if (i === 5) b.setFontColor('#94A3B8').setStrikethrough(true);
    rules.push(b.build());
  });
  sh.setConditionalFormatRules(rules);

  sh.setFrozenRows(1);
  sh.setRowHeight(1, 40);
  const widths = [95, 90, 150, 130, 110, 90, 170, 55, 90, 95, 130, 150, 110, 120, 120, 120, 180, 95, 95, 70, 90, 100];
  widths.forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.hideColumns(22);

  if (WITH_SAMPLE_DATA) {
    const customers = v.customers || t.sampleCustomers;
    const products = t.sampleProducts;
    const today = new Date();
    const rows = SAMPLE_ORDERS.map((o, i) => {
      const [daysAgo, ci, pi, qty, ch, pay, st, car, shipIn] = o;
      const c = customers[ci];
      const d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - daysAgo);
      return [d, `#${1001 + i}`, c[0], c[1], c[2], c[3], products[pi][1], qty, products[pi][5] * v.money, shipIn,
        t.channels[ch][0], t.payments[pay][0], t.statuses[st], v.carriers[car][0],
        st >= 2 ? `TRK${100000 + i * 7919}` : '', '', ''];
    });
    sh.getRange(2, 1, rows.length, 17).setValues(rows);
  }
}

// ---- Clients (100 % automatique) -----------------------------------------

function buildCustomers_(sh, t, N) {
  const O = N.orders;
  const h = t.customers;
  const agg = (i, body) => sh.getRange(1, i + 1).setFormula(`={${s(h[i])}; MAP(A2:A, LAMBDA(k_id, IF(k_id="", , ${body})))}`);

  sh.getRange('A1').setFormula(`={${s(h[0])}; IFERROR(UNIQUE(FILTER(${O}!V2:V, ${O}!V2:V<>"")), "")}`);
  agg(1, `XLOOKUP(k_id, ${O}!V2:V, ${O}!C2:C, "", 0, -1)`);
  agg(2, `XLOOKUP(k_id, ${O}!V2:V, ${O}!E2:E, "", 0, -1)`);
  agg(3, `XLOOKUP(k_id, ${O}!V2:V, ${O}!F2:F, "", 0, -1)`);
  agg(4, `COUNTIF(${O}!V2:V, k_id)`);
  agg(5, `COUNTIFS(${O}!V2:V, k_id, ${O}!M2:M, MK_ST_DELIVERED)`);
  agg(6, `COUNTIFS(${O}!V2:V, k_id, ${O}!M2:M, MK_ST_RETURNED)`);
  sh.getRange('H1').setFormula(`={${s(h[7])}; ARRAYFORMULA(IF(A2:A="", , IFERROR(F2:F/(F2:F + G2:G), "")))}`);
  agg(8, `SUMIFS(${O}!R2:R, ${O}!V2:V, k_id, ${O}!M2:M, MK_ST_DELIVERED)`);
  agg(9, `SUMIFS(${O}!S2:S, ${O}!V2:V, k_id)`);
  agg(10, `MAXIFS(${O}!A2:A, ${O}!V2:V, k_id)`);
  sh.getRange('L1').setFormula(`={${s(h[11])}; ARRAYFORMULA(IF(A2:A="", , IF(G2:G>=2, ${s(t.tags.risky)}, IF(F2:F>=3, ${s(t.tags.loyal)}, ""))))}`);

  styleHeader_(sh.getRange('A1:L1'), true);
  sh.getRange('A1').setNote(t.notes.auto);
  sh.protect().setWarningOnly(true).setDescription('Automatic sheet');

  sh.getRange('A2:A').setNumberFormat('@');
  sh.getRange('H2:H').setNumberFormat('0%');
  sh.getRange('I2:J').setNumberFormat(MONEY);
  sh.getRange('K2:K').setNumberFormat(t.dateFormat);

  sh.setConditionalFormatRules([
    rule_(sh.getRange('L2:L')).whenTextEqualTo(t.tags.risky).setBackground('#FEE2E2').setFontColor(C.loss).setBold(true).build(),
    rule_(sh.getRange('L2:L')).whenTextEqualTo(t.tags.loyal).setBackground('#DCFCE7').setFontColor(C.profit).setBold(true).build(),
    rule_(sh.getRange('H2:H')).whenFormulaSatisfied('=AND($H2<>"", $H2<0.5)').setFontColor(C.loss).setBold(true).build(),
  ]);

  sh.setFrozenRows(1);
  sh.setRowHeight(1, 40);
  const widths = [140, 170, 120, 100, 85, 85, 90, 95, 110, 100, 110, 110];
  widths.forEach((w, i) => sh.setColumnWidth(i + 1, w));
}

// ---- Tableau de bord ------------------------------------------------------

function buildDashboard_(ss, sh, t, N, pack) {
  const O = N.orders;
  const P = N.products;
  const d = t.dash;
  const DR = `${O}!A2:A, ">="&MK_FROM, ${O}!A2:A, "<="&MK_TO`;

  sh.setHiddenGridlines(true);
  sh.getRange('A1:J80').setBackground(C.bg);
  sh.setColumnWidth(1, 24);
  for (let c = 2; c <= 9; c++) sh.setColumnWidth(c, 118);
  sh.setColumnWidth(10, 24);
  for (let c = 11; c <= 13; c++) sh.setColumnWidth(c, 140);

  // Titre
  sh.getRange('B1:I1').merge().setFormula(`="📊 "&MK_BUSINESS&" · ${t.sheets.dashboard.replace(/"/g, '""')}"`)
    .setFontSize(20).setFontWeight('bold');
  sh.setRowHeight(1, 48);
  sh.getRange('B2:I2').merge().setValue(d.subtitle).setFontColor(C.muted);

  // Période
  sh.getRange('B4').setValue(d.from).setFontWeight('bold').setHorizontalAlignment('right');
  sh.getRange('D4').setValue(d.to).setFontWeight('bold').setHorizontalAlignment('right');
  const dateCells = sh.getRangeList(['C4', 'E4']);
  dateCells.setNumberFormat(t.dateFormat).setBackground(C.primarySoft)
    .setBorder(true, true, true, true, false, false, C.primary, SpreadsheetApp.BorderStyle.SOLID);
  dateCells.getRanges().forEach(r => r.setDataValidation(SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(false).build()));
  sh.getRange('F4:I4').merge().setValue(d.periodHint).setFontColor(C.muted).setFontStyle('italic');

  // Aides masquées (colonnes N à P)
  sh.getRange('O1:O4').setValues([['from'], ['to'], ['delivered'], ['returned']]);
  sh.getRange('P1').setFormula('=IF(C4="", DATE(2000, 1, 1), C4)');
  sh.getRange('P2').setFormula('=IF(E4="", DATE(2999, 12, 31), E4)');
  ss.setNamedRange('MK_FROM', sh.getRange('P1'));
  ss.setNamedRange('MK_TO', sh.getRange('P2'));
  sh.getRange('P3').setFormula(`=COUNTIFS(${O}!M2:M, MK_ST_DELIVERED, ${DR})`);
  sh.getRange('P4').setFormula(`=COUNTIFS(${O}!M2:M, MK_ST_RETURNED, ${DR})`);

  // Indicateurs
  tile_(sh, 6, 2, d.revenue, true, `=SUMIFS(${O}!R2:R, ${O}!M2:M, MK_ST_DELIVERED, ${DR})`, MONEY);
  tile_(sh, 6, 4, d.profit, true, `=SUMIFS(${O}!S2:S, ${DR})`, MONEY);
  tile_(sh, 6, 6, d.margin, false, '=IFERROR(D7/B7, 0)', PCT);
  tile_(sh, 6, 8, d.orders, false, `=COUNTIFS(${O}!G2:G, "<>", ${DR})`, '0');
  tile_(sh, 9, 2, d.deliveryRate, false, '=IFERROR(P3/(P3 + P4), 0)', PCT);
  tile_(sh, 9, 4, d.returnRate, false, '=IFERROR(P4/(P3 + P4), 0)', PCT);
  tile_(sh, 9, 6, d.aov, true, '=IFERROR(B7/P3, 0)', MONEY);
  tile_(sh, 9, 8, d.transit, true, `=SUMIFS(${O}!R2:R, ${O}!M2:M, MK_ST_SHIPPED)`, MONEY);
  tile_(sh, 12, 2, d.stockValue, true, `=SUM(${P}!M2:M)`, MONEY);
  tile_(sh, 12, 4, d.alerts, false, `=COUNTIF(${P}!L2:L, ${s(t.stock.low)}) + COUNTIF(${P}!L2:L, ${s(t.stock.out)})`, '0');
  tile_(sh, 12, 6, d.bestChannel, false, '=IFERROR(IF(MAX(L19:L38)<=0, "—", INDEX(SORT(K19:L38, 2, FALSE), 1, 1)), "—")', '@');
  tile_(sh, 12, 8, d.bestProduct, false, '=IFERROR(IF(MAX(L51:L55)<=0, "—", K51), "—")', '@');
  sh.getRangeList(['F13:G13', 'H13:I13']).setFontSize(13);

  const dashRules = [
    rule_(sh.getRange('D7')).whenNumberLessThan(0).setFontColor(C.loss).build(),
    rule_(sh.getRange('D7')).whenNumberGreaterThan(0).setFontColor(C.profit).build(),
    rule_(sh.getRange('D10')).whenNumberGreaterThan(0.2).setFontColor(C.loss).build(),
    rule_(sh.getRange('D13')).whenNumberGreaterThan(0).setFontColor(C.warn).build(),
  ];

  // Seller Pack : pub, trésorerie, contenu
  if (pack) {
    const k = t.pack.dash;
    const A = N.ads, CO = N.content, CA = N.cash;
    const range = (sheet) => `${sheet}!A2:A, ">="&MK_FROM, ${sheet}!A2:A, "<="&MK_TO`;
    tile_(sh, 15, 2, k.adSpend, true, `=SUMIFS(${A}!E2:E, ${range(A)})`, MONEY);
    tile_(sh, 15, 4, k.roas, false, `=IFERROR(SUMIFS(${A}!H2:H, ${range(A)})/B16, 0)`, '0.00"x"');
    tile_(sh, 15, 6, k.afterAds, true, '=D7 - B16', MONEY);
    tile_(sh, 15, 8, k.cpa, true, `=IFERROR(B16/SUMIFS(${A}!F2:F, ${range(A)}), 0)`, MONEY);
    tile_(sh, 18, 2, k.cashBalance, true, `=SUM(${CA}!H2:H)`, MONEY);
    tile_(sh, 18, 4, k.cashNet, true, `=SUMIFS(${CA}!H2:H, ${range(CA)})`, MONEY);
    tile_(sh, 18, 6, k.posts, false, `=COUNTIFS(${CO}!F2:F, ${s(t.pack.contentStatuses[5])}, ${range(CO)})`, '0');
    tile_(sh, 18, 8, k.views, false, `=SUMIFS(${CO}!H2:H, ${range(CO)})`, '#,##0');
    ['F16', 'B19', 'D19'].forEach(a => {
      dashRules.push(rule_(sh.getRange(a)).whenNumberLessThan(0).setFontColor(C.loss).build());
      dashRules.push(rule_(sh.getRange(a)).whenNumberGreaterThan(0).setFontColor(C.profit).build());
    });
  }
  sh.setConditionalFormatRules(dashRules);

  // Données des graphiques (colonnes K à M, N masquée)
  sh.getRange('K2').setValue(d.data).setFontColor(C.muted).setFontWeight('bold');
  sh.getRange('K3:M3').setValues([[d.month, d.revenue, d.profit]]);
  sh.getRange('N4').setFormula('=ARRAYFORMULA(DATE(YEAR(TODAY()), MONTH(TODAY()) + SEQUENCE(12, 1, -11, 1), 1))');
  sh.getRange('K4').setFormula('=ARRAYFORMULA(TEXT(N4:N15, "mmm yy"))');
  sh.getRange('L4').setFormula(`=MAP(N4:N15, LAMBDA(k_m, SUMIFS(${O}!R2:R, ${O}!U2:U, k_m, ${O}!M2:M, MK_ST_DELIVERED)))`);
  sh.getRange('M4').setFormula(`=MAP(N4:N15, LAMBDA(k_m, SUMIFS(${O}!S2:S, ${O}!U2:U, k_m)))`);

  sh.getRange('K18:M18').setValues([[d.channel, d.revenue, d.count]]);
  sh.getRange('K19').setFormula('=IFERROR(FILTER(MK_LIST_CHANNEL, MK_LIST_CHANNEL<>""), "")');
  sh.getRange('L19').setFormula(`=MAP(K19:K38, LAMBDA(k_c, IF(k_c="", , SUMIFS(${O}!R2:R, ${O}!K2:K, k_c, ${O}!M2:M, MK_ST_DELIVERED, ${DR}))))`);
  sh.getRange('M19').setFormula(`=MAP(K19:K38, LAMBDA(k_c, IF(k_c="", , COUNTIFS(${O}!K2:K, k_c, ${DR}))))`);

  sh.getRange('K41:L41').setValues([[d.status, d.count]]);
  sh.getRange('K42').setFormula('=ARRAYFORMULA(MK_LIST_STATUS)');
  sh.getRange('L42').setFormula(`=MAP(K42:K47, LAMBDA(k_s, COUNTIFS(${O}!M2:M, k_s, ${DR})))`);

  sh.getRange('K50:L50').setValues([[d.product, d.profit]]);
  sh.getRange('K51').setFormula(`=IFERROR(LET(v_p, FILTER(${P}!B2:B, ${P}!B2:B<>""), v_r, MAP(v_p, LAMBDA(k_x, SUMIFS(${O}!S2:S, ${O}!G2:G, k_x, ${DR}))), SORTN(HSTACK(v_p, v_r), 5, 0, 2, FALSE)), "")`);

  sh.getRangeList(['K3:M3', 'K18:M18', 'K41:L41', 'K50:L50']).setFontWeight('bold').setBackground(C.border);
  sh.getRangeList(['L4:M15', 'L19:L38', 'L51:L55']).setNumberFormat(MONEY);
  sh.getRange('N4:N15').setNumberFormat('yyyy-mm-dd');
  sh.hideColumns(14, 3);

  // Graphiques
  const W = 450;
  const H = 290;
  const r1 = pack ? 22 : 16;
  const r2 = r1 + 16;
  chart_(sh, Charts.ChartType.COLUMN, 'K3:M15', r1, 2, d.chartMonthly, W, H, { colors: [C.ink, '#84CC16'] });
  chart_(sh, Charts.ChartType.PIE, 'K41:L47', r1, 6, d.chartStatus, W, H,
    { pieHole: 0.5, colors: ['#3B82F6', '#8B5CF6', '#F59E0B', '#16A34A', '#DC2626', '#94A3B8'] });
  chart_(sh, Charts.ChartType.BAR, 'K18:L38', r2, 2, d.chartChannel, W, H, { colors: [C.ink], legend: { position: 'none' } });
  chart_(sh, Charts.ChartType.BAR, 'K50:L55', r2, 6, d.chartTop, W, H, { colors: ['#84CC16'], legend: { position: 'none' } });
}

// ---- Seller Pack : Publicité / ROAS ----------------------------------------

function buildAds_(sh, t, v, N, productsSheet) {
  const k = t.pack;
  const O = N.orders;
  const P = N.products;
  const h = k.adsCalc;
  styleHeader_(sh.getRange(1, 1, 1, 7).setValues([k.ads]), false);

  sh.getRange('H1').setFormula(`={${s(h[0])}; MAP(D2:D, E2:E, F2:F, G2:G, LAMBDA(p_prod, p_sp, p_ord, p_rev, IF(p_sp="", , IF(p_rev<>"", p_rev, p_ord*IFERROR(VLOOKUP(p_prod, ${P}!B2:F, 5, FALSE), 0)))))}`);
  sh.getRange('I1').setFormula(`={${s(h[1])}; ARRAYFORMULA(IF(E2:E="", , IFERROR(E2:E/F2:F, "")))}`);
  sh.getRange('J1').setFormula(`={${s(h[2])}; ARRAYFORMULA(IF(E2:E="", , IFERROR(H2:H/E2:E, "")))}`);
  // Bénéfice réel moyen par commande (livrées + retournées) tiré de l'historique ; sinon estimation depuis Produits
  sh.getRange('K1').setFormula(`={${s(h[3])}; MAP(D2:D, E2:E, LAMBDA(p_prod, p_sp, IF(p_sp="", , ` +
    `LET(v_n, COUNTIFS(${O}!G2:G, p_prod, ${O}!M2:M, MK_ST_DELIVERED) + COUNTIFS(${O}!G2:G, p_prod, ${O}!M2:M, MK_ST_RETURNED), ` +
    `IF(v_n>0, SUMIFS(${O}!S2:S, ${O}!G2:G, p_prod)/v_n, ` +
    `IFERROR(VLOOKUP(p_prod, ${P}!B2:F, 5, FALSE) - VLOOKUP(p_prod, ${P}!B2:F, 3, FALSE) - VLOOKUP(p_prod, ${P}!B2:F, 4, FALSE) - IFERROR(INDEX(MK_CARRIERS, 1, 2), 0), ""))))))}`);
  sh.getRange('L1').setFormula(`={${s(h[4])}; ARRAYFORMULA(IF(E2:E="", , IFERROR(F2:F*K2:K - E2:E, "")))}`);
  sh.getRange('M1').setFormula(`={${s(h[5])}; ARRAYFORMULA(IF(ISNUMBER(L2:L), IF(L2:L>0, ${s(k.verdict.win)}, ${s(k.verdict.lose)}), ""))}`);
  sh.getRange('N1').setFormula(`={${s(h[6])}; ARRAYFORMULA(IF(A2:A="", , IFERROR(DATE(YEAR(A2:A), MONTH(A2:A), 1), "")))}`);

  styleHeader_(sh.getRange('H1:N1'), true);
  sh.getRange('G1').setNote(k.adsNotes.revenue);
  sh.getRange('K1').setNote(k.adsNotes.profit);
  sh.getRange('L1').setNote(k.adsNotes.real);
  sh.getRange('H1:N').protect().setWarningOnly(true).setDescription('Automatic columns');

  sh.getRange('A2:A').setNumberFormat(t.dateFormat);
  sh.getRange('E2:E').setNumberFormat(MONEY);
  sh.getRange('F2:F').setNumberFormat('0');
  sh.getRange('G2:I').setNumberFormat(MONEY);
  sh.getRange('J2:J').setNumberFormat('0.00"x"');
  sh.getRange('K2:L').setNumberFormat(MONEY);
  sh.getRange('N2:N').setNumberFormat('mmm yyyy');

  const ss = sh.getParent();
  const nonNeg = SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false).build();
  sh.getRange('A2:A').setDataValidation(SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(false).build());
  sh.getRange('B2:B').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInRange(ss.getRangeByName('MK_LIST_ADPLAT'), true).setAllowInvalid(true).build());
  sh.getRange('D2:D').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInRange(productsSheet.getRange('B2:B'), true).setAllowInvalid(true).build());
  sh.getRange('E2:G').setDataValidation(nonNeg);

  sh.setConditionalFormatRules([
    rule_(sh.getRange('L2:L')).whenNumberLessThan(0).setFontColor(C.loss).setBold(true).build(),
    rule_(sh.getRange('L2:L')).whenNumberGreaterThan(0).setFontColor(C.profit).setBold(true).build(),
    rule_(sh.getRange('M2:M')).whenTextEqualTo(k.verdict.win).setBackground('#DCFCE7').setFontColor(C.profit).build(),
    rule_(sh.getRange('M2:M')).whenTextEqualTo(k.verdict.lose).setBackground('#FEE2E2').setFontColor(C.loss).build(),
  ]);

  sh.setFrozenRows(1);
  sh.setRowHeight(1, 40);
  [95, 120, 180, 170, 100, 110, 110, 100, 100, 70, 120, 110, 140, 90].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.hideColumns(14);

  if (WITH_SAMPLE_DATA) {
    const today = new Date();
    const rows = k.sampleAds.map(a => [daysAgo_(today, a[0]), k.adPlatforms[a[1]], a[2], t.sampleProducts[a[3]][1], a[4] * v.money, a[5], '']);
    sh.getRange(2, 1, rows.length, 7).setValues(rows);
  }
}

// ---- Seller Pack : Planning de contenu ------------------------------------

function buildContent_(sh, t, v, productsSheet) {
  const k = t.pack;
  const h = k.contentCalc;
  styleHeader_(sh.getRange(1, 1, 1, 14).setValues([k.content]), false);

  sh.getRange('O1').setFormula(`={${s(h[0])}; ARRAYFORMULA(IF(H2:H="", , IFERROR((I2:I + J2:J + K2:K + L2:L)/H2:H, "")))}`);
  sh.getRange('P1').setFormula(`={${s(h[1])}; ARRAYFORMULA(IF(A2:A="", , TEXT(A2:A, "ddd")))}`);
  styleHeader_(sh.getRange('O1:P1'), true);
  sh.getRange('O1').setNote(k.contentNote);
  sh.getRange('O1:P').protect().setWarningOnly(true).setDescription('Automatic columns');

  sh.getRange('A2:A').setNumberFormat(t.dateFormat);
  sh.getRange('H2:N').setNumberFormat('#,##0');
  sh.getRange('O2:O').setNumberFormat(PCT);
  sh.getRange('D2:D').setWrap(true);

  const ss = sh.getParent();
  sh.getRange('A2:A').setDataValidation(SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(false).build());
  sh.getRange('B2:B').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInRange(ss.getRangeByName('MK_LIST_CONTENTPLAT'), true).setAllowInvalid(true).build());
  sh.getRange('C2:C').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(k.formats, true).setAllowInvalid(true).build());
  sh.getRange('E2:E').setDataValidation(SpreadsheetApp.newDataValidation()
    .requireValueInRange(productsSheet.getRange('B2:B'), true).setAllowInvalid(true).build());
  sh.getRange('F2:F').setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(k.contentStatuses, true).setAllowInvalid(false).build());
  sh.getRange('H2:N').setDataValidation(SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false).build());

  const st = k.contentStatuses;
  sh.setConditionalFormatRules([
    rule_(sh.getRange('A2:N')).whenFormulaSatisfied('=AND($A2<>"", $A2=TODAY())').setBackground(C.primarySoft).setBold(true).build(),
    rule_(sh.getRange('F2:F')).whenTextEqualTo(st[5]).setBackground('#DCFCE7').setFontColor(C.profit).build(),
    rule_(sh.getRange('F2:F')).whenTextEqualTo(st[4]).setBackground('#DBEAFE').setFontColor('#1D4ED8').build(),
    rule_(sh.getRange('F2:F')).whenTextEqualTo(st[0]).setBackground('#F1F5F9').setFontColor(C.muted).build(),
    rule_(sh.getRange('F2:F')).whenFormulaSatisfied(`=OR($F2=${s(st[1])}, $F2=${s(st[2])}, $F2=${s(st[3])})`).setBackground('#FEF3C7').setFontColor(C.warn).build(),
    SpreadsheetApp.newConditionalFormatRule().setRanges([sh.getRange('H2:H')])
      .setGradientMinpoint('#FFFFFF').setGradientMaxpoint('#BEF264').build(),
  ]);

  sh.setFrozenRows(1);
  sh.setRowHeight(1, 40);
  [95, 130, 95, 320, 150, 100, 140, 80, 70, 90, 80, 110, 90, 90, 95, 60].forEach((w, i) => sh.setColumnWidth(i + 1, w));

  if (WITH_SAMPLE_DATA) {
    const price = v.currency === '$' ? '$25' : `${25 * v.money} ${v.currency}`;
    const today = new Date();
    const rows = k.sampleContent.map(c => {
      const metrics = c.length > 6 ? c.slice(6) : ['', '', '', '', '', '', ''];
      return [daysAgo_(today, c[0]), k.contentPlatforms[c[1]], k.formats[c[2]], c[3].replace('{P}', price),
        c[4] >= 0 ? t.sampleProducts[c[4]][1] : '', st[c[5]], ''].concat(metrics);
    });
    sh.getRange(2, 1, rows.length, 14).setValues(rows);
  }
}

// ---- Seller Pack : Trésorerie (journal des mouvements) --------------------

function buildCash_(sh, t, v) {
  const k = t.pack;
  const h = k.cashCalc;
  styleHeader_(sh.getRange(1, 1, 1, 7).setValues([k.cash]), false);

  sh.getRange('H1').setFormula(`={${s(h[0])}; ARRAYFORMULA(IF(E2:E="", , IF(B2:B=${s(k.types[0])}, E2:E, -E2:E)))}`);
  sh.getRange('I1').setFormula(`={${s(h[1])}; ARRAYFORMULA(IF(A2:A="", , IFERROR(DATE(YEAR(A2:A), MONTH(A2:A), 1), "")))}`);
  sh.getRange('J1').setFormula(`={${s(h[2])}; MAP(E2:E, SCAN(0, H2:H, LAMBDA(v_acc, v_x, v_acc + N(v_x))), LAMBDA(p_amt, p_bal, IF(p_amt="", , p_bal)))}`);
  styleHeader_(sh.getRange('H1:J1'), true);
  sh.getRange('E1').setNote(k.cashNote);
  sh.getRange('H1:J').protect().setWarningOnly(true).setDescription('Automatic columns');

  sh.getRange('A2:A').setNumberFormat(t.dateFormat);
  sh.getRange('E2:E').setNumberFormat(MONEY);
  sh.getRange('H2:H').setNumberFormat(MONEY);
  sh.getRange('I2:I').setNumberFormat('mmm yyyy');
  sh.getRange('J2:J').setNumberFormat(MONEY);

  const ss = sh.getParent();
  const list = (values, strict) => SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(!strict).build();
  const named = (name) => SpreadsheetApp.newDataValidation().requireValueInRange(ss.getRangeByName(name), true).setAllowInvalid(true).build();
  sh.getRange('A2:A').setDataValidation(SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(false).build());
  sh.getRange('B2:B').setDataValidation(list(k.types, true));
  sh.getRange('C2:C').setDataValidation(named('MK_LIST_CATEGORY'));
  sh.getRange('E2:E').setDataValidation(SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false).build());
  sh.getRange('F2:F').setDataValidation(named('MK_LIST_ACCOUNT'));
  sh.getRange('G2:G').setDataValidation(list(k.scope, true));

  sh.setConditionalFormatRules([
    rule_(sh.getRange('H2:H')).whenNumberLessThan(0).setFontColor(C.loss).build(),
    rule_(sh.getRange('H2:H')).whenNumberGreaterThan(0).setFontColor(C.profit).build(),
    rule_(sh.getRange('J2:J')).whenNumberLessThan(0).setFontColor(C.loss).setBold(true).build(),
  ]);

  sh.setFrozenRows(1);
  sh.setRowHeight(1, 40);
  [95, 90, 180, 260, 100, 140, 100, 110, 90, 110].forEach((w, i) => sh.setColumnWidth(i + 1, w));
  sh.hideColumns(9);

  if (WITH_SAMPLE_DATA) {
    const today = new Date();
    const rows = k.sampleCash.map(c => [daysAgo_(today, c[0]), k.types[c[1]], k.categories[c[2]][0], c[3], c[4] * v.money, k.accounts[c[5]], k.scope[c[6]]]);
    sh.getRange(2, 1, rows.length, 7).setValues(rows);
  }
}

// ---- Seller Pack : Budget (100 % automatique sauf le mois) -----------------

function buildBudget_(ss, sh, t, N) {
  const k = t.pack;
  const b = k.budget;
  const CA = N.cash;
  const INC = s(k.types[0]);
  const EXP = s(k.types[1]);

  sh.setHiddenGridlines(true);
  sh.getRange('A1:E1').merge().setValue(b.title).setFontSize(18).setFontWeight('bold');
  sh.setRowHeight(1, 44);

  sh.getRange('A3').setValue(b.month).setFontWeight('bold');
  sh.getRange('B3').setNumberFormat('mmmm yyyy').setBackground(C.primarySoft)
    .setBorder(true, true, true, true, false, false, C.primary, SpreadsheetApp.BorderStyle.SOLID)
    .setDataValidation(SpreadsheetApp.newDataValidation().requireDate().setAllowInvalid(false).build());
  sh.getRange('C3:E3').merge().setValue(b.monthHint).setFontColor(C.muted).setFontStyle('italic');
  sh.getRange('J1').setFormula('=IF(B3="", DATE(YEAR(TODAY()), MONTH(TODAY()), 1), DATE(YEAR(B3), MONTH(B3), 1))');
  ss.setNamedRange('MK_BMONTH', sh.getRange('J1'));

  const inMonth = `${CA}!I2:I, MK_BMONTH`;
  sh.getRange('A5:A10').setValues(b.kpis.map(x => [x])).setFontColor(C.muted);
  sh.getRange('B5:B10').setFormulas([
    [`=SUMIFS(${CA}!E2:E, ${CA}!B2:B, ${INC}, ${inMonth})`],
    [`=SUMIFS(${CA}!E2:E, ${CA}!B2:B, ${EXP}, ${inMonth})`],
    ['=B5 - B6'],
    [`=SUM(${CA}!H2:H)`],
    [`=SUMIFS(${CA}!E2:E, ${CA}!B2:B, ${EXP}, ${inMonth}, ${CA}!G2:G, ${s(k.scope[0])})`],
    [`=SUMIFS(${CA}!E2:E, ${CA}!B2:B, ${EXP}, ${inMonth}, ${CA}!G2:G, ${s(k.scope[1])})`],
  ]).setNumberFormat(MONEY).setFontWeight('bold').setFontSize(12);
  sh.getRange('A5:B10').setBorder(true, true, true, true, false, true, C.border, SpreadsheetApp.BorderStyle.SOLID).setBackground('#FFFFFF');

  styleHeader_(sh.getRange('A12:E12').setValues([b.table]), true);
  sh.getRange('A13').setFormula('=IFERROR(FILTER(MK_CATEGORIES, INDEX(MK_CATEGORIES, 0, 1)<>""), "")');
  sh.getRange('C13').setFormula(`=MAP(A13:A42, LAMBDA(k_c, IF(k_c="", , SUMIFS(${CA}!E2:E, ${CA}!C2:C, k_c, ${CA}!B2:B, ${EXP}, ${inMonth}))))`);
  sh.getRange('D13').setFormula('=ARRAYFORMULA(IF(A13:A42="", , IF(B13:B42>0, B13:B42 - C13:C42, "")))');
  sh.getRange('E13').setFormula('=ARRAYFORMULA(IF(A13:A42="", , IF(B13:B42>0, C13:C42/B13:B42, "")))');
  sh.getRange('B13:D42').setNumberFormat(MONEY);
  sh.getRange('E13:E42').setNumberFormat('0%');

  styleHeader_(sh.getRange('A45:D45').setValues([b.history]), true);
  sh.getRange('J46').setFormula('=ARRAYFORMULA(DATE(YEAR(MK_BMONTH), MONTH(MK_BMONTH) + SEQUENCE(6, 1, -5, 1), 1))');
  sh.getRange('A46').setFormula('=ARRAYFORMULA(TEXT(J46:J51, "mmm yy"))');
  sh.getRange('B46').setFormula(`=MAP(J46:J51, LAMBDA(k_m, SUMIFS(${CA}!E2:E, ${CA}!B2:B, ${INC}, ${CA}!I2:I, k_m)))`);
  sh.getRange('C46').setFormula(`=MAP(J46:J51, LAMBDA(k_m, SUMIFS(${CA}!E2:E, ${CA}!B2:B, ${EXP}, ${CA}!I2:I, k_m)))`);
  sh.getRange('D46').setFormula('=ARRAYFORMULA(B46:B51 - C46:C51)');
  sh.getRange('B46:D51').setNumberFormat(MONEY);
  sh.hideColumns(10);

  sh.setConditionalFormatRules([
    rule_(sh.getRange('B7')).whenNumberLessThan(0).setFontColor(C.loss).build(),
    rule_(sh.getRange('B7')).whenNumberGreaterThan(0).setFontColor(C.profit).build(),
    rule_(sh.getRange('E13:E42')).whenNumberGreaterThan(1).setBackground('#FEE2E2').setFontColor(C.loss).setBold(true).build(),
    rule_(sh.getRange('E13:E42')).whenNumberGreaterThan(0.8).setBackground('#FEF3C7').setFontColor(C.warn).build(),
    rule_(sh.getRange('D13:D42')).whenNumberLessThan(0).setFontColor(C.loss).setBold(true).build(),
    rule_(sh.getRange('D46:D51')).whenNumberLessThan(0).setFontColor(C.loss).build(),
    rule_(sh.getRange('D46:D51')).whenNumberGreaterThan(0).setFontColor(C.profit).build(),
  ]);
  sh.getRange('A5:E60').protect().setWarningOnly(true).setDescription('Automatic');

  sh.setColumnWidth(1, 240);
  for (let c = 2; c <= 5; c++) sh.setColumnWidth(c, 130);

  chart_(sh, Charts.ChartType.COLUMN, 'A45:C51', 53, 1, b.chart, 560, 280, { colors: [C.profit, C.loss] });
}

// ---- Seller Pack : Calculateur de prix ------------------------------------

function buildPricing_(sh, t, v) {
  const p = t.pack.pricing;
  sh.setHiddenGridlines(true);
  sh.getRange('A1:E1').merge().setValue(p.title).setFontSize(18).setFontWeight('bold');
  sh.setRowHeight(1, 44);
  sh.getRange('A2:C2').merge().setValue(p.subtitle).setFontColor(C.muted);
  sh.getRange('D2:E2').merge().setFormula(`=${s(p.currencyLabel)}&" "&MK_CURRENCY`).setFontColor(C.muted).setHorizontalAlignment('right');

  styleHeader_(sh.getRange('A3:B3').merge().setValue(p.inputsHeader), false);
  styleHeader_(sh.getRange('D3:E3').merge().setValue(p.outputsHeader), true);

  const values = PRICING_DEFAULTS.map((x, i) => [PRICING_MONEY_ROWS.indexOf(i) >= 0 ? x * v.money : x]);
  sh.getRange('A4:A15').setValues(p.inputs.map(x => [x]));
  sh.getRange('B4:B15').setValues(values).setBackground(C.primarySoft).setFontWeight('bold')
    .setBorder(true, true, true, true, false, true, C.primary, SpreadsheetApp.BorderStyle.SOLID);
  PRICING_MONEY_ROWS.forEach(i => sh.getRange(4 + i, 2).setNumberFormat(MONEY)
    .setDataValidation(SpreadsheetApp.newDataValidation().requireNumberGreaterThanOrEqualTo(0).setAllowInvalid(false).build()));
  PRICING_PCT_ROWS.forEach(i => sh.getRange(4 + i, 2).setNumberFormat(PCT)
    .setDataValidation(SpreadsheetApp.newDataValidation().requireNumberBetween(i === 9 ? 0.01 : 0, 1).setAllowInvalid(false).setHelpText('0% – 100%').build()));
  sh.getRange('B12').setNote(p.notes.ads);
  sh.getRange('B13').setNote(p.notes.delivery);

  // K = coûts fixes par colis expédié ; NET = part du prix qui reste après frais en % ; BASE = coûts par commande livrée hors frais %
  const K = '(B6 + B7 + (1 - B13)*B8 + B12)';
  const NET = '(1 - B9 - B11)';
  const BASE = `(B10 + B5 + ${K}/B13)`;
  sh.getRange('D4:D13').setValues(p.outputs.map(x => [x]));
  sh.getRange('E4:E13').setFormulas([
    [`=IFERROR(B4*${NET} - ${BASE}, "—")`],
    ['=IFERROR(E4/B4, "—")'],
    ['=IFERROR(B4 - E4, "—")'],
    [`=IFERROR(${BASE}/${NET}, "—")`],
    [`=IFERROR(IF(${NET} - 0.3<=0, "—", ${BASE}/(${NET} - 0.3)), "—")`],
    [`=IFERROR(IF(${NET} - 0.5<=0, "—", ${BASE}/(${NET} - 0.5)), "—")`],
    [`=IFERROR(IF(${NET} - B14<=0, "—", ${BASE}/(${NET} - B14)), "—")`],
    [`=IFERROR(B13*(B4*${NET} - B10 - B5) - B6 - B7 - (1 - B13)*B8, "—")`],
    ['=IFERROR(IF(E11<=0, "—", B4/E11), "—")'],
    ['=IFERROR(IF(E11<=0, "—", ROUNDUP(B15/E11, 0)), "—")'],
  ]).setFontWeight('bold').setHorizontalAlignment('right');
  sh.getRange('E4:E13').setNumberFormat(MONEY);
  sh.getRange('E5').setNumberFormat(PCT);
  sh.getRange('E12').setNumberFormat('0.00"x"').setNote(p.notes.roas);
  sh.getRange('E13').setNumberFormat('0');
  sh.getRange('D4:E4').setFontSize(14);
  sh.getRange('D4:E13').setBackground('#FFFFFF')
    .setBorder(true, true, true, true, false, true, C.border, SpreadsheetApp.BorderStyle.SOLID);

  sh.getRange('A17:E17').merge().setFormula(`=IF(NOT(ISNUMBER(E4)), "", IF(E4<0, ${s(p.status.loss)}, IF(E5<0.2, ${s(p.status.thin)}, ${s(p.status.ok)})))`)
    .setFontWeight('bold').setFontSize(12).setWrap(true);
  sh.setRowHeight(17, 36);

  sh.getRange('A19').setValue(p.scenariosTitle).setFontWeight('bold').setFontSize(12);
  styleHeader_(sh.getRange('A20:C20').setValues([p.scenarios]), true);
  sh.getRange('A21').setFormula('=ARRAYFORMULA(ROUND(B4*{0.8; 0.9; 1; 1.1; 1.2; 1.3; 1.5}, 2))');
  sh.getRange('B21').setFormula(`=ARRAYFORMULA(IFERROR(A21:A27*${NET} - ${BASE}, ""))`);
  sh.getRange('C21').setFormula('=ARRAYFORMULA(IFERROR(B21:B27/A21:A27, ""))');
  sh.getRange('A21:B27').setNumberFormat(MONEY);
  sh.getRange('C21:C27').setNumberFormat(PCT);
  sh.getRange('A21:C27').setBorder(true, true, true, true, false, true, C.border, SpreadsheetApp.BorderStyle.SOLID);

  const signRules = (a1) => [
    rule_(sh.getRange(a1)).whenNumberLessThan(0).setFontColor(C.loss).build(),
    rule_(sh.getRange(a1)).whenNumberGreaterThan(0).setFontColor(C.profit).build(),
  ];
  sh.setConditionalFormatRules([
    rule_(sh.getRange('A21:C27')).whenFormulaSatisfied('=$A21=ROUND($B$4, 2)').setBackground(C.primarySoft).setBold(true).build(),
    rule_(sh.getRange('A17')).whenTextStartsWith('❌').setBackground('#FEE2E2').setFontColor(C.loss).build(),
    rule_(sh.getRange('A17')).whenTextStartsWith('⚠️').setBackground('#FEF3C7').setFontColor(C.warn).build(),
    rule_(sh.getRange('A17')).whenTextStartsWith('✅').setBackground('#DCFCE7').setFontColor(C.profit).build(),
  ].concat(signRules('E4'), signRules('E11'), signRules('B21:B27')));
  sh.getRangeList(['D4:E13', 'A21:C27']).getRanges().forEach(r => r.protect().setWarningOnly(true).setDescription('Automatic'));

  sh.setColumnWidth(1, 280);
  sh.setColumnWidth(2, 130);
  sh.setColumnWidth(3, 110);
  sh.setColumnWidth(4, 300);
  sh.setColumnWidth(5, 140);
}

function daysAgo_(today, n) {
  return new Date(today.getFullYear(), today.getMonth(), today.getDate() - n);
}

// ---- Mode d'emploi --------------------------------------------------------

function buildGuide_(sh, t, pack) {
  sh.setHiddenGridlines(true);
  sh.setColumnWidth(1, 24);
  sh.setColumnWidth(2, 190);
  sh.setColumnWidth(3, 720);
  sh.getRange('B1:C1').merge().setValue(pack ? t.pack.guideTitle : t.guideTitle).setFontSize(18).setFontWeight('bold');
  sh.setRowHeight(1, 48);
  // Les étapes du Pack s'insèrent avant les conseils généraux (« On your phone » et suivants)
  const rows = pack ? t.guide.slice(0, 10).concat(t.pack.guide, t.guide.slice(10)) : t.guide;
  sh.getRange(3, 2, rows.length, 2).setValues(rows).setWrap(true).setVerticalAlignment('top');
  sh.getRange(3, 2, rows.length, 1).setFontWeight('bold').setFontColor(C.primaryInk);
  sh.getRange(3, 2, rows.length, 2).setBorder(null, null, true, null, null, true, C.border, SpreadsheetApp.BorderStyle.SOLID);
  sh.getRange(3, 2, 1, 2).setBackground(C.primarySoft);
}

// ---------------------------------------------------------------------------
// Utilitaires
// ---------------------------------------------------------------------------

/** Chaîne littérale pour une formule (guillemets doublés). */
function s(x) { return '"' + String(x).replace(/"/g, '""') + '"'; }

function rule_(range) { return SpreadsheetApp.newConditionalFormatRule().setRanges([range]); }

function styleHeader_(range, auto) {
  return range.setBackground(auto ? C.primary : C.ink).setFontColor(auto ? C.ink : '#FFFFFF')
    .setFontWeight('bold').setWrap(true).setVerticalAlignment('middle');
}

function tile_(sh, row, col, label, withCurrency, formula, format) {
  const lab = sh.getRange(row, col, 1, 2).merge();
  if (withCurrency) lab.setFormula(`=${s(label)}&" ("&MK_CURRENCY&")"`);
  else lab.setValue(label);
  lab.setFontColor(C.muted).setFontSize(10).setBackground('#FFFFFF').setVerticalAlignment('bottom');
  sh.getRange(row + 1, col, 1, 2).merge().setFormula(formula).setNumberFormat(format)
    .setFontSize(20).setFontWeight('bold').setBackground('#FFFFFF').setHorizontalAlignment('left');
  sh.getRange(row, col, 2, 2).setBorder(true, true, true, true, null, null, C.border, SpreadsheetApp.BorderStyle.SOLID);
  sh.setRowHeight(row + 1, 40);
}

function chart_(sh, type, a1, row, col, title, width, height, options) {
  let b = sh.newChart().setChartType(type).addRange(sh.getRange(a1)).setNumHeaders(1)
    .setPosition(row, col, 0, 0)
    .setOption('title', title).setOption('width', width).setOption('height', height)
    .setOption('fontName', FONT).setOption('legend', { position: 'bottom' });
  Object.keys(options || {}).forEach(k => { b = b.setOption(k, options[k]); });
  sh.insertChart(b.build());
}
