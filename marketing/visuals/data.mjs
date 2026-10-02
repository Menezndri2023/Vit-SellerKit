/**
 * Sample data for the sheet mockups — a JavaScript port of the SAMPLE DATA and the formulas
 * of sheets/tracker/Code.gs, so every number in a mockup is the number the real file shows.
 *
 * Only the logic needed for the visuals is ported (Orders → Profit, Products, Customers,
 * Dashboard tiles and chart data, Ads, Content, Cash, Budget, Price calculator).
 * If the samples or formulas change in Code.gs, update them here too.
 */

// Fixed "today" so renders are reproducible (end of month → the Budget tab has a full month).
export const TODAY = new Date(2026, 8, 30); // 30 Sep 2026

const C = {
  primary: '#A3E635', primarySoft: '#F7FEE7', primaryInk: '#4D7C0F', ink: '#0F172A', muted: '#475569',
  border: '#E2E8F0', bg: '#F8FAFC', profit: '#16A34A', loss: '#DC2626', warn: '#D97706',
};
export const COLORS = C;

const VARIANTS = {
  en: { lang: 'en', currency: '$', money: 1,
    carriers: [['USPS', 6, 6], ['UPS', 9, 9], ['DHL Express', 18, 18], ['Local courier', 5, 3], ['Other', 0, 0]] },
  fr: { lang: 'fr', currency: '€', money: 1,
    carriers: [['Colissimo', 6, 6], ['Mondial Relay', 4, 4], ['Chronopost', 12, 12], ['Livreur local', 5, 3], ['Autre', 0, 0]] },
  ma: { lang: 'fr', currency: 'MAD', money: 10,
    carriers: [['Amana', 35, 20], ['Cathedis', 35, 15], ['Ozon Express', 30, 15], ['Livreur local', 25, 10], ['Autre', 0, 0]],
    customers: [['Salma Bennani', '0612345678', 'Casablanca', 'Maroc'], ['Youssef Alaoui', '0661234567', 'Rabat', 'Maroc'],
      ['Imane Tazi', '0698765432', 'Marrakech', 'Maroc'], ['Omar Chraibi', '0655443322', 'Tanger', 'Maroc'], ['Nadia Berrada', '0677889900', 'Fès', 'Maroc']] },
};

const T = {
  en: {
    file: 'Margokit — Order & Inventory Tracker', packFile: 'Margokit — Seller Pack', shop: 'My shop',
    sheets: { dashboard: 'Dashboard', orders: 'Orders', products: 'Products', customers: 'Customers', settings: 'Settings', guide: 'How to use',
      ads: 'Ads', content: 'Content', cash: 'Cash', budget: 'Budget', pricing: 'Price calculator' },
    orders: ['Date', 'Order #', 'Customer', 'Phone', 'City', 'Country', 'Product', 'Qty', 'Unit price', 'Shipping charged',
      'Channel', 'Payment', 'Status', 'Carrier', 'Tracking #', 'Shipping cost (you pay)', 'Notes'],
    ordersCalc: ['Total', 'Profit', 'Margin', 'Month'],
    products: ['SKU', 'Product', 'Category', 'Unit cost', 'Packaging / unit', 'Sale price', 'Initial stock', 'Restocked (+)', 'Low-stock alert at'],
    productsCalc: ['Sold', 'In stock', 'Stock status', 'Stock value', 'Revenue', 'Profit'],
    stock: { ok: 'OK', low: 'Low', out: 'Out of stock' },
    customers: ['Phone / ID', 'Name', 'City', 'Country', 'Orders', 'Delivered', 'Returned', 'Delivery rate', 'Total spent', 'Profit', 'Last order', 'Tag'],
    tags: { risky: '⚠️ Risky', loyal: '⭐ Loyal' },
    statuses: ['New', 'Confirmed', 'Shipped', 'Delivered', 'Returned', 'Cancelled'],
    channels: [['Instagram', 0, 0], ['TikTok', 0, 0], ['Facebook', 0, 0], ['WhatsApp', 0, 0], ['TikTok Shop', 0.06, 0], ['Etsy', 0.065, 0.2], ['Website / Shopify', 0, 0]],
    payments: [['Card / online', 0.029, 0.3], ['Cash on delivery', 0, 0], ['Bank transfer', 0, 0], ['PayPal', 0.0349, 0.49]],
    dash: { subtitle: 'Your real numbers, updated automatically.', from: 'From', to: 'To', periodHint: 'Leave both empty = all time',
      revenue: 'Revenue', profit: 'Net profit', margin: 'Net margin', orders: 'Orders', deliveryRate: 'Delivery rate', returnRate: 'Return rate',
      aov: 'Avg order value', transit: 'In transit', stockValue: 'Stock value', alerts: 'Stock alerts', bestChannel: 'Best channel', bestProduct: 'Best product',
      chartMonthly: 'Revenue & profit — last 12 months', chartStatus: 'Orders by status', chartChannel: 'Revenue by channel', chartTop: 'Top 5 products by profit' },
    sampleProducts: [['TS-01', 'Oversized T-shirt', 'Apparel', 6, 0.5, 25, 60, 0, 10], ['SR-01', 'Vitamin C serum', 'Beauty', 4, 0.8, 29, 40, 20, 8],
      ['WT-01', 'Classic watch', 'Accessories', 12, 1.5, 49, 25, 0, 5], ['PC-01', 'iPhone case', 'Accessories', 1.5, 0.3, 15, 100, 0, 15],
      ['BG-01', 'Tote bag', 'Bags', 5, 0.7, 22, 6, 0, 5]],
    sampleCustomers: [['Emma Johnson', '+1 415 555 0142', 'San Francisco', 'USA'], ['Liam Smith', '+44 7700 900123', 'London', 'UK'],
      ['Olivia Brown', '+1 212 555 0199', 'New York', 'USA'], ['Noah Wilson', '+61 412 345 678', 'Sydney', 'Australia'], ['Ava Martin', '+1 647 555 0110', 'Toronto', 'Canada']],
    pack: {
      adPlatforms: ['Meta Ads', 'TikTok Ads', 'Google Ads', 'Snapchat Ads', 'Influencer', 'Other'],
      contentPlatforms: ['TikTok', 'Instagram Reels', 'Instagram Post', 'Instagram Story', 'Facebook', 'YouTube Shorts', 'Pinterest', 'WhatsApp Status'],
      categories: [['Sales payout', 0], ['Supplier / stock', 500], ['Ads', 300], ['Shipping', 150], ['Packaging', 50], ['Tools & subscriptions', 30], ['Personal', 400], ['Rent & bills', 0], ['Taxes', 0], ['Other', 50]],
      accounts: ['Cash', 'Bank', 'Card / wallet'],
      ads: ['Start date', 'Platform', 'Campaign', 'Product', 'Ad spend', 'Orders (ads manager)', 'Revenue (ads manager)'],
      adsCalc: ['Revenue used', 'Cost per order', 'ROAS', 'Profit / order before ads', 'Real profit', 'Verdict'],
      verdict: { win: '✅ Profitable', lose: '❌ Losing money' },
      sampleAds: [[60, 0, 'Serum — broad', 1, 30, 4], [45, 1, 'T-shirt UGC', 0, 20, 3], [30, 0, 'Watch retargeting', 2, 25, 1],
        [20, 1, 'Serum — hook v2', 1, 20, 3], [10, 0, 'Tote bag test', 4, 25, 1], [5, 1, 'Case promo', 3, 10, 2]],
      content: ['Date', 'Platform', 'Format', 'Hook / idea', 'Product', 'Status', 'Link', 'Views', 'Likes', 'Comments', 'Shares', 'Saves', 'DMs / clicks', 'Orders'],
      contentCalc: ['Engagement', 'Day'],
      formats: ['Video', 'Carousel', 'Photo', 'Story', 'Live'],
      contentStatuses: ['Idea', 'Script', 'Filmed', 'Edited', 'Scheduled', 'Published'],
      sampleContent: [
        [-3, 0, 0, 'You sell at {P}… here’s what you ACTUALLY keep', -1, 0], [-1, 1, 0, '3 mistakes that kill your margin', -1, 1],
        [0, 0, 0, 'Unboxing the Vitamin C serum', 1, 4], [2, 0, 0, 'POV: your cash-on-delivery parcel gets refused', -1, 5, 12400, 890, 64, 120, 210, 35, 6],
        [4, 1, 1, '5 ways to style the oversized tee', 0, 5, 3100, 240, 18, 22, 95, 12, 3], [6, 3, 3, 'Behind the scenes: packing 30 orders', -1, 5, 1800, 95, 6, 4, 10, 5, 1],
        [9, 0, 0, 'Cheap watch vs. luxury watch — can you tell?', 2, 5, 25600, 1900, 210, 340, 420, 60, 8], [12, 4, 2, 'New tote bag drop', 4, 5, 900, 40, 3, 1, 4, 2, 0],
        [15, 6, 2, 'Summer tote outfit', 4, 5, 2200, 30, 0, 12, 85, 9, 1], [20, 0, 0, 'How I track 100 orders a day with one Google Sheet', -1, 5, 8900, 610, 48, 75, 390, 22, 0]],
      cash: ['Date', 'Type', 'Category', 'Description', 'Amount', 'Account', 'Pro / Personal'],
      cashCalc: ['Signed amount', 'Balance'],
      types: ['Income', 'Expense'], scope: ['Pro', 'Personal'],
      sampleCash: [[30, 0, 9, 'Opening balance', 500, 1, 0], [28, 0, 0, 'Payout — delivery company (COD)', 420, 1, 0], [27, 1, 1, 'Supplier order — serums', 160, 1, 0],
        [25, 1, 2, 'Meta Ads top-up', 120, 2, 0], [22, 1, 3, 'Shipping labels', 45, 0, 0], [20, 1, 6, 'Groceries', 85, 0, 1], [18, 1, 5, 'Canva Pro', 12, 2, 0],
        [15, 0, 0, 'Payout — delivery company (COD)', 380, 1, 0], [14, 1, 2, 'TikTok Ads top-up', 80, 2, 0], [12, 1, 7, 'Rent', 300, 1, 1],
        [10, 1, 4, 'Boxes & stickers', 30, 0, 0], [7, 1, 1, 'Supplier order — tote bags', 90, 1, 0], [5, 0, 0, 'Payout — Etsy', 145, 1, 0],
        [3, 1, 2, 'Meta Ads top-up', 60, 2, 0], [1, 1, 6, 'Phone plan', 20, 1, 1]],
      budget: { title: '💰 Budget & cash', month: 'Month', kpis: ['Income', 'Expenses', 'Net', 'Cash balance (all time)', 'Pro expenses', 'Personal expenses'],
        table: ['Category', 'Monthly budget', 'Spent', 'Remaining', 'Used'], history: ['Month', 'Income', 'Expenses', 'Net'], chart: 'Income vs expenses — last 6 months' },
      pricing: { title: '🧮 Price calculator', subtitle: 'Find the right price BEFORE you sell. Change the green cells.', inputsHeader: 'Your numbers', outputsHeader: 'Results',
        inputs: ['Sale price', 'Product cost', 'Packaging', 'Shipping cost (you pay)', 'Return cost per refused parcel', 'Platform fee %', 'Platform fixed fee', 'Payment fee %', 'Ad cost per order', 'Delivery rate %', 'Target margin %', 'Ad budget to recoup'],
        outputs: ['Profit per delivered order', 'Net margin', 'Real cost per delivered order', 'Break-even price (no loss)', 'Price for 30% margin', 'Price for 50% margin', 'Price for your target margin', 'Max ad cost per order', 'Break-even ROAS', 'Orders to recoup ad budget'],
        scenarios: ['Price', 'Profit / delivered order', 'Margin'], scenariosTitle: 'What if I change my price?',
        status: { loss: '❌ You lose money on every delivered order. Raise the price or cut costs.', thin: '⚠️ Thin margin: one bad week of returns and you lose money.', ok: '✅ Healthy margin.' } },
      dash: { adSpend: 'Ad spend', roas: 'Ad ROAS', afterAds: 'Profit after ads', cpa: 'Cost per order (ads)', cashBalance: 'Cash balance', cashNet: 'Cash net (period)', posts: 'Posts published', views: 'Total views' },
    },
  },
  fr: {
    file: 'Margokit — Suivi Commandes & Stock', packFile: 'Margokit — Pack Vendeur', shop: 'Ma boutique',
    sheets: { dashboard: 'Tableau de bord', orders: 'Commandes', products: 'Produits', customers: 'Clients', settings: 'Paramètres', guide: 'Mode d’emploi',
      ads: 'Publicité', content: 'Contenu', cash: 'Trésorerie', budget: 'Budget', pricing: 'Calculateur de prix' },
    orders: ['Date', 'N° commande', 'Client', 'Téléphone', 'Ville', 'Pays', 'Produit', 'Qté', 'Prix unitaire', 'Livraison facturée',
      'Canal', 'Paiement', 'Statut', 'Transporteur', 'N° de suivi', 'Coût livraison (payé par toi)', 'Notes'],
    ordersCalc: ['Total', 'Bénéfice', 'Marge', 'Mois'],
    products: ['Réf.', 'Produit', 'Catégorie', 'Coût unitaire', 'Emballage / unité', 'Prix de vente', 'Stock initial', 'Réassort (+)', 'Alerte stock bas à'],
    productsCalc: ['Vendus', 'En stock', 'État du stock', 'Valeur du stock', 'CA', 'Bénéfice'],
    stock: { ok: 'OK', low: 'Bas', out: 'Rupture' },
    customers: ['Téléphone / ID', 'Nom', 'Ville', 'Pays', 'Commandes', 'Livrées', 'Retournées', 'Taux de livraison', 'Total dépensé', 'Bénéfice', 'Dernière commande', 'Tag'],
    tags: { risky: '⚠️ À risque', loyal: '⭐ Fidèle' },
    statuses: ['Nouvelle', 'Confirmée', 'Expédiée', 'Livrée', 'Retournée', 'Annulée'],
    channels: [['Instagram', 0, 0], ['TikTok', 0, 0], ['Facebook', 0, 0], ['WhatsApp', 0, 0], ['TikTok Shop', 0.06, 0], ['Etsy', 0.065, 0.2], ['Site / Shopify', 0, 0]],
    payments: [['Carte / en ligne', 0.029, 0.3], ['Paiement à la livraison', 0, 0], ['Virement', 0, 0], ['PayPal', 0.0349, 0.49]],
    dash: { subtitle: 'Tes vrais chiffres, mis à jour automatiquement.', from: 'Du', to: 'Au', periodHint: 'Laisse vide = depuis le début',
      revenue: 'Chiffre d’affaires', profit: 'Bénéfice net', margin: 'Marge nette', orders: 'Commandes', deliveryRate: 'Taux de livraison', returnRate: 'Taux de retour',
      aov: 'Panier moyen', transit: 'En cours de livraison', stockValue: 'Valeur du stock', alerts: 'Alertes stock', bestChannel: 'Meilleur canal', bestProduct: 'Meilleur produit',
      chartMonthly: 'CA & bénéfice — 12 derniers mois', chartStatus: 'Commandes par statut', chartChannel: 'CA par canal', chartTop: 'Top 5 produits (bénéfice)' },
    sampleProducts: [['TS-01', 'T-shirt oversize', 'Vêtements', 6, 0.5, 25, 60, 0, 10], ['SR-01', 'Sérum vitamine C', 'Beauté', 4, 0.8, 29, 40, 20, 8],
      ['MT-01', 'Montre classique', 'Accessoires', 12, 1.5, 49, 25, 0, 5], ['CQ-01', 'Coque iPhone', 'Accessoires', 1.5, 0.3, 15, 100, 0, 15],
      ['SC-01', 'Sac cabas', 'Sacs', 5, 0.7, 22, 6, 0, 5]],
    sampleCustomers: [['Sarah Benali', '06 12 34 56 78', 'Paris', 'France'], ['Yassine El Idrissi', '06 61 23 45 67', 'Casablanca', 'Maroc'],
      ['Chloé Dubois', '07 45 67 89 01', 'Lyon', 'France'], ['Aminata Diallo', '77 123 45 67', 'Dakar', 'Sénégal'], ['Karim Haddad', '0470 12 34 56', 'Bruxelles', 'Belgique']],
    pack: {
      adPlatforms: ['Meta Ads', 'TikTok Ads', 'Google Ads', 'Snapchat Ads', 'Influenceur', 'Autre'],
      contentPlatforms: ['TikTok', 'Instagram Reels', 'Instagram Post', 'Instagram Story', 'Facebook', 'YouTube Shorts', 'Pinterest', 'Statut WhatsApp'],
      categories: [['Encaissement ventes', 0], ['Fournisseur / stock', 500], ['Publicité', 300], ['Livraison', 150], ['Emballage', 50], ['Outils & abonnements', 30], ['Personnel', 400], ['Loyer & factures', 0], ['Impôts', 0], ['Autre', 50]],
      accounts: ['Espèces', 'Banque', 'Carte / portefeuille'],
      ads: ['Date de début', 'Plateforme', 'Campagne', 'Produit', 'Dépense pub', 'Commandes (gestionnaire pub)', 'CA (gestionnaire pub)'],
      adsCalc: ['CA retenu', 'Coût par commande', 'ROAS', 'Bénéfice / commande avant pub', 'Bénéfice réel', 'Verdict'],
      verdict: { win: '✅ Rentable', lose: '❌ Perd de l’argent' },
      sampleAds: [[60, 0, 'Sérum — large', 1, 30, 4], [45, 1, 'T-shirt UGC', 0, 20, 3], [30, 0, 'Montre retargeting', 2, 25, 1],
        [20, 1, 'Sérum — accroche v2', 1, 20, 3], [10, 0, 'Test sac cabas', 4, 25, 1], [5, 1, 'Promo coque', 3, 10, 2]],
      content: ['Date', 'Réseau', 'Format', 'Accroche / idée', 'Produit', 'Statut', 'Lien', 'Vues', 'J’aime', 'Commentaires', 'Partages', 'Enregistrements', 'DM / clics', 'Commandes'],
      contentCalc: ['Engagement', 'Jour'],
      formats: ['Vidéo', 'Carrousel', 'Photo', 'Story', 'Live'],
      contentStatuses: ['Idée', 'Script', 'Tourné', 'Monté', 'Programmé', 'Publié'],
      sampleContent: [
        [-3, 0, 0, 'Tu vends à {P}… voilà ce que tu gardes VRAIMENT', -1, 0], [-1, 1, 0, '3 erreurs qui tuent ta marge', -1, 1],
        [0, 0, 0, 'Déballage du sérum vitamine C', 1, 4], [2, 0, 0, 'POV : ton colis en paiement à la livraison est refusé', -1, 5, 12400, 890, 64, 120, 210, 35, 6],
        [4, 1, 1, '5 façons de porter le t-shirt oversize', 0, 5, 3100, 240, 18, 22, 95, 12, 3], [6, 3, 3, 'Coulisses : j’emballe 30 commandes', -1, 5, 1800, 95, 6, 4, 10, 5, 1],
        [9, 0, 0, 'Montre pas chère vs montre de luxe : tu vois la différence ?', 2, 5, 25600, 1900, 210, 340, 420, 60, 8], [12, 4, 2, 'Nouveau : le sac cabas', 4, 5, 900, 40, 3, 1, 4, 2, 0],
        [15, 6, 2, 'Tenue d’été avec le sac cabas', 4, 5, 2200, 30, 0, 12, 85, 9, 1], [20, 0, 0, 'Comment je gère 100 commandes par jour avec un seul Google Sheet', -1, 5, 8900, 610, 48, 75, 390, 22, 0]],
      cash: ['Date', 'Type', 'Catégorie', 'Description', 'Montant', 'Compte', 'Pro / Perso'],
      cashCalc: ['Montant signé', 'Solde'],
      types: ['Entrée', 'Sortie'], scope: ['Pro', 'Perso'],
      sampleCash: [[30, 0, 9, 'Solde d’ouverture', 500, 1, 0], [28, 0, 0, 'Versement société de livraison (COD)', 420, 1, 0], [27, 1, 1, 'Commande fournisseur — sérums', 160, 1, 0],
        [25, 1, 2, 'Recharge Meta Ads', 120, 2, 0], [22, 1, 3, 'Étiquettes d’expédition', 45, 0, 0], [20, 1, 6, 'Courses', 85, 0, 1], [18, 1, 5, 'Canva Pro', 12, 2, 0],
        [15, 0, 0, 'Versement société de livraison (COD)', 380, 1, 0], [14, 1, 2, 'Recharge TikTok Ads', 80, 2, 0], [12, 1, 7, 'Loyer', 300, 1, 1],
        [10, 1, 4, 'Boîtes & stickers', 30, 0, 0], [7, 1, 1, 'Commande fournisseur — sacs', 90, 1, 0], [5, 0, 0, 'Versement Etsy', 145, 1, 0],
        [3, 1, 2, 'Recharge Meta Ads', 60, 2, 0], [1, 1, 6, 'Forfait téléphone', 20, 1, 1]],
      budget: { title: '💰 Budget & trésorerie', month: 'Mois', kpis: ['Entrées', 'Sorties', 'Net', 'Solde de trésorerie (total)', 'Dépenses pro', 'Dépenses perso'],
        table: ['Catégorie', 'Budget mensuel', 'Dépensé', 'Reste', 'Utilisé'], history: ['Mois', 'Entrées', 'Sorties', 'Net'], chart: 'Entrées vs sorties — 6 derniers mois' },
      pricing: { title: '🧮 Calculateur de prix', subtitle: 'Trouve le bon prix AVANT de vendre. Modifie les cellules vertes.', inputsHeader: 'Tes chiffres', outputsHeader: 'Résultats',
        inputs: ['Prix de vente', 'Coût du produit', 'Emballage', 'Coût de livraison (payé par toi)', 'Coût de retour par colis refusé', 'Frais plateforme %', 'Frais plateforme fixes', 'Frais de paiement %', 'Coût pub par commande', 'Taux de livraison %', 'Marge visée %', 'Budget pub à rentabiliser'],
        outputs: ['Bénéfice par commande livrée', 'Marge nette', 'Coût réel par commande livrée', 'Prix minimum (sans perte)', 'Prix pour 30 % de marge', 'Prix pour 50 % de marge', 'Prix pour ta marge visée', 'Coût pub max par commande', 'ROAS minimum rentable', 'Commandes pour rentabiliser le budget pub'],
        scenarios: ['Prix', 'Bénéfice / commande livrée', 'Marge'], scenariosTitle: 'Et si je change mon prix ?',
        status: { loss: '❌ Tu perds de l’argent sur chaque commande livrée. Augmente le prix ou baisse les coûts.', thin: '⚠️ Marge fine : une mauvaise semaine de retours et tu perds de l’argent.', ok: '✅ Marge saine.' } },
      dash: { adSpend: 'Dépense pub', roas: 'ROAS pub', afterAds: 'Bénéfice après pub', cpa: 'Coût par commande (pub)', cashBalance: 'Solde de trésorerie', cashNet: 'Trésorerie nette (période)', posts: 'Posts publiés', views: 'Vues totales' },
    },
  },
};

// [days ago, customer, product, qty, channel, payment, status, carrier, shipping charged]
const SAMPLE_ORDERS = [
  [85, 0, 0, 2, 0, 1, 3, 0, 0], [80, 1, 1, 1, 1, 0, 3, 1, 0], [72, 2, 2, 1, 3, 1, 4, 0, 0],
  [65, 3, 3, 3, 4, 0, 3, 2, 0], [58, 0, 1, 1, 0, 1, 3, 0, 0], [50, 2, 0, 1, 2, 1, 4, 1, 0],
  [44, 1, 2, 1, 1, 0, 3, 2, 0], [38, 4, 4, 2, 3, 1, 3, 0, 0], [30, 3, 0, 1, 0, 1, 3, 1, 0],
  [25, 0, 3, 2, 6, 0, 3, 2, 0], [20, 4, 1, 2, 1, 1, 3, 0, 0], [15, 1, 2, 1, 0, 1, 5, 0, 0],
  [10, 2, 4, 1, 3, 1, 3, 1, 0], [7, 3, 1, 1, 1, 0, 2, 2, 0], [5, 0, 0, 3, 0, 1, 2, 0, 0],
  [3, 4, 3, 1, 4, 0, 1, 1, 0], [1, 1, 2, 1, 3, 1, 0, 0, 0], [0, 2, 1, 2, 0, 1, 0, 0, 0],
];
const PRICING_DEFAULTS = [25, 6, 0.5, 5, 3, 0, 0, 0.029, 4, 0.8, 0.3, 300];
const PRICING_MONEY_ROWS = [0, 1, 2, 3, 4, 6, 8, 11];

const daysAgo = (n) => new Date(TODAY.getFullYear(), TODAY.getMonth(), TODAY.getDate() - n);
const monthKey = (d) => `${d.getFullYear()}-${d.getMonth()}`;
const sum = (a) => a.reduce((x, y) => x + y, 0);

export function build(key) {
  const v = VARIANTS[key];
  const t = T[v.lang];
  const m = v.money;
  const products = t.sampleProducts.map((r) => r.map((x, i) => (i >= 3 && i <= 5 ? x * m : x)));
  const customers = v.customers || t.sampleCustomers;
  const ST = t.statuses;

  // ---- Orders
  const orders = SAMPLE_ORDERS.map((o, i) => {
    const [ago, ci, pi, qty, ch, pay, st, car, shipIn] = o;
    const c = customers[ci];
    const p = products[pi];
    const price = p[5];
    const total = qty * price + shipIn;
    const [chanName, chanPct, chanFix] = t.channels[ch];
    const [payName, payPct, payFix] = t.payments[pay];
    const [carName, carShip, carRet] = v.carriers[car];
    let profit = null;
    if (st === 3) profit = total - qty * (p[3] + p[4]) - carShip - (total * chanPct + chanFix * m) - (total * payPct + payFix * m);
    else if (st === 4) profit = -(carShip + carRet + qty * p[4]);
    return {
      date: daysAgo(ago), num: `#${1001 + i}`, customer: c[0], phone: c[1], city: c[2], country: c[3], product: p[1], pi, qty, price, shipIn,
      channel: chanName, payment: payName, st, status: ST[st], carrier: carName, tracking: st >= 2 ? `TRK${100000 + i * 7919}` : '',
      total, profit, margin: st === 3 ? profit / total : null,
    };
  });

  // ---- Products
  const productRows = products.map((p, pi) => {
    const os = orders.filter((o) => o.pi === pi);
    const sold = sum(os.filter((o) => o.st === 2 || o.st === 3).map((o) => o.qty));
    const inStock = p[6] + p[7] - sold;
    const low = p[8] === '' ? 5 : p[8];
    const stockStatus = inStock <= 0 ? 'out' : inStock <= low ? 'low' : 'ok';
    return { sku: p[0], name: p[1], category: p[2], cost: p[3], pack: p[4], price: p[5], init: p[6], restock: p[7], low: p[8], sold, inStock,
      stockStatus, stockLabel: t.stock[stockStatus], stockValue: inStock > 0 ? inStock * p[3] : 0,
      revenue: sum(os.filter((o) => o.st === 3).map((o) => o.total)), profit: sum(os.map((o) => o.profit || 0)) };
  });

  // ---- Customers (keyed by phone, in order of first appearance)
  const keys = [...new Set(orders.map((o) => o.phone))];
  const customerRows = keys.map((k) => {
    const os = orders.filter((o) => o.phone === k);
    const last = os[os.length - 1];
    const delivered = os.filter((o) => o.st === 3).length;
    const returned = os.filter((o) => o.st === 4).length;
    return { id: k, name: last.customer, city: last.city, country: last.country, orders: os.length, delivered, returned,
      deliveryRate: delivered + returned ? delivered / (delivered + returned) : null,
      spent: sum(os.filter((o) => o.st === 3).map((o) => o.total)), profit: sum(os.map((o) => o.profit || 0)),
      last: new Date(Math.max(...os.map((o) => o.date))),
      tag: returned >= 2 ? 'risky' : delivered >= 3 ? 'loyal' : '', tagLabel: returned >= 2 ? t.tags.risky : delivered >= 3 ? t.tags.loyal : '' };
  });

  // ---- Dashboard (all time)
  const nDel = orders.filter((o) => o.st === 3).length;
  const nRet = orders.filter((o) => o.st === 4).length;
  const revenue = sum(orders.filter((o) => o.st === 3).map((o) => o.total));
  const profit = sum(orders.map((o) => o.profit || 0));
  const channelRevenue = t.channels.map(([name]) => ({ name, value: sum(orders.filter((o) => o.channel === name && o.st === 3).map((o) => o.total)) }));
  const bestChannel = [...channelRevenue].sort((a, b) => b.value - a.value)[0];
  const topProducts = productRows.map((p) => ({ name: p.name, value: p.profit })).sort((a, b) => b.value - a.value).slice(0, 5);
  const months = Array.from({ length: 12 }, (_, i) => new Date(TODAY.getFullYear(), TODAY.getMonth() - 11 + i, 1));
  const monthly = months.map((d) => ({ d,
    revenue: sum(orders.filter((o) => o.st === 3 && monthKey(o.date) === monthKey(d)).map((o) => o.total)),
    profit: sum(orders.filter((o) => monthKey(o.date) === monthKey(d)).map((o) => o.profit || 0)) }));
  const statusCounts = ST.map((s, i) => ({ name: s, value: orders.filter((o) => o.st === i).length }));
  const dash = { revenue, profit, margin: revenue ? profit / revenue : 0, orders: orders.length, deliveryRate: nDel / (nDel + nRet), returnRate: nRet / (nDel + nRet),
    aov: revenue / nDel, transit: sum(orders.filter((o) => o.st === 2).map((o) => o.total)), stockValue: sum(productRows.map((p) => p.stockValue)),
    alerts: productRows.filter((p) => p.stockStatus !== 'ok').length, bestChannel: bestChannel.value > 0 ? bestChannel.name : '—',
    bestProduct: topProducts[0].value > 0 ? topProducts[0].name : '—', monthly, statusCounts, channelRevenue, topProducts };

  // ---- Ads
  const P = t.pack;
  const ads = P.sampleAds.map((a) => {
    const prod = products[a[3]];
    const spend = a[4] * m;
    const n = a[5];
    const rev = n * prod[5];
    const os = orders.filter((o) => o.pi === a[3] && (o.st === 3 || o.st === 4));
    const perOrder = os.length ? sum(orders.filter((o) => o.pi === a[3]).map((o) => o.profit || 0)) / os.length
      : prod[5] - prod[3] - prod[4] - v.carriers[0][1];
    const real = n * perOrder - spend;
    return { date: daysAgo(a[0]), platform: P.adPlatforms[a[1]], campaign: a[2], product: prod[1], spend, orders: n, revenue: rev,
      cpa: spend / n, roas: rev / spend, perOrder, real, win: real > 0, verdict: real > 0 ? P.verdict.win : P.verdict.lose };
  });

  // ---- Content
  const priceLabel = v.currency === '$' ? '$25' : `${25 * m} ${v.currency}`;
  const content = P.sampleContent.map((c) => {
    const mt = c.length > 6 ? c.slice(6) : null;
    return { date: daysAgo(c[0]), platform: P.contentPlatforms[c[1]], format: P.formats[c[2]], hook: c[3].replace('{P}', priceLabel),
      product: c[4] >= 0 ? t.sampleProducts[c[4]][1] : '', st: c[5], status: P.contentStatuses[c[5]],
      views: mt ? mt[0] : null, likes: mt ? mt[1] : null, comments: mt ? mt[2] : null, shares: mt ? mt[3] : null, saves: mt ? mt[4] : null,
      dms: mt ? mt[5] : null, orders: mt ? mt[6] : null, engagement: mt ? (mt[1] + mt[2] + mt[3] + mt[4]) / mt[0] : null, today: c[0] === 0 };
  });

  // ---- Cash
  let bal = 0;
  const cash = P.sampleCash.map((c) => {
    const amount = c[4] * m;
    const signed = c[1] === 0 ? amount : -amount;
    bal += signed;
    return { date: daysAgo(c[0]), type: P.types[c[1]], income: c[1] === 0, category: P.categories[c[2]][0], description: c[3], amount, account: P.accounts[c[5]],
      scope: P.scope[c[6]], signed, balance: bal };
  });
  const inMonth = (d, ref) => monthKey(d) === monthKey(ref);
  const bMonth = new Date(TODAY.getFullYear(), TODAY.getMonth(), 1);
  const exp = cash.filter((c) => !c.income);
  const budget = {
    month: bMonth,
    income: sum(cash.filter((c) => c.income && inMonth(c.date, bMonth)).map((c) => c.amount)),
    expenses: sum(exp.filter((c) => inMonth(c.date, bMonth)).map((c) => c.amount)),
    balance: bal,
    pro: sum(exp.filter((c) => inMonth(c.date, bMonth) && c.scope === P.scope[0]).map((c) => c.amount)),
    personal: sum(exp.filter((c) => inMonth(c.date, bMonth) && c.scope === P.scope[1]).map((c) => c.amount)),
    categories: P.categories.map(([name, b]) => {
      const budgetV = b * m;
      const spent = sum(exp.filter((c) => c.category === name && inMonth(c.date, bMonth)).map((c) => c.amount));
      return { name, budget: budgetV, spent, remaining: budgetV > 0 ? budgetV - spent : null, used: budgetV > 0 ? spent / budgetV : null };
    }),
    history: Array.from({ length: 6 }, (_, i) => new Date(bMonth.getFullYear(), bMonth.getMonth() - 5 + i, 1)).map((d) => {
      const inc = sum(cash.filter((c) => c.income && inMonth(c.date, d)).map((c) => c.amount));
      const ex = sum(exp.filter((c) => inMonth(c.date, d)).map((c) => c.amount));
      return { d, income: inc, expenses: ex, net: inc - ex };
    }),
  };
  budget.net = budget.income - budget.expenses;

  // ---- Price calculator (same formulas as buildPricing_)
  const B = PRICING_DEFAULTS.map((x, i) => (PRICING_MONEY_ROWS.includes(i) ? x * m : x));
  const [b4, b5, b6, b7, b8, b9, b10, b11, b12, b13, b14, b15] = B;
  const K = b6 + b7 + (1 - b13) * b8 + b12;
  const NET = 1 - b9 - b11;
  const BASE = b10 + b5 + K / b13;
  const e4 = b4 * NET - BASE;
  const e11 = b13 * (b4 * NET - b10 - b5) - b6 - b7 - (1 - b13) * b8;
  const pricing = {
    inputs: B,
    outputs: [e4, e4 / b4, b4 - e4, BASE / NET, BASE / (NET - 0.3), BASE / (NET - 0.5), BASE / (NET - b14), e11, b4 / e11, Math.ceil(b15 / e11)],
    status: e4 < 0 ? 'loss' : e4 / b4 < 0.2 ? 'thin' : 'ok',
    scenarios: [0.8, 0.9, 1, 1.1, 1.2, 1.3, 1.5].map((f) => {
      const price = Math.round(b4 * f * 100) / 100;
      const pr = price * NET - BASE;
      return { price, profit: pr, margin: pr / price, current: f === 1 };
    }),
  };

  const packDash = {
    adSpend: sum(ads.map((a) => a.spend)),
    roas: sum(ads.map((a) => a.revenue)) / sum(ads.map((a) => a.spend)),
    cpa: sum(ads.map((a) => a.spend)) / sum(ads.map((a) => a.orders)),
    cashBalance: bal, cashNet: bal,
    posts: content.filter((c) => c.st === 5).length,
    views: sum(content.map((c) => c.views || 0)),
  };
  packDash.afterAds = dash.profit - packDash.adSpend;

  return { key, v, t, lang: v.lang, currency: v.currency, products: productRows, orders, customers: customerRows, dash, ads, content, cash, budget, pricing, packDash };
}

// ---- Formatting (Sheets number formats, in the file's locale)
export function fmt(lang) {
  const loc = lang === 'fr' ? 'fr-FR' : 'en-US';
  const nf2 = new Intl.NumberFormat(loc, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const nf0 = new Intl.NumberFormat(loc, { maximumFractionDigits: 0 });
  const nf1 = new Intl.NumberFormat(loc, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  const p2 = (n) => String(n).padStart(2, '0');
  const MONTHS = { en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    fr: ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'] }[lang];
  const LONG = { en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    fr: ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'] }[lang];
  return {
    money: (x) => (x === null || x === undefined ? '' : nf2.format(x).replace(/ /g, ' ')),
    int: (x) => (x === null || x === undefined ? '' : nf0.format(x).replace(/ /g, ' ')),
    pct1: (x) => (x === null ? '' : `${nf1.format(x * 100)}%`),
    pct0: (x) => (x === null ? '' : `${nf0.format(x * 100)}%`),
    roas: (x) => `${nf2.format(x)}x`,
    date: (d) => (lang === 'fr' ? `${p2(d.getDate())}/${p2(d.getMonth() + 1)}/${d.getFullYear()}` : `${p2(d.getMonth() + 1)}/${p2(d.getDate())}/${d.getFullYear()}`),
    monthShort: (d) => `${MONTHS[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`,
    monthLong: (d) => `${LONG[d.getMonth()]} ${d.getFullYear()}`,
  };
}
