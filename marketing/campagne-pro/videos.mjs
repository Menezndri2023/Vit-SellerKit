/**
 * Source unique des vidéos de la campagne « Facture. Encaisse. Respire. » (voir 02-scripts-videos.md).
 * Rendu : node marketing/visuals/videos-pro.mjs [id…]
 *
 * vo    : voix off (lue par Kokoro, voix ff_siwis) — aussi affichée en sous-titres
 * head  : texte à l'écran (titre de la scène)
 * scene : ce qu'on voit. k = phone (capture mobile entière) · card (zoom sur une zone d'une capture)
 *         · big (grand texte) · list · chat · word · email · pack · prices · end
 * Captures : marketing/campagne-pro/captures (compte de démonstration fictif « Studio Atlas »).
 */

const END = (cta = 'Essaie Pro 7 jours — sans carte') => ({ k: 'end', cta });

export const VIDEOS = [
  {
    id: 'V01-demo-75s',
    title: 'Margokit en 75 secondes',
    formats: ['9x16', '16x9', '1x1'],
    segments: [
      { head: 'Tu factures encore sur Word ?', vo: 'Tu factures encore sur Word ? Tu recopies l’ICE du client, tu cherches le dernier numéro, tu exportes en PDF…', scene: { k: 'word' } },
      { head: 'Et tu relances sur WhatsApp…', vo: 'et tu relances sur WhatsApp, en espérant être payé.', scene: { k: 'chat', msgs: [{ me: true, t: 'Bonjour, je me permets de revenir vers vous pour la facture du mois dernier 🙏' }, { me: true, t: 'Bonjour ? 🙂' }] } },
      { head: 'Devis + factures en 1 minute', vo: 'Avec Margokit, tes devis et tes factures sont prêts en une minute.', scene: { k: 'phone', img: 'dashboard' } },
      { head: 'Totaux, TVA, mentions : automatiques', vo: 'Tu choisis ton client, tu ajoutes une ligne, et les totaux, la TVA et les mentions légales se remplissent tout seuls.', scene: { k: 'phone', img: 'editeur', y: 2330 } },
      { head: 'Devis accepté → facture en 1 clic', vo: 'Le client dit oui ? Un clic, et le devis devient une facture, avec un numéro continu, sans trou.', scene: { k: 'phone', img: 'devis-accepte' } },
      { head: 'Envoi WhatsApp, e-mail ou lien', vo: 'Tu l’envoies par lien, par e-mail ou sur WhatsApp. Ton client l’ouvre sur son téléphone.', scene: { k: 'phone', img: 'vue-client' } },
      { head: 'Relances automatiques', vo: 'Et s’il paie en retard, Margokit le relance pour toi : un jour, sept jours et quinze jours après l’échéance.', scene: { k: 'phone', img: 'settings-relances' } },
      { head: 'Tes revenus, mois par mois', vo: 'Tu vois enfin ce que tu as facturé, encaissé, et ce qui reste à encaisser.', scene: { k: 'phone', img: 'revenus' } },
      { head: 'Essai Pro 7 jours — sans carte', vo: 'Margokit, c’est gratuit pour trois documents par mois. Et tu peux essayer Pro sept jours, sans carte.', scene: { k: 'card', img: 'plan-essai', y: 760, h: 920 } },
      { head: '', vo: 'Margokit. Facture. Encaisse. Respire.', scene: END() },
    ],
  },
  {
    id: 'V02-premiere-facture',
    title: 'Ta première facture en 1 minute',
    formats: ['9x16'],
    segments: [
      { head: '⏱ Ta première facture : 1 minute', vo: 'Ta première facture, chrono en main.', scene: { k: 'big', text: '⏱ 0:00', sub: 'Ta première facture' } },
      { head: 'Ton entreprise : une seule fois', vo: 'Une seule fois, tu remplis ton entreprise : nom, adresse, ICE, IF, RIB. Ils seront repris sur chaque facture.', scene: { k: 'phone', img: 'settings-entreprise' } },
      { head: 'Nouvelle facture', vo: 'Nouvelle facture. Tu choisis le client, tu décris la prestation, le prix, la TVA. Le total se calcule pendant que tu tapes.', scene: { k: 'phone', img: 'editeur', y: 2330 } },
      { head: 'Numéro continu + facture verrouillée', vo: 'Tu émets : le numéro est attribué et la facture est verrouillée. Une erreur ? On la corrige par un avoir.', scene: { k: 'phone', img: 'facture-emise-haut' } },
      { head: 'PDF prêt ✅', vo: 'Le PDF est prêt. Moins d’une minute.', scene: { k: 'phone', img: 'vue-client' } },
      { head: '', vo: 'Crée ton compte gratuit sur margokit point com.', scene: END('Gratuit · 3 documents par mois') },
    ],
  },
  {
    id: 'V03-facture-maroc-article-145',
    title: 'Facture au Maroc : ce que dit l’article 145',
    formats: ['9x16'],
    segments: [
      { head: 'Facture au Maroc : article 145 du CGI', vo: 'Au Maroc, ce que doit contenir une facture est fixé par l’article 145 du Code général des impôts. Voici ce qu’on oublie le plus souvent.', scene: { k: 'big', text: 'Article 145', sub: 'Code général des impôts · Maroc' } },
      { head: '1. Ton IF + taxe professionnelle', vo: 'Un : ton identifiant fiscal et ton numéro de taxe professionnelle.', scene: { k: 'list', active: 0, items: LIST145() } },
      { head: '2. L’ICE du client', vo: 'Deux : l’ICE de ton client professionnel, pas seulement son nom.', scene: { k: 'list', active: 1, items: LIST145() } },
      { head: '3. TVA à part', vo: 'Trois : la TVA affichée à part, ou la mention d’exonération.', scene: { k: 'list', active: 2, items: LIST145() } },
      { head: '4. Le mode de paiement', vo: 'Quatre : le mode et les références de paiement.', scene: { k: 'list', active: 3, items: LIST145() } },
      { head: '5. Numérotation continue', vo: 'Cinq : une numérotation continue, sans trou ni doublon.', scene: { k: 'list', active: 4, items: LIST145() } },
      { head: 'Margokit te prévient', vo: 'Margokit vérifie l’ICE, te prévient s’il manque ton IF, et numérote pour toi. Vérifie toujours ta situation avec ton comptable.', scene: { k: 'phone', img: 'warning-if' } },
      { head: '', vo: 'Le guide complet est gratuit sur margokit point com.', scene: END('Guide gratuit : margokit.com/fr/guides') },
    ],
    caption: 'Source : article 145-III du CGI (édition DGI). Les auto-entrepreneurs relèvent de règles particulières (art. 145-XI).',
  },
  {
    id: 'V04-devis-en-facture-whatsapp',
    title: 'Devis accepté → facture en 1 clic',
    formats: ['9x16'],
    segments: [
      { head: 'Ton client vient de dire oui', vo: 'Ton client vient de dire oui sur WhatsApp. Ne recommence rien.', scene: { k: 'chat', msgs: [{ me: false, t: 'Bonjour ! C’est bon pour le devis, on lance 👍' }] } },
      { head: '1 clic', vo: 'Ouvre le devis, marque-le accepté, et transforme-le en facture. Tout est repris : client, lignes, montants.', scene: { k: 'phone', img: 'devis-accepte' } },
      { head: 'Envoi WhatsApp', vo: 'Partage-la directement sur WhatsApp : ton client reçoit un lien, voit la facture et la télécharge.', scene: { k: 'phone', img: 'facture-emise' } },
      { head: 'Ton client la voit sur son téléphone', vo: 'Et tu sais quand elle est payée.', scene: { k: 'phone', img: 'vue-client' } },
      { head: '', vo: 'Margokit. Gratuit pour commencer.', scene: END('Gratuit pour commencer') },
    ],
  },
  {
    id: 'V05-relances-automatiques',
    title: 'Arrête de courir après tes paiements',
    formats: ['9x16', '1x1'],
    segments: [
      { head: 'Relancer, c’est gênant', vo: 'Relancer un client, c’est gênant. Alors on attend. Et on n’est pas payé.', scene: { k: 'chat', msgs: [{ me: true, t: 'Bonjour, désolé de vous déranger… 😅' }] } },
      { head: 'Relances : activées', vo: 'Avec Margokit Pro, active les relances une fois.', scene: { k: 'phone', img: 'settings-relances' } },
      { head: 'J+1 · J+7 · J+15', vo: 'Un jour, sept jours et quinze jours après l’échéance, ton client reçoit un e-mail poli, à ton nom, avec le lien de la facture.', scene: { k: 'email' } },
      { head: 'S’arrête dès le paiement', vo: 'Dès que tu marques la facture payée, les relances s’arrêtent. Et tu peux les couper pour une facture en particulier.', scene: { k: 'phone', img: 'facture-retard' } },
      { head: '', vo: 'Essaie Pro sept jours, sans carte.', scene: END() },
    ],
  },
  {
    id: 'V06-page-revenus',
    title: 'Combien tu as vraiment encaissé cette année ?',
    formats: ['9x16', '16x9'],
    segments: [
      { head: 'Facturé ≠ encaissé', vo: 'Question simple : combien tu as encaissé cette année ? Pas facturé. Encaissé.', scene: { k: 'big', text: 'Facturé ≠ encaissé' } },
      { head: 'Mois par mois', vo: 'La page Revenus de Margokit te le dit, mois par mois.', scene: { k: 'card', img: 'revenus-clients', y: 480, h: 980 } },
      { head: 'Reste à encaisser · en retard', vo: 'Ce qui reste à encaisser, et la part déjà en retard.', scene: { k: 'phone', img: 'revenus' } },
      { head: 'Délai de paiement · meilleurs clients', vo: 'Ta facture moyenne, le délai moyen de paiement, et tes meilleurs clients.', scene: { k: 'card', img: 'revenus-clients', y: 0, h: 2300 } },
      { head: '', vo: 'Parfait pour préparer ton bilan avec ton comptable. Gratuit sur margokit point com.', scene: END('Page Revenus : gratuite') },
    ],
  },
  {
    id: 'V07-import-clients-excel',
    title: 'Importe tes clients depuis Excel',
    formats: ['9x16'],
    segments: [
      { head: 'Ne retape rien', vo: 'Tu as déjà tes clients dans Excel ? Ne les retape pas.', scene: { k: 'big', text: 'Excel → Margokit', sub: 'tes clients en 30 secondes' } },
      { head: 'Enregistre en CSV → Vérifier', vo: 'Enregistre-le en CSV, dépose-le dans Margokit, et clique sur Vérifier.', scene: { k: 'phone', img: 'import' } },
      { head: 'Rien n’est enregistré avant ta validation', vo: 'Margokit te dit combien de clients sont prêts, lesquels existent déjà, et quelles lignes corriger.', scene: { k: 'card', img: 'import', y: 2570, h: 880 } },
      { head: 'Clients importés ✅', vo: 'Un clic : tous tes clients sont là.', scene: { k: 'phone', img: 'clients-apres-import' } },
      { head: '', vo: 'Commence l’année proprement. Margokit point com.', scene: END('Import CSV : gratuit') },
    ],
  },
  {
    id: 'V08-factures-recurrentes',
    title: 'Tes factures de janvier sont déjà prêtes',
    formats: ['9x16'],
    segments: [
      { head: 'Les mêmes factures, chaque mois ?', vo: 'Tu factures les mêmes clients chaque mois ? Abonnement, maintenance, loyer, cours…', scene: { k: 'big', text: 'Chaque mois, la même facture ?' } },
      { head: 'Mensuelle · trimestrielle · annuelle', vo: 'Avec Margokit Pro, rends une facture récurrente : chaque mois, trimestre ou année.', scene: { k: 'phone', img: 'recurrente' } },
      { head: 'Brouillon prêt · tu gardes la main', vo: 'Le jour venu, un brouillon prêt t’attend et tu reçois un e-mail. Tu vérifies, tu émets. Rien ne part sans toi.', scene: { k: 'phone', img: 'documents' } },
      { head: '', vo: 'Essaie Pro sept jours, sans carte.', scene: END() },
    ],
  },
  {
    id: 'V09-seller-pack-tuto',
    title: 'Seller Pack : le tuto',
    formats: ['9x16', '16x9'],
    segments: [
      { head: 'ROAS 3 ≠ bénéfice', vo: 'Ton gestionnaire de pubs affiche un ROAS de trois. Ton compte en banque n’est pas d’accord.', scene: { k: 'big', text: 'ROAS 3 ≠ bénéfice' } },
      { head: '1 Google Sheet · 11 onglets', vo: 'Le Seller Pack, c’est un Google Sheet qui relie tes commandes, tes pubs, ton contenu et ta trésorerie.', scene: { k: 'pack', view: 'dashboard' } },
      { head: 'Bénéfice réel par commande', vo: 'Dans Commandes, tu notes chaque commande : le bénéfice réel se calcule, livraison, frais et colis refusés compris.', scene: { k: 'pack', view: 'orders' } },
      { head: '✅ rentable · ❌ perd de l’argent', vo: 'Dans Pubs et ROAS, une ligne par campagne : le Pack te dit si elle gagne ou perd de l’argent.', scene: { k: 'pack', view: 'ads' } },
      { head: 'Prix minimum · ROAS d’équilibre', vo: 'Le calculateur de prix te donne ton prix minimum et le coût maximum par commande en pub.', scene: { k: 'pack', view: 'pricing' } },
      { head: 'Tableau de bord', vo: 'Et le tableau de bord résume tout : bénéfice après pub, trésorerie, contenus publiés.', scene: { k: 'pack', view: 'dashboardTall' } },
      { head: '', vo: 'Versions en dirhams, euros et dollars, en français et en anglais. Trente-quatre dollars, une fois. Lien en bio.', scene: { k: 'end', cta: 'Seller Pack · 34 $ · MAD / EUR / USD', url: 'margokit.gumroad.com/l/seller-pack' } },
    ],
  },
  {
    id: 'V10-essai-pro-7-jours',
    title: 'Essaie Pro 7 jours, sans carte',
    formats: ['9x16', '1x1'],
    segments: [
      { head: '7 jours gratuits · sans carte', vo: 'Margokit Pro, sept jours gratuits. Sans carte bancaire.', scene: { k: 'phone', img: 'gratuit-essai-bandeau' } },
      { head: 'Illimité · relances · récurrentes', vo: 'Documents illimités, sans filigrane. Relances automatiques. Factures récurrentes.', scene: { k: 'phone', img: 'essai-actif' } },
      { head: '5 $/mois · 49 $/an · 99 $ à vie', vo: 'À la fin, tu choisis : cinq dollars par mois, quarante-neuf par an, ou quatre-vingt-dix-neuf à vie. Ou tu restes gratuit.', scene: { k: 'prices' } },
      { head: '', vo: 'Un clic depuis ton compte. Margokit point com.', scene: END() },
    ],
  },
  // Accroches courtes (15–20 s)
  ...[
    ['H1-dernier-numero', 'Le dernier numéro de facture, c’était douze ou treize ?', 'Margokit numérote pour toi, sans trou ni doublon.', 'facture-emise-haut', 'Le dernier numéro… 12 ou 13 ?'],
    ['H2-je-te-paie-la-semaine-prochaine', 'Ton client t’a dit : je te paie la semaine prochaine. C’était il y a un mois.', 'Avec Margokit Pro, les relances partent toutes seules.', 'settings-relances', '« Je te paie la semaine prochaine »'],
    ['H3-ice-du-client', 'L’ICE de ton client, tu l’as mis sur ta facture ?', 'Au Maroc, l’article 145 l’exige. Margokit le vérifie pour toi.', 'facture-emise-haut', 'L’ICE du client : il y est ?'],
    ['H4-trois-outils', 'Devis sur Word, facture sur Excel, relance sur WhatsApp. Trois outils pour un seul client.', 'Un seul outil : Margokit.', 'dashboard', 'Word + Excel + WhatsApp = 😩'],
    ['H5-combien-encaisse', 'Tu sais combien tu as encaissé cette année ?', 'La page Revenus te le dit en un coup d’œil.', 'revenus', 'Combien tu as encaissé en 2026 ?'],
    ['H6-roas-3', 'Ton ROAS est à trois et tu perds de l’argent.', 'Le Seller Pack te montre ton vrai bénéfice, campagne par campagne.', 'pack:ads', 'ROAS 3… et tu perds de l’argent ?'],
  ].map(([id, hook, follow, img, head]) => ({
    id,
    title: head,
    formats: ['9x16'],
    segments: [
      { head, vo: hook, scene: { k: 'big', text: head } },
      { head: id === 'H6-roas-3' ? 'Le Seller Pack' : 'Margokit', vo: follow, scene: img.startsWith('pack:') ? { k: 'pack', view: img.slice(5) } : { k: 'phone', img } },
      { head: '', vo: id === 'H6-roas-3' ? 'Lien en bio.' : 'Essaie Pro sept jours, sans carte. Lien en bio.', scene: id === 'H6-roas-3' ? { k: 'end', cta: 'Seller Pack · 34 $', url: 'margokit.gumroad.com/l/seller-pack' } : END() },
    ],
  })),
];

function LIST145() {
  return ['Ton IF + n° de taxe professionnelle', 'L’ICE du client professionnel', 'La TVA à part (ou l’exonération)', 'Le mode et les références de paiement', 'Une numérotation continue'];
}

/** Sigles épelés pour la voix (le sous-titre garde l'écriture normale). */
export const SAY = [
  [/\bICE\b/g, 'I C E'],
  [/\bIF\b/g, 'I F'],
  [/\bRIB\b/g, 'R I B'],
  [/\bCGI\b/g, 'C G I'],
  [/margokit point com/gi, 'margokit point com'],
];
export const SUB = [[/margokit point com/gi, 'margokit.com']];
