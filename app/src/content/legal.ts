/**
 * Terms of service and privacy policy (EN/FR).
 * Publisher details come from environment variables (the repository is public).
 * Have these texts reviewed by a legal professional before relying on them.
 */
export type LegalSection = { title: string; body: string[] };
export type LegalDoc = { title: string; updated: string; sections: LegalSection[] };

type Publisher = { entity: string; address: string; email: string };

export function publisher(): Publisher {
  return {
    entity: process.env.LEGAL_ENTITY || '[Legal name / Nom légal]',
    address: process.env.LEGAL_ADDRESS || '[Address / Adresse]',
    email: process.env.CONTACT_EMAIL || '[contact email]',
  };
}

const UPDATED = '2026-09-27';

export function terms(lang: 'en' | 'fr', p: Publisher): LegalDoc {
  if (lang === 'fr') {
    return {
      title: 'Conditions générales d’utilisation',
      updated: UPDATED,
      sections: [
        { title: '1. Éditeur', body: [`Margokit est édité par ${p.entity}, ${p.address}. Contact : ${p.email}.`] },
        { title: '2. Service', body: ['Margokit propose un calculateur de bénéfice gratuit et un logiciel en ligne de création de devis, factures et avoirs (« Margokit Pro »).', 'Le calculateur fournit des estimations à partir des chiffres que tu saisis ; il ne constitue pas un conseil financier.'] },
        { title: '3. Compte', body: ['Tu es responsable de l’exactitude des informations saisies et de la confidentialité de ton mot de passe. Un compte est personnel.', 'Nous pouvons suspendre un compte en cas d’usage frauduleux, abusif ou illégal.'] },
        { title: '4. Plans et paiement', body: ['Le plan gratuit permet d’émettre 3 documents par mois, avec la mention « Made with Margokit ».', 'Les abonnements Pro sont vendus par Gumroad, qui agit comme revendeur (merchant of record) : le paiement, la facturation et les taxes de vente sont gérés par Gumroad selon ses propres conditions. Certains accès peuvent aussi être activés par un code remis après un paiement direct.', 'L’abonnement mensuel se renouvelle jusqu’à son annulation depuis ton reçu Gumroad ; l’accès reste actif jusqu’à la fin de la période payée.', 'Remboursement : 14 jours après l’achat, sur simple demande.'] },
        { title: '5. Tes documents et ta responsabilité', body: ['Tu restes seul responsable du contenu de tes devis et factures, de leur conformité aux règles de ton pays (mentions obligatoires, TVA, numérotation, facture électronique) et de leur conservation pendant la durée légale.', 'Margokit t’aide à inclure les mentions usuelles et effectue des contrôles, mais ne remplace pas un expert-comptable ou un conseil juridique. Les exports Factur-X/UBL et la transmission via une plateforme agréée, lorsqu’ils sont proposés, dépendent aussi de ces prestataires.'] },
        { title: '6. Disponibilité', body: ['Nous faisons notre possible pour que le service soit disponible et tes données sauvegardées, sans pouvoir garantir une disponibilité ininterrompue. Pense à télécharger régulièrement tes PDF et à exporter tes données.'] },
        { title: '7. Propriété intellectuelle', body: ['Le logiciel, la marque et les contenus de Margokit restent notre propriété. Tes données et tes documents restent les tiens.'] },
        { title: '8. Responsabilité', body: ['Dans les limites permises par la loi, notre responsabilité est limitée au montant payé pour le service au cours des 12 derniers mois.'] },
        { title: '9. Résiliation', body: ['Tu peux supprimer ton compte à tout moment depuis Paramètres, après avoir exporté tes données.'] },
        { title: '10. Droit applicable', body: ['Ces conditions sont régies par le droit du pays de l’éditeur, sans préjudice des droits impératifs dont tu bénéficies comme consommateur dans ton pays de résidence.'] },
      ],
    };
  }
  return {
    title: 'Terms of service',
    updated: UPDATED,
    sections: [
      { title: '1. Publisher', body: [`Margokit is published by ${p.entity}, ${p.address}. Contact: ${p.email}.`] },
      { title: '2. Service', body: ['Margokit provides a free profit calculator and online software to create quotes, invoices and credit notes (“Margokit Pro”).', 'The calculator gives estimates based on the numbers you enter; it is not financial advice.'] },
      { title: '3. Account', body: ['You are responsible for the accuracy of the information you enter and for keeping your password secret. An account is personal.', 'We may suspend an account in case of fraudulent, abusive or illegal use.'] },
      { title: '4. Plans and payment', body: ['The free plan lets you issue 3 documents per month, with the “Made with Margokit” mention.', 'Pro subscriptions are sold by Gumroad, acting as merchant of record: payment, receipts and sales taxes are handled by Gumroad under its own terms. Some access may also be activated with a code delivered after a direct payment.', 'The monthly plan renews until you cancel it from your Gumroad receipt; access stays active until the end of the paid period.', 'Refunds: within 14 days of purchase, on request.'] },
      { title: '5. Your documents and your responsibility', body: ['You alone are responsible for the content of your quotes and invoices, their compliance with the rules of your country (mandatory mentions, VAT, numbering, e-invoicing) and for keeping them for the legal period.', 'Margokit helps you include the usual mentions and runs checks, but it does not replace an accountant or legal advice. Factur-X/UBL exports and transmission through an approved platform, when offered, also depend on those providers.'] },
      { title: '6. Availability', body: ['We do our best to keep the service available and your data backed up, but cannot guarantee uninterrupted availability. Download your PDFs and export your data regularly.'] },
      { title: '7. Intellectual property', body: ['The software, brand and content of Margokit remain ours. Your data and documents remain yours.'] },
      { title: '8. Liability', body: ['To the extent permitted by law, our liability is limited to the amount you paid for the service in the last 12 months.'] },
      { title: '9. Termination', body: ['You can delete your account at any time from Settings, after exporting your data.'] },
      { title: '10. Governing law', body: ['These terms are governed by the law of the publisher’s country, without prejudice to the mandatory consumer rights you have in your country of residence.'] },
    ],
  };
}

export function privacy(lang: 'en' | 'fr', p: Publisher): LegalDoc {
  if (lang === 'fr') {
    return {
      title: 'Politique de confidentialité',
      updated: UPDATED,
      sections: [
        { title: '1. Responsable du traitement', body: [`${p.entity}, ${p.address}. Contact : ${p.email}.`] },
        { title: '2. Données traitées', body: ['Compte : nom, e-mail, mot de passe (haché, jamais lisible), langue et fuseau horaire.', 'Contenu : informations de ton entreprise, clients, produits, devis, factures et paiements que tu saisis. Pour tes clients, tu agis comme responsable de traitement et Margokit comme sous-traitant.', 'Abonnement : informations d’achat transmises par Gumroad (e-mail, produit, montant, pays).', 'Technique : journaux de sécurité, adresse IP (limitation des abus), statistiques de visite anonymes (Vercel Analytics, sans cookie).', 'Le calculateur fonctionne dans ton navigateur : les chiffres saisis ne sont pas enregistrés.'] },
        { title: '3. Finalités et bases légales', body: ['Fournir le service (exécution du contrat) ; sécuriser le service et prévenir la fraude (intérêt légitime) ; gérer les abonnements (contrat) ; t’envoyer les e-mails liés au compte (contrat) et, si tu t’inscris, la newsletter (consentement, désinscription à tout moment).'] },
        { title: '4. Sous-traitants', body: ['Vercel (hébergement), MongoDB Atlas (base de données, région Union européenne), Resend (envoi d’e-mails), Gumroad (paiements), Google (connexion avec Google, si tu la choisis). Certains peuvent traiter des données hors de l’UE, avec des garanties appropriées (clauses contractuelles types).'] },
        { title: '5. Durée de conservation', body: ['Tant que ton compte existe. À la suppression du compte, tes données sont effacées de la base active ; les sauvegardes sont écrasées selon leur cycle de rotation.', 'Tu dois conserver tes factures pendant la durée légale de ton pays : exporte-les avant de supprimer ton compte.'] },
        { title: '6. Tes droits', body: ['Accès, rectification, effacement, portabilité (export JSON dans Paramètres), opposition et limitation. Écris-nous à l’adresse ci-dessus.', 'Tu peux saisir l’autorité de protection des données de ton pays (par exemple la CNIL en France, la CNDP au Maroc).'] },
        { title: '7. Cookies', body: ['Uniquement les cookies nécessaires à la connexion (session sécurisée). Aucun cookie publicitaire.'] },
        { title: '8. Sécurité', body: ['Chiffrement des échanges (HTTPS), mots de passe hachés, liens de partage aléatoires révocables, clés de licence chiffrées, limitation des tentatives, contrôle d’accès sur chaque requête.'] },
      ],
    };
  }
  return {
    title: 'Privacy policy',
    updated: UPDATED,
    sections: [
      { title: '1. Controller', body: [`${p.entity}, ${p.address}. Contact: ${p.email}.`] },
      { title: '2. Data we process', body: ['Account: name, email, password (hashed, never readable), language and time zone.', 'Content: your business details, clients, products, quotes, invoices and payments you enter. For your clients’ data, you are the controller and Margokit acts as a processor.', 'Subscription: purchase information sent by Gumroad (email, product, amount, country).', 'Technical: security logs, IP address (abuse prevention), anonymous visit statistics (Vercel Analytics, cookieless).', 'The calculator runs in your browser: the numbers you type are not stored.'] },
      { title: '3. Purposes and legal bases', body: ['Providing the service (contract); securing it and preventing fraud (legitimate interest); managing subscriptions (contract); sending account emails (contract) and, if you sign up, the newsletter (consent, unsubscribe anytime).'] },
      { title: '4. Processors', body: ['Vercel (hosting), MongoDB Atlas (database, European Union region), Resend (email delivery), Gumroad (payments), Google (Sign in with Google, if you use it). Some may process data outside the EU with appropriate safeguards (standard contractual clauses).'] },
      { title: '5. Retention', body: ['As long as your account exists. When you delete your account, your data is erased from the live database; backups are overwritten according to their rotation cycle.', 'You must keep your invoices for the legal period of your country: export them before deleting your account.'] },
      { title: '6. Your rights', body: ['Access, rectification, erasure, portability (JSON export in Settings), objection and restriction. Write to us at the address above.', 'You can lodge a complaint with your data protection authority (for example the CNIL in France, the CNDP in Morocco).'] },
      { title: '7. Cookies', body: ['Only the cookies required to keep you signed in (secure session). No advertising cookies.'] },
      { title: '8. Security', body: ['Encrypted connections (HTTPS), hashed passwords, random revocable share links, encrypted license keys, rate limiting, access control on every request.'] },
    ],
  };
}
