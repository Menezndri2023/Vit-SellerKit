/**
 * Calendrier de publication — campagne « Facture. Encaisse. Respire. » (30 nov → 27 déc 2026).
 * Source unique : node marketing/campagne-pro/build.mjs génère 03-calendrier.md, calendrier.csv et le dossier d'export.
 * Heures : heure du Maroc (GMT+1). Réseaux : comptes VIT GLOBAL (Facebook, Instagram, LinkedIn, TikTok @vitglobaltech).
 */

export const SITE = 'https://margokit.com/fr';
export const link = (net, content) => `${SITE}?utm_source=${net}&utm_medium=social&utm_campaign=facture-encaisse&utm_content=${content}`;

const TAGS = {
  ig: '#facture #freelancemaroc #entrepreneurmaroc #autoentrepreneur #devis #casablanca #freelance #petiteentreprise #margokit',
  tiktok: '#facture #freelance #maroc #entrepreneur #devis #astuce #business #margokit',
  fb: '#facture #freelance #Maroc #entrepreneur',
  li: '#facturation #freelance #Maroc #TPE #entrepreneuriat',
};

/** Légendes par contenu. ig = Instagram / Facebook / TikTok (tutoiement) · li = LinkedIn (vouvoiement). */
export const CAPTIONS = {
  'C1-word-vs-margokit': {
    ig: `Tu factures encore sur Word ? 👀\n\nLe dernier numéro, l’ICE du client, la TVA à part, les mentions… tout repose sur ta mémoire.\n\nAvec Margokit : tu choisis le client, tu ajoutes une ligne, c’est prêt. Numéro continu, mentions du pays, envoi WhatsApp, relances automatiques.\n\n👉 Essai Pro 7 jours sans carte : lien en bio.\n\nDarija : Mazal katdir les factures f Word ? Margokit kaywajed lik devis w facture f d9i9a.`,
    li: `Combien de temps passez-vous chaque mois à préparer vos factures sur Word ou Excel ?\n\nRetrouver le dernier numéro, recopier l’ICE du client, calculer la TVA, vérifier les mentions… puis relancer.\n\nNous avons conçu Margokit, chez VIT GLOBAL, pour que ce travail prenne une minute : devis transformé en facture en un clic, numérotation continue, mentions du pays, envoi par lien ou WhatsApp, relances automatiques.\n\nEssai Pro de 7 jours, sans carte bancaire.`,
  },
  'C2-facture-maroc-article-145': {
    ig: `📌 Enregistre ce post.\n\nAu Maroc, le contenu d’une facture est fixé par l’article 145 du CGI. Les 5 oublis les plus fréquents 👉 glisse.\n\nSource : article 145-III du CGI (édition DGI). Les auto-entrepreneurs relèvent de règles particulières (art. 145-XI). Vérifie ta situation avec ton comptable.\n\nDarija : L’ICE dial client dima khasso ykoun f la facture. Margokit kayfakrek.`,
    li: `Facturation au Maroc : ce que dit l’article 145 du Code général des impôts.\n\nLes oublis que nous voyons le plus souvent :\n1. L’identifiant fiscal (IF) et le numéro de taxe professionnelle du vendeur\n2. L’ICE du client professionnel\n3. La TVA indiquée de manière distincte (ou la mention d’exonération)\n4. Le mode et les références de paiement\n5. Une numérotation continue\n\nSource : article 145-III du CGI, édition publiée par la DGI. Les auto-entrepreneurs et la CPU relèvent de règles particulières (art. 145-XI). Ce résumé ne remplace pas l’avis de votre comptable.\n\nLe guide complet est gratuit sur margokit.com/fr/guides.`,
  },
  'C3-se-faire-payer-plus-vite': {
    ig: `5 réflexes pour être payé plus vite, sans être lourd avec tes clients 💸\n\nLequel tu appliques déjà ? Dis-le en commentaire 👇\n\nLe 4e (les relances automatiques) est inclus dans Margokit Pro : essai 7 jours sans carte, lien en bio.`,
    li: `Cinq réflexes pour réduire vos délais de paiement :\n\n1. Une échéance écrite sur chaque facture\n2. Le RIB et un lien de paiement sur la facture\n3. L’envoi sur le canal où le client répond (souvent WhatsApp)\n4. Des relances programmées à J+1, J+7 et J+15\n5. Un point hebdomadaire sur le reste à encaisser\n\nMargokit automatise les réflexes 3, 4 et 5.`,
  },
  'C4-cloturer-2026': {
    ig: `Clôture ton année en 10 minutes avant d’appeler ton comptable 🗂️\n\nFacturé, encaissé, reste à encaisser, meilleurs clients, et tes factures de janvier déjà prêtes.\n\nTout est dans Margokit (la page Revenus est gratuite). Lien en bio.`,
    li: `Avant le rendez-vous de janvier avec votre comptable, quatre chiffres à connaître :\n\n• ce que vous avez facturé en 2026\n• ce que vous avez réellement encaissé\n• ce qui reste à encaisser, dont la part en retard\n• vos clients les plus importants\n\nLa page Revenus de Margokit les affiche en un coup d’œil, gratuitement.`,
  },
  'C5-offre-pro': {
    ig: `Margokit Pro, 7 jours gratuits. Sans carte bancaire. 🎁\n\n✔ Documents illimités, sans filigrane\n✔ Relances automatiques\n✔ Factures récurrentes\n\nEnsuite : 5 $/mois, 49 $/an ou 99 $ à vie. Ou tu restes gratuit (3 documents par mois).\nCarte refusée ? Paiement local via WhatsApp.\n\n👉 Lien en bio.`,
    li: `Margokit Pro est désormais disponible en essai gratuit de 7 jours, sans carte bancaire.\n\nAu programme : documents illimités sans filigrane, relances automatiques et factures récurrentes.\nTarifs : 5 $/mois, 49 $/an ou 99 $ à vie. Le plan gratuit (3 documents par mois) reste disponible.`,
  },
  'P1-lancement': {
    ig: `Facture. Encaisse. Respire. 🌿\n\nMargokit, par VIT GLOBAL : tes devis et factures en 1 minute, envoyés sur WhatsApp, relancés automatiquement.\n\nPendant 4 semaines, on te montre comment facturer proprement et être payé plus vite. Abonne-toi pour ne rien rater.\n\n👉 Essai Pro 7 jours sans carte : lien en bio.`,
    li: `VIT GLOBAL lance la campagne « Facture. Encaisse. Respire. » pour Margokit, notre application de devis et de factures.\n\nNotre conviction : un freelance ou une petite entreprise ne devrait pas passer ses soirées sur Word, ni courir après ses paiements.\n\nPendant quatre semaines, nous partagerons ici des conseils concrets de facturation (Maroc, Afrique francophone, France) et les fonctions de Margokit.\n\nEssai Pro de 7 jours, sans carte bancaire : margokit.com`,
  },
  'P2-nouveau-revenus': {
    ig: `Nouveau 📊 Combien tu as vraiment encaissé en 2026 ?\n\nLa page Revenus te montre le facturé, l’encaissé, ce qui reste à encaisser, ton délai moyen de paiement et tes meilleurs clients. Gratuit.\n\nLien en bio.`,
    li: `Nouveauté Margokit : la page Revenus.\n\nFacturé et encaissé mois par mois, reste à encaisser et part en retard, délai moyen de paiement, meilleurs clients, comparaison avec l’année précédente. Disponible pour tous les comptes, y compris gratuits.`,
  },
  'P3-nouveau-import': {
    ig: `Nouveau 📥 Tes clients Excel dans Margokit en 30 secondes.\n\nEnregistre ta liste en CSV, dépose-la, clique sur Vérifier : Margokit te dit ce qui est prêt et ce qu’il faut corriger avant d’importer. Gratuit.\n\nLien en bio.`,
    li: `Nouveauté Margokit : l’import de clients depuis Excel ou Google Sheets (CSV). Vérification avant enregistrement, doublons ignorés, modèle téléchargeable.`,
  },
  'P4-whatsapp': {
    ig: `Ta facture, sur WhatsApp, en 1 clic 📲\n\nTon client reçoit un lien, ouvre la facture sur son téléphone, avec ton RIB et ton lien de paiement.\n\nLien en bio.`,
    li: `Vos clients répondent sur WhatsApp, pas par e-mail ? Margokit envoie la facture par lien WhatsApp : le client l’ouvre sur son téléphone, avec vos coordonnées bancaires.`,
  },
  'P5-seller-pack': {
    ig: `ROAS 3. Et tu perds de l’argent ? 📉\n\nLe Seller Pack (Google Sheets) calcule ton vrai bénéfice par commande et par campagne : livraison, frais, colis refusés et pub compris.\n\n34 $ une fois · MAD, EUR, USD · FR/EN. Lien en bio.`,
  },
  'P6-question': {
    ig: `Question du jour 👇\n\nTu factures avec quoi aujourd’hui ?\nA · Word / Excel\nB · Un carnet\nC · Un logiciel\nD · Je ne facture pas 😅\n\nRéponds en commentaire, on lit tout.`,
  },
  'V01-demo-75s': {
    ig: `Margokit en 50 secondes ⏱️\n\nDevis → facture en 1 clic, envoi WhatsApp, relances automatiques, revenus mois par mois.\n\nCommente « FACTURE » et on t’envoie le lien + le guide facture Maroc 📩\n\nDarija : Margokit kaywajed lik devis w facture f d9i9a, w kayrelanci les clients li t2ekhro.`,
    li: `Margokit en moins d’une minute : devis transformé en facture en un clic, numérotation continue, mentions du pays, envoi par lien ou WhatsApp, relances automatiques et suivi des revenus.\n\nConçu par VIT GLOBAL pour les freelances et petites entreprises. Essai Pro de 7 jours, sans carte.`,
  },
  'V02-premiere-facture': { ig: `Ta première facture en moins d’1 minute ⏱️ Chrono en main.\n\nCrée ton compte gratuit (lien en bio) et dis-nous ton temps en commentaire 👇`, li: `Démonstration : une facture conforme en moins d’une minute avec Margokit.` },
  'V03-facture-maroc-article-145': {
    ig: `Facture au Maroc : les 5 oublis fréquents (article 145 du CGI) 🇲🇦\n\nSource : article 145-III du CGI (édition DGI). Les auto-entrepreneurs relèvent de règles particulières (art. 145-XI). Vérifie ta situation avec ton comptable.\n\nGuide complet gratuit : lien en bio.`,
    li: `Facturation au Maroc : ce que l’article 145 du CGI impose, en 45 secondes. Source : article 145-III, édition DGI. Les auto-entrepreneurs relèvent de règles particulières (art. 145-XI).`,
  },
  'V04-devis-en-facture-whatsapp': { ig: `Ton client a dit oui sur WhatsApp ? Ne recommence rien 👍\n\nDevis → facture en 1 clic, puis envoi WhatsApp. Lien en bio.` },
  'V05-relances-automatiques': {
    ig: `Relancer un client, c’est gênant. Alors laisse Margokit le faire 😌\n\nJ+1, J+7, J+15 : un e-mail poli, à ton nom, avec le lien de la facture. Ça s’arrête dès qu’elle est payée.\n\nEssai Pro 7 jours sans carte : lien en bio.\n\nDarija : Ma b9itich t9elleb 3la flousek : Margokit kayrelanci lik les clients li t2ekhro.`,
    li: `Relancer un client est souvent la partie la plus inconfortable du métier. Margokit Pro envoie des relances par e-mail à J+1, J+7 et J+15 après l’échéance, au nom de l’entreprise, et s’arrête dès que la facture est payée.`,
  },
  'V06-page-revenus': { ig: `Facturé ≠ encaissé. Tu connais le vrai chiffre ? 📊\n\nPage Revenus, gratuite : lien en bio.`, li: `Facturé n’est pas encaissé. La page Revenus de Margokit montre les deux, mois par mois, avec le reste à encaisser et le délai moyen de paiement.` },
  'V07-import-clients-excel': { ig: `Ne retape pas tes clients 🙅 Import Excel → Margokit en 30 secondes. Gratuit, lien en bio.` },
  'V08-factures-recurrentes': { ig: `Abonnement, maintenance, loyer, cours… Tes factures de janvier peuvent déjà être prêtes 🗓️\n\nFactures récurrentes (Pro) : un brouillon prêt à chaque échéance, tu gardes la main. Lien en bio.` },
  'V09-seller-pack-tuto': { ig: `Seller Pack : le tuto en 1 minute 🧮\n\nCommandes, pubs, prix minimum, trésorerie : ton vrai bénéfice dans un Google Sheet. 34 $ une fois. Lien en bio.\n\nCommente « PACK » pour recevoir le lien 📩` },
  'V10-essai-pro-7-jours': { ig: `7 jours de Pro, gratuits, sans carte 🎁\n\nEnsuite 5 $/mois, 49 $/an ou 99 $ à vie — ou tu restes gratuit. Lien en bio.`, li: `Margokit Pro : 7 jours d’essai gratuit, sans carte bancaire. Ensuite 5 $/mois, 49 $/an ou 99 $ à vie.` },
  'H1-dernier-numero': { ig: `12 ou 13 ? 🤔 Laisse Margokit numéroter. Lien en bio.` },
  'H2-je-te-paie-la-semaine-prochaine': { ig: `« Je te paie la semaine prochaine »… il y a un mois 🙃 Les relances automatiques, c’est dans Margokit Pro. Lien en bio.` },
  'H3-ice-du-client': { ig: `L’ICE de ton client est sur ta facture ? 🇲🇦 (article 145 du CGI). Lien en bio pour le guide gratuit.` },
  'H4-trois-outils': { ig: `Word + Excel + WhatsApp = 😩\nUn seul outil = Margokit. Lien en bio.` },
  'H5-combien-encaisse': { ig: `Tu sais combien tu as encaissé en 2026 ? Pas facturé. Encaissé. 📊 Lien en bio.` },
  'H6-roas-3': { ig: `ROAS 3 et tu perds de l’argent ? Le Seller Pack te montre ton vrai bénéfice. Lien en bio.` },
  'S1-essai': { ig: 'Story : ajoute le sticker lien → margokit.com (essai Pro 7 jours).' },
  'S2-sondage': { ig: 'Story : ajoute le sticker sondage « Oui 😤 / Non, jamais ».' },
  'S3-revenus': { ig: 'Story : sticker lien vers margokit.com, texte « Facturé ≠ encaissé ».' },
  'PRES-presentation': { li: `Présentation de Margokit en 10 pages : le problème, la solution, la conformité (Maroc, France), les relances, les revenus et les tarifs.\n\nÀ partager avec un freelance ou une TPE qui facture encore sur Word.` },
  'BILAN-fondateur': { li: `⚠️ À ADAPTER PAR LE FONDATEUR (ne rien inventer) : 4 semaines de campagne Margokit — ce que nous avons appris, les chiffres réels (essais, ventes, retours) et la suite pour 2027.` },
};

/** [date, heure, réseau, contenu, format] — réseau : ig, fb, li, tiktok, story. */
export const SCHEDULE = [
  // S1 — Le problème
  ['2026-11-30', '09:00', 'li', 'P1-lancement', 'image'],
  ['2026-11-30', '13:00', 'fb', 'P1-lancement', 'image'],
  ['2026-11-30', '19:30', 'ig', 'C1-word-vs-margokit', 'carrousel'],
  ['2026-11-30', '20:00', 'tiktok', 'H4-trois-outils', '9x16'],
  ['2026-12-01', '19:30', 'ig', 'V01-demo-75s', '9x16'],
  ['2026-12-01', '20:00', 'tiktok', 'H1-dernier-numero', '9x16'],
  ['2026-12-01', '12:00', 'story', 'S2-sondage', 'story'],
  ['2026-12-02', '09:00', 'li', 'V01-demo-75s', '16x9'],
  ['2026-12-02', '13:00', 'fb', 'V01-demo-75s', '16x9'],
  ['2026-12-02', '20:00', 'tiktok', 'V03-facture-maroc-article-145', '9x16'],
  ['2026-12-03', '19:30', 'ig', 'C2-facture-maroc-article-145', 'carrousel'],
  ['2026-12-03', '13:00', 'fb', 'C2-facture-maroc-article-145', 'carrousel'],
  ['2026-12-03', '20:00', 'tiktok', 'H3-ice-du-client', '9x16'],
  ['2026-12-04', '09:00', 'li', 'C2-facture-maroc-article-145', 'document'],
  ['2026-12-04', '20:00', 'tiktok', 'V01-demo-75s', '9x16'],
  ['2026-12-05', '19:30', 'ig', 'P6-question', 'image'],
  ['2026-12-05', '13:00', 'fb', 'P6-question', 'image'],
  ['2026-12-06', '20:00', 'tiktok', 'V02-premiere-facture', '9x16'],
  // S2 — La démo
  ['2026-12-07', '09:00', 'li', 'PRES-presentation', 'document'],
  ['2026-12-07', '19:30', 'ig', 'V02-premiere-facture', '9x16'],
  ['2026-12-07', '20:00', 'tiktok', 'V04-devis-en-facture-whatsapp', '9x16'],
  ['2026-12-08', '13:00', 'fb', 'V04-devis-en-facture-whatsapp', '9x16'],
  ['2026-12-08', '12:00', 'story', 'S1-essai', 'story'],
  ['2026-12-08', '20:00', 'tiktok', 'V10-essai-pro-7-jours', '9x16'],
  ['2026-12-09', '19:30', 'ig', 'P4-whatsapp', 'image'],
  ['2026-12-09', '09:00', 'li', 'V02-premiere-facture', '9x16'],
  ['2026-12-10', '19:30', 'ig', 'V10-essai-pro-7-jours', '9x16'],
  ['2026-12-10', '13:00', 'fb', 'V10-essai-pro-7-jours', '1x1'],
  ['2026-12-10', '20:00', 'tiktok', 'V03-facture-maroc-article-145', '9x16'],
  ['2026-12-11', '19:30', 'ig', 'C5-offre-pro', 'carrousel'],
  ['2026-12-11', '13:00', 'fb', 'C5-offre-pro', 'carrousel'],
  ['2026-12-11', '09:00', 'li', 'V10-essai-pro-7-jours', '1x1'],
  ['2026-12-12', '19:30', 'ig', 'V03-facture-maroc-article-145', '9x16'],
  ['2026-12-13', '20:00', 'tiktok', 'V07-import-clients-excel', '9x16'],
  // S3 — Se faire payer
  ['2026-12-14', '19:30', 'ig', 'C3-se-faire-payer-plus-vite', 'carrousel'],
  ['2026-12-14', '13:00', 'fb', 'C3-se-faire-payer-plus-vite', 'carrousel'],
  ['2026-12-14', '20:00', 'tiktok', 'V05-relances-automatiques', '9x16'],
  ['2026-12-14', '09:00', 'li', 'V05-relances-automatiques', '1x1'],
  ['2026-12-15', '19:30', 'ig', 'V05-relances-automatiques', '9x16'],
  ['2026-12-15', '20:00', 'tiktok', 'H2-je-te-paie-la-semaine-prochaine', '9x16'],
  ['2026-12-16', '19:30', 'ig', 'V09-seller-pack-tuto', '9x16'],
  ['2026-12-16', '20:00', 'tiktok', 'V09-seller-pack-tuto', '9x16'],
  ['2026-12-16', '13:00', 'fb', 'P5-seller-pack', 'image'],
  ['2026-12-16', '09:00', 'li', 'P4-whatsapp', 'image'],
  ['2026-12-17', '20:00', 'tiktok', 'H6-roas-3', '9x16'],
  ['2026-12-17', '13:00', 'fb', 'V09-seller-pack-tuto', '16x9'],
  ['2026-12-17', '12:00', 'story', 'S3-revenus', 'story'],
  ['2026-12-18', '09:00', 'li', 'C3-se-faire-payer-plus-vite', 'document'],
  ['2026-12-18', '19:30', 'ig', 'V04-devis-en-facture-whatsapp', '9x16'],
  ['2026-12-19', '13:00', 'fb', 'V05-relances-automatiques', '1x1'],
  ['2026-12-20', '20:00', 'tiktok', 'V10-essai-pro-7-jours', '9x16'],
  // S4 — Préparer 2027
  ['2026-12-21', '19:30', 'ig', 'C4-cloturer-2026', 'carrousel'],
  ['2026-12-21', '13:00', 'fb', 'C4-cloturer-2026', 'carrousel'],
  ['2026-12-21', '09:00', 'li', 'V06-page-revenus', '16x9'],
  ['2026-12-21', '20:00', 'tiktok', 'V06-page-revenus', '9x16'],
  ['2026-12-22', '20:00', 'tiktok', 'V07-import-clients-excel', '9x16'],
  ['2026-12-22', '19:30', 'ig', 'V07-import-clients-excel', '9x16'],
  ['2026-12-22', '13:00', 'fb', 'P3-nouveau-import', 'image'],
  ['2026-12-23', '20:00', 'tiktok', 'H5-combien-encaisse', '9x16'],
  ['2026-12-23', '19:30', 'ig', 'P2-nouveau-revenus', 'image'],
  ['2026-12-23', '09:00', 'li', 'P2-nouveau-revenus', 'image'],
  ['2026-12-24', '20:00', 'tiktok', 'V08-factures-recurrentes', '9x16'],
  ['2026-12-24', '19:30', 'ig', 'V08-factures-recurrentes', '9x16'],
  ['2026-12-24', '13:00', 'fb', 'V08-factures-recurrentes', '9x16'],
  ['2026-12-25', '09:00', 'li', 'C4-cloturer-2026', 'document'],
  ['2026-12-25', '12:00', 'story', 'S1-essai', 'story'],
  ['2026-12-26', '19:30', 'ig', 'V06-page-revenus', '9x16'],
  ['2026-12-26', '20:00', 'tiktok', 'V01-demo-75s', '9x16'],
  ['2026-12-27', '13:00', 'fb', 'C5-offre-pro', 'carrousel'],
  ['2026-12-27', '09:00', 'li', 'BILAN-fondateur', 'texte'],
];

export { TAGS };
