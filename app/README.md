# Margokit Pro — application web

Devis, factures et avoirs conformes, en français et en anglais, pour les vendeurs et freelances du monde entier. L'app sert aussi de site principal (`margokit.com`) : landing, calculateur de bénéfice gratuit, tarifs.

Architecture et décisions : [../docs/pro/ARCHITECTURE.md](../docs/pro/ARCHITECTURE.md).

## Sommaire

1. [Fonctionnalités](#1-fonctionnalités)
2. [Démarrer en local](#2-démarrer-en-local)
3. [Tests](#3-tests)
4. [Configuration Gumroad](#4-configuration-gumroad-produits-licences-webhook)
5. [Déploiement : MongoDB Atlas + Vercel](#5-déploiement-mongodb-atlas--vercel)
6. [Services complémentaires : e-mails, Google, cron](#6-services-complémentaires)
7. [Créer le compte admin](#7-créer-le-compte-admin)
8. [Codes d'activation (ventes WhatsApp)](#8-codes-dactivation-ventes-whatsapp)
9. [Langues (EN, FR, AR)](#9-langues-en-fr-ar-et-ajout-dune-langue)
10. [Facture électronique](#10-facture-électronique-factur-x-ubl)
11. [Ajouter un prestataire de paiement](#11-ajouter-un-prestataire-de-paiement-par-carte)
12. [Structure du code](#12-structure-du-code)
13. [Sécurité](#13-sécurité)

## 1. Fonctionnalités

| Domaine | Détail |
|---|---|
| Site | Landing EN/FR, calculateur de bénéfice (image 9:16 à partager), tarifs, FAQ, CGU, confidentialité, SEO (hreflang, sitemap, Open Graph) |
| Comptes | E-mail + mot de passe (e-mail vérifié obligatoire), Google, mot de passe oublié, limitation des tentatives |
| Entreprise | Identifiants par pays avec contrôle des clés (SIREN, SIRET, TVA, BCE, ICE, IBAN…), régime de TVA (normal, franchise 293 B, exonéré), taux, RIB, liens de paiement, numérotation, mentions, logo |
| Documents | Devis, factures, avoirs ; totaux EN 16931 ; catégories de TVA (normal, zéro, exonéré, autoliquidation, intracommunautaire, export, hors champ) ; contrôles de conformité avant émission ; numérotation continue attribuée à l'émission ; document verrouillé une fois émis ; conversion devis → facture ; paiements partiels |
| Partage | PDF EN/FR (QR code virement SEPA), lien public sécurisé et révocable, e-mail avec PDF joint, WhatsApp |
| Facture électronique | **Factur-X** (PDF/A-3 + XML CII, profil EN 16931, validé contre les XSD officiels à chaque export) et **UBL 2.1 Peppol BIS 3.0** pour les factures et avoirs émis |
| Plans | Gratuit : 3 documents émis/mois avec filigrane · Pro mensuel ou à vie via Gumroad · codes manuels |
| Admin | Statistiques, utilisateurs (attribuer / prolonger / retirer Pro), codes par lot, journal des ventes |
| RGPD | Export JSON de toutes les données, suppression du compte |

## 2. Démarrer en local

Prérequis : Node.js 20+ (testé avec Node 26).

```bash
cd app
npm install
cp .env.example .env.local
```

Dans `.env.local`, remplis au minimum :

```bash
BETTER_AUTH_SECRET=$(openssl rand -base64 32)   # colle la valeur générée
APP_ENCRYPTION_KEY=$(openssl rand -base64 32)   # idem
```

Lance la base de données locale (MongoDB en replica set, données gardées dans `.devdb/`), puis l'app :

```bash
npm run db      # terminal 1 — MongoDB sur le port 27018
npm run dev     # terminal 2 — http://localhost:3000
```

Sans clé Resend, les e-mails (confirmation d'inscription, mot de passe oublié, documents) s'affichent dans le terminal de `npm run dev` : copie le lien de confirmation depuis là.

## 3. Tests

```bash
npm test                 # tests unitaires (calculs, TVA, numérotation, conformité, identifiants, licences…)
npm run build            # obligatoire avant les tests de bout en bout
npm run e2e              # Playwright, ordinateur + mobile (nécessite `npm run db`)
```

Les tests de bout en bout utilisent une base séparée (`margokit_e2e`) et un faux serveur Gumroad local (`e2e/gumroad-mock.mjs`) : ils ne touchent jamais au vrai Gumroad.

## 4. Configuration Gumroad (produits, licences, webhook)

> Les écrans de Gumroad évoluent : si un libellé diffère, cherche l'option équivalente dans l'aide Gumroad (gumroad.com/help).

1. **Créer 2 produits** :
   - `Margokit Pro — Monthly` : type **Membership**, 5 $ par mois.
   - `Margokit Pro — Lifetime` : produit numérique, 39 $.
2. Sur **chaque** produit : active **Generate a unique license key per sale** (clés de licence). Dans le contenu livré, écris par exemple : « Ta clé : {license_key} — active-la sur https://margokit.com/fr/activate ».
3. **Récupérer les Product ID** (écran d'édition du produit, ou via l'API) et les mettre dans `GUMROAD_PRODUCT_ID_MONTHLY` et `GUMROAD_PRODUCT_ID_LIFETIME`. L'API de vérification des licences exige le `product_id` pour les produits créés après le 9 janvier 2023.
4. **Liens d'achat** : mets les URL des produits dans `GUMROAD_URL_MONTHLY` et `GUMROAD_URL_LIFETIME` (boutons de la page Tarifs et de `/activate`).
5. **Webhook (Ping)** :
   - génère un secret : `openssl rand -hex 24` → `GUMROAD_PING_SECRET` ;
   - Gumroad → Settings → Advanced → **Ping endpoint** : `https://margokit.com/api/webhooks/gumroad/<GUMROAD_PING_SECRET>`.
   Gumroad ne signe pas ses requêtes : l'URL secrète, l'idempotence et la revérification de chaque licence auprès de l'API protègent l'app. Les ventes des templates Google Sheets arrivent aussi par ce Ping et alimentent les statistiques admin.
6. **Remboursements et annulations** : l'app revérifie les abonnements mensuels au plus une fois par jour (à la connexion et via le cron). Pour être prévenu plus vite, tu peux abonner la même URL aux événements `refund`, `cancellation` et `subscription_ended` via l'API `resource_subscriptions` de Gumroad.
7. **Test** : achète chaque produit avec un code promo à −100 %, vérifie que la clé s'active sur `/activate`, que la vente apparaît dans `/admin/sales`, puis supprime le code.

## 5. Déploiement : MongoDB Atlas + Vercel

### MongoDB Atlas (gratuit)

1. https://cloud.mongodb.com → **Create** → cluster **M0 (Free)**, **région en Europe** (Paris, Francfort ou Irlande), c'est préférable pour le RGPD.
2. **Database Access** → utilisateur avec un mot de passe long, rôle « Read and write to any database ».
3. **Network Access** → `0.0.0.0/0`. Vercel n'a pas d'adresses IP fixes sur le plan gratuit ; la sécurité repose sur le mot de passe.
4. **Connect → Drivers** → copie l'URI, ajoute le nom de la base : `mongodb+srv://USER:PASS@cluster.xxxxx.mongodb.net/margokit?retryWrites=true&w=majority` → `MONGODB_URI`.

### Vercel

1. https://vercel.com/new → importe le dépôt GitHub → **Root Directory : `app`**.
2. **Environment Variables** : toutes celles de `.env.example`, avec :
   - `NEXT_PUBLIC_SITE_URL` et `BETTER_AUTH_URL` = `https://margokit.com` (ton domaine) ;
   - de **nouvelles** valeurs pour `BETTER_AUTH_SECRET`, `APP_ENCRYPTION_KEY`, `GUMROAD_PING_SECRET`, `CRON_SECRET`. Ne change jamais `APP_ENCRYPTION_KEY` une fois en production : les liens de partage et les clés enregistrées ne pourraient plus être lus.
3. **Deploy**, puis **Settings → Domains** : ajoute `margokit.com` et `www.margokit.com`.
4. Le fichier `vercel.json` programme le cron quotidien (`/api/cron/daily`, 7 h UTC). Vercel envoie automatiquement `CRON_SECRET` dans l'en-tête `Authorization`.
5. **Analytics** → Enable.

> Le plan Hobby de Vercel est réservé à un usage non commercial. Dès que l'app vend, passe au plan Pro. Vérifie les conditions actuelles sur vercel.com/pricing.

Le calculateur autonome (`../calculator`) devient inutile une fois l'app en ligne : fais pointer le domaine sur ce projet-ci.

## 6. Services complémentaires

**E-mails (Resend)** : https://resend.com → ajoute et vérifie ton domaine (enregistrements DNS SPF/DKIM chez ton registrar) → crée une clé API → `RESEND_API_KEY`, et `EMAIL_FROM=Margokit <hello@margokit.com>`. Vérifie les limites de l'offre gratuite sur resend.com/pricing.

**Connexion Google** : https://console.cloud.google.com → APIs & Services → Credentials → **OAuth client ID** (type Web) → URI de redirection autorisée : `https://margokit.com/api/auth/callback/google` (et `http://localhost:3000/api/auth/callback/google` pour le local) → `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Sans ces variables, le bouton Google n'apparaît pas.

**Newsletter** : voir [email-capture/Code.gs](email-capture/Code.gs) (Google Sheet gratuit) → `SUBSCRIBE_WEBHOOK_URL`, `SUBSCRIBE_WEBHOOK_SECRET`.

**Pages légales** : `LEGAL_ENTITY`, `LEGAL_ADDRESS` et `CONTACT_EMAIL` complètent les CGU et la politique de confidentialité. Les textes (`src/content/legal.ts`) sont une base de travail : fais-les relire par un professionnel.

## 7. Créer le compte admin

1. Inscris-toi normalement sur le site et confirme ton e-mail.
2. Lance, avec les variables de production :
   ```bash
   MONGODB_URI="mongodb+srv://…" node scripts/create-admin.mjs ton@email.com
   # en local : node --env-file=.env.local scripts/create-admin.mjs ton@email.com
   ```
3. Recharge l'app : le lien **Admin** apparaît dans le menu → `/fr/admin`.

## 8. Codes d'activation (ventes WhatsApp)

Depuis **Admin → Codes** : choisis le nombre, la durée (30 jours, 1 an, à vie) et une note (« Virement Youssef ») → les codes s'affichent **une seule fois**, car seule leur empreinte est enregistrée. Envoie le code au client, qui l'active sur `/activate`.

En ligne de commande :

```bash
node --env-file=.env.local scripts/create-codes.mjs --count 5 --days 30 --note "WhatsApp octobre"
node --env-file=.env.local scripts/create-codes.mjs --count 1 --lifetime --note "Salma B."
```

Tu peux aussi attribuer du Pro directement à un compte : **Admin → Utilisateurs → +30 jours / +1 an / À vie**.

## 9. Langues (EN, FR, AR) et ajout d'une langue

**Arabe (disponible)** : interface complète en arabe, écriture de droite à gauche (`dir="rtl"`), police IBM Plex Sans Arabic, chiffres latins à l'affichage (usage au Maghreb) et chiffres arabo-indiens acceptés à la saisie, e-mails en arabe. Limites assumées : **les documents (PDF, Factur-X) restent en français ou en anglais** (le moteur PDF ne gère pas bien l'écriture arabe liée) ; l'image de partage du calculateur et l'aperçu Open Graph restent en anglais ; les CGU et la politique de confidentialité s'affichent en anglais. Fais relire les textes arabes (`messages/ar.json`) par un locuteur natif avant de communiquer auprès d'un public arabophone.

**Ajouter une langue** (ex. espagnol) :
1. `messages/es.json` : copie de `messages/en.json`, traduite (garder les clés et les variables `{…}`) ; vérifier avec le script de contrôle ICU (voir historique Git) ou `new IntlMessageFormat(text, 'es')`.
2. `src/i18n/routing.ts` : ajouter la langue à `locales` ; nom affiché dans `src/components/LocaleSwitcher.tsx`.
3. Si la langue s'écrit de droite à gauche : `isRtl` dans `src/lib/intl.ts` et une police adaptée dans `src/app/[locale]/layout.tsx` (l'interface utilise déjà les propriétés logiques `ms-`/`me-`/`start`/`end`).
4. Pour des **documents** dans cette langue : `DOC_LOCALES` (`src/lib/catalog.ts`), textes `doc` et `catalog`, mentions légales (`src/lib/documents/compliance.ts`), et vérifier le rendu PDF (police couvrant l'alphabet).
5. E-mails : `src/lib/email.ts` ; pages légales : `src/content/legal.ts`.

## 10. Facture électronique (Factur-X, UBL)

- Sur une facture ou un avoir émis : **Partager → Factur-X (PDF)** ou **UBL / Peppol (XML)**.
- Le Factur-X est validé à chaque export (règles du profil EN 16931 + schémas XSD officiels) ; si une donnée manque, l'utilisateur voit la liste des erreurs au lieu d'un fichier invalide.
- Correspondances EN 16931 : SIREN → schéma `0002`, BCE → `0208`, KvK → `0106` ; franchise en base → catégorie `E` + `VATEX-FR-FRANCHISE` ; autoliquidation, intracommunautaire, export, hors champ → codes `VATEX-EU-*` ; notes `PMD` (pénalités), `PMT` (indemnité 40 €), `AAB` (escompte) ; date de livraison/prestation = date de facture si non renseignée.
- UBL : `EndpointID` Peppol déduit des identifiants (BCE, SIRET/SIREN, KvK, TVA DE/LU) ; validé contre les XSD OASIS UBL 2.1 pendant le développement.
- **Pas encore fait** : validation officielle Schematron (règles EN 16931 et Peppol) et contrôle PDF/A-3 par veraPDF — à lancer avant de promettre la conformité (ces outils nécessitent Java).

### Envoi via une plateforme agréée (PA) ou Peppol

L'envoi, le suivi du cycle de vie (déposée, reçue, mise à disposition, approuvée, refusée, en litige, encaissée…), le signalement « encaissée » au paiement complet et le webhook de statuts sont en place. Seul le connecteur du partenaire reste à écrire :

1. Choisis une plateforme **immatriculée par la DGFiP** (liste officielle sur impots.gouv.fr) qui propose une API pour les éditeurs de logiciels, et compare tarif par facture, réception gratuite pour tes utilisateurs, et Peppol.
2. Crée `src/lib/einvoice/providers/<partenaire>.ts` qui implémente `EInvoicingProvider` (`send`, `getStatus`, `reportPayment`, `parseWebhook`) avec leur API, en traduisant leurs codes de statut vers les nôtres (`types.ts`).
3. Enregistre-le dans `providers/index.ts`, puis sur Vercel : `EINVOICE_PROVIDER=<partenaire>`, `EINVOICE_WEBHOOK_SECRET=…`, et chez le partenaire l'URL `https://margokit.com/api/einvoicing/<partenaire>/<secret>`. Si le partenaire signe ses webhooks, vérifie la signature dans `parseWebhook`.
4. Pour tester sans partenaire : `EINVOICE_PROVIDER=sandbox` (simulation locale, ignorée en production).
- Profil de couleurs sRGB : `assets/icc/sRGB-v2-micro.icc` (CC0).

## 11. Ajouter un prestataire de paiement par carte

**A. Abonnements Margokit Pro** (remplacer ou compléter Gumroad : Paddle, Lemon Squeezy, Stripe, CMI…)

1. Vérifie d'abord que le prestataire accepte un vendeur de ton pays et de ton statut : Paddle et Lemon Squeezy agissent comme revendeur (ils gèrent la TVA mondiale, comme Gumroad) ; Stripe demande en général une société dans un pays éligible ; CMI demande un contrat commerçant au Maroc.
2. Crée `src/lib/billing/providers/<id>.ts` qui implémente `BillingProvider` :
   - `checkoutUrl(plan)` : lien de paiement hébergé (inclure l'identifiant ou l'e-mail du compte si le prestataire le permet) ;
   - `handleWebhook(req, secret)` : **vérifier la signature** du prestataire sur le corps brut (`await req.text()`), idempotence via `BillingEvent.eventId`, puis créer ou mettre à jour la `Subscription` (`provider: '<id>'`, `external.customerId/subscriptionId`, `status`, `expiresAt`).
3. Ajoute `'<id>'` aux valeurs autorisées de `provider` dans `src/models/Subscription.ts`, enregistre le prestataire dans `providers/index.ts`, puis `BILLING_PROVIDER=<id>` sur Vercel. Webhook : `https://margokit.com/api/webhooks/<id>/<secret>`.
4. Les droits Pro, l'admin et les statistiques fonctionnent sans autre changement (ils ne lisent que `Subscription` et `BillingEvent`).

**B. Paiement en ligne des factures de tes utilisateurs**

Aujourd'hui : chaque utilisateur ajoute ses propres liens de paiement (Stripe Payment Link, PayPal, Wise, CMI…) et son IBAN dans Paramètres ; ils apparaissent sur le PDF, la page client et le QR code SEPA. Pour aller plus loin (paiement intégré qui marque la facture payée automatiquement), il faut un prestataire qui gère des **comptes connectés** (ex. Stripe Connect) : le paiement arrive sur le compte de l'utilisateur, un webhook enregistre le paiement dans `Document.payments` (`source: 'provider'`), et M9 signale « encaissée » à la plateforme.

## 12. Structure du code

| Chemin | Rôle |
|---|---|
| `src/app/[locale]/(site)` | Landing, calculateur, pages légales |
| `src/app/[locale]/(auth)` | Connexion, inscription, mot de passe |
| `src/app/[locale]/app` | Espace connecté (tableau de bord, documents, clients, produits, paramètres) |
| `src/app/[locale]/activate` | Activation Pro |
| `src/app/[locale]/admin` | Admin |
| `src/app/[locale]/d/[token]` | Document partagé (public) |
| `src/app/api` | Auth, PDF, logos, webhook Gumroad, cron, export, image de partage, newsletter |
| `src/lib/documents` | Totaux, numérotation, conformité et mentions, QR SEPA, partage, vues |
| `src/lib/countries` | Registre des règles par pays et validation des identifiants |
| `src/lib/billing` | Prestataires de paiement (Gumroad), licences, codes, activation |
| `src/lib/einvoice` | Factur-X, UBL, plateformes de transmission |
| `src/lib/pdf` | Génération PDF |
| `src/models` | Modèles Mongoose |
| `messages/` | Tous les textes (EN/FR) |
| `e2e/` | Tests Playwright et faux serveur Gumroad |
| `scripts/` | Base locale, admin, codes |

## 13. Sécurité

- Validation Zod de toutes les entrées côté serveur ; chaque requête métier est filtrée par l'utilisateur de la session (tests d'isolation entre comptes).
- Secrets uniquement côté serveur (`server-only`), aucun secret en `NEXT_PUBLIC_`.
- Mots de passe hachés (Better Auth), e-mail vérifié obligatoire, limitation des tentatives stockée en base (connexion, inscription, activation, webhook, liens publics).
- Codes d'activation aléatoires (~59 bits) stockés en HMAC ; clés de licence et jetons de partage chiffrés en AES-256-GCM.
- Logos : 200 Ko max, PNG/JPEG vérifiés par leurs octets, pas de SVG.
- En-têtes : CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
- Documents émis immuables, journal d'audit des actions sensibles.
