# Margokit Pro — architecture et plan de développement

> Statut : **v2, à valider** (phase 7a). Intègre : conformité facture électronique (France + international), architecture prête pour un prestataire de paiement par carte, conception internationale.

## 1. Décisions clés

| Sujet | Décision | Raison |
|---|---|---|
| Authentification | **Better Auth** (au lieu d'Auth.js) | Auth.js est passé sous la responsabilité de l'équipe Better Auth et n'est plus qu'en maintenance de sécurité ; ses mainteneurs recommandent Better Auth pour les nouveaux projets. |
| Modèle de facture | **Aligné dès le départ sur la norme européenne EN 16931** | C'est le modèle de données commun à Factur-X (France, Allemagne), UBL/Peppol (Belgique, Pays-Bas, Nordiques…) et XRechnung. Structurer les données correctement dès M2 évite de tout refaire plus tard. |
| Facture électronique française | **3 niveaux** : mentions + règles (au lancement) → export Factur-X/UBL → transmission via une Plateforme Agréée partenaire | Un logiciel ne peut pas transmettre lui-même à l'administration : seule une Plateforme Agréée (immatriculée par la DGFiP) le peut. Margokit devient une « solution compatible » connectée à une PA. |
| Paiements | **Couche d'abstraction `BillingProvider`** (Gumroad aujourd'hui) + **liens de paiement sur les factures** | Tu pourras brancher un prestataire (Paddle, Lemon Squeezy, Stripe, CMI…) sans toucher au reste de l'app. |
| Webhooks de paiement | **Jamais de confiance aveugle** : URL secrète ou signature + revérification API + idempotence | Le Ping Gumroad n'est pas signé. |
| International | **Registre de règles par pays** (identifiants fiscaux, mentions obligatoires, catégories de TVA, réseau de facture électronique) | Ajouter un pays = ajouter une entrée de configuration, pas du code dispersé. |
| Factures émises | **Immuables** ; corrections uniquement par **avoir** | Obligation légale en France et dans la plupart des pays (une facture émise ne se modifie ni ne se supprime). |
| Site | L'app devient `margokit.com` et reprend le calculateur (`profit.ts`) | Un seul site, un seul SEO. |
| Logos | Stockés dans MongoDB (≤ 200 Ko, PNG/JPEG/WebP, pas de SVG) | Pas de service en plus ; le SVG peut contenir du JavaScript. |
| E-mails | Resend | Réinitialisation de mot de passe, envoi de documents, rappels. |

## 2. Vue d'ensemble

```text
                          ┌─────────────────── Vercel (Next.js 16) ───────────────────┐
 Visiteur ───────────────►│ /[locale]                 landing + calculateur            │
 Utilisateur ────────────►│ /[locale]/app/*           Margokit Pro                     │
 Client de l'utilisateur ►│ /[locale]/d/[token]       document public + « Payer »      │
 Admin ──────────────────►│ /[locale]/admin/*         rôle admin                       │
                          │ /api/auth/*               Better Auth                      │
 Gumroad / futur PSP ────►│ /api/webhooks/[provider]  abonnements Margokit             │
 Plateforme Agréée ──────►│ /api/einvoicing/[pa]      statuts du cycle de vie          │
 Vercel Cron (1×/jour) ──►│ /api/cron/daily           rappels, relances, revérifs      │
                          └───┬──────────┬───────────┬──────────────┬─────────────────┘
                              │          │           │              │
                      MongoDB Atlas   Gumroad /   Plateforme     Resend
                      (région UE)     PSP (futur) Agréée / Peppol (e-mails)
                                                  (niveau 3)
```

Mutations par Server Actions, Route Handlers pour PDF, XML, webhooks, cron et Better Auth. **Toute la logique (totaux, taxes, numérotation, droits) est côté serveur.**

## 3. Pile technique

| Rôle | Choix |
|---|---|
| Framework | Next.js 16 (App Router, `proxy.ts`), TypeScript strict |
| UI | Tailwind CSS 4, jetons Margokit, mode sombre, RTL prêt (propriétés logiques `ms-`/`me-`, `dir` sur `<html>`) |
| i18n | next-intl 4 : `en`, `fr` au lancement ; `ar` (RTL), `es` ensuite. Langue de l'interface ≠ langue du document (une facture en anglais depuis une interface en français) |
| Base | MongoDB Atlas, **cluster en région UE** (RGPD) + Mongoose ; Better Auth via l'adaptateur MongoDB |
| Auth | Better Auth : e-mail + mot de passe, Google, vérification d'e-mail, plugin `admin`, limitation de débit |
| Validation | Zod sur toutes les entrées serveur |
| PDF | `@react-pdf/renderer` (PDF lisible) → post-traitement PDF/A-3 + XML pour Factur-X (niveau 2) |
| Facture électronique | Génération CII (Factur-X) et UBL (Peppol BIS 3.0) depuis le même modèle EN 16931 ; bibliothèque candidate : `@stackforge-eu/factur-x` (à évaluer en M8) |
| Tests | Vitest (calculs, taxes, numérotation, règles pays, licences, XML), Playwright (parcours critiques) |

## 4. Modèles de données

Montants en **unités mineures entières** selon la devise (2 décimales pour EUR/USD/MAD, 0 pour XOF/JPY, 3 pour TND/KWD) : aucune erreur d'arrondi. Chaque document métier porte `userId`, indexé ; **toutes** les requêtes filtrent par l'utilisateur de la session.

**User** (Better Auth + champs) : `role`, `uiLocale`, `timeZone` (dates d'échéance et « en retard » calculées dans le fuseau de l'utilisateur), `plan` (cache), `planExpiresAt`, `planCheckedAt`.

**BusinessProfile** :
- Identité : `legalName`, `tradeName`, `logo`, `address` (structurée : ligne 1-2, code postal, ville, région, **pays ISO**), `email`, `phone`, `website`.
- Identifiants (selon le pays, voir §6) : `ids: [{ scheme, value }]` — ex. France `SIREN`, `SIRET`, `VAT` ; Maroc `ICE`, `IF`, `RC`, `PATENTE`, `CNSS` ; Belgique `BCE`, `VAT` ; générique `TIN`.
- Fiscalité : `vatRegime` (`standard`, `franchise` — « TVA non applicable, art. 293 B du CGI » en France —, `exempt`, `not_registered`), `vatOnDebits` (option TVA sur les débits, mention française), `taxRates: [{ name, rate, category }]`.
- Paiement : `bankAccounts: [{ label, iban, bic, accountNumber, bankName }]`, `paymentLinks: [{ label, url }]` (Stripe, PayPal, Wise, CMI…), `paymentTerms` par défaut (ex. 30 jours), `latePenaltyText`, `recoveryFeeText` (France : indemnité forfaitaire de 40 € entre professionnels).
- Documents : `defaultCurrency`, `defaultDocLocale`, `numbering` (motifs par type), `legalMentions` libres, `footer`.

**Client** : `kind: 'business' | 'individual'`, `name`, `address` structurée + pays, `ids` (SIREN obligatoire pour un client entreprise française à partir de la réforme, n° de TVA intracommunautaire…), `email`, `phone`, `deliveryAddress` (si différente), `preferredDocLocale`, `preferredCurrency`, `einvoicing: { network, endpointId }` (adresse Peppol / annuaire PA, niveau 3).

**Product** : `name`, `description`, `unitPrice`, `currency`, `unitCode` (codes UN/ECE Rec 20 : `C62` pièce, `HUR` heure, `DAY` jour…), `taxRate`, `vatCategory`, `kind: 'goods' | 'service'` (sert à la « nature de l'opération »).

**Document** :
- `type: 'quote' | 'invoice' | 'credit_note' | 'deposit_invoice'` (devis, facture, avoir, facture d'acompte).
- `number` (attribué **à l'émission**, pas au brouillon : pas de trou dans la séquence), `status` :
  - devis : `draft → sent → accepted | declined | expired`
  - facture : `draft → issued → sent → partially_paid → paid` (+ `overdue` calculé, `cancelled` par avoir)
- **Figés à l'émission** : copie du vendeur (profil) et de l'acheteur (client), taux, mentions. Une facture émise ne change plus jamais, même si le profil ou le client change ensuite.
- En-tête : `issueDate`, `dueDate`, `serviceDate` ou période, `currency`, `docLocale`, `operationCategory` (`goods`, `services`, `mixed` — nouvelle mention FR), `deliveryAddress`, `buyerReference` / n° de bon de commande, `precedingInvoice` (pour un avoir).
- Lignes : `description`, `qty` (3 décimales), `unitCode`, `unitPrice`, `discount`, `vatCategory` (EN 16931 : `S` normal, `Z` taux zéro, `E` exonéré, `AE` autoliquidation, `K` livraison intracommunautaire, `G` export, `O` hors champ), `taxRate`, `exemptionReason` (texte + code VATEX).
- Totaux calculés au serveur : `lineTotal`, `taxBreakdown: [{ category, rate, base, amount }]`, `totalExclTax`, `totalTax`, `totalInclTax`, `paid`, `amountDue`.
- Paiement : `paymentMeans` (virement, carte, espèces…), `bankAccount` choisi, `paymentLink`.
- Facture électronique : `einvoice: { format, xmlHash, provider, providerId, lifecycle: [{ status, at, reason }] }`.
- `publicTokenHash`, `convertedFromId`, `watermark`, `issuedAt`, `lockedAt`.

**Payment** (encaissements) : `documentId`, `amount`, `date`, `method`, `reference`, `source: 'manual' | 'provider'`. Paiements partiels, statut « payé » automatique, et statut « encaissée » à transmettre à la PA (TVA sur les encaissements, niveau 3).

**Counter** : séquence atomique par utilisateur, type et période (`findOneAndUpdate` + `$inc`), pour une numérotation chronologique et continue.

**Subscription** (abonnement de l'utilisateur à Margokit) : `plan`, `provider: 'gumroad' | 'manual' | …`, `status`, `startsAt`, `expiresAt`, `external: { productId, customerId, subscriptionId, saleId }`, `licenseKeyEnc` + `licenseKeyHash` (unique), `lastCheckedAt`.

**ActivationCode** : `codeHash` (HMAC-SHA256), `batch`, `durationDays | null`, `note`, `createdBy`, `usedBy`, `usedAt`, `revokedAt`.

**BillingEvent** (journal des webhooks, ex-SaleEvent) : `provider`, `eventId` (unique = idempotence), `type`, `productId`, `email`, `amount`, `currency`, `country`, `isTest`, `verified`, `raw`, `receivedAt`, `linkedUserId`.

**AuditLog** : actions sensibles (émission, avoir, suppression, actions admin) : qui, quoi, quand. Utile pour la piste d'audit fiable exigée en France.

**RateLimit** : `{ key, count, expiresAt }` + index TTL.

## 5. Facture électronique

### Niveau 1 — au lancement (M2-M4) : factures « prêtes pour la réforme »
- Mentions obligatoires classiques + **les 4 nouvelles mentions françaises** : SIREN du client, adresse de livraison (si différente), nature de l'opération (biens / services / mixte), option pour la TVA sur les débits.
- **Contrôles avant émission** selon le pays du vendeur et de l'acheteur : ex. vendeur FR + client entreprise FR → SIREN du client obligatoire ; régime franchise → mention 293 B ajoutée automatiquement ; client UE avec n° de TVA → autoliquidation proposée.
- Numérotation chronologique et continue attribuée à l'émission ; facture émise non modifiable ; corrections par avoir ; piste d'audit.
- Conservation : les factures émises ne sont jamais supprimées avec le compte (obligation de conservation, 10 ans en France) ; export complet (PDF + CSV) disponible à tout moment.

### Niveau 2 — M8 : export des formats structurés
- **Factur-X** (PDF/A-3 + XML CII, profil EN 16931) : format de référence en France et en Allemagne (ZUGFeRD) ; accepté par les Plateformes Agréées.
- **UBL Peppol BIS Billing 3.0** : Belgique (obligatoire en B2B depuis le 1er janvier 2026) et réseau Peppol.
- Validation : schémas XSD dans l'app + règles officielles (Schematron) dans les tests automatiques.
- Résultat : un utilisateur français peut déposer ses factures Margokit sur la PA de son choix → **conforme pour l'émission de 2027**.

### Niveau 3 — M9 (après le lancement) : transmission directe
- Interface `EInvoicingProvider { send, getStatus, handleWebhook }` ; première implémentation : **une Plateforme Agréée partenaire avec API** (critères : présente sur la liste officielle de la DGFiP, API documentée, prix par facture, réception gratuite pour les utilisateurs).
- Cycle de vie remonté dans l'app (déposée, reçue, acceptée, refusée, **encaissée**…) ; e-reporting (ventes aux particuliers et à l'étranger) assuré via la PA.
- Même interface pour un **point d'accès Peppol** (Belgique et autres pays).
- Margokit ne peut pas devenir lui-même Plateforme Agréée (immatriculation DGFiP, certifications lourdes) : ce n'est pas l'objectif.

### Autres pays
| Pays | Statut dans Margokit |
|---|---|
| France | Niveaux 1 → 3 (priorité) |
| Belgique | Niveau 2 (UBL Peppol) puis point d'accès Peppol |
| Allemagne | Niveau 2 (Factur-X = ZUGFeRD ; XRechnung plus tard) |
| Maroc | Mentions obligatoires (ICE, IF, RC, Patente, CNSS) ; la facture électronique marocaine est en préparation à la DGI : à surveiller |
| Espagne (Verifactu), Pologne (KSeF), Italie (SDI) | Systèmes nationaux spécifiques : **non couverts au lancement**. L'app l'indique clairement aux utilisateurs de ces pays pour les ventes locales B2B |
| Reste du monde | PDF avec mentions configurables |

## 6. International

- **Registre de règles par pays** (`src/lib/countries/*.ts`) : libellés et formats des identifiants (validation SIREN/SIRET par clé de Luhn, format des n° de TVA UE, ICE à 15 chiffres…), mentions obligatoires, catégories et taux de TVA suggérés, textes d'exonération, réseau de facture électronique, format d'adresse. Chaque règle est testée.
- **Devises** : ISO 4217, décimales tirées de `Intl`. Chaque document a une seule devise ; le tableau de bord affiche les totaux **par devise** (jamais d'addition de dirhams et d'euros).
- **Langues** : interface et documents indépendants ; PDF et XML traduits (libellés EN/FR au lancement).
- **Dates et fuseaux** : dates stockées en UTC, affichées et comparées dans le fuseau de l'utilisateur.
- **Données personnelles** : cluster MongoDB en région UE ; export et suppression de compte (RGPD, loi marocaine 09-08) ; politique de confidentialité et CGU EN/FR ; sous-traitants listés (Vercel, MongoDB, Resend, Gumroad).

## 7. Paiements

**A. Abonnements à Margokit (ton revenu)**
- Interface `BillingProvider { verifyPurchase, getSubscriptionStatus, handleWebhook, checkoutUrl }`.
- `gumroad` au lancement (clés de licence + Ping) ; `manual` (codes d'activation WhatsApp).
- Plus tard : un prestataire de paiement par carte (Paddle ou Lemon Squeezy en « merchant of record », Stripe si tu crées une société dans un pays éligible, CMI pour le Maroc) = une nouvelle implémentation + une route `/api/webhooks/[provider]` avec **vérification de signature**. Les droits de l'utilisateur ne dépendent que de `Subscription`, quel que soit le prestataire.
- Pages de prix déjà prévues pour plusieurs devises.

**B. Encaissement des factures de tes utilisateurs**
- Au lancement : coordonnées bancaires + **liens de paiement** de l'utilisateur (Stripe Payment Link, PayPal, Wise, CMI…) affichés sur le PDF et la page publique, bouton « Payer », **QR code de virement SEPA** (norme EPC) pour les factures en euros, saisie manuelle des encaissements.
- Plus tard : paiement en ligne intégré via le prestataire choisi (compte connecté de l'utilisateur) → facture marquée payée automatiquement → statut « encaissée » envoyé à la PA.

## 8. Licences et abonnements Gumroad

- Produits : `Margokit Pro — Monthly` (abonnement) et `Margokit Pro — Lifetime`, clés de licence activées.
- `/activate` : limite de 5 essais / 15 min ; `POST https://api.gumroad.com/v2/licenses/verify` avec `product_id` (obligatoire pour les produits créés après le 9 janvier 2023) + `license_key` ; refus si remboursée, contestée, annulée, échouée, terminée ou déjà liée à un autre compte ; clé stockée chiffrée (AES-256-GCM).
- Revérification des abonnements : à la connexion (cache 24 h) et par le cron quotidien ; en cas d'indisponibilité de Gumroad, pas de coupure.
- Ping : `/api/webhooks/gumroad/<SECRET>` → idempotence sur `sale_id` → journal → revérification API → activation automatique si l'e-mail correspond à un compte. Remboursements et annulations via `resource_subscriptions`.
- Codes manuels : `MK-XXXX-XXXX-XXXX`, `crypto.randomBytes`, HMAC-SHA256, usage unique, 30 jours ou à vie, affichés une seule fois.
- Plan gratuit : 3 documents émis par mois, filigrane « Made with Margokit ». Rappels d'expiration : bannière J-7, e-mails J-7 et J-1.

> Les noms exacts des champs Gumroad seront revérifiés sur la documentation officielle et par un achat test au moment de coder M5.

## 9. Pages

| Route | Contenu |
|---|---|
| `/[locale]` | Landing (accroche, calculateur, offre, prix, Gumroad, WhatsApp, avis réels, FAQ, SEO) |
| `/[locale]/calculator` | Calculateur seul |
| `/[locale]/login`, `/signup`, `/forgot-password` | Better Auth |
| `/[locale]/app` | Tableau de bord : CA du mois par devise, impayés, en retard, compteur du plan gratuit |
| `/[locale]/app/documents` (+ `/new`, `/[id]`) | Devis, factures, avoirs, acomptes : éditeur, contrôles de conformité, émission, conversion, paiements, PDF, XML, partage |
| `/[locale]/app/clients`, `/app/products` | CRUD |
| `/[locale]/app/settings` | Entreprise, identifiants, TVA, banque et liens de paiement, numérotation, mentions, facture électronique (niveau 3), compte, export RGPD |
| `/[locale]/activate` | Clé Gumroad / code manuel, plan, date de fin |
| `/[locale]/d/[token]` | Document public, téléchargement, bouton « Payer » (`noindex`) |
| `/[locale]/admin` | Utilisateurs, plans, codes, journal des ventes, statistiques |
| `/[locale]/legal/terms`, `/privacy` | CGU, confidentialité |

## 10. Sécurité

| Exigence | Mise en œuvre |
|---|---|
| Validation serveur | Zod partout |
| Isolation des données | `requireUser()` + filtre `userId` systématique + tests « A ne voit jamais les données de B » |
| Secrets | `server-only`, aucune clé en `NEXT_PUBLIC_` |
| Codes d'activation | Aléa cryptographique, HMAC, comparaison à temps constant |
| Limitation de débit | Better Auth + collection `RateLimit` (activation, webhooks, liens publics) |
| Upload | ≤ 200 Ko, type vérifié par les octets magiques, pas de SVG |
| Webhooks | URL secrète ou signature, idempotence, revérification API |
| En-têtes | CSP, HSTS, `X-Frame-Options`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` |
| Admin | Rôle vérifié côté serveur sur chaque page et chaque action |
| Liens publics | Jeton de 32 octets haché, révocable, `noindex` |
| Intégrité des factures | Documents émis verrouillés, hash du XML, journal d'audit |

## 11. Plan de développement

| Étape | Contenu | Durée |
|---|---|---|
| **M1 — Socle** | Projet, i18n, MongoDB (UE), Better Auth, mise en page, landing + calculateur | 2 j |
| **M2 — Données & pays** | Profil entreprise, identifiants, régimes de TVA, registre des pays (FR, BE, MA, générique), clients, produits | 3 j |
| **M3 — Documents** | Devis, factures, avoirs, acomptes ; catégories de TVA ; totaux ; contrôles de conformité ; émission et verrouillage ; numérotation ; paiements ; tableau de bord | 4 j |
| **M4 — PDF & partage** | PDF EN/FR avec mentions complètes, QR SEPA, liens de paiement, filigrane, lien public, e-mail, WhatsApp | 2–3 j |
| **M5 — Monétisation** | `BillingProvider` + Gumroad, plans et limites, `/activate`, codes manuels, webhooks, cron | 2 j |
| **M6 — Admin** | Utilisateurs, codes, journal des ventes, statistiques, script de création de l'admin | 2 j |
| **M7 — Lancement** | Tests Playwright, CGU et confidentialité, export RGPD, README, `.env.example`, déploiement | 2 j |
| **M8 — Formats structurés** | Factur-X (EN 16931) + UBL Peppol, validation XSD et Schematron | 3–4 j |
| **M9 — Transmission** | Connecteur Plateforme Agréée (partenaire à choisir), cycle de vie, point d'accès Peppol | 5 j + délai du partenaire |
| **M10 — Paiement en ligne** | Branchement du prestataire de paiement choisi (abonnements + factures) | 3–5 j |

**Lancement commercial après M7 (≈ 3 semaines)** : factures conformes aux mentions, prêtes pour la réforme. M8 et M9 doivent être terminés **avant septembre 2027**, pour que les utilisateurs français puissent émettre leurs factures électroniques via Margokit.

## 12. Coûts

| Service | Coût |
|---|---|
| Vercel | 0 $ (Hobby) → **20 $/mois (Pro)** dès les premières ventes (le plan Hobby est non commercial) |
| MongoDB Atlas M0 (UE) | 0 $ (512 Mo) |
| Resend | 0 $ (offre gratuite, limites à vérifier) |
| Gumroad | 10 % + 0,50 $ par vente |
| Plateforme Agréée (M9) | Tarif par facture ou forfait selon le partenaire : à intégrer dans le prix de Margokit Pro |
| Domaine | ≈ 10–12 $/an |

## 13. Risques

1. **Réglementation mouvante** : calendriers et formats (France, Belgique, Allemagne, Maroc) peuvent évoluer. Revue trimestrielle du registre des pays et des sources officielles.
2. **Responsabilité** : l'app aide à produire des factures conformes mais **ne remplace pas un expert-comptable**. À écrire dans les CGU ; mentions et contrôles présentés comme une aide.
3. **PDF/A-3** : produire un PDF/A-3 strictement valide avec `@react-pdf/renderer` demande un post-traitement (polices incorporées, profil de couleurs, métadonnées XMP). À prototyper au début de M8 avec la bibliothèque candidate et un validateur (veraPDF).
4. **PDF en arabe** : `@react-pdf/renderer` gère mal l'arabe ; génération HTML → PDF probable pour la phase arabe.
5. **Dépendance à un partenaire** (PA, prestataire de paiement) : interfaces abstraites pour pouvoir en changer.
6. **Limites gratuites** (Atlas, Resend, Vercel) : à surveiller dans le suivi hebdomadaire (phase 8).

## Sources

- Auth.js rejoint Better Auth : https://better-auth.com/blog/authjs-joins-better-auth · https://github.com/nextauthjs/next-auth/discussions/13252
- Licences Gumroad : https://gumroad.com/help/article/76-license-keys · Ping : https://gumroad.com/ping
- Calendrier et guide officiel de la facturation électronique : https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/guide_pratique_facturation_electronique.pdf · https://www.economie.gouv.fr/tout-savoir-sur-la-facturation-electronique-pour-les-entreprises
- Nouvelles mentions obligatoires : https://ma-facture-electronique.org/reforme-2026/nouvelles-mentions-obligatoires/siren-client/ · https://cerfrance22.fr/facture-electronique-nouvelles-mentions-obligatoires/
- Belgique (Peppol, 1er janvier 2026) : https://ec.europa.eu/digital-building-blocks/sites/spaces/DIGITAL/pages/467108877/eInvoicing+in+Belgium · https://www.ey.com/en_gl/technical/tax-alerts/belgium-s-mandatory-e-invoicing-to-apply-from-1-january-2026
- Calendrier européen : https://marosavat.com/resources/e-invoicing-in-europe-overview-and-dates
- EN 16931 / UBL / CII : https://www.vatupdate.com/2026/05/25/understanding-eu-e-invoicing-en-16931-ubl-cii-and-national-syntaxes/
- Factur-X en Node.js : https://github.com/StackForge-EU/factur-x · https://dev.to/erwanbargain/factur-x-en-16931-from-scratch-pdfa-3-cii-xml-in-nodejs-typescript-3pbe
