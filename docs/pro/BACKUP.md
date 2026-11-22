# Sauvegardes de la base Margokit

MongoDB Atlas M0 (gratuit) n'a pas de sauvegarde automatique. Le workflow GitHub
[`db-backup`](../../.github/workflows/db-backup.yml) fait chaque nuit (02:30 UTC) un `mongodump`
de la production, le **chiffre** (AES-256, clé dérivée PBKDF2 de `BACKUP_PASSPHRASE`) puis le
conserve 30 jours comme artefact GitHub. Le dépôt étant public, seul le fichier chiffré quitte
le runner ; sans la phrase secrète il est illisible.

## Mise en place (une fois)

1. **Atlas → Database Access → Add New Database User**
   - Authentication : Password (générer un mot de passe long)
   - Built-in Role : **Only read any database** (lecture seule : suffit à `mongodump`, aucune écriture possible)
2. Construire l'URI : celle de `MONGODB_URI` en remplaçant l'utilisateur et le mot de passe.
3. **GitHub → Settings → Secrets and variables → Actions → New repository secret**
   - `MONGODB_BACKUP_URI` : l'URI ci-dessus
   - `BACKUP_PASSPHRASE` : `openssl rand -base64 48` — **à garder aussi dans un gestionnaire de mots de passe**, sinon les sauvegardes sont irrécupérables
4. **Actions → db-backup → Run workflow** pour un premier essai.

## Restaurer

```bash
# 1. Télécharger l'artefact (Actions → db-backup → run → Artifacts), puis :
openssl enc -d -aes-256-cbc -pbkdf2 -iter 600000 -in margokit-AAAA-MM-JJ.archive.gz.enc -out dump.archive.gz
# 2. Toujours tester d'abord dans une base locale :
npm --prefix app run db   # autre terminal : MongoDB local sur 27018
mongorestore --uri="mongodb://127.0.0.1:27018/?replicaSet=rs0" --archive=dump.archive.gz --gzip --nsFrom='margokit.*' --nsTo='margokit_restore.*'
# 3. En production seulement après vérification, avec --drop sur les collections concernées.
```

Restauration testée le 22/11/2026 (sauvegarde du jour : déchiffrement, `mongorestore` dans une base locale séparée, comptes identiques à la production, base de test supprimée ensuite). Sans Docker, `mongorestore` s'obtient avec les [MongoDB Database Tools](https://www.mongodb.com/try/download/database-tools).

Une sauvegarde n'existe vraiment qu'une fois sa restauration testée : faire l'essai local une fois par trimestre.

Pour aller plus loin : un cluster Atlas avec sauvegardes gérées (snapshots + restauration à un instant donné) remplace ce workflow.
