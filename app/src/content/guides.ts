/**
 * Editorial guides (SEO). Written in French and English only: Arabic URLs point to the French
 * version rather than showing an unreviewed translation. Regulatory content quotes its source;
 * numbers in examples are checked against the calculator (guides.test.ts).
 */
export type GuideLang = 'fr' | 'en';
export type Block = { h2: string; p?: string[]; list?: string[] };
export type GuideText = { slug: string; title: string; description: string; intro: string; blocks: Block[]; sources?: { label: string; url: string }[]; cta: { label: string; href: string } };
export type Guide = { id: string; updated: string; text: Record<GuideLang, GuideText> };

/** Worked example of the margin guide (MAD, cash on delivery). Checked by guides.test.ts. */
export const MARGIN_EXAMPLE = { price: 250, productCost: 90, packaging: 5, shipping: 35, returnCost: 15, adCostPerOrder: 40, returnRate: 0.25, platformPct: 0, platformFixed: 0, paymentPct: 0, adBudget: 0 };
export const MARGIN_EXAMPLE_RESULTS = { naiveProfit: 80, profit: 48.33, margin: 19.3, breakEvenPrice: 201.67, maxAdCost: 76.25, breakEvenRoas: 3.28 };

export const GUIDES: Guide[] = [
  {
    id: 'morocco-invoice',
    updated: '2026-11-22',
    text: {
      fr: {
        slug: 'facture-maroc-mentions-obligatoires',
        title: 'Facture au Maroc : les mentions obligatoires (article 145 du CGI)',
        description: 'Ce qu’une facture doit contenir au Maroc selon l’article 145 du Code général des impôts : identité, IF, taxe professionnelle, ICE du client, TVA, paiement, numérotation continue.',
        intro: 'Au Maroc, le contenu des factures est fixé par l’article 145 du Code général des impôts (CGI). Voici ce que dit le texte, et comment l’appliquer sans rien oublier.',
        blocks: [
          { h2: 'Qui est concerné', p: ['Les contribuables qui vendent à des acheteurs ou clients doivent leur délivrer des factures ou mémoires. L’article 145-XI exclut de ces dispositions les personnes physiques relevant du régime de l’auto-entrepreneur ou de la contribution professionnelle unique (CPU).'] },
          {
            h2: 'Les mentions obligatoires (article 145-III)',
            p: ['En plus des indications habituelles d’ordre commercial, la facture doit mentionner :'],
            list: [
              '1° l’identité du vendeur ;',
              '2° le numéro d’identification fiscale (IF) attribué par le service local des impôts, ainsi que le numéro d’article d’imposition à la taxe professionnelle ;',
              '3° la date de l’opération ;',
              '4° les nom, prénoms ou raison sociale et adresse des acheteurs ou clients, et leur identifiant commun de l’entreprise (ICE) ;',
              '5° les prix, quantités et nature des marchandises vendues, des travaux exécutés ou des services rendus ;',
              '6° de manière distincte, le montant de la TVA réclamée en sus du prix ou comprise dans le prix — pour les opérations exonérées ou en régime suspensif (articles 91, 92 et 94), la mention de la taxe est remplacée par l’indication de l’exonération ou du régime ;',
              '7° les références et le mode de paiement se rapportant à la facture ;',
              '8° tous autres renseignements prescrits par les dispositions légales.',
            ],
          },
          { h2: 'Une numérotation continue', p: ['Les factures doivent être pré-numérotées et tirées d’une série continue, ou éditées par un système informatique selon une série continue : pas de trou, pas de doublon, pas de numéro réutilisé.'] },
          { h2: 'Ventes aux particuliers', p: ['Pour la vente de produits ou de marchandises à des particuliers, le ticket de caisse peut tenir lieu de facture. Il doit indiquer au moins la date, l’identification du vendeur, la désignation du produit, la quantité et le prix, avec la TVA le cas échéant.'] },
          {
            h2: 'Comment Margokit t’aide',
            list: [
              'Champs dédiés pour ton ICE (15 chiffres, vérifiés), ton IF, ton RC, ta taxe professionnelle et ta CNSS, enregistrés une fois et repris sur chaque facture.',
              'Avant l’émission : ton ICE et celui de ton client professionnel sont exigés ; un avertissement te signale un IF ou une taxe professionnelle manquants.',
              'Numéro attribué à l’émission depuis un compteur continu, puis facture verrouillée : une erreur se corrige par un avoir.',
              'TVA calculée par taux et affichée à part, mention d’exonération sur les lignes exonérées, montants en dirhams.',
              'Ton RIB et tes liens de paiement apparaissent sur la facture pour indiquer le mode de paiement.',
            ],
          },
          { h2: 'À vérifier de ton côté', p: ['Ce guide reprend l’article 145-III tel que publié par la DGI dans l’édition 2023 du CGI. Les lois de finances modifient régulièrement le code : vérifie l’édition en vigueur sur le site de la DGI et fais valider ta situation par ton comptable. Margokit t’aide à bien facturer mais ne remplace pas un conseil fiscal.'] },
        ],
        sources: [{ label: 'Direction générale des impôts — Code général des impôts', url: 'https://www.tax.gov.ma' }],
        cta: { label: 'Créer une facture conforme gratuitement', href: '/signup' },
      },
      en: {
        slug: 'morocco-invoice-requirements',
        title: 'Invoicing in Morocco: mandatory invoice details (tax code, article 145)',
        description: 'What an invoice must show in Morocco under article 145 of the General Tax Code: seller identity, tax ID, business tax number, client ICE, VAT, payment, sequential numbering.',
        intro: 'In Morocco, what an invoice must contain is set by article 145 of the General Tax Code (CGI). Here is what the text says, and how to apply it without missing anything.',
        blocks: [
          { h2: 'Who it applies to', p: ['Taxpayers selling to buyers or clients must issue them invoices. Article 145-XI excludes individuals under the auto-entrepreneur regime or the single professional contribution (CPU) regime.'] },
          {
            h2: 'Mandatory details (article 145-III)',
            p: ['On top of the usual commercial information, the invoice must show:'],
            list: [
              '1° the seller’s identity;',
              '2° the tax identification number (IF) given by the local tax office, and the business tax (taxe professionnelle) registration number;',
              '3° the date of the transaction;',
              '4° the buyer’s name or company name, address and common company identifier (ICE);',
              '5° prices, quantities and nature of the goods sold, work performed or services provided;',
              '6° separately, the VAT amount charged on top of or included in the price — for exempt or suspended operations (articles 91, 92 and 94), the exemption or regime is stated instead;',
              '7° the payment references and method for the invoice;',
              '8° any other information required by law.',
            ],
          },
          { h2: 'Sequential numbering', p: ['Invoices must be pre-numbered from a continuous series, or issued by a computer system following a continuous series: no gaps, no duplicates, no reused numbers.'] },
          { h2: 'Sales to individuals', p: ['When selling products to individuals, a till receipt can replace the invoice. It must show at least the date, the seller, the product, the quantity and the price, with VAT where applicable.'] },
          {
            h2: 'How Margokit helps',
            list: [
              'Dedicated fields for your ICE (15 digits, checked), tax ID (IF), trade register (RC), business tax number and CNSS, saved once and printed on every invoice.',
              'Before issuing: your ICE and your business client’s ICE are required; a warning tells you when the IF or business tax number is missing.',
              'The number is assigned at issue from a continuous counter, then the invoice is locked: mistakes are fixed with a credit note.',
              'VAT computed per rate and shown separately, exemption mention on exempt lines, amounts in dirhams.',
              'Your bank details and payment links are printed on the invoice to state the payment method.',
            ],
          },
          { h2: 'What to check yourself', p: ['This guide follows article 145-III as published by the tax administration (DGI) in the 2023 edition of the tax code. Finance laws change the code regularly: check the current edition on the DGI website and have your situation reviewed by your accountant. Margokit helps you invoice correctly but is not tax advice.'] },
        ],
        sources: [{ label: 'Direction générale des impôts — General Tax Code (French)', url: 'https://www.tax.gov.ma' }],
        cta: { label: 'Create a compliant invoice for free', href: '/signup' },
      },
    },
  },
  {
    id: 'profit-margin',
    updated: '2026-11-22',
    text: {
      fr: {
        slug: 'calculer-marge-benefice-vente',
        title: 'Calculer sa marge et son vrai bénéfice sur chaque vente',
        description: 'La méthode pour connaître ton bénéfice réel par commande : coût du produit, livraison, publicité et colis refusés inclus, avec un exemple chiffré et le ROAS minimum.',
        intro: 'Vendre 250 dirhams un produit qui en coûte 90 ne veut pas dire gagner 160 dirhams. Livraison, publicité et colis refusés mangent une grande partie de l’écart. Voici comment calculer ce que tu gardes vraiment.',
        blocks: [
          { h2: 'Chiffre d’affaires, marge, bénéfice', p: ['Le chiffre d’affaires, c’est ce que paie le client. Le bénéfice, c’est ce qui reste une fois tous les coûts de la vente payés. La marge nette, c’est ce bénéfice divisé par le prix de vente : une marge de 20 % signifie que tu gardes 20 dirhams sur 100 encaissés.'] },
          {
            h2: 'Tous les coûts d’une commande',
            list: [
              'le coût du produit (achat ou fabrication) ;',
              'l’emballage ;',
              'la livraison, payée pour chaque colis expédié ;',
              'les frais de plateforme et de paiement, souvent un pourcentage du prix ;',
              'la publicité ramenée à une commande (budget publicitaire ÷ nombre de commandes) ;',
              'les colis refusés ou retournés : tu as payé l’envoi, parfois le retour, et tu n’encaisses rien.',
            ],
          },
          { h2: 'Le piège des colis refusés', p: ['Avec la livraison contre remboursement, une partie des colis revient. Si 1 colis sur 4 est refusé, il faut expédier 4 colis pour en livrer 3 : la livraison et la publicité de chaque colis perdu sont à payer par les ventes réussies. C’est la principale différence entre le bénéfice « sur le papier » et le vrai bénéfice.'] },
          {
            h2: 'Exemple chiffré',
            p: ['Prix 250 DH, produit 90 DH, emballage 5 DH, livraison 35 DH, frais de retour 15 DH, publicité 40 DH par commande, 25 % de colis refusés, sans frais de plateforme.'],
            list: [
              'Calcul naïf : 250 − 90 − 5 − 35 − 40 = 80 DH par vente (32 %).',
              'Vrai bénéfice par commande livrée, colis refusés inclus : 48,33 DH, soit une marge de 19,3 %.',
              'Prix minimum pour ne pas perdre d’argent : 201,67 DH.',
              'Coût publicitaire maximum par commande avant de perdre de l’argent : 76,25 DH, soit un ROAS minimum de 3,28 (prix ÷ coût publicitaire).',
            ],
          },
          { h2: 'Ce qu’il faut retenir', p: ['Suis ton taux de colis refusés et ton coût publicitaire par commande : ce sont les deux chiffres qui font le plus varier ta marge. En dessous de 20 % de marge, la moindre hausse du coût de la publicité ou des retours fait passer une vente en perte.'] },
        ],
        cta: { label: 'Calculer mon vrai bénéfice', href: '/calculator' },
      },
      en: {
        slug: 'calculate-profit-margin-per-sale',
        title: 'How to calculate your real profit margin on every sale',
        description: 'The method to know your real profit per order: product cost, shipping, ads and refused parcels included, with a worked example and the minimum ROAS.',
        intro: 'Selling a product for 250 dirhams that costs 90 doesn’t mean you earn 160. Shipping, ads and refused parcels eat a large part of the gap. Here is how to calculate what you really keep.',
        blocks: [
          { h2: 'Revenue, margin, profit', p: ['Revenue is what the client pays. Profit is what is left once every cost of the sale is paid. Net margin is that profit divided by the selling price: a 20% margin means you keep 20 for every 100 collected.'] },
          {
            h2: 'Every cost of an order',
            list: ['the product cost (purchase or production);', 'packaging;', 'shipping, paid for every parcel sent;', 'platform and payment fees, often a percentage of the price;', 'advertising per order (ad budget ÷ number of orders);', 'refused or returned parcels: you paid to send them, sometimes to bring them back, and collected nothing.'],
          },
          { h2: 'The refused-parcel trap', p: ['With cash on delivery, some parcels come back. If 1 parcel in 4 is refused, you ship 4 parcels to deliver 3: shipping and ads of every lost parcel are paid by the successful sales. That is the main difference between profit “on paper” and real profit.'] },
          {
            h2: 'Worked example',
            p: ['Price 250 MAD, product 90 MAD, packaging 5 MAD, shipping 35 MAD, return fee 15 MAD, ads 40 MAD per order, 25% refused parcels, no platform fees.'],
            list: ['Naive calculation: 250 − 90 − 5 − 35 − 40 = 80 MAD per sale (32%).', 'Real profit per delivered order, refused parcels included: 48.33 MAD, a 19.3% margin.', 'Minimum price to avoid losing money: 201.67 MAD.', 'Maximum ad cost per order before losing money: 76.25 MAD, i.e. a minimum ROAS of 3.28 (price ÷ ad cost).'],
          },
          { h2: 'Key takeaways', p: ['Track your refused-parcel rate and your ad cost per order: they move your margin the most. Below a 20% margin, the slightest rise in ad costs or returns turns a sale into a loss.'] },
        ],
        cta: { label: 'Calculate my real profit', href: '/calculator' },
      },
    },
  },
  {
    id: 'freelance-quote',
    updated: '2026-11-22',
    text: {
      fr: {
        slug: 'faire-un-devis-freelance',
        title: 'Faire un devis professionnel en freelance (et le transformer en facture)',
        description: 'Ce qu’un bon devis de freelance doit contenir, comment présenter les lignes et les conditions, puis passer du devis accepté à la facture sans ressaisie.',
        intro: 'Un devis clair rassure le client, évite les malentendus sur le prix et accélère la signature. Voici ce qu’il doit contenir et comment le transformer en facture une fois accepté.',
        blocks: [
          {
            h2: 'Ce que doit contenir un devis',
            list: [
              'ton identité et tes coordonnées professionnelles, avec tes identifiants (ICE, SIREN, n° de TVA… selon ton pays) ;',
              'l’identité et l’adresse du client ;',
              'un numéro et une date ;',
              'la description précise de chaque prestation, la quantité (heures, jours, forfait) et le prix unitaire ;',
              'le total hors taxes, la TVA et le total toutes taxes comprises ;',
              'la date de validité de l’offre ;',
              'les conditions : délai de réalisation, acompte éventuel, conditions et délai de paiement.',
            ],
          },
          { h2: 'Bien découper les lignes', p: ['Une ligne par livrable plutôt qu’un forfait unique : le client voit ce qu’il paie, et il peut retirer une option sans tout renégocier. Indique ce qui n’est pas inclus (révisions supplémentaires, frais de déplacement) pour éviter les discussions plus tard.'] },
          { h2: 'Prévoir un acompte', p: ['Pour un projet long, demande un acompte au démarrage (30 % est courant). Facture-le avec une facture d’acompte : le solde sera facturé à la livraison, en déduisant l’acompte déjà payé.'] },
          { h2: 'Du devis accepté à la facture', p: ['Dans Margokit, un devis accepté se transforme en facture en un clic : client, lignes, prix et TVA sont repris, la facture reçoit le numéro suivant de ta série à l’émission. Le devis passe au statut « accepté » et tu gardes l’historique.'] },
          { h2: 'Envoyer et suivre', p: ['Partage le devis par lien, e-mail ou WhatsApp, avec le PDF. Après l’émission de la facture, tu suis les paiements, les retards et, avec Pro, les relances automatiques.'] },
        ],
        cta: { label: 'Faire mon premier devis gratuitement', href: '/signup' },
      },
      en: {
        slug: 'how-to-write-a-freelance-quote',
        title: 'How to write a professional freelance quote (and turn it into an invoice)',
        description: 'What a good freelance quote must contain, how to present lines and terms, then turn an accepted quote into an invoice without retyping.',
        intro: 'A clear quote reassures the client, avoids price misunderstandings and gets signed faster. Here is what it must contain and how to turn it into an invoice once accepted.',
        blocks: [
          {
            h2: 'What a quote must contain',
            list: ['your identity and business details, with your identifiers (ICE, SIREN, VAT number… depending on your country);', 'the client’s identity and address;', 'a number and a date;', 'a precise description of each service, the quantity (hours, days, fixed fee) and unit price;', 'the total before tax, the VAT and the total including tax;', 'how long the offer is valid;', 'terms: delivery time, possible deposit, payment terms.'],
          },
          { h2: 'Split the lines well', p: ['One line per deliverable rather than one lump sum: the client sees what they pay for and can drop an option without renegotiating everything. State what is not included (extra revisions, travel costs) to avoid discussions later.'] },
          { h2: 'Ask for a deposit', p: ['For a long project, ask for a deposit at the start (30% is common). Invoice it with a deposit invoice: the balance is invoiced on delivery, minus the deposit already paid.'] },
          { h2: 'From accepted quote to invoice', p: ['In Margokit, an accepted quote becomes an invoice in one click: client, lines, prices and VAT are copied, and the invoice gets the next number of your series when issued. The quote is marked “accepted” and you keep the history.'] },
          { h2: 'Send and follow up', p: ['Share the quote by link, email or WhatsApp, with the PDF. Once the invoice is issued, you track payments, late invoices and, with Pro, automatic reminders.'] },
        ],
        cta: { label: 'Write my first quote for free', href: '/signup' },
      },
    },
  },
];

export const guideLang = (locale: string): GuideLang => (locale === 'en' ? 'en' : 'fr');
export const findGuide = (lang: GuideLang, slug: string) => GUIDES.find((g) => g.text[lang].slug === slug);
/** Same guide in another language (for language switching and hreflang). */
export const findGuideAnyLang = (slug: string) => GUIDES.find((g) => g.text.fr.slug === slug || g.text.en.slug === slug);
