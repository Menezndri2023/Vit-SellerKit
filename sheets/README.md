# Margokit — Google Sheets

## Order & Inventory Tracker (`tracker/Code.gs`)

Script Google Apps Script qui génère le fichier complet (6 onglets, formules, menus déroulants, couleurs, graphiques, données d'exemple). Le fichier généré **ne contient aucun script** : l'acheteur n'a aucun écran d'autorisation.

### Générer les fichiers (5 min)

1. Ouvre https://script.google.com → **Nouveau projet**, nomme-le « Margokit generator ».
2. Remplace le contenu de `Code.gs` par celui de [tracker/Code.gs](tracker/Code.gs) → 💾.
3. Dans la liste des fonctions, choisis :
   - `buildTrackerEN` : anglais, `$`, transporteurs US/UK
   - `buildTrackerFR` : français, `€`, Colissimo / Mondial Relay…
   - `buildTrackerMA` : français, `MAD`, Amana / Cathedis / Ozon Express (pour la vente directe au Maroc)
   - `buildAll` : les trois d'un coup
4. **Exécuter** → autorise l'accès à ton compte (« Paramètres avancés → Accéder à… », c'est ton propre script).
5. L'URL de chaque fichier s'affiche dans le **Journal d'exécution**. Les fichiers sont aussi dans ton Google Drive.

`WITH_SAMPLE_DATA = false` en haut du script génère une version vide.

### Vérifier avant de vendre (checklist)

- [ ] Tableau de bord : les 12 indicateurs et les 4 graphiques s'affichent (données d'exemple).
- [ ] Commandes : passe une ligne de « Confirmée » à « Livrée » → le bénéfice apparaît et le stock baisse dans Produits.
- [ ] Passe une ligne en « Retournée » → bénéfice négatif en rouge, le stock remonte.
- [ ] Clients : un client est marqué ⚠️ (2 retours) et un autre ⭐ (3 livraisons).
- [ ] Produits : « Sac cabas » apparaît en orange (stock bas).
- [ ] Ouvre le fichier sur l'application mobile Google Sheets : les menus déroulants fonctionnent.
- [ ] Fais des captures d'écran du tableau de bord pour Gumroad.

Si une cellule affiche `#ERROR!` ou `#NAME?`, envoie-moi le nom de l'onglet, la cellule et le message.

### Livrer via Gumroad

1. Dans le fichier : **Partager → Toute personne disposant du lien → Lecteur**.
2. Copie l'URL et remplace la fin `/edit…` par **`/copy`** :
   `https://docs.google.com/spreadsheets/d/ID_DU_FICHIER/copy`
   L'acheteur qui ouvre ce lien reçoit le bouton « Créer une copie » : il obtient sa propre version, et ton original reste intact.
3. Gumroad → produit → **Contenu** : mets un petit PDF « Accès à ton tracker » avec le lien `/copy` (EN et FR), ou colle directement le lien dans le contenu.

⚠️ Un lien `/copy` peut circuler librement. Au prix de 9–12 $, c'est un risque accepté par la plupart des vendeurs de templates. Ne mets jamais en partage l'original sur lequel tu travailles : génère une copie dédiée à la vente.
