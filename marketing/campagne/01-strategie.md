# Stratégie — campagne « Ce que tu gardes vraiment »

**Période** : du lundi 16 novembre au dimanche 13 décembre 2026 (4 semaines), préparation du 9 au 15 novembre.
**Réseaux** : Instagram, Facebook (Page + groupes), TikTok, LinkedIn. Pinterest continue en parallèle.
**Langue** : français (marché prioritaire : Maroc, Afrique de l'Ouest francophone, France). Version anglaise ensuite si la campagne marche.

---

## 1. Pourquoi zéro client aujourd'hui

Diagnostic du 8 novembre 2026, à partir de ce qui a été fait et de ce qu'on peut mesurer :

| Constat | Conséquence |
|---|---|
| **Personne ne mesure le trafic de margokit.com.** Le code envoie bien les données (`@vercel/analytics`), mais Web Analytics n'est **pas activé** sur le projet Vercel `margokit-pro`, celui qui sert margokit.com depuis le 4 octobre. L'API Vercel répond « Web Analytics not found ». | On ne sait pas si les épingles Pinterest amènent des visites. Impossible de savoir ce qui marche. |
| **Pinterest est le seul canal actif**, avec 17 épingles. | Pinterest est un canal lent : il faut en général 3 à 6 mois et des dizaines d'épingles pour un trafic régulier. Ce n'est pas un échec, c'est trop tôt. |
| **Aucune audience propre** : pas de comptes Instagram, TikTok ou Facebook actifs, pas de liste e-mail. | Personne ne voit les produits. |
| **Pas de preuve sociale** : aucun avis, aucun témoignage. | Un visiteur froid n'achète pas un produit inconnu à 12 ou 34 $. |
| **La prospection directe** (artefact de prospection, 11 boutiques YouCan) n'a pas été suivie jusqu'au bout. | C'est pourtant le canal qui convertit le plus vite au départ. |

**Conclusion** : le produit n'est pas en cause tant qu'il n'a pas été montré. Il faut **être vu** (réseaux), **démarrer des conversations** (commentaires, DM, groupes) et **mesurer**.

## 2. Objectifs des 4 semaines

Objectifs réalistes pour un lancement sans audience. Ils servent à décider, pas à se juger.

| Indicateur | Objectif | Où le lire |
|---|---|---|
| Visites du calculateur | 1 000 | Vercel → margokit-pro → Analytics (filtre `utm_campaign = ce-que-tu-gardes`) |
| Conversations (commentaires CALCUL / ROAS / COLIS + DM) | 40 | Instagram, TikTok, Facebook, à noter dans l'artefact de prospection |
| Comptes Margokit Pro gratuits | 20 | margokit.com/fr/admin |
| Inscriptions e-mail (calculateur) | 30 | Google Sheet « Margokit emails » |
| **Premières ventes** (Gumroad ou WhatsApp) | **5** | Gumroad → Analytics, WhatsApp |
| Abonnés cumulés (4 réseaux) | 300 | Chaque réseau |

## 3. Le message

**Une seule idée, répétée partout** : *tu ne sais pas ce que tu gardes vraiment, et c'est en général beaucoup moins que tu ne crois.*

Les preuves chiffrées, toutes calculées avec les formules du calculateur (`app/src/lib/profit.ts`) :

| Accroche | Chiffre |
|---|---|
| Tu vends à 25 €, tu crois garder 19 € | tu gardes **5,65 €** |
| Promo Black Friday −30 % sur ce produit | **−1,63 €** par vente |
| À −20 % | 0,79 €, il faut **7 fois** plus de ventes |
| ROAS de 3 | **0,23 €** par commande, seuil à 2,93 |
| COD 199 DH, 30 % de colis refusés → 15 % | 32 DH → **54 DH**, **+66 %** |
| +10 % sur le prix (27,50 €) | 8,08 €, **+43 %** |

**Ton** : tutoiement, phrases courtes, un chiffre par visuel, pas de jargon. On montre le calcul, on ne vend pas en premier.

## 4. Les cibles

| Cible | Où la trouver | Produit d'entrée | Produit payant |
|---|---|---|---|
| **Vendeur COD** (Maroc, Côte d'Ivoire, Sénégal) qui vend sur Instagram, TikTok, WhatsApp, YouCan | TikTok, Instagram, groupes Facebook e-commerce Maroc / Afrique | Calculateur en DH | Tracker version Maroc |
| **E-commerçant qui fait de la pub** (Shopify, dropshipping, TikTok Shop) | TikTok, Instagram, groupes dropshipping francophones | Calculateur (ROAS minimum) | Pack Vendeur |
| **Freelance, artisan, petite entreprise** (France, Maroc) | LinkedIn, groupes freelances Facebook | Margokit Pro gratuit (3 documents/mois) | Pro mensuel ou à vie |

## 5. Le rôle de chaque réseau

| Réseau | Rôle | Rythme | Ce qu'on y publie |
|---|---|---|---|
| **TikTok** | Portée : toucher des inconnus | 5 / semaine | Vidéos écran + voix (scripts de `marketing/content/videos.md`), carrousels photo |
| **Instagram** | Confiance + conversations | 3 posts / semaine + stories tous les jours | Carrousels « à enregistrer », Reels (mêmes vidéos que TikTok), stories avec sondages |
| **Facebook** | Groupes, là où sont les vendeurs COD | 3 posts Page + 1 post de valeur dans les groupes / semaine | Albums, vidéos, réponses dans les groupes |
| **LinkedIn** | Crédibilité, freelances, partenaires (comptables, agences) | 2 / semaine | Récit du fondateur, documents PDF |

## 6. La mécanique qui crée des conversations

1. **« Commente CALCUL »** (ou ROAS, COLIS) : la personne donne son prix et son coût, tu réponds en public avec son bénéfice, puis tu passes en DM.
2. En DM : le message n°1 de `marketing/content/outreach.md` (calcul offert), puis le lien du calculateur, puis, seulement si la marge est faible, le Tracker ou le Pack.
3. Chaque conversation est notée dans l'artefact de prospection (statut envoyé / répondu / gagné).
4. Les meilleures questions deviennent des vidéos « réponse à un commentaire » (vidéo n°9).

**Offre de lancement** : code **EARLY** (−25 %, 50 utilisations, déjà actif sur Gumroad) mis en avant pendant la semaine du Black Friday, jusqu'au **30 novembre**. Vérifie avant le 23 novembre que le code s'applique bien au Tracker et au Pack (piège Gumroad : « Tous les produits » + produits = exclusions).

## 7. Préparation : 9 → 15 novembre (obligatoire)

- [ ] **Activer Vercel Web Analytics** sur le projet `margokit-pro` : Vercel → margokit-pro → Analytics → Enable. Sans ça, impossible de mesurer la campagne.
- [ ] Créer les comptes **@margokit** sur Instagram (compte professionnel), TikTok (compte business) et la **Page Facebook Margokit**. Photo de profil : logo M sur fond lime (`marketing/visuals/out/tracker-thumb.png` recadré, ou l'icône `app/src/app/icon.svg`).
- [ ] Copier les bios et liens de profil (en haut de chaque fichier réseau). Liens avec UTM déjà prêts.
- [ ] LinkedIn : mettre à jour ton titre (« Fondateur de Margokit… »), créer la Page Margokit.
- [ ] Rejoindre 8 à 10 groupes Facebook (liste dans `facebook.md`) et y être actif 2 ou 3 jours avant de poster.
- [ ] Tourner les 5 premières vidéos de la semaine 1 et 2 (méthode : `marketing/content/tournage-semaine-1.md`).
- [ ] Faire une copie de démonstration du Tracker et du Pack pour filmer (données d'exemple incluses).
- [ ] Vérifier le code EARLY sur Gumroad.
- [ ] Programmer les posts : **Meta Business Suite** (Instagram + Facebook, gratuit), TikTok (planificateur intégré sur ordinateur), LinkedIn (programmation intégrée).

## 8. Routine pendant la campagne

| Quand | Quoi | Temps |
|---|---|---|
| Chaque jour | Répondre à **tous** les commentaires et DM dans l'heure qui suit la publication · 1 story | 20–30 min |
| Chaque jour | 10 commentaires utiles sur des posts de vendeurs (pas de lien) · 5 messages de prospection à la main | 20 min |
| Dimanche | Tourner les 5 vidéos de la semaine (1 h) · lire les chiffres et remplir le tableau ci-dessous | 1 h 30 |

## 9. Suivi hebdomadaire

| Semaine | Visites calculateur | Conversations | Comptes Pro | E-mails | Ventes | Meilleur post | Décision |
|---|---|---|---|---|---|---|---|
| 1 | | | | | | | |
| 2 | | | | | | | |
| 3 | | | | | | | |
| 4 | | | | | | | |

**Règles de décision** :
- Un format fait 3 fois mieux que les autres (enregistrements, partages, commentaires) → on en fait 2 de plus la semaine suivante.
- Un réseau n'amène aucune visite après 2 semaines → on réduit son rythme de moitié et on reporte le temps sur le meilleur.
- Le post organique avec le plus d'enregistrements en semaines 1–2 → c'est lui qu'on booste en semaine 3 (voir `facebook.md`, section publicité, 35 € au total).

## 10. Après le 13 décembre

- Bilan dans le tableau ci-dessus et sur LinkedIn (post du 10 décembre).
- Si les ventes viennent surtout des DM : doubler la prospection, alléger les publications.
- Si TikTok porte : passer à la version anglaise (`videos.md` contient tous les scripts EN).
- Demander un avis écrit à chaque premier acheteur, à publier en janvier.
