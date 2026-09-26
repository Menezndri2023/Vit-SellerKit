# Gumroad — mise en place (≈ 2 h)

Pages de vente prêtes à coller : [tracker.md](tracker.md) · [seller-pack.md](seller-pack.md)

Chiffres vérifiés le 26/09/2026 sur [gumroad.com/pricing](https://gumroad.com/pricing) et le [centre d'aide](https://gumroad.com/help/article/327-purchasing-power-parity). Revérifie avant de lancer :
- **10 % + 0,50 $** par vente directe (ton lien, ton profil) ; **30 %** si la vente vient de la vitrine Gumroad Discover.
- Gumroad est **merchant of record** depuis le 01/01/2025 : il collecte et reverse les taxes de vente (TVA, sales tax) à ta place.

## 1. Stratégie de prix

| Produit | Prix | Tu touches (vente directe) | Code de lancement |
|---|---|---|---|
| Tracker | **12 $** | ≈ 10,30 $ | `EARLY` −25 % → 9 $, limité à 50 utilisations |
| Seller Pack | **34 $** | ≈ 30,10 $ | `EARLY` −20 % → 27 $, limité à 50 utilisations |
| Tracker → Pack | 34 − 12 = **22 $** | ≈ 19,30 $ | `UPGRADE` : −12 $, réservé au Seller Pack, sans limite |

- Pas en dessous de 9 $ : les 0,50 $ fixes pèsent trop lourd sur les petits prix.
- **Parité de pouvoir d'achat (PPP) : active-la, plafond 40 %.** Au Maroc, le Pack tombe à environ 20 $ (≈ 200 MAD). Aligne tes prix WhatsApp dessus (voir §5) pour que les deux canaux ne se concurrencent pas.
- **Upsell** sur le Tracker : au paiement, Gumroad propose le Pack. C'est ton levier n°1 pour augmenter le panier.

## 2. Compte et versements

1. **Profil** (Settings → Profile) : nom `Margokit`, nom d'utilisateur `margokit` → `margokit.gumroad.com`, logo, bio : `Google Sheets & tools for online sellers — know what you really keep.`
2. **Versements** (Settings → Payments) : ton compte bancaire marocain (RIB/IBAN, nom exact du titulaire) + la vérification d'identité demandée. Note le montant minimum de versement et le calendrier affichés : ils peuvent avoir changé.
3. **PPP** (Settings → Advanced, ou Checkout selon la version de l'interface) : active « Purchasing power parity » et fixe le plafond à 40 %.
4. **E-mail de support** : mets une adresse que tu lis tous les jours. Les clients répondent au reçu.

## 3. Créer chaque produit

Pour le Tracker, puis pour le Seller Pack :

1. **New product → Digital product**, nom et prix du fichier `.md`.
2. **Description** : colle le bloc « Description ». Remplace `{{LIEN_WHATSAPP}}` (§5).
3. **Covers** : 3 à 5 images de 1280 × 720 (§4). **Thumbnail** : 600 × 600.
4. **Summary**, bouton, détails additionnels et tags : voir le tableau en haut du fichier `.md`.
5. **Content** : colle le bloc « Contenu livré ». Remplace les `{{LIEN_COPY_…}}` par les liens `/copy` (voir [sheets/README.md](../../sheets/README.md), section « Livrer via Gumroad »).
6. **Receipt** : le message personnalisé.
7. **Refund policy** : 14 jours.
8. **Discounts** : `EARLY` sur chaque produit, `UPGRADE` sur le Seller Pack.
9. **Checkout → Upsells** (après la création des 2 produits) : sur le Tracker, propose le Seller Pack.
10. **Publish**.

### Test obligatoire avant d'annoncer

1. Crée un code `TEST100` à −100 %, limité à 1 utilisation.
2. Achète chaque produit avec ce code, dans une fenêtre de navigation privée et avec un autre compte Google.
3. Vérifie : le reçu arrive, les 3 liens `/copy` ouvrent « Créer une copie », la copie contient bien les données d'exemple.
4. Supprime `TEST100`.

## 4. Visuels à créer

Outils gratuits : [Canva](https://www.canva.com) pour les covers, [shots.so](https://shots.so) pour les mockups d'écran et de téléphone. Palette : fond `#0F172A` ou `#F8FAFC`, accent citron `#A3E635`, police Plus Jakarta Sans.

**Captures à faire** : zoom 100 %, fenêtre d'environ 1440 px, données d'exemple, Pack FR et EN.

| # | Tracker (1280 × 720) | Seller Pack (1280 × 720) |
|---|---|---|
| 1 — Héros | Titre « Know what you really keep » + capture du Tableau de bord dans un cadre de navigateur, fond sombre | Titre « Your ROAS lies. This sheet doesn't. » + Tableau de bord du Pack (8 tuiles pub/trésorerie visibles) |
| 2 | Onglet Commandes (lignes colorées par statut), flèche vers la colonne Bénéfice | Onglet Publicité : zoom sur la colonne Verdict ✅/❌ |
| 3 | Onglet Clients : zoom sur ⚠️ À risque / ⭐ Fidèle — légende « Spot customers who refuse parcels » | Calculateur de prix + tableau « Et si je change mon prix ? » |
| 4 | Mockup iPhone de l'onglet Commandes — « Works on your phone » | Onglet Contenu (vues colorées) + Budget (barres) |
| 5 | Les 3 versions EN / FR / MAD — « 3 versions included » | « 11 tabs, one file » : les noms des 11 onglets |
| Thumbnail 600 × 600 | Logo Margokit + « Tracker » + mini-capture | Logo Margokit + « Seller Pack » + mini-capture |

**Bonus conseillé** : une vidéo de 20 à 30 secondes, en cover n°1 si possible. Enregistrement d'écran : tu passes une commande de « Confirmée » à « Livrée », puis tu montres le bénéfice qui apparaît et le tableau de bord qui bouge. Sur macOS, fais `Cmd + Shift + 5` pour enregistrer, puis passe dans CapCut pour ajouter les sous-titres. Tu pourras la réutiliser telle quelle sur TikTok et en Reel.

## 5. Vente directe WhatsApp (secours et Maroc)

**Lien à mettre dans les pages Gumroad** (remplace `2126XXXXXXXX` par ton numéro au format international, sans + ni 0) :

```text
https://wa.me/2126XXXXXXXX?text=Hi%20Margokit%20%F0%9F%91%8B%20My%20card%20was%20declined.%20How%20can%20I%20pay%20for%20the%20Seller%20Pack%3F
```

**Lien pour tes posts et stories au Maroc** :

```text
https://wa.me/2126XXXXXXXX?text=Bonjour%20Margokit%20%F0%9F%91%8B%20Je%20veux%20acheter%20le%20Pack%20Vendeur%20%28version%20Maroc%29.%20Comment%20je%20paie%20%3F
```

**Prix WhatsApp**, alignés sur Gumroad avec la PPP : Tracker **79 MAD**, Pack **199 MAD**, passage du Tracker au Pack **129 MAD**.

**Messages types** (WhatsApp Business → Réponses rapides) :

```text
/prix
Merci pour ton intérêt 🙏
• Tracker Commandes & Stock : 79 DH
• Pack Vendeur complet (11 onglets) : 199 DH
Paiement par virement, versement ou transfert (CashPlus / Wafacash). Tu reçois le lien juste après la confirmation du paiement.
```

```text
/rib
Voici mes coordonnées :
Nom : {{NOM_TITULAIRE}}
RIB : {{RIB}}
Banque : {{BANQUE}}
Montant : {{MONTANT}} DH
Envoie-moi la capture du paiement ici et je t'envoie ton accès dans la foulée ✅
```

```text
/livraison
Paiement bien reçu, merci ! 🎉
Voici ton lien : {{LIEN_COPY_MA}}
1. Ouvre le lien → « Créer une copie » (le fichier arrive dans ton Google Drive).
2. Commence par l'onglet « Mode d'emploi ».
Une question ? Je suis là. Et si tu as 2 minutes plus tard, ton avis m'aiderait beaucoup 🙏
```

**À ne pas oublier :**
- Garde une trace de chaque paiement direct : date, client, montant, capture. Un onglet Trésorerie dans ton propre Pack fait très bien l'affaire.
- **Tes revenus sont à déclarer**, ceux de Gumroad comme ceux des ventes directes. Le statut d'auto-entrepreneur au Maroc est la voie la plus simple. Renseigne-toi sur [ae.gov.ma](https://ae.gov.ma) et auprès de ta banque, qui peut demander des justificatifs pour les virements venant de l'étranger (les versements Gumroad). Je ne suis ni comptable ni conseiller fiscal : fais valider ta situation par un professionnel.

## 6. Checklist de lancement

- [ ] Copies de vente des 6 fichiers créées et partagées en « Lecteur » ; liens `/copy` notés
- [ ] Profil Gumroad, versements et PPP (40 %) configurés
- [ ] Tracker publié (description, 5 covers, contenu, reçu, `EARLY`)
- [ ] Seller Pack publié (description, 5 covers, contenu, reçu, `EARLY`, `UPGRADE`)
- [ ] Upsell Tracker → Pack actif
- [ ] Achat test `TEST100` réussi sur les 2 produits, puis code supprimé
- [ ] Liens WhatsApp testés sur ton téléphone
- [ ] Lien Gumroad dans les bios TikTok, Instagram et WhatsApp Business
- [ ] Premier message envoyé à 5 vendeurs de ton entourage (version Maroc, contre un avis honnête)
