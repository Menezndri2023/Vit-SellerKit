/**
 * Phone-sized screenshots of the real Margokit Pro app (fr + en) for the marketing video.
 * Sibling of shoot-app.mjs: same LOCAL build + THROWAWAY database, same fictional "Atelier Nour" data.
 *
 *   cd app && npm run db                                   # local MongoDB on port 27018 (reuse it if it already runs)
 *   npm run build
 *   MONGODB_URI='mongodb://127.0.0.1:27018/margokit_visuals?replicaSet=rs0' \
 *     BETTER_AUTH_URL=http://localhost:3400 NEXT_PUBLIC_SITE_URL=http://localhost:3400 E2E_DISABLE_RATE_LIMIT=1 \
 *     npx next start -p 3400
 *   node marketing/visuals/shoot-mobile.mjs [--drop]       # from the repo root, in another terminal
 *
 * Writes pro-{editor,pdf,share,list}-{fr,en}.png to OUT_DIR (default brag-output-kits/work/pro).
 * Viewport 430×932 @2.5, light mode. PDFs: page 1 from the app's own PDF route, rasterized with pdf.js at 1075 px wide.
 */
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const { chromium } = await import(join(ROOT, 'app', 'node_modules', 'playwright', 'index.mjs'));
const { MongoClient } = await import(join(ROOT, 'app', 'node_modules', 'mongodb', 'lib', 'index.js'));

const BASE = process.env.BASE_URL || 'http://localhost:3400';
const DB = process.env.VISUALS_DB || 'mongodb://127.0.0.1:27018/margokit_visuals?replicaSet=rs0';
if (/margokit\.com|vercel\.app/.test(BASE)) throw new Error('Refusing to run against production.');
if (!/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(BASE)) throw new Error('BASE_URL must be a local server.');
if (!/\/margokit_visuals\?/.test(DB)) throw new Error('Use the throwaway margokit_visuals database.');
const DROP = process.argv.includes('--drop');
const OUT = process.env.OUT_DIR || join(ROOT, 'brag-output-kits', 'work', 'pro');
mkdirSync(OUT, { recursive: true });
const ASSETS = join(HERE, 'assets');
mkdirSync(ASSETS, { recursive: true });
const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build';
const PHONE = { viewport: { width: 430, height: 932 }, deviceScaleFactor: 2.5, colorScheme: 'light', timezoneId: 'Europe/Paris', isMobile: true, hasTouch: true };

// ---------------------------------------------------------------------------
// Demo data (all fictional) — same business as shoot-app.mjs
// ---------------------------------------------------------------------------

const SELLER = {
  legalName: 'Atelier Nour',
  email: 'hello@ateliernour.example',
  'address.line1': '8 rue des Lilas',
  'address.postalCode': '13001',
  'address.city': 'Marseille',
  'ids.SIREN': '123456782',
  'ids.VAT': 'FR11123456782',
  'bankAccounts.0.holder': 'Atelier Nour',
  'bankAccounts.0.bankName': 'Banque Exemple',
  'bankAccounts.0.iban': 'FR7630006000011234567890189', // the standard documentation example IBAN
  'paymentLinks.0.url': 'https://pay.ateliernour.example/invoice',
  latePenaltyText: 'Pénalités de retard : 3 fois le taux d’intérêt légal',
  latePenaltyTextEn: 'Late payment penalties: 3 times the French legal interest rate',
};

const CLIENTS = [
  { key: 'lumen', name: 'Studio Lumen SARL', contactName: 'Camille Durand', email: 'camille@studiolumen.example', phone: '+33 6 00 00 00 01', line1: '24 quai Saint-Antoine', postalCode: '69002', city: 'Lyon', siren: '987654324', lang: 'fr' },
  { key: 'bloom', name: 'Bloom & Co.', contactName: 'Emma Clarke', email: 'emma@bloomco.example', phone: '+33 6 00 00 00 02', line1: '15 rue du Faubourg', postalCode: '75010', city: 'Paris', siren: '111222337', lang: 'en' },
  { key: 'zitoun', name: 'Café Zitoun', email: 'contact@cafezitoun.example', phone: '+33 6 00 00 00 03', line1: '3 place des Oliviers', postalCode: '13006', city: 'Marseille', siren: '444555668', lang: 'fr' },
  { key: 'sable', name: 'Maison Sable', email: 'bonjour@maisonsable.example', phone: '+33 6 00 00 00 04', line1: '9 cours Julien', postalCode: '13006', city: 'Marseille', siren: '777888991', lang: 'fr' },
];

// ---------------------------------------------------------------------------

const browser = await chromium.launch();
const ctx = await browser.newContext({ baseURL: BASE, viewport: { width: 1280, height: 900 }, deviceScaleFactor: 1, colorScheme: 'light', locale: 'en-GB', timezoneId: 'Europe/Paris' });
await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
const page = await ctx.newPage();
page.on('dialog', (d) => d.accept());
const mongo = await MongoClient.connect(DB);
const db = mongo.db();

const step = (s) => console.log(`· ${s}`);
const shot = (name) => join(OUT, `${name}.png`);
const fill = async (name, value) => page.locator(`[name="${name}"]`).fill(value);

async function account() {
  const email = `visuals-${randomUUID().slice(0, 8)}@example.com`;
  const password = 'demo-visuals-2026';
  const res = await page.request.post('/api/auth/sign-up/email', { data: { name: 'Nour Alaoui', email, password, uiLocale: 'en' }, headers: { Origin: BASE } });
  if (!res.ok()) throw new Error(`sign-up: ${res.status()} ${await res.text()}`);
  const user = await db.collection('user').findOneAndUpdate({ email }, { $set: { emailVerified: true, timeZone: 'Europe/Paris' } }, { returnDocument: 'after' });
  await db.collection('subscriptions').insertOne({ userId: String(user._id), plan: 'manual', provider: 'manual', status: 'active', startsAt: new Date(), expiresAt: null, remindersSent: [], createdAt: new Date(), updatedAt: new Date() });
  const login = await page.request.post('/api/auth/sign-in/email', { data: { email, password }, headers: { Origin: BASE } });
  if (!login.ok()) throw new Error(`sign-in: ${login.status()} ${await login.text()}`);
  step(`demo account ${email}`);
}

async function makeLogo() {
  const p = await browser.newPage({ viewport: { width: 520, height: 160 }, deviceScaleFactor: 1 });
  await p.setContent(`<html><head><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&display=block" rel="stylesheet"></head>
  <body style="margin:0;background:#fff;width:520px;height:160px;display:flex;align-items:center;gap:22px;padding-left:16px;box-sizing:border-box;font-family:'Plus Jakarta Sans'">
  <svg width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="30" fill="#C2410C"/><path d="M30 92V52a30 30 0 0 1 60 0v40" stroke="#FFF7ED" stroke-width="12" fill="none" stroke-linecap="round"/><circle cx="60" cy="54" r="9" fill="#FDBA74"/></svg>
  <div><div style="font-weight:800;font-size:44px;color:#1C1917;letter-spacing:-.02em;line-height:1">Atelier Nour</div><div style="font-weight:700;font-size:17px;color:#C2410C;letter-spacing:.18em;margin-top:8px">DESIGN STUDIO</div></div></body></html>`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const buf = await p.screenshot({ type: 'png' });
  await p.close();
  writeFileSync(join(ASSETS, 'demo-logo.png'), buf);
  return join(ASSETS, 'demo-logo.png');
}

async function settings(logoPath) {
  await page.goto('/en/app/settings');
  await page.locator('[name="address.country"]').selectOption('FR');
  await page.locator('[name="ids.SIREN"]').waitFor();
  for (const [k, v] of Object.entries(SELLER)) await fill(k, v);
  await page.locator('[name="defaultCurrency"]').selectOption('EUR');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByText('Saved ✓').waitFor();
  await page.reload();
  await page.locator('input[name="logo"]').setInputFiles(logoPath);
  await page.locator('img[src^="/api/logo/"]').first().waitFor();
  step('business profile + logo');
}

async function clients() {
  for (const c of CLIENTS) {
    await page.goto('/en/app/clients/new');
    await fill('name', c.name);
    if (c.contactName) await fill('contactName', c.contactName);
    await fill('email', c.email);
    await fill('phone', c.phone);
    await fill('address.line1', c.line1);
    await fill('address.postalCode', c.postalCode);
    await fill('address.city', c.city);
    await page.locator('[name="address.country"]').selectOption('FR');
    await page.locator('[name="ids.SIREN"]').fill(c.siren);
    await page.locator('[name="preferredDocLocale"]').selectOption(c.lang);
    await page.locator('[name="preferredCurrency"]').selectOption('EUR');
    await page.getByRole('button', { name: 'Save', exact: true }).click();
    await page.waitForURL(/\/en\/app\/clients$/);
  }
  step(`${CLIENTS.length} clients`);
}

/** Creates a draft in the real editor; issues it unless draft=true. Returns the document id. */
async function createDoc({ type, client, lang, issueDate, dueDate, lines, notes, draft = false }) {
  await page.goto(`/en/app/documents/new?type=${type}`);
  await page.locator('#client').selectOption({ label: CLIENTS.find((c) => c.key === client).name });
  if (lang) await page.locator('#docLocale').selectOption(lang);
  if (issueDate) await page.locator('#issueDate').fill(issueDate);
  if (dueDate) await page.locator('#dueDate').fill(dueDate);
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) await page.getByRole('button', { name: '+ Add a line' }).click();
    const [d, q, p] = lines[i];
    await page.locator(`#d-${i}`).fill(d);
    await page.locator(`#q-${i}`).fill(String(q));
    await page.locator(`#p-${i}`).fill(String(p));
  }
  if (notes) await page.locator('#notes').fill(notes);
  await page.getByRole('button', { name: 'Save draft' }).click();
  await page.waitForURL(/\/documents\/[0-9a-f]{24}$/);
  if (draft) return page.url().split('/').pop();
  return issue();
}

async function issue() {
  const id = page.url().split('/').pop();
  await page.getByRole('button', { name: /^Issue / }).click();
  await page.getByText('This document is issued').waitFor();
  return id;
}

async function markSent() {
  await page.getByRole('button', { name: 'Mark as sent' }).click();
  await page.getByRole('button', { name: 'Mark as sent' }).waitFor({ state: 'detached' });
}

async function recordPayment() {
  await page.getByRole('button', { name: 'Record a payment' }).click();
  await page.getByText('No payment recorded yet.').waitFor({ state: 'detached' });
}

async function documents() {
  const ids = {};
  // Overdue invoices (due in September)
  ids.overdue = await createDoc({ type: 'invoice', client: 'zitoun', lang: 'fr', issueDate: '2026-08-18', dueDate: '2026-09-17',
    lines: [['Création de 4 ardoises menu', 4, 90], ['Mise en page des menus imprimés', 1, 180]] });
  await markSent();
  ids.overdue2 = await createDoc({ type: 'invoice', client: 'bloom', lang: 'en', issueDate: '2026-08-25', dueDate: '2026-09-24',
    lines: [['Social media kit (12 templates)', 1, 380]] });
  await markSent();
  // Paid invoices
  ids.paid = await createDoc({ type: 'invoice', client: 'sable', lang: 'fr', issueDate: '2026-09-08', dueDate: '2026-10-08',
    lines: [['Packaging — gamme de bougies', 1, 650], ['Fichiers d’impression étiquettes', 3, 40]] });
  await markSent(); await recordPayment();
  ids.paid2 = await createDoc({ type: 'invoice', client: 'lumen', lang: 'fr', issueDate: '2026-09-12', dueDate: '2026-10-12',
    lines: [['Retouche photo (lot de 20)', 20, 15]] });
  await markSent(); await recordPayment();
  // Hero invoices, one per language (PDF + client page)
  ids.invoiceFr = await createDoc({ type: 'invoice', client: 'lumen', lang: 'fr',
    lines: [['Création de logo', 1, 450], ['Site vitrine 5 pages', 1, 1200], ['Séance photo produits (demi-journée)', 1, 350]],
    notes: 'Merci pour votre confiance !' });
  await markSent();
  ids.invoiceEn = await createDoc({ type: 'invoice', client: 'bloom', lang: 'en',
    lines: [['Logo design', 1, 450], ['5-page website', 1, 1200], ['Brand guidelines (PDF)', 1, 300]],
    notes: 'Thank you for your trust!' });
  await markSent();
  // A quote waiting for an answer
  ids.quote = await createDoc({ type: 'quote', client: 'sable', lang: 'fr',
    lines: [['Design de coffret cadeau', 1, 520], ['Modèles réseaux sociaux (10)', 1, 280]] });
  await markSent();
  // Drafts for the editor shots
  ids.draftFr = await createDoc({ type: 'quote', client: 'zitoun', lang: 'fr', draft: true,
    lines: [['Identité visuelle complète', 1, 900], ['Enseigne de façade — maquette', 1, 380], ['Cartes de visite (500 ex.)', 500, 0.4]] });
  ids.draftEn = await createDoc({ type: 'quote', client: 'bloom', lang: 'en', draft: true,
    lines: [['Brand identity package', 1, 900], ['Shop sign — mock-up', 1, 380], ['Business cards (500)', 500, 0.4]] });
  step(`documents ${JSON.stringify(ids)}`);
  return ids;
}

// ---------------------------------------------------------------------------
// Screenshots (phone)
// ---------------------------------------------------------------------------

async function phoneShots(ids, cookies) {
  for (const loc of ['fr', 'en']) {
    const mctx = await browser.newContext({ baseURL: BASE, ...PHONE, locale: loc === 'fr' ? 'fr-FR' : 'en-GB' });
    await mctx.addCookies(cookies);
    const m = await mctx.newPage();
    const ready = async () => { await m.evaluate(() => document.fonts.ready); await m.waitForTimeout(400); };

    // 1. Editor of a draft: scroll so the last line card + totals sit at the bottom of the viewport
    await m.goto(`/${loc}/app/documents/${ids[loc === 'fr' ? 'draftFr' : 'draftEn']}`); await ready();
    await m.evaluate(() => {
      // Totals card bottom just above the sticky save bar
      const dd = [...document.querySelectorAll('dd.font-display')].pop();
      const sec = dd.closest('section');
      const bar = [...document.querySelectorAll('div.sticky')].find((d) => d.querySelector('button'));
      const limit = bar ? bar.getBoundingClientRect().top : innerHeight; // stuck at bottom-20 while the totals are above it
      const offset = innerHeight - limit;
      scrollTo({ top: scrollY + sec.getBoundingClientRect().bottom - innerHeight + offset + 14, behavior: 'instant' });
    });
    await m.waitForTimeout(300);
    await m.screenshot({ path: shot(`pro-editor-${loc}`) });
    await m.screenshot({ path: shot(`pro-editor-${loc}-full`), fullPage: true });

    // 3. Public client page from "Copy client link"
    const inv = ids[loc === 'fr' ? 'invoiceFr' : 'invoiceEn'];
    await page.goto(`/en/app/documents/${inv}`);
    await page.getByRole('button', { name: 'Copy client link' }).click();
    await page.getByRole('button', { name: 'Link copied!' }).waitFor();
    const link = (await page.evaluate(() => navigator.clipboard.readText())).replace(/\/(en|fr)\/d\//, `/${loc}/d/`);
    const pub = await browser.newContext({ ...PHONE, locale: loc === 'fr' ? 'fr-FR' : 'en-GB' });
    const pp = await pub.newPage();
    await pp.goto(link); await pp.evaluate(() => document.fonts.ready); await pp.waitForTimeout(400);
    // Totals + bank details + pay button in view
    await pp.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await pp.waitForTimeout(300);
    await pp.screenshot({ path: shot(`pro-share-${loc}`) });
    await pp.screenshot({ path: shot(`pro-share-${loc}-full`), fullPage: true });
    await pub.close();

    // 4. Documents list
    await m.goto(`/${loc}/app/documents?type=invoice`); await ready();
    await m.evaluate(() => scrollTo(0, document.documentElement.scrollHeight)); await m.waitForTimeout(300);
    await m.screenshot({ path: shot(`pro-list-${loc}`) });
    await m.screenshot({ path: shot(`pro-list-${loc}-full`), fullPage: true });
    await mctx.close();
  }
  step('phone screenshots');
}

/** Rasterizes page 1 of each PDF with pdf.js at 1075 px wide (430 × 2.5). */
async function pdfs(ids) {
  const files = {};
  for (const name of ['pdf.min.mjs', 'pdf.worker.min.mjs']) {
    const r = await fetch(`${PDFJS}/${name}`);
    if (!r.ok) throw new Error(`pdf.js download failed: ${name}`);
    files[name] = Buffer.from(await r.arrayBuffer());
  }
  const p = await browser.newPage({ viewport: { width: 1075, height: 1600 }, deviceScaleFactor: 1 });
  let current = null;
  await p.route('http://pdf.local/**', (route) => {
    const n = new URL(route.request().url()).pathname.slice(1);
    if (n === 'index.html') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><body style="margin:0;background:#fff"><canvas id="c" style="display:block"></canvas></body>' });
    if (n === 'doc.pdf') return route.fulfill({ contentType: 'application/pdf', body: current });
    return route.fulfill({ contentType: 'text/javascript', body: files[n] });
  });
  await p.goto('http://pdf.local/index.html');
  for (const [key, out] of [['invoiceFr', 'pro-pdf-fr'], ['invoiceEn', 'pro-pdf-en']]) {
    const res = await page.request.get(`/api/documents/${ids[key]}/pdf`);
    if (!res.ok() || res.headers()['content-type'] !== 'application/pdf') throw new Error(`PDF ${key}: ${res.status()}`);
    current = await res.body();
    await p.evaluate(async () => {
      const pdfjs = await import('http://pdf.local/pdf.min.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = 'http://pdf.local/pdf.worker.min.mjs';
      const pdf = await pdfjs.getDocument('http://pdf.local/doc.pdf?' + Math.random()).promise;
      const pg = await pdf.getPage(1);
      const vp = pg.getViewport({ scale: 1075 / pg.getViewport({ scale: 1 }).width });
      const c = document.getElementById('c');
      c.width = Math.round(vp.width); c.height = Math.round(vp.height);
      await pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
    });
    await p.locator('#c').screenshot({ path: shot(out) });
  }
  await p.close();
  step('PDFs rasterized');
}

try {
  const logoPath = await makeLogo();
  await account();
  await settings(logoPath);
  await clients();
  const ids = await documents();
  await phoneShots(ids, await ctx.cookies());
  await pdfs(ids);
} finally {
  if (DROP) { await db.dropDatabase(); console.log('· margokit_visuals dropped'); }
  await mongo.close();
  await browser.close();
}
