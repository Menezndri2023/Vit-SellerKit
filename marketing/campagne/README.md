# Campagne « Ce que tu gardes vraiment » — 16 nov. → 13 déc. 2026

Tout ce qu'il faut pour lancer Margokit sur Instagram, Facebook, TikTok et LinkedIn : stratégie, présentation, guide des kits, 52 publications datées avec leurs visuels et leurs textes.

## Par où commencer

1. **Ouvre `OUVRIR-apercu-local.html`** (double-clic) : l'aperçu visuel de toute la campagne, filtrable par réseau, avec les carrousels à faire défiler et un bouton « Copier le texte » sur chaque post.
2. Lis **`01-strategie.md`**, en particulier la **préparation du 9 au 15 novembre** (activer Vercel Analytics, créer les comptes, rejoindre les groupes).
3. Chaque jour, ouvre le fichier du réseau et copie-colle le post du jour.

## Contenu du dossier

| Fichier | Contenu |
|---|---|
| `OUVRIR-apercu-local.html` | Aperçu visuel de la campagne (à ouvrir dans le navigateur) |
| `01-strategie.md` | Diagnostic, objectifs, cibles, message, rôle de chaque réseau, préparation, routine, suivi |
| `02-presentation-margokit.md` | Présentation complète du projet (version texte) |
| `03-guide-des-kits.md` | Chaque kit : pour qui, comment l'utiliser, objections, lequel conseiller |
| `calendrier.md` | Les 52 publications jour par jour |
| `instagram.md` · `facebook.md` · `tiktok.md` · `linkedin.md` | Textes prêts à publier, 1er commentaire, visuels, scripts vidéo, bios |
| `visuels/` | 32 slides de carrousel (1080 × 1350), 4 stories (1080 × 1920), 10 slides de présentation (1920 × 1080), et les PDF (carrousels LinkedIn, `presentation-margokit.pdf`) |
| `videos/` | Copie locale des 2 vidéos déjà prêtes (non versionnée) |
| `posts.mjs` | **Source unique** de tous les textes |
| `build.mjs` | Régénère les `.md`, les PDF et l'aperçu à partir de `posts.mjs` |
| `export-campagne.mjs` | Exporte **toute cette campagne** (aperçu hors ligne, PDF complet, vidéos, présentation, carrousels, stories, posts par réseau) dans `~/Desktop/Campagne Ce que tu gardes` |
| `pdf-complet.mjs` | Génère `CAMPAGNE-COMPLETE.pdf` (utilisé par les deux exports) |
| `export-mac.mjs` | Copie toutes les campagnes (celle-ci + Pinterest, prospection, vidéos, visuels Gumroad) dans `~/Desktop/Margokit-Campagnes`, un dossier par publication avec images numérotées et `texte.txt` |

## Modifier un post

1. Modifie le texte dans `posts.mjs`.
2. `node marketing/campagne/build.mjs` (ajoute `--no-pdf` si les visuels n'ont pas changé).
3. `node marketing/campagne/export-campagne.mjs` pour mettre à jour le dossier « Campagne Ce que tu gardes » du Bureau (et `export-mac.mjs` pour le dossier de toutes les campagnes).

## Modifier un visuel

Les visuels sont du HTML rendu en PNG, dans `marketing/visuals/campagne.mjs` (mêmes briques et même charte que les couvertures Gumroad).

```bash
node marketing/visuals/render.mjs --no-shots car-      # carrousels
node marketing/visuals/render.mjs --no-shots story-    # stories
node marketing/visuals/render.mjs --no-shots deck-     # présentation
node marketing/campagne/build.mjs                      # PDF + aperçu
```

## À faire par toi avant de publier

- Les posts marqués **⚠️** (récit personnel) : adapte la première phrase à ton vécu réel.
- Les posts LinkedIn du 26 novembre et du 10 décembre contiennent **[à compléter]** : mets tes vrais chiffres.
- 14 vidéos sont **à tourner** (liste dans `calendrier.md`) : 5 par dimanche.
