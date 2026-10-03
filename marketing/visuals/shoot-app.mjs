/**
 * Screenshots of the real Margokit Pro app for the Pro covers (pro-cover-*.png, pro-thumb.png).
 * Writes marketing/visuals/assets/app-*.png and pdf-*.png; render.mjs then uses them.
 *
 * Runs against a LOCAL production build and a THROWAWAY database — never against margokit.com:
 *
 *   cd app && npm run db                                   # local MongoDB on port 27018 (reuse it if it already runs)
 *   npm run build
 *   MONGODB_URI='mongodb://127.0.0.1:27018/margokit_visuals?replicaSet=rs0' \
 *     BETTER_AUTH_URL=http://localhost:3300 NEXT_PUBLIC_SITE_URL=http://localhost:3300 E2E_DISABLE_RATE_LIMIT=1 \
 *     npx next start -p 3300
 *   node marketing/visuals/shoot-app.mjs                   # from the repo root, in another terminal
 *
 * Every run creates a new demo account (fictional business "Atelier Nour", fictional clients, IDs and IBAN),
 * then drops nothing: delete the margokit_visuals database when done (`--drop` does it at the end).
 * The PDFs come from the app's own PDF route and are rasterized with pdf.js (loaded from jsDelivr).
 */
import { randomUUID } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const { chromium } = await import(join(ROOT, 'app', 'node_modules', 'playwright', 'index.mjs'));
const { MongoClient } = await import(join(ROOT, 'app', 'node_modules', 'mongodb', 'lib', 'index.js'));

const BASE = process.env.BASE_URL || 'http://localhost:3300';
const DB = process.env.VISUALS_DB || 'mongodb://127.0.0.1:27018/margokit_visuals?replicaSet=rs0';
if (/margokit\.com|vercel\.app/.test(BASE)) throw new Error('Refusing to run against production.');
if (!/\/margokit_visuals\?/.test(DB)) throw new Error('Use the throwaway margokit_visuals database.');
const DROP = process.argv.includes('--drop');
const ASSETS = join(HERE, 'assets');
mkdirSync(ASSETS, { recursive: true });
const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build';

// ---------------------------------------------------------------------------
// Demo data (all fictional)
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
  latePenaltyText: 'Late payment penalties: 3 times the French legal interest rate',
};

const CLIENTS = [
  { key: 'lumen', name: 'Studio Lumen SARL', contactName: 'Camille Durand', email: 'camille@studiolumen.example', phone: '+33 6 00 00 00 01', line1: '24 quai Saint-Antoine', postalCode: '69002', city: 'Lyon', siren: '987654324', lang: 'fr' },
  { key: 'bloom', name: 'Bloom & Co.', contactName: 'Emma Clarke', email: 'emma@bloomco.example', phone: '+33 6 00 00 00 02', line1: '15 rue du Faubourg', postalCode: '75010', city: 'Paris', siren: '111222337', lang: 'en' },
  { key: 'zitoun', name: 'Café Zitoun', email: 'contact@cafezitoun.example', phone: '+33 6 00 00 00 03', line1: '3 place des Oliviers', postalCode: '13006', city: 'Marseille', siren: '444555668', lang: 'fr' },
  { key: 'sable', name: 'Maison Sable', email: 'bonjour@maisonsable.example', phone: '+33 6 00 00 00 04', line1: '9 cours Julien', postalCode: '13006', city: 'Marseille', siren: '777888991', lang: 'fr' },
];

// ---------------------------------------------------------------------------

const browser = await chromium.launch();
const ctx = await browser.newContext({ baseURL: BASE, viewport: { width: 1280, height: 900 }, deviceScaleFactor: 2, colorScheme: 'light', locale: 'en-GB', timezoneId: 'Europe/Paris' });
await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
const page = await ctx.newPage();
page.on('dialog', (d) => d.accept());
const mongo = await MongoClient.connect(DB);
const db = mongo.db();

const step = (s) => console.log(`· ${s}`);
const shot = (name) => join(ASSETS, `${name}.png`);
const fill = async (name, value) => page.locator(`[name="${name}"]`).fill(value);

async function luhnCheck() {
  const luhn = (s) => [...s].reverse().reduce((sum, c, i) => { let d = Number(c); if (i % 2) { d *= 2; if (d > 9) d -= 9; } return sum + d; }, 0) % 10 === 0;
  for (const c of CLIENTS) if (!luhn(c.siren)) throw new Error(`${c.name}: SIREN ${c.siren} fails Luhn`);
}

async function account() {
  const email = `visuals-${randomUUID().slice(0, 8)}@example.com`;
  const password = 'demo-visuals-2026';
  const res = await page.request.post('/api/auth/sign-up/email', { data: { name: 'Nour Alaoui', email, password, uiLocale: 'en' }, headers: { Origin: BASE } });
  if (!res.ok()) throw new Error(`sign-up: ${res.status()} ${await res.text()}`);
  const user = await db.collection('user').findOneAndUpdate({ email }, { $set: { emailVerified: true, timeZone: 'Europe/Paris' } }, { returnDocument: 'after' });
  // Pro (no watermark): a manual lifetime subscription, as an admin activation code would create
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

/** Creates a draft in the real editor, then issues it. Returns the document id. */
async function createDoc({ type, client, issueDate, dueDate, lines, notes }) {
  await page.goto(`/en/app/documents/new?type=${type}`);
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
  if (notes) await page.locator('#notes').fill(notes);
  await page.getByRole('button', { name: 'Save draft' }).click();
  await page.waitForURL(/\/documents\/[0-9a-f]{24}$/);
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

async function documents() {
  const ids = {};
  // 1. Overdue invoice (issued in August, due mid-September)
  ids.overdue = await createDoc({ type: 'invoice', client: 'zitoun', issueDate: '2026-08-18', dueDate: '2026-09-17',
    lines: [['Menu board design (4 boards)', 4, 90], ['Printed menus — layout', 1, 180]] });
  await markSent();
  // 2. Paid invoice
  ids.paid = await createDoc({ type: 'invoice', client: 'sable', issueDate: '2026-09-08', dueDate: '2026-10-08',
    lines: [['Packaging design — candle range', 1, 650], ['Label printing files', 3, 40]] });
  await markSent();
  await page.getByRole('button', { name: 'Record a payment' }).click();
  await page.getByText('No payment recorded yet.').waitFor({ state: 'detached' });
  // 3. Quote (FR) → accepted → invoice
  ids.quote = await createDoc({ type: 'quote', client: 'lumen', issueDate: '2026-09-22',
    lines: [['Création de logo', 1, 450], ['Site vitrine 5 pages', 1, 1200], ['Séance photo produits (demi-journée)', 1, 350]] });
  await markSent();
  await page.getByRole('button', { name: 'Convert to invoice' }).click();
  await page.waitForURL((u) => !u.pathname.endsWith(ids.quote));
  ids.invoiceFr = await issue();
  await markSent();
  // 4. Hero invoice (EN)
  ids.invoiceEn = await createDoc({ type: 'invoice', client: 'bloom',
    lines: [['Logo design', 1, 450], ['5-page website', 1, 1200], ['Brand guidelines (PDF)', 1, 300]],
    notes: 'Thank you for your trust!' });
  await markSent();
  // 5. A quote waiting for an answer
  ids.quote2 = await createDoc({ type: 'quote', client: 'sable',
    lines: [['Gift box design', 1, 520], ['Social media templates (10)', 1, 280]] });
  await markSent();
  step(`documents ${JSON.stringify(ids)}`);
  return ids;
}

// ---------------------------------------------------------------------------
// Screenshots
// ---------------------------------------------------------------------------

async function el(locator, name, pad = 0) {
  await locator.scrollIntoViewIfNeeded();
  const b = await locator.boundingBox();
  await page.screenshot({ path: shot(name), fullPage: true, clip: { x: b.x - pad, y: b.y - pad + (await page.evaluate(() => scrollY)), width: b.width + pad * 2, height: b.height + pad * 2 } });
}

async function screenshots(ids) {
  const ready = () => page.evaluate(() => document.fonts.ready);
  // Dashboard
  await page.goto('/en/app'); await ready();
  await page.screenshot({ path: shot('app-dashboard') });
  // Hero invoice page (EN), full page
  await page.goto(`/en/app/documents/${ids.invoiceEn}`); await ready();
  await page.screenshot({ path: shot('app-invoice-en'), fullPage: true });
  await el(page.locator('section').filter({ has: page.getByRole('heading', { name: 'Share' }) }), 'app-share');
  // Quote page (accepted, "Convert to invoice")
  await page.goto(`/en/app/documents/${ids.quote}`); await ready();
  await page.screenshot({ path: shot('app-quote'), fullPage: true });
  // Converted invoice (FR document inside the EN app)
  await page.goto(`/en/app/documents/${ids.invoiceFr}`); await ready();
  await page.screenshot({ path: shot('app-invoice-fr'), fullPage: true });
  // Public client link on a phone
  await page.goto(`/en/app/documents/${ids.invoiceEn}`);
  await page.getByRole('button', { name: 'Copy client link' }).click();
  await page.getByRole('button', { name: 'Link copied!' }).waitFor();
  const link = await page.evaluate(() => navigator.clipboard.readText());
  const phone = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, colorScheme: 'light', locale: 'en-GB' });
  await phone.goto(link); await phone.evaluate(() => document.fonts.ready);
  await phone.screenshot({ path: shot('app-public-mobile') });
  // Documents list on a phone (same session)
  const cookies = await ctx.cookies();
  const mctx = await browser.newContext({ baseURL: BASE, viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, colorScheme: 'light', locale: 'en-GB', timezoneId: 'Europe/Paris', isMobile: true, hasTouch: true });
  await mctx.addCookies(cookies);
  const m = await mctx.newPage();
  await m.goto('/en/app/documents?type=invoice'); await m.evaluate(() => document.fonts.ready);
  await m.evaluate(() => scrollTo(0, document.documentElement.scrollHeight));
  await m.waitForTimeout(300);
  await m.screenshot({ path: shot('app-list-mobile') });
  await mctx.close();
  await phone.close();
  step('app screenshots');
}

/** Rasterizes page 1 of each PDF with pdf.js, served from a fake same-origin host so the worker loads. */
async function pdfs(ids) {
  const files = {};
  for (const name of ['pdf.min.mjs', 'pdf.worker.min.mjs']) {
    const r = await fetch(`${PDFJS}/${name}`);
    if (!r.ok) throw new Error(`pdf.js download failed: ${name}`);
    files[name] = Buffer.from(await r.arrayBuffer());
  }
  const p = await browser.newPage({ viewport: { width: 1240, height: 1754 }, deviceScaleFactor: 1 });
  let current = null;
  await p.route('http://pdf.local/**', (route) => {
    const n = new URL(route.request().url()).pathname.slice(1);
    if (n === 'index.html') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><body style="margin:0;background:#fff"><canvas id="c"></canvas></body>' });
    if (n === 'doc.pdf') return route.fulfill({ contentType: 'application/pdf', body: current });
    return route.fulfill({ contentType: 'text/javascript', body: files[n] });
  });
  await p.goto('http://pdf.local/index.html');
  for (const [key, out] of [['invoiceEn', 'pdf-en'], ['invoiceFr', 'pdf-fr']]) {
    const res = await page.request.get(`/api/documents/${ids[key]}/pdf`);
    if (!res.ok() || res.headers()['content-type'] !== 'application/pdf') throw new Error(`PDF ${key}: ${res.status()}`);
    current = await res.body();
    await p.evaluate(async () => {
      const pdfjs = await import('http://pdf.local/pdf.min.mjs');
      pdfjs.GlobalWorkerOptions.workerSrc = 'http://pdf.local/pdf.worker.min.mjs';
      const pdf = await pdfjs.getDocument('http://pdf.local/doc.pdf?' + Math.random()).promise;
      const pg = await pdf.getPage(1);
      const vp = pg.getViewport({ scale: 1240 / pg.getViewport({ scale: 1 }).width });
      const c = document.getElementById('c');
      c.width = vp.width; c.height = vp.height;
      await pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
    });
    await p.locator('#c').screenshot({ path: shot(out) });
  }
  await p.close();
  step('PDFs rasterized');
}

try {
  await luhnCheck();
  const logoPath = await makeLogo();
  await account();
  await settings(logoPath);
  await clients();
  const ids = await documents();
  await screenshots(ids);
  await pdfs(ids);
} finally {
  if (DROP) { await db.dropDatabase(); console.log('· margokit_visuals dropped'); }
  await mongo.close();
  await browser.close();
}
