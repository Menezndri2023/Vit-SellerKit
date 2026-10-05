# Visuels marketing (Gumroad + Pinterest + WhatsApp)

Les PNG prêts à téléverser sont dans `out/`. Ils sont générés à partir de HTML avec Playwright, donc on peut les refaire à l'identique après un changement de texte ou de données.

## Refaire les images

```bash
node marketing/visuals/render.mjs              # tout (refait aussi les captures du calculateur en ligne)
node marketing/visuals/render.mjs --no-shots   # hors ligne : réutilise assets/calc-*.png
node marketing/visuals/render.mjs pin-03       # seulement les fichiers dont le nom contient « pin-03 »
node marketing/visuals/render.mjs --no-shots wa-   # seulement les 3 images WhatsApp
node marketing/visuals/render.mjs --html       # écrit aussi le HTML à côté de chaque PNG (débogage)
```

Les visuels **Margokit Pro** (`pro-*`) utilisent des captures de la vraie app (`assets/app-*.png`, `assets/pdf-*.png`), faites par `shoot-app.mjs` sur un build **local** avec une base jetable — jamais sur margokit.com. Pour les refaire (après un changement d'interface ou du PDF) :

```bash
cd app && npm run db                    # MongoDB local (port 27018) — s'il tourne déjà, le réutiliser
npm run build
MONGODB_URI='mongodb://127.0.0.1:27018/margokit_visuals?replicaSet=rs0' \
  BETTER_AUTH_URL=http://localhost:3300 NEXT_PUBLIC_SITE_URL=http://localhost:3300 E2E_DISABLE_RATE_LIMIT=1 \
  npx next start -p 3300
# dans un autre terminal, depuis la racine du dépôt :
node marketing/visuals/shoot-app.mjs --drop   # compte + entreprise de démo fictifs, captures, puis supprime la base margokit_visuals
node marketing/visuals/render.mjs --no-shots pro-
```

Données de démo 100 % fictives : « Atelier Nour » (Marseille), clients Studio Lumen SARL, Bloom & Co., Café Zitoun, Maison Sable ; SIREN de démo valides au sens Luhn (123 456 782…), IBAN d'exemple de la documentation (FR76 3000 6000 0112 3456 7890 189), adresses e-mail en `.example`. Le PDF est celui de la route `/api/documents/:id/pdf` de l'app, rastérisé avec pdf.js (chargé depuis jsDelivr).

Le script utilise le Playwright et le Chromium déjà installés pour les tests de `app/` (`cd app && npm ci && npx playwright install chromium` si besoin). Les polices (Plus Jakarta Sans, Inter) viennent de Google Fonts : il faut une connexion. Chaque PNG est rendu à `deviceScaleFactor: 1` et sa taille est vérifiée (le script s'arrête si elle ne correspond pas).

| Fichier | Rôle |
|---|---|
| `data.mjs` | Données d'exemple et formules portées de `sheets/tracker/Code.gs` (commandes, bénéfice, stock, clients, tableau de bord, pub, contenu, trésorerie, budget, calculateur de prix). Date figée au 30/09/2026. **Si les données d'exemple ou les formules changent dans Code.gs, mets ce fichier à jour.** |
| `templates.mjs` | Briques HTML : logo, cadre navigateur, téléphone, interface Google Sheets, maquette de chaque onglet. |
| `visuals.mjs` | Chaque visuel : textes, mise en page, taille (dont `whatsappVisuals()` pour les images `wa-*`). |
| `shoot-app.mjs` | Captures de l'app Margokit Pro (build local, base `margokit_visuals` jetable) et rendu des PDF en PNG. |
| `render.mjs` | Captures du calculateur (`margokit.vercel.app/en` et `/fr`, exemple 25 $ → 5,65 $ de bénéfice) puis rendu des PNG. |
| `assets/` | Captures du calculateur (×2, utilisées dans les épingles 1, 2, 6 et 10), captures de l'app Pro (`app-*.png`, `pdf-*.png`) et logo de démo (`demo-logo.png`). |

## Où téléverser chaque image

### Gumroad — Order & Inventory Tracker (`margokit.gumroad.com/l/tracker`)

| Fichier | Emplacement | Contenu |
|---|---|---|
| `tracker-cover-1.png` | Cover 1 (héros) | « Know what you really keep. » + Tableau de bord |
| `tracker-cover-2.png` | Cover 2 | Onglet Commandes coloré par statut, flèche vers la colonne Profit |
| `tracker-cover-3.png` | Cover 3 | Onglet Clients, ⚠️ Risky / ⭐ Loyal — « Spot customers who refuse parcels » |
| `tracker-cover-4.png` | Cover 4 | Téléphone, onglet Commandes — « Works on your phone » |
| `tracker-cover-5.png` | Cover 5 | Les 3 versions EN $ / FR € / Maroc MAD — « 3 versions included » |
| `tracker-thumb.png` | Thumbnail (600 × 600) | Logo + « Tracker » + mini tableau de bord |

### Gumroad — Seller Pack (`margokit.gumroad.com/l/seller-pack`)

| Fichier | Emplacement | Contenu |
|---|---|---|
| `pack-cover-1.png` | Cover 1 (héros) | « Your ROAS lies. This sheet doesn't. » + Tableau de bord du Pack (8 tuiles pub/trésorerie/contenu) |
| `pack-cover-2.png` | Cover 2 | Onglet Ads, colonne Verdict ✅ / ❌ |
| `pack-cover-3.png` | Cover 3 | Calculateur de prix + « What if I change my price? » |
| `pack-cover-4.png` | Cover 4 | Onglet Content (vues colorées) + onglet Budget |
| `pack-cover-5.png` | Cover 5 | « 11 tabs. One file. » : les 11 onglets |
| `pack-thumb.png` | Thumbnail (600 × 600) | Logo + « Seller Pack » + mini onglet Ads |

### Gumroad — Margokit Pro (`margokit.gumroad.com/l/pro-monthly` **et** `margokit.gumroad.com/l/pro-lifetime`)

Mêmes images pour les deux produits : téléverse-les à l'identique sur **Pro Monthly** et sur **Pro Lifetime**.

| Fichier | Emplacement | Contenu |
|---|---|---|
| `pro-cover-1.png` | Cover 1 (héros) | « Quotes & invoices in one minute. » + page facture de l'app (partage PDF / lien / WhatsApp / e-mail, Factur-X, UBL) + PDF, 🇬🇧 English · 🇫🇷 Français |
| `pro-cover-2.png` | Cover 2 | « Your client said yes? One click. » : devis accepté → bouton « Convert to invoice » → facture créée, statuts Draft → Sent → Accepted → Invoice → Paid |
| `pro-cover-3.png` | Cover 3 | Le PDF (EN devant, FR derrière) : logo, identifiants fiscaux, QR code SEPA, mentions légales |
| `pro-cover-4.png` | Cover 4 | « Send it. Get paid. » : panneau Partager, tuiles Facturé / Impayé / En retard, téléphone avec factures Sent / Paid / Overdue |
| `pro-cover-5.png` | Cover 5 | Tarifs Free 0 $ · Pro monthly 5 $/mois · Pro lifetime 39 $ (textes de `app/messages/en.json`) + « Ready for e-invoicing: Factur-X · UBL/Peppol (EN 16931) » |
| `pro-thumb.png` | Thumbnail (600 × 600) | Logo + « Pro » + haut du PDF de facture |

### Pinterest (1000 × 1500) — voir `marketing/content/pinterest.md` pour les titres, descriptions et liens

Lien : **C** = calculateur (`/en` ou `/fr`), **T** = Tracker, **P** = Seller Pack (ajoute `?utm_source=pinterest` aux liens Gumroad). Les fichiers `-en` vont sur les tableaux anglais, les `-fr` sur les tableaux français.

| Épingle | Fichiers | Lien | Titre Pinterest (EN) |
|---|---|---|---|
| 1 | `pin-01-en.png` · `pin-01-fr.png` | C | Free Profit Calculator for Online Sellers (Shipping, Fees & Returns Included) |
| 2 | `pin-02-en.png` · `pin-02-fr.png` | C | How to Price Your Product: The Minimum Price Formula for Small Businesses |
| 3 | `pin-03-en.png` · `pin-03-fr.png` | T | Order Tracker Google Sheets Template for Small Business (Inventory + Profit Dashboard) |
| 4 | `pin-04-en.png` · `pin-04-fr.png` | T | Simple Inventory Tracker Spreadsheet — Stock Updates Automatically |
| 5 | `pin-05-en.png` · `pin-05-fr.png` | T | Cash on Delivery Business? Track Refused Parcels and Risky Customers |
| 6 | `pin-06-en.png` · `pin-06-fr.png` | C | What Is a Good ROAS? Calculate Your Break-Even ROAS in 10 Seconds |
| 7 | `pin-07-en.png` · `pin-07-fr.png` | P | Facebook & TikTok Ads Tracker Spreadsheet — See Real Profit per Campaign |
| 8 | `pin-08-en.png` · `pin-08-fr.png` | P | Content Calendar Google Sheets Template for TikTok, Reels & Pinterest |
| 9 | `pin-09-en.png` · `pin-09-fr.png` | P | Small Business Budget Spreadsheet — Separate Business and Personal Money |
| 10 | `pin-10-en.png` · `pin-10-fr.png` | C | Product Launch Checklist: 5 Numbers to Know Before You Order Stock |

### WhatsApp — vendeurs COD au Maroc (1080 × 1350, 4:5)

Les 3 images envoyées après le message « J'ai fait un Google Sheet qui calcule le vrai bénéfice par commande et signale les clients qui refusent les colis. Je vous montre en 2 captures ? ». Version **Maroc** du fichier (libellés FR, montants en MAD affichés « DH »), mêmes données d'exemple et formules que `data.mjs` (`build('ma')`). Fond clair (lisible en mode clair et sombre de WhatsApp), aucun prix du produit.

| Fichier | Ordre d'envoi | Contenu |
|---|---|---|
| `wa-capture-1-tableau-de-bord.png` | 1 | Tableau de bord : CA 3 810,00 DH · bénéfice net 2 483,63 DH · taux de livraison 83,3 % · taux de retour 16,7 %, puis marge nette, panier moyen, meilleur canal + formule du bénéfice net |
| `wa-capture-2-clients-a-risque.png` | 2 | Onglet Clients : ⭐ Fidèle (Salma) et ⚠️ À risque (Imane : 2 colis refusés → 3,00 DH gagnés en 4 commandes) + « Demande un acompte à ces clients avant d'expédier » |
| `wa-capture-3-pack-pub.png` | 3 (upsell, si intérêt) | Pack Vendeur, onglet Publicité : dépense pub 1 300,00 DH, bénéfice après pub 1 183,63 DH, ROAS et verdict ✅ Rentable / ❌ Perd de l'argent par campagne |

## Points d'attention

- Les maquettes de tableur sont du HTML qui reproduit les onglets générés par `Code.gs` (mêmes en-têtes, couleurs, statuts et données d'exemple). Ce ne sont pas des captures de Google Sheets. Certaines colonnes sont masquées pour la lisibilité, ce qui explique les sauts dans les lettres de colonnes (B, C, G…).
- Les chiffres EN et FR diffèrent légèrement (ex. bénéfice net 157,36 $ contre 200,36 €), car les transporteurs d'exemple ne coûtent pas pareil dans chaque version. C'est aussi le cas dans les vrais fichiers.
- Captures Pro : prises sur l'app réelle, sans retouche (le bouton « Download PDF », un temps blanc sur blanc, est corrigé dans l'app).
- Les dates des documents de démo dépendent du jour où tu lances `shoot-app.mjs` (une facture datée d'août sert d'exemple « En retard »).
- Si le calculateur change d'interface, relance sans `--no-shots` et vérifie les épingles 1, 2, 6 et 10.
