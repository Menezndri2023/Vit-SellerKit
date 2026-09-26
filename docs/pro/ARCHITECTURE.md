# Margokit Pro — architecture et plan de développement

> Statut : **proposition à valider** (phase 7a). Rien n'est codé tant que ce document n'est pas validé.

## 1. Ce qui change par rapport à la spec (et pourquoi)

| Spec | Proposition | Raison |
|---|---|---|
| Auth.js | **Better Auth** | Auth.js est passé sous la responsabilité de l'équipe Better Auth (sept. 2025) et n'est plus qu'en maintenance de sécurité ; ses mainteneurs recommandent Better Auth pour les nouveaux projets. Better Auth fournit en natif : e-mail + mot de passe, Google, limitation de débit, rôles admin, adaptateur MongoDB. |
| Webhook Gumroad « avec vérification de l'origine » | **URL secrète + re-vérification via l'API Gumroad + idempotence** | Le Ping Gumroad n'a **pas de signature**. On ne fait donc jamais confiance au contenu du Ping : il sert de signal, et la licence est revérifiée auprès de l'API Gumroad avant d'accorder quoi que ce soit. |
| Upload de logo (stockage non précisé) | **Stocké dans MongoDB** (≤ 200 Ko, PNG/JPEG/WebP, pas de SVG) | Aucun service de plus à payer ou configurer. Le SVG est refusé : il peut contenir du JavaScript. |
| Envoi par e-mail | **Resend** (offre gratuite) | Nécessaire aussi pour la réinitialisation de mot de passe et les rappels d'expiration. Limites gratuites à vérifier sur resend.com/pricing. |
| `/[locale]/calculator` dans l'app | **L'app devient le site principal** et reprend le calculateur (même code `profit.ts`) | Au lancement de Pro, `margokit.com` pointe vers `app/` ; `calculator/` est archivé. Un seul site, un seul domaine, un seul SEO. |

## 2. Vue d'ensemble

```text
                         ┌──────────────── Vercel (Next.js 16) ────────────────┐
 Visiteur ──────────────►│ /[locale]              landing + calculateur         │
                         │ /[locale]/app/*        Margokit Pro (connecté)       │
 Client de l'utilisateur►│ /[locale]/d/[token]    document public (lecture seule)│
                         │ /[locale]/activate     clé Gumroad ou code manuel    │
 Admin ─────────────────►│ /[locale]/admin/*      rôle admin                    │
                         │ /api/auth/*            Better Auth                   │
 Gumroad (Ping) ────────►│ /api/webhooks/gumroad  URL secrète                   │
 Vercel Cron (1×/jour) ─►│ /api/cron/daily        rappels d'expiration          │
                         └──────┬───────────────────────┬────────────┬─────────┘
                                │                       │            │
                         MongoDB Atlas (M0)      API Gumroad     Resend (e-mails)
```

Server Actions pour toutes les mutations (formulaires), Route Handlers pour le PDF, le webhook, le cron et Better Auth. Toute la logique métier est côté serveur ; le client n'affiche que des aperçus.

## 3. Pile technique

| Rôle | Choix |
|---|---|
| Framework | Next.js 16 (App Router, `proxy.ts`), TypeScript strict |
| UI | Tailwind CSS 4, mêmes jetons de couleur que le calculateur, mode sombre, RTL prêt (propriétés logiques `ms-`/`me-`) |
| i18n | next-intl 4 — `en`, `fr` ; `ar` en phase 2 |
| Base | MongoDB Atlas + Mongoose (modèles métier) ; Better Auth via l'adaptateur MongoDB (même connexion) |
| Auth | Better Auth : e-mail + mot de passe (haché scrypt par défaut), Google OAuth, vérification d'e-mail, plugin `admin` |
| Validation | Zod sur **toutes** les entrées serveur (Server Actions, routes) |
| PDF | `@react-pdf/renderer`, généré côté serveur |
| E-mails | Resend |
| Tests | Vitest (calculs, numérotation, licences), Playwright (3 parcours critiques) |
| Hébergement | Vercel + MongoDB Atlas M0 (gratuit, 512 Mo) |

## 4. Modèles de données

Montants stockés en **unités mineures entières** (centimes, 0 décimale pour XOF, 3 pour TND) pour éviter les erreurs d'arrondi. Chaque document métier porte `userId`, indexé, et **toutes** les requêtes filtrent par `userId` de la session.

**User** (collection Better Auth, champs ajoutés) : `role: 'user' | 'admin'`, `locale`, `plan: 'free' | 'pro'` (cache), `planExpiresAt: Date | null` (null = à vie), `planCheckedAt`.

**BusinessProfile** (1 par utilisateur) : `name`, `logo { data: Buffer, mime, size }`, `address`, `country`, `taxIdLabel` (proposé selon le pays : VAT number, SIRET, ICE, TIN…), `taxId`, `email`, `phone`, `paymentDetails` (texte libre : RIB, IBAN, PayPal…), `legalMentions`, `defaultCurrency`, `defaultLocale`, `taxRates: [{ name, rate, isDefault }]`, `numbering: { invoice: 'INV-{YYYY}-{SEQ:3}', quote: 'QUO-{YYYY}-{SEQ:3}' }`.

**Client** : `userId`, `name`, `company`, `email`, `phone`, `address`, `country`, `taxId`, `notes`.

**Product** (produits et services) : `userId`, `name`, `description`, `unitPrice` (mineures), `currency`, `unit` (pièce, heure, jour…), `taxRate`.

**Document** : `userId`, `type: 'quote' | 'invoice'`, `number`, `status: 'draft' | 'sent' | 'paid' | 'overdue'` (+ `accepted`/`declined` pour les devis), `clientId` + **copie figée du client** (une facture ne doit pas changer si le client est modifié), `issueDate`, `dueDate`, `currency`, `locale` (langue du PDF), `lines: [{ description, qty, unitPrice, discountPct, taxRate }]`, `discount` global, `totals { subtotal, discount, taxes: [{ rate, base, amount }], total }` (calculés **au serveur** à chaque enregistrement), `notes`, `publicTokenHash`, `convertedFromId`, `watermark: boolean`.

**Counter** : `{ userId, key: 'invoice-2026' }` → `seq`, incrémenté atomiquement (`findOneAndUpdate` + `$inc`) : pas de doublon de numéro même avec deux onglets.

**Subscription** : `userId`, `plan: 'monthly' | 'lifetime' | 'manual'`, `source: 'gumroad' | 'manual'`, `status: 'active' | 'cancelled' | 'expired' | 'refunded' | 'revoked'`, `startsAt`, `expiresAt`, `gumroad { productId, saleId, licenseKeyEnc, licenseKeyHash (unique) }`, `lastCheckedAt`.

**ActivationCode** : `codeHash` (HMAC-SHA256 avec un secret serveur, unique), `batch`, `durationDays | null` (null = à vie), `note` (ex. « WhatsApp — Youssef »), `createdBy`, `usedBy`, `usedAt`, `revokedAt`.

**SaleEvent** (journal) : `saleId` (unique = idempotence), `resource` (sale, refund, cancellation…), `productId`, `email`, `price`, `currency`, `country`, `isTest`, `verified: boolean`, `raw` (payload), `receivedAt`, `linkedUserId`.

**RateLimit** : `{ key, count, expiresAt }` avec index TTL : fonctionne entre toutes les instances serverless (un compteur en mémoire ne suffit pas).

## 5. Licences, abonnements et Gumroad

**Produits Gumroad** : `Margokit Pro — Monthly` (abonnement 5 $/mois) et `Margokit Pro — Lifetime` (39 $), **clés de licence activées** sur les deux. Leurs `product_id` sont dans les variables d'environnement.

**Activation par clé** (`/activate`) :
1. Limite : 5 essais / 15 min / utilisateur et / IP.
2. `POST https://api.gumroad.com/v2/licenses/verify` avec `product_id` + `license_key` (le paramètre `product_id` est obligatoire pour les produits créés après le 9 janvier 2023), essayé contre les 2 produits.
3. Refus si remboursée, contestée, abonnement annulé, échoué ou terminé, ou si la clé est déjà liée à un autre compte (index unique sur le hash de la clé).
4. Création de la `Subscription` ; la clé est stockée **chiffrée** (AES-256-GCM) car il faut la revérifier pour les abonnements mensuels.

**Revérification** des abonnements mensuels : à la connexion si `lastCheckedAt` > 24 h, et chaque jour par le cron. Si Gumroad est injoignable, on garde l'accès (pas de coupure injuste) et on réessaie.

**Ping Gumroad** : URL `https://margokit.com/api/webhooks/gumroad/<SECRET>`.
1. Limite de débit + corps `x-www-form-urlencoded` validé par Zod.
2. `saleId` déjà vu → 200 sans rien refaire (Gumroad renvoie en cas d'échec).
3. Enregistrement dans `SaleEvent` (journal admin, statistiques de revenus par mois et par pays).
4. Si une clé est présente : revérification par l'API → si un compte a le même e-mail, activation automatique (l'utilisateur n'a rien à coller).
5. Événements `refund` / `cancellation` / `subscription_ended` (via `resource_subscriptions` de l'API) → mise à jour de la `Subscription`.

> ⚠️ Les noms exacts des champs renvoyés par Gumroad (`subscription_cancelled_at`, `subscription_failed_at`, `refunded`, `chargebacked`, `ip_country`…) seront revérifiés sur la documentation officielle au moment de coder cette étape, avec un achat test.

**Codes manuels** (ventes WhatsApp) : format `MK-XXXX-XXXX-XXXX` (alphabet sans caractères ambigus, 60 bits d'aléa via `crypto.randomBytes`), stockés **hachés** (HMAC-SHA256 + secret serveur), usage unique, 30 jours ou à vie, génération par lot, prolongation et révocation depuis l'admin. Le code en clair n'est affiché **qu'une fois**, à la génération.

**Plan gratuit** : 3 documents créés par mois calendaire (compté au serveur au moment de la création), PDF avec filigrane « Made with Margokit ». Rappel d'expiration : bannière dans l'app 7 jours avant + e-mail à J-7 et J-1.

## 6. Pages

| Route | Contenu |
|---|---|
| `/[locale]` | Landing : accroche, calculateur intégré, offre, prix (Gratuit / Pro mensuel / Pro à vie), boutons Gumroad, bouton WhatsApp, témoignages (réels), FAQ, SEO complet |
| `/[locale]/calculator` | Calculateur seul (page SEO dédiée) |
| `/[locale]/login`, `/signup`, `/forgot-password` | Better Auth |
| `/[locale]/app` | Tableau de bord : CA du mois, factures impayées, en retard, derniers documents, compteur « 2/3 documents ce mois-ci » |
| `/[locale]/app/documents` (+ `/new`, `/[id]`) | Liste filtrable, éditeur avec aperçu des totaux en direct, conversion devis → facture, statuts, PDF, partage |
| `/[locale]/app/clients`, `/app/products` | CRUD avec états vides soignés |
| `/[locale]/app/settings` | Profil entreprise, logo, taxes, numérotation, mentions légales, compte |
| `/[locale]/activate` | Clé Gumroad ou code manuel, plan actuel, date de fin |
| `/[locale]/d/[token]` | Document public en lecture seule + téléchargement PDF (`noindex`) |
| `/[locale]/admin` | Utilisateurs, plans, codes, journal des ventes, statistiques |

## 7. Sécurité (correspondance avec la spec)

| Exigence | Mise en œuvre |
|---|---|
| Validation serveur de toutes les entrées | Schémas Zod partagés ; aucune Server Action sans `parse` |
| Accès à ses seules données | Helper unique `requireUser()` ; chaque requête Mongoose inclut `userId` ; tests dédiés (un utilisateur A ne peut ni lire ni modifier un document de B) |
| Clés API côté serveur | `import 'server-only'` sur tous les modules sensibles ; aucune variable `NEXT_PUBLIC_` secrète |
| Codes d'activation sûrs et hachés | `crypto.randomBytes` + HMAC-SHA256 ; comparaison à temps constant |
| Limitation de débit | Better Auth (connexion, inscription, mot de passe oublié) + collection `RateLimit` (activation, webhook, liens publics) |
| Upload de logo | ≤ 200 Ko, type vérifié par les **octets magiques** (pas l'extension), PNG/JPEG/WebP uniquement |
| En-têtes de sécurité | CSP, HSTS, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy` |
| Admin | Rôle vérifié côté serveur sur chaque page et chaque action admin (pas seulement masqué dans l'interface) |
| Liens publics | Jeton aléatoire de 32 octets, stocké haché, révocable, pages `noindex` |

## 8. Plan de développement (≈ 3 semaines, chaque étape déployable)

| Étape | Contenu | Durée |
|---|---|---|
| **M1 — Socle** | Projet, i18n, MongoDB, Better Auth (e-mail + Google), mise en page, landing + calculateur repris | 2 j |
| **M2 — Données** | Profil entreprise + logo + taxes, clients, produits | 2 j |
| **M3 — Documents** | Devis/factures, lignes, remises, taxes, totaux, numérotation, statuts, conversion, tableau de bord | 3 j |
| **M4 — PDF & partage** | PDF EN/FR, filigrane, lien public, e-mail, WhatsApp | 2 j |
| **M5 — Monétisation** | Plans et limites, `/activate`, vérification Gumroad, codes manuels, Ping, cron de rappels | 2 j |
| **M6 — Admin** | Utilisateurs, codes, journal des ventes, statistiques, script de création de l'admin | 2 j |
| **M7 — Finition** | Tests Playwright, en-têtes de sécurité, README complet, `.env.example`, déploiement | 1–2 j |

Ordre choisi pour **pouvoir vendre au plus tôt** : dès M5, l'app est payante même sans admin (codes manuels générés par script en attendant).

## 9. Coûts

| Service | Coût au lancement |
|---|---|
| Vercel | 0 $ (Hobby) → **20 $/mois (Pro)** dès que le site génère des ventes : le plan Hobby est réservé à un usage non commercial |
| MongoDB Atlas M0 | 0 $ (512 Mo : largement assez pour des milliers d'utilisateurs, les logos étant limités à 200 Ko) |
| Resend | 0 $ (offre gratuite, limites à vérifier) |
| Google OAuth | 0 $ |
| Gumroad | 10 % + 0,50 $ par vente |
| Domaine | ≈ 10–12 $/an |

## 10. Risques à connaître

1. **Facturation électronique en France.** La réforme impose aux entreprises françaises de **recevoir** des factures électroniques à partir de septembre 2026, et aux TPE/micro-entrepreneurs de les **émettre** à partir de septembre 2027, via des plateformes agréées, pour les ventes entre entreprises en France. Un PDF Margokit ne sera pas une facture électronique conforme pour ces ventes-là. **Positionnement conseillé** : freelances hors de France, ventes aux particuliers, clients à l'international, Maroc et Afrique. À revérifier sur impots.gouv.fr avant le lancement.
2. **Mentions obligatoires.** Chaque pays impose ses mentions (ICE au Maroc, SIRET et TVA en France…). L'app fournit les champs et des mentions personnalisables, mais **ne garantit pas la conformité** : à indiquer clairement dans les conditions d'utilisation.
3. **PDF en arabe.** `@react-pdf/renderer` gère mal l'arabe (liaison des lettres, sens de lecture). Pour la phase arabe, il faudra probablement générer le PDF depuis du HTML (Chromium) : plus lourd. À tester avant de promettre le PDF arabe.
4. **Ping Gumroad non signé** : couvert par l'URL secrète + la revérification API ; ne jamais s'y fier seul.
5. **Limites gratuites** (Atlas M0, Resend, Vercel Hobby) : suffisantes pour démarrer, à surveiller en phase 8.

## 11. Variables d'environnement (aperçu)

`NEXT_PUBLIC_SITE_URL`, `MONGODB_URI`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `RESEND_API_KEY`, `EMAIL_FROM`, `GUMROAD_ACCESS_TOKEN`, `GUMROAD_PRODUCT_ID_MONTHLY`, `GUMROAD_PRODUCT_ID_LIFETIME`, `GUMROAD_URL_MONTHLY`, `GUMROAD_URL_LIFETIME`, `GUMROAD_PING_SECRET`, `LICENSE_ENCRYPTION_KEY`, `ACTIVATION_CODE_SECRET`, `CRON_SECRET`, `NEXT_PUBLIC_WHATSAPP_URL`, `GUMROAD_PACK_URL`, `GUMROAD_TRACKER_URL`.

Le `.env.example` complet et commenté sera livré à l'étape M7.

## Sources

- Auth.js rejoint Better Auth : https://better-auth.com/blog/authjs-joins-better-auth
- Discussion officielle : https://github.com/nextauthjs/next-auth/discussions/13252
- Vérification de licence Gumroad (`product_id` obligatoire depuis le 9/01/2023) : https://gumroad.com/help/article/76-license-keys
- Ping Gumroad : https://gumroad.com/ping
- Calendrier officiel de la facturation électronique : https://www.impots.gouv.fr/sites/default/files/media/1_metier/2_professionnel/EV/2_gestion/290_facturation_electronique/guide_pratique_facturation_electronique.pdf · https://www.economie.gouv.fr/tout-savoir-sur-la-facturation-electronique-pour-les-entreprises
