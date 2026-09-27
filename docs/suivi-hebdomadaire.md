# Suivi hebdomadaire — indicateurs et décisions

> 30 minutes chaque lundi. Le but n'est pas de tout mesurer, mais de savoir **où le tunnel fuit** et de changer **une seule chose** par semaine.

## 1. Le tunnel à surveiller

```text
Vidéos / épingles / messages  →  Visites (calculateur, landing)  →  Clics vers Gumroad / WhatsApp  →  Ventes
                                        ↓
                          Inscriptions Margokit Pro → 1er document émis → limite gratuite atteinte → Pro
```

Chaque semaine, repère l'étape où le taux est le plus faible par rapport aux repères ci-dessous : c'est là que tu agis.

## 2. Les indicateurs (et où les trouver)

| # | Indicateur | Où le lire | Repère de départ* |
|---|---|---|---|
| **A. Audience** ||||
| A1 | Vues totales des vidéos (TikTok + Reels) | Statistiques TikTok / Instagram | Médiane > 500 vues/vidéo après 3 semaines |
| A2 | Visites du profil → clics sur le lien en bio | TikTok (Statistiques → Profil), Instagram (Insights) | 1–3 % des vues |
| A3 | Épingles Pinterest : impressions → clics sortants | Pinterest Analytics | 0,5–1 % des impressions |
| **B. Trafic** ||||
| B1 | Visiteurs du site, par source | Vercel → Analytics → Referrers, et `utm_source` | En hausse chaque semaine |
| B2 | Partages du résultat du calculateur | Vercel Analytics → événements `share_result`, `copy_link` | 2–5 % des visiteurs |
| B3 | Inscriptions à la newsletter | Google Sheet « Margokit emails » + événement `subscribe` | 2–5 % des visiteurs du calculateur |
| **C. Ventes des templates** ||||
| C1 | Vues des pages Gumroad | Gumroad → Analytics (par produit, par source UTM) | — |
| C2 | Taux de conversion Gumroad (ventes ÷ vues) | Gumroad → Analytics | 1–3 % |
| C3 | Part du Seller Pack dans les ventes (et upsell accepté) | Gumroad → Sales | ≥ 30 % des ventes |
| C4 | Conversations WhatsApp → ventes | Ta liste de contacts (onglet Clients / Trésorerie de ton Pack) | 20–40 % des conversations |
| C5 | Remboursements | Gumroad → Sales | < 5 % |
| **D. Margokit Pro** ||||
| D1 | Inscriptions (e-mail confirmé) | `/admin` → Statistiques | En hausse chaque semaine |
| D2 | Activation : inscrits ayant émis ≥ 1 document | `/admin` → Statistiques (Activation) | ≥ 40 % des inscrits |
| D3 | Conversion gratuit → Pro | `/admin` → Statistiques | 2–5 % des inscrits vérifiés |
| D4 | Revenus Pro du mois (mensuel + à vie) et MRR | `/admin` → Statistiques (revenus par mois) | — |
| D5 | Annulations des abonnements mensuels | Gumroad → Subscribers ; `/admin/sales` (événements `cancellation`) | < 8 % par mois |
| D6 | Codes WhatsApp activés / générés | `/admin/codes` | > 80 % utilisés |
| **E. Argent** ||||
| E1 | Encaissé de la semaine (Gumroad + WhatsApp) | Relevé Gumroad + Trésorerie de ton Pack | Objectif que tu fixes |
| E2 | Dépenses (outils, pub, domaine) | Trésorerie de ton Pack | Toujours < encaissé |

\* Repères indicatifs pour démarrer, à remplacer par tes propres moyennes après 4 semaines. Ce ne sont pas des garanties.

## 3. Règles de décision

| Ce que tu observes | Ce que ça veut dire | Action de la semaine |
|---|---|---|
| Beaucoup de vues, peu de clics en bio (A2 bas) | L'accroche plaît mais l'appel à l'action est faible | Dire « calculateur gratuit, lien en bio » à l'oral **et** à l'écran ; lien unique et clair en bio |
| Vues faibles partout (A1 bas) | Les 3 premières secondes ne retiennent pas | Tester 3 nouvelles accroches (chiffre choc, question, « POV ») sur le même sujet |
| Beaucoup de visites, peu de partages (B2 bas) | Le résultat n'est pas assez « montrable » | Pousser le bouton partage dans les vidéos (« poste ta marge ») ; format #10 du plan de contenu |
| Beaucoup de visites Gumroad, peu de ventes (C2 < 1 %) | Page, prix ou preuve insuffisants | Changer **une** chose : visuel n°1, titre, ou code de lancement ; ajouter 1–2 vrais avis |
| Beaucoup de cartes refusées / questions de paiement | Paiement international bloqué (Maroc, Afrique) | Mettre le lien WhatsApp plus en avant ; proposer les codes d'activation |
| Remboursements > 5 % | Promesse ≠ produit | Relire la page : ce qui est promis est-il exactement ce qui est livré ? Corriger la FAQ |
| Inscrits Pro qui n'émettent aucun document (D2 bas) | Démarrage trop long | E-mail de bienvenue avec 3 étapes ; pré-remplir le pays et la devise ; vidéo « ma première facture en 1 min » |
| Limite gratuite atteinte mais pas de passage à Pro | Prix ou valeur perçue | Mettre en avant « à vie » ; vérifier la réduction par pays (PPP) ; message à la limite plus concret |
| Annulations mensuelles > 8 % | Pas assez de valeur récurrente | Demander la raison (e-mail court) ; pousser les fonctions récurrentes (relances, Factur-X) |
| Coûts d'hébergement qui montent | Limites gratuites atteintes | Atlas M0 (512 Mo), Resend (quota), Vercel : passer à l'offre payante quand les revenus couvrent 3× le coût |

**Règle d'or : une seule modification par semaine**, sinon tu ne sauras pas ce qui a marché.

## 4. La routine du lundi (30 min)

1. **10 min — Relever les chiffres** dans le tableau ci-dessous (Gumroad, Vercel, TikTok/Instagram, `/admin`).
2. **5 min — Trouver la fuite** : l'étape du tunnel la plus éloignée de son repère.
3. **5 min — Décider** : une action tirée des règles ci-dessus, écrite noir sur blanc.
4. **10 min — Planifier le contenu** de la semaine (onglet Contenu de ton Seller Pack) en répétant les 3 accroches qui ont fait le plus de vues.

## 5. Tableau à remplir chaque semaine

Copie ce tableau dans un Google Sheet (ou l'onglet Trésorerie/Contenu de ton propre Seller Pack).

| Semaine | Vues vidéos | Clics bio | Visiteurs site | Partages calc. | E-mails | Vues Gumroad | Ventes Gumroad | Ventes WhatsApp | Inscrits Pro | Nouveaux Pro | Encaissé | Action décidée |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| S1 | | | | | | | | | | | | |
| S2 | | | | | | | | | | | | |
| S3 | | | | | | | | | | | | |
| S4 | | | | | | | | | | | | |

## 6. Revue mensuelle (1 h)

- Quels 3 contenus ont apporté le plus de visites et de ventes ? → en faire 3 variantes.
- Quel canal rapporte le plus par heure passée (TikTok, Instagram, Pinterest, groupes, WhatsApp) ? → doubler dessus, couper le plus faible.
- Prix : si C2 > 3 % pendant 4 semaines, **teste une hausse** (ex. Pack 34 → 39 $) ; si < 1 % malgré le trafic, teste un code de lancement.
- Déclarer les revenus du mois (auto-entrepreneur) et mettre de côté les impôts et cotisations — à vérifier avec un comptable.

## 7. Suivi technique (5 min par mois)

- `/admin/sales` : les ventes Gumroad arrivent-elles bien (webhook) ?
- Vercel → Logs : erreurs 500 récurrentes ?
- Cron quotidien exécuté (Vercel → Cron Jobs) ?
- Sauvegardes MongoDB Atlas (sur M0, faire un export régulier : `mongodump` ou export depuis Atlas).
