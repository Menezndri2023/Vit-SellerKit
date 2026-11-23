/**
 * Captures of the real Margokit app for the « Facture. Encaisse. Respire. » campaign (FR UI, Moroccan demo business).
 * Writes marketing/campagne-pro/captures/*.png (not versioned).
 *
 * LOCAL production build + THROWAWAY database only — never margokit.com:
 *   cd app && npm run db && npm run build
 *   MONGODB_URI='mongodb://127.0.0.1:27018/margokit_visuals?replicaSet=rs0' BETTER_AUTH_URL=http://localhost:3300 \
 *     NEXT_PUBLIC_SITE_URL=http://localhost:3300 E2E_DISABLE_RATE_LIMIT=1 npx next start -p 3300
 *   node marketing/visuals/shoot-campagne-pro.mjs [--drop]
 *
 * Everything is fictional: « Studio Atlas » (Casablanca), its clients, ICE/IF/RIB numbers, emails (*.example).
 */
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const { chromium } = await import(join(ROOT, 'app', 'node_modules', 'playwright', 'index.mjs'));
const { MongoClient, ObjectId } = await import(join(ROOT, 'app', 'node_modules', 'mongodb', 'lib', 'index.js'));

const BASE = process.env.BASE_URL || 'http://localhost:3300';
const DB = process.env.VISUALS_DB || 'mongodb://127.0.0.1:27018/margokit_visuals?replicaSet=rs0';
if (/margokit\.com|vercel\.app/.test(BASE)) throw new Error('Refusing to run against production.');
if (!/\/margokit_visuals\?/.test(DB)) throw new Error('Use the throwaway margokit_visuals database.');
const OUT = join(ROOT, 'marketing', 'campagne-pro', 'captures');
mkdirSync(OUT, { recursive: true });
const ONLY = process.argv.find((a) => a.startsWith('--only='))?.slice(7);

const SELLER = {
  legalName: 'Studio Atlas',
  tradeName: 'Studio Atlas — design & web',
  email: 'contact@studioatlas.example',
  phone: '+212 6 00 00 00 00',
  'address.line1': '45 boulevard d’Anfa',
  'address.postalCode': '20000',
  'address.city': 'Casablanca',
  'ids.ICE': '001234567000089',
  'ids.RC': 'Casablanca 123456',
  'bankAccounts.0.holder': 'Studio Atlas',
  'bankAccounts.0.bankName': 'Banque Exemple',
  'bankAccounts.0.accountNumber': '011 780 0000123456789012 34',
  'paymentLinks.0.url': 'https://pay.studioatlas.example/facture',
};
const SELLER_LATER = { 'ids.IF': '12345678', 'ids.PATENTE': '34567890' };

const CLIENTS = [
  { key: 'riad', name: 'Riad Yasmine SARL', contactName: 'Salma Benjelloun', email: 'salma@riadyasmine.example', phone: '+212 6 11 00 00 01', line1: '12 derb Sidi Bouloukat', postalCode: '40000', city: 'Marrakech', ice: '002211334000071' },
  { key: 'nova', name: 'Nova Immobilier SA', contactName: 'Youssef El Idrissi', email: 'youssef@novaimmo.example', phone: '+212 6 11 00 00 02', line1: '7 avenue Hassan II', postalCode: '10000', city: 'Rabat', ice: '003344556000062' },
  { key: 'horizon', name: 'École Horizon', email: 'direction@ecolehorizon.example', phone: '+212 6 11 00 00 03', line1: '3 rue Ibn Battouta', postalCode: '90000', city: 'Tanger', ice: '004455667000053' },
  { key: 'cafe', name: 'Café Zellige', email: 'bonjour@cafezellige.example', phone: '+212 6 11 00 00 04', line1: '18 rue de Fès', postalCode: '20250', city: 'Casablanca', ice: '005566778000044' },
];

const browser = await chromium.launch({ args: ['--lang=fr-FR'], env: { ...process.env, LANG: 'fr_FR.UTF-8' } });
const ctx = await browser.newContext({ baseURL: BASE, viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2, locale: 'fr-FR', timezoneId: 'Africa/Casablanca', colorScheme: 'light' });
await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
const page = await ctx.newPage();
page.on('dialog', (d) => d.accept());
const mongo = await MongoClient.connect(DB);
const db = mongo.db();
const step = (s) => console.log(`· ${s}`);
const fill = (name, v) => page.locator(`[name="${name}"]`).fill(v);
const fonts = (p = page) => p.evaluate(() => document.fonts.ready);

async function account({ pro, name, locale = 'en' }) {
  const email = `campagne-${randomUUID().slice(0, 8)}@example.com`;
  const password = 'demo-campagne-2026';
  const res = await page.request.post('/api/auth/sign-up/email', { data: { name, email, password, uiLocale: locale }, headers: { Origin: BASE } });
  if (!res.ok()) throw new Error(`sign-up ${res.status()} ${await res.text()}`);
  const user = await db.collection('user').findOneAndUpdate({ email }, { $set: { emailVerified: true, timeZone: 'Africa/Casablanca', consent: { version: '2026-11-22', termsAcceptedAt: new Date(), transferAcceptedAt: new Date(), ip: '127.0.0.1' } } }, { returnDocument: 'after' });
  if (pro) await db.collection('subscriptions').insertOne({ userId: String(user._id), plan: 'manual', provider: 'manual', status: 'active', startsAt: new Date(), expiresAt: null, remindersSent: [], createdAt: new Date(), updatedAt: new Date() });
  await ctx.clearCookies();
  const login = await page.request.post('/api/auth/sign-in/email', { data: { email, password }, headers: { Origin: BASE } });
  if (!login.ok()) throw new Error(`sign-in ${login.status()}`);
  return { userId: String(user._id), email };
}

/** Accepts the consent screen if the app shows it (the user document format may differ). */
async function passConsent() {
  if (!page.url().includes('/consent')) return;
  await page.locator('input[name=terms]').check();
  await page.locator('input[name=transfer]').check();
  await page.locator('button[type=submit]').click();
  await page.waitForURL((u) => !u.pathname.includes('/consent'));
}
async function go(path) {
  await page.goto(path);
  await passConsent();
  if (!page.url().includes(path.split('?')[0])) await page.goto(path);
}

async function settings() {
  await go('/en/app/settings');
  await page.locator('[name="address.country"]').selectOption('MA');
  await page.locator('[name="ids.ICE"]').waitFor();
  for (const [k, v] of Object.entries(SELLER)) await fill(k, v);
  await page.locator('[name="defaultCurrency"]').selectOption('MAD');
  await page.locator('[name="defaultDocLocale"]').selectOption('fr');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByText('Saved ✓').waitFor();
  step('profile (without IF/TP for the warning shot)');
}
async function settingsComplete() {
  await go('/en/app/settings');
  for (const [k, v] of Object.entries(SELLER_LATER)) await fill(k, v);
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByText('Saved ✓').waitFor();
  step('profile IF + TP');
}

async function clients() {
  for (const c of CLIENTS) {
    await go('/en/app/clients/new');
    await fill('name', c.name);
    if (c.contactName) await fill('contactName', c.contactName);
    await fill('email', c.email);
    await fill('phone', c.phone);
    await fill('address.line1', c.line1);
    await fill('address.postalCode', c.postalCode);
    await fill('address.city', c.city);
    await page.locator('[name="address.country"]').selectOption('MA');
    await page.locator('[name="ids.ICE"]').fill(c.ice);
    await page.locator('[name="preferredDocLocale"]').selectOption('fr');
    await page.locator('[name="preferredCurrency"]').selectOption('MAD');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForURL(/\/en\/app\/clients$/);
  }
  step(`${CLIENTS.length} clients`);
}

async function draft({ type, client, issueDate, dueDate, lines }) {
  await go(`/en/app/documents/new?type=${type}`);
  await page.locator('#client').selectOption({ label: CLIENTS.find((c) => c.key === client).name });
  if (issueDate) await page.locator('#issueDate').fill(issueDate);
  if (dueDate) await page.locator('#dueDate').fill(dueDate);
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) await page.getByRole('button', { name: '+ Add a line' }).click();
    const [d, q, p] = lines[i];
    await page.locator(`#d-${i}`).fill(d);
    await page.locator(`#q-${i}`).fill(String(q));
    await page.locator(`#p-${i}`).fill(String(p));
  }
  await page.getByRole('button', { name: 'Save draft' }).click();
  await page.waitForURL(/\/documents\/[0-9a-f]{24}$/);
  return page.url().split('/').pop();
}
async function issue() {
  await page.getByRole('button', { name: /^Issue / }).click();
  await page.getByText('This document is issued').waitFor();
  return page.url().split('/').pop();
}
async function markSent() {
  await page.getByRole('button', { name: 'Mark as sent' }).click();
  await page.getByRole('button', { name: 'Mark as sent' }).waitFor({ state: 'detached' });
}
async function pay() {
  await page.getByRole('button', { name: 'Record a payment' }).click();
  await page.getByText('No payment recorded yet.').waitFor({ state: 'detached' });
}

const ids = {};
async function documents(userId) {
  // History for the revenue page: one invoice per month, most paid ~3 weeks later
  const year = 2026;
  const services = [['Identité visuelle', 1, 6500], ['Site vitrine', 1, 12000], ['Maintenance site (mois)', 1, 1500], ['Shooting photo produits', 1, 4000], ['Gestion réseaux sociaux (mois)', 1, 3500], ['Refonte logo', 1, 5000]];
  const who = ['riad', 'nova', 'horizon', 'cafe'];
  for (let m = 0; m < 11; m++) {
    for (let k = 0; k < (m % 3 === 0 ? 2 : 1); k++) {
      const s = services[(m + k) % services.length];
      const issueDate = `${year}-${String(m + 1).padStart(2, '0')}-${String(5 + k * 9).padStart(2, '0')}`;
      const due = new Date(Date.UTC(year, m, 5 + k * 9 + 30)).toISOString().slice(0, 10);
      await draft({ type: 'invoice', client: who[(m + k) % who.length], issueDate, dueDate: due, lines: [[s[0], s[1], s[2] * (1 + ((m + k) % 3) * 0.25)]] });
      const id = await issue();
      await markSent();
      if (m < 10 || k === 1) {
        await pay();
        const paidAt = new Date(Date.UTC(year, m, 5 + k * 9 + 12 + ((m * 7) % 15)));
        await db.collection('documents').updateOne({ _id: new ObjectId(id) }, { $set: { 'payments.0.date': paidAt } });
      }
    }
  }
  // Last year, for the comparison
  await db.collection('documents').insertMany([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((m) => ({ userId, type: 'invoice', status: 'paid', number: `F-2025-${m + 1}`, currency: 'MAD', docLocale: 'fr', issueDate: new Date(Date.UTC(2025, m, 10)), issuedAt: new Date(Date.UTC(2025, m, 10)), lines: [], payments: [{ amount: 1080000, date: new Date(Date.UTC(2025, m, 25)), method: 'transfer', source: 'manual', createdAt: new Date() }], paid: 1080000, amountDue: 0, totals: { totalExclTax: 900000, totalTax: 180000, totalInclTax: 1080000, taxBreakdown: [] }, buyer: { kind: 'business', name: 'Nova Immobilier SA', address: { line1: 'x', city: 'Rabat', country: 'MA' } }, createdAt: new Date(), updatedAt: new Date() })));
  // Overdue invoice (reminders), issued in October, due early November
  await draft({ type: 'invoice', client: 'cafe', issueDate: '2026-10-21', dueDate: '2026-11-20', lines: [['Menu et carte — mise en page', 1, 2800], ['Panneaux vitrine', 2, 900]] });
  ids.overdue = await issue();
  await markSent();
  // As the daily job would have done: the J+1 reminder went out on 21 Nov
  await db.collection('documents').updateOne({ _id: new ObjectId(ids.overdue) }, { $set: { reminders: { disabled: false, sent: [{ step: 1, at: new Date('2026-11-21T08:00:00Z'), to: 'bonjour@cafezellige.example' }] } } });
  // Quote → accepted → invoice (the hero flow)
  ids.quote = await draft({ type: 'quote', client: 'riad', lines: [['Identité visuelle complète', 1, 6500], ['Site vitrine 5 pages', 1, 12000], ['Shooting photo (demi-journée)', 1, 3500]] });
  await issue();
  await markSent();
  ids.quoteAccepted = ids.quote;
  // A quote waiting for an answer
  ids.quote2 = await draft({ type: 'quote', client: 'nova', lines: [['Visite virtuelle 360° (5 biens)', 5, 1200], ['Photos HDR', 5, 600]] });
  await issue();
  await markSent();
  // Hero invoice, issued today, sent
  ids.hero = await draft({ type: 'invoice', client: 'horizon', lines: [['Site web de l’école (6 pages)', 1, 14000], ['Formation à l’administration du site', 2, 1500]] });
  ids.heroDraft = ids.hero;
  step(`documents ${JSON.stringify(ids)}`);
}

// ---------------------------------------------------------------------------
// Screenshots
// ---------------------------------------------------------------------------
let mobile;
async function mobileCtx() {
  const m = await browser.newContext({ baseURL: BASE, viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true, locale: 'fr-FR', timezoneId: 'Africa/Casablanca', colorScheme: 'light' });
  await m.addCookies(await ctx.cookies());
  return m;
}
async function shotBoth(path, name, { mobileScroll, desktopFull = false, prep } = {}) {
  if (ONLY && !name.includes(ONLY)) return;
  await page.goto(path);
  if (prep) await prep(page);
  await fonts();
  await page.waitForTimeout(250);
  await page.screenshot({ path: join(OUT, `${name}-desktop.png`), fullPage: desktopFull });
  const p = await mobile.newPage();
  await p.goto(path);
  if (prep) await prep(p);
  await fonts(p);
  if (mobileScroll) await p.evaluate(mobileScroll);
  await p.waitForTimeout(250);
  await p.screenshot({ path: join(OUT, `${name}-mobile.png`) });
  await p.screenshot({ path: join(OUT, `${name}-mobile-full.png`), fullPage: true });
  await p.close();
  step(name);
}
const scrollTo = (text) => `(() => { const el = [...document.querySelectorAll('h1,h2,h3,legend,p,label,button,a,span')].find((e) => e.textContent.trim().startsWith(${JSON.stringify(text)})); if (el) el.scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); })()`;

async function run() {
  const main = await account({ pro: true, name: 'Karim Atlas' });
  await settings();
  await clients();
  // Warning shot: Moroccan invoice while IF / TP are missing
  const warnId = await draft({ type: 'invoice', client: 'nova', lines: [['Visite virtuelle 360°', 1, 4500]] });
  mobile = await mobileCtx();
  {
    const p = await mobile.newPage();
    p.on('dialog', (d) => d.accept());
    await p.goto(`/fr/app/documents/${warnId}`);
    await p.getByRole('button', { name: /^Émettre/ }).click();
    await p.getByText(/identifiant fiscal \(IF\)/).waitFor();
    await fonts(p);
    await p.getByText(/identifiant fiscal \(IF\)/).scrollIntoViewIfNeeded();
    await p.evaluate(() => window.scrollBy(0, -260));
    await p.waitForTimeout(300);
    await p.screenshot({ path: join(OUT, 'warning-if-mobile.png') });
    await p.close();
    await db.collection('documents').deleteOne({ _id: new ObjectId(warnId) }); // still a draft: nothing issued
    step('warning-if');
  }
  await settingsComplete();
  // Reminders on (Pro), so every screen shows them active
  await go('/fr/app/settings');
  await page.getByRole('button', { name: 'Activer les relances' }).click();
  await page.getByRole('button', { name: 'Désactiver' }).first().waitFor();
  step('reminders on');
  await documents(main.userId);
  await mobile.close();
  mobile = await mobileCtx();

  await shotBoth('/fr/app', 'dashboard');
  await shotBoth('/fr/app/settings', 'settings-entreprise', { mobileScroll: scrollTo('ICE') });
  await shotBoth('/fr/app/settings', 'settings-relances', { mobileScroll: scrollTo('Relances automatiques'), prep: (p) => p.evaluate(scrollTo('Relances automatiques')) });
  await shotBoth('/fr/app/clients', 'clients');
  await shotBoth('/fr/app/documents', 'documents');
  await shotBoth('/fr/app/documents?status=overdue', 'documents-retard');
  await shotBoth(`/fr/app/documents/${ids.overdue}`, 'facture-retard', { mobileScroll: scrollTo('Relances') });
  await shotBoth(`/fr/app/documents/${ids.quote}`, 'devis');
  await shotBoth('/fr/app/revenue', 'revenus', { desktopFull: true });
  await shotBoth('/fr/app/revenue', 'revenus-clients', { mobileScroll: scrollTo('Meilleurs clients') });

  // Editor with a filled line (not saved)
  if (!ONLY || 'editeur'.includes(ONLY)) {
    for (const [ctxPage, file] of [[page, 'editeur-desktop.png'], [await mobile.newPage(), 'editeur-mobile.png']]) {
      await ctxPage.goto('/fr/app/documents/new?type=invoice');
      await ctxPage.locator('#client').selectOption({ label: 'École Horizon' });
      await ctxPage.locator('#d-0').fill('Site web de l’école (6 pages)');
      await ctxPage.locator('#q-0').fill('1');
      await ctxPage.locator('#p-0').fill('14000');
      await fonts(ctxPage);
      await ctxPage.locator('#d-0').scrollIntoViewIfNeeded();
      await ctxPage.evaluate(() => window.scrollBy(0, -120));
      await ctxPage.waitForTimeout(300);
      await ctxPage.screenshot({ path: join(OUT, file) });
      if (file.includes('mobile')) await ctxPage.screenshot({ path: join(OUT, 'editeur-mobile-full.png'), fullPage: true });
    }
    step('editeur');
  }

  // Quote accepted → convert (FR UI)
  await page.goto(`/fr/app/documents/${ids.quote}`);
  await page.getByRole('button', { name: /accepté/i }).first().click().catch(() => undefined);
  await page.waitForTimeout(600);
  await shotBoth(`/fr/app/documents/${ids.quote}`, 'devis-accepte');
  await page.goto(`/fr/app/documents/${ids.quote}`);
  await page.getByRole('button', { name: /Transformer en facture/ }).click();
  await page.waitForURL((u) => !u.pathname.endsWith(ids.quote));
  ids.converted = page.url().split('/').pop();
  await shotBoth(`/fr/app/documents/${ids.converted}`, 'facture-convertie-brouillon');
  await page.getByRole('button', { name: /^Émettre/ }).click();
  await page.waitForTimeout(1200);
  await shotBoth(`/fr/app/documents/${ids.converted}`, 'facture-emise', { mobileScroll: scrollTo('Partager') });
  await shotBoth(`/fr/app/documents/${ids.converted}`, 'facture-emise-haut');
  // Recurring panel
  await shotBoth(`/fr/app/documents/${ids.converted}`, 'recurrente', { mobileScroll: scrollTo('Facture récurrente'), prep: (p) => p.evaluate(scrollTo('Facture récurrente')) });

  // Public client view
  await page.goto(`/fr/app/documents/${ids.converted}`);
  const copy = page.getByRole('button', { name: /Copier le lien/ });
  if (await copy.count()) {
    await copy.first().click();
    await page.waitForTimeout(500);
    const link = await page.evaluate(() => navigator.clipboard.readText());
    if (/^https?:\/\//.test(link)) {
      const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, locale: 'fr-FR' });
      await phone.goto(link);
      await fonts(phone);
      await phone.screenshot({ path: join(OUT, 'vue-client-mobile.png') });
      await phone.screenshot({ path: join(OUT, 'vue-client-mobile-full.png'), fullPage: true });
      await phone.close();
      step('vue client');
    }
  }

  // Import CSV
  const csv = ['Nom;E-mail;Téléphone;Adresse;Code postal;Ville;Pays;ICE', 'Atlas Négoce SARL;compta@atlasnegoce.example;+212600000011;12 bd Zerktouni;20000;Casablanca;Maroc;006677889000035', 'Dar Lina;contact@darlina.example;;5 rue Allal Ben Abdellah;30000;Fès;Maroc;007788990000026', 'Kenza Photo;kenza@kenzaphoto.example;;22 av. Mohammed V;10000;Rabat;Maroc;', 'Riad Yasmine SARL;salma@riadyasmine.example;;12 derb Sidi Bouloukat;40000;Marrakech;Maroc;002211334000071', 'Sans Adresse;x@exemple.example;;;;;Maroc;'].join('\n');
  for (const [p, file] of [[page, 'import-desktop.png'], [await mobile.newPage(), 'import-mobile.png']]) {
    await p.goto('/fr/app/clients/import');
    await p.getByLabel('Fichier CSV').setInputFiles({ name: 'mes-clients.csv', mimeType: 'text/csv', buffer: Buffer.from(csv) });
    await p.getByRole('button', { name: 'Vérifier le fichier' }).click();
    await p.getByText(/lignes lues/).waitFor();
    await fonts(p);
    await p.getByText(/lignes lues/).scrollIntoViewIfNeeded();
    await p.evaluate(() => window.scrollBy(0, -200));
    await p.waitForTimeout(300);
    await p.screenshot({ path: join(OUT, file) });
    if (file.includes('mobile')) await p.screenshot({ path: join(OUT, 'import-mobile-full.png'), fullPage: true });
    if (file.includes('mobile')) {
      await p.getByRole('button', { name: /^Importer/ }).click();
      await p.getByText(/clients importés/).waitFor();
      await p.screenshot({ path: join(OUT, 'import-fait-mobile.png') });
    }
  }
  step('import');
  await shotBoth('/fr/app/clients', 'clients-apres-import');
  await mobile.close();

  // Free account: trial button, plan page
  await account({ pro: false, name: 'Leïla Freelance' });
  mobile = await mobileCtx();
  await go('/fr/app');
  await shotBoth('/fr/app', 'gratuit-essai-bandeau');
  await shotBoth('/fr/activate', 'plan-essai');
  await page.goto('/fr/activate');
  await page.getByRole('button', { name: 'Essayer Pro gratuitement 7 jours' }).first().click();
  await page.waitForTimeout(1200);
  await shotBoth('/fr/app', 'essai-actif');
  await mobile.close();

  // Public pages
  mobile = await mobileCtx();
  await shotBoth('/fr', 'accueil');
  await shotBoth('/fr', 'tarifs', { mobileScroll: scrollTo('Des prix simples'), prep: (p) => p.evaluate(scrollTo('Des prix simples')) });
  await shotBoth('/fr/guides/facture-maroc-mentions-obligatoires', 'guide-maroc');
  await mobile.close();
}

try {
  await run();
} finally {
  writeFileSync(join(OUT, 'ids.json'), JSON.stringify(ids, null, 2));
  if (process.argv.includes('--drop')) await db.dropDatabase();
  await mongo.close();
  await browser.close();
}
