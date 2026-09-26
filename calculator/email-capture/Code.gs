/**
 * Margokit — récolte des e-mails du calculateur dans un Google Sheet (gratuit).
 *
 * 1. Crée un Google Sheet « Margokit emails » → Extensions → Apps Script → colle ce fichier.
 * 2. Remplace SECRET par une longue chaîne aléatoire (la même que SUBSCRIBE_WEBHOOK_SECRET sur Vercel).
 * 3. Déployer → Nouveau déploiement → Type : Application Web
 *    Exécuter en tant que : Moi · Accès : Tout le monde → Déployer → copie l'URL (…/exec)
 *    = SUBSCRIBE_WEBHOOK_URL sur Vercel.
 */

const SECRET = 'REMPLACE-MOI-PAR-UNE-LONGUE-CHAINE-ALEATOIRE';

function doPost(e) {
  const data = JSON.parse(e.postData.contents || '{}');
  if (data.secret !== SECRET) return json_({ ok: false });

  const email = String(data.email || '').trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || email.length > 254) return json_({ ok: false });

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  if (sheet.getLastRow() === 0) sheet.appendRow(['Date', 'Email', 'Langue', 'Source']);

  // Pas de doublon
  const existing = sheet.getLastRow() > 1 ? sheet.getRange(2, 2, sheet.getLastRow() - 1, 1).getValues().flat() : [];
  if (existing.indexOf(email) === -1) {
    sheet.appendRow([new Date(), email, String(data.locale || '').slice(0, 5), String(data.source || '').slice(0, 40)]);
  }
  return json_({ ok: true });
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
