/**
 * Margokit — Order & Inventory Tracker (générateur Google Sheets)
 *
 * Utilisation :
 *   1. https://script.google.com → Nouveau projet → coller ce fichier à la place de Code.gs
 *   2. Choisir la fonction buildTrackerEN / buildTrackerFR / buildTrackerMA (ou buildAll) → Exécuter
 *   3. Autoriser l'accès → l'URL du fichier créé s'affiche dans le journal d'exécution
 *
 * Le fichier généré ne contient AUCUN script : il fonctionne uniquement avec des formules
 * (pas d'écran d'autorisation effrayant pour l'acheteur).
 */

const WITH_SAMPLE_DATA = true;

function buildTrackerEN() { buildTracker_('en'); }
function buildTrackerFR() { buildTracker_('fr'); }
function buildTrackerMA() { buildTracker_('ma'); }
function buildAll() { ['en', 'fr', 'ma'].forEach(buildTracker_); }

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
// Construction
// ---------------------------------------------------------------------------

function buildTracker_(variantKey) {
  const v = VARIANTS[variantKey];
  const t = I18N[v.lang];
  const ss = SpreadsheetApp.create(t.file + v.suffix);
  // Les formules sont écrites avec la syntaxe en_US (virgules) : on garde cette locale
  // pendant la construction et on applique la locale finale tout à la fin (Sheets convertit).
  ss.setSpreadsheetLocale('en_US');

  const keys = ['dashboard', 'orders', 'products', 'customers', 'settings', 'guide'];
  const sh = {};
  const N = {};
  keys.forEach((k, i) => {
    sh[k] = i === 0 ? ss.getSheets()[0].setName(t.sheets[k]) : ss.insertSheet(t.sheets[k]);
    sh[k].getRange(1, 1, sh[k].getMaxRows(), sh[k].getMaxColumns()).setFontFamily(FONT).setFontColor(C.ink);
    N[k] = "'" + t.sheets[k].replace(/'/g, "''") + "'";
  });

  buildSettings_(ss, sh.settings, t, v);
  buildProducts_(sh.products, t, v, N);
  buildOrders_(sh.orders, t, v, N, sh.products);
  buildCustomers_(sh.customers, t, N);
  buildDashboard_(ss, sh.dashboard, t, N);
  buildGuide_(sh.guide, t);

  sh.dashboard.setTabColor(C.primary);
  sh.orders.setTabColor(C.ink);
  sh.products.setTabColor(C.ink);
  sh.customers.setTabColor(C.ink);
  sh.settings.setTabColor(C.muted);
  sh.guide.setTabColor(C.muted);
  ss.setActiveSheet(sh.dashboard);

  SpreadsheetApp.flush();
  ss.setSpreadsheetLocale(v.locale);
  SpreadsheetApp.flush();
  Logger.log(`${t.file}${v.suffix} → ${ss.getUrl()}`);
}

// ---- Paramètres -----------------------------------------------------------

function buildSettings_(ss, sh, t, v) {
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

function buildDashboard_(ss, sh, t, N) {
  const O = N.orders;
  const P = N.products;
  const d = t.dash;
  const DR = `${O}!A2:A, ">="&MK_FROM, ${O}!A2:A, "<="&MK_TO`;

  sh.setHiddenGridlines(true);
  sh.getRange('A1:J60').setBackground(C.bg);
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

  sh.setConditionalFormatRules([
    rule_(sh.getRange('D7')).whenNumberLessThan(0).setFontColor(C.loss).build(),
    rule_(sh.getRange('D7')).whenNumberGreaterThan(0).setFontColor(C.profit).build(),
    rule_(sh.getRange('D10')).whenNumberGreaterThan(0.2).setFontColor(C.loss).build(),
    rule_(sh.getRange('D13')).whenNumberGreaterThan(0).setFontColor(C.warn).build(),
  ]);

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
  chart_(sh, Charts.ChartType.COLUMN, 'K3:M15', 16, 2, d.chartMonthly, W, H, { colors: [C.ink, '#84CC16'] });
  chart_(sh, Charts.ChartType.PIE, 'K41:L47', 16, 6, d.chartStatus, W, H,
    { pieHole: 0.5, colors: ['#3B82F6', '#8B5CF6', '#F59E0B', '#16A34A', '#DC2626', '#94A3B8'] });
  chart_(sh, Charts.ChartType.BAR, 'K18:L38', 32, 2, d.chartChannel, W, H, { colors: [C.ink], legend: { position: 'none' } });
  chart_(sh, Charts.ChartType.BAR, 'K50:L55', 32, 6, d.chartTop, W, H, { colors: ['#84CC16'], legend: { position: 'none' } });
}

// ---- Mode d'emploi --------------------------------------------------------

function buildGuide_(sh, t) {
  sh.setHiddenGridlines(true);
  sh.setColumnWidth(1, 24);
  sh.setColumnWidth(2, 190);
  sh.setColumnWidth(3, 720);
  sh.getRange('B1:C1').merge().setValue(t.guideTitle).setFontSize(18).setFontWeight('bold');
  sh.setRowHeight(1, 48);
  const rows = t.guide;
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
