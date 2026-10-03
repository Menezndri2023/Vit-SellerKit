/**
 * One quote → invoice story, shot in the fr, en and ar (RTL) UIs on a phone, for the marketing video.
 * Same LOCAL build + THROWAWAY database rules as shoot-app.mjs / shoot-mobile.mjs:
 *
 *   MONGODB_URI='mongodb://127.0.0.1:27018/margokit_visuals?replicaSet=rs0' \
 *     BETTER_AUTH_URL=http://localhost:3400 NEXT_PUBLIC_SITE_URL=http://localhost:3400 E2E_DISABLE_RATE_LIMIT=1 \
 *     npx next start -p 3400
 *   node marketing/visuals/shoot-story.mjs [--drop]
 *
 * Per UI locale a fresh demo account (so numbers match: QUO-2026-001 → INV-2026-001):
 * Atelier Nour quotes Studio Lumen SARL 3 lines (2 000 HT, TVA 20 %, 2 400 TTC), the quote is issued, sent,
 * accepted, then converted to an invoice that is issued and sent. Documents are French for fr/ar, English for en.
 * Writes to OUT_DIR (default brag-output-kits/work/pro2).
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
const ONLY = process.argv.find((a) => a.startsWith('--only='))?.slice(7).split(',');
const OUT = process.env.OUT_DIR || join(ROOT, 'brag-output-kits', 'work', 'pro2');
mkdirSync(OUT, { recursive: true });
const PDFJS = 'https://cdn.jsdelivr.net/npm/pdfjs-dist@4.10.38/build';
const PHONE = { viewport: { width: 430, height: 932 }, deviceScaleFactor: 2.5, colorScheme: 'light', timezoneId: 'Europe/Paris', isMobile: true, hasTouch: true };
const BROWSER_LOCALE = { fr: 'fr-FR', en: 'en-GB', ar: 'ar' };

// Fictional data
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
const CLIENT = { name: 'Studio Lumen SARL', contactName: 'Camille Durand', email: 'camille@studiolumen.example', phone: '+33 6 00 00 00 01', line1: '24 quai Saint-Antoine', postalCode: '69002', city: 'Lyon', siren: '987654324' };
const LINES = {
  fr: [['Création de logo', 1, 450], ['Site vitrine 5 pages', 1, 1200], ['Séance photo produits (demi-journée)', 1, 350]],
  en: [['Logo design', 1, 450], ['5-page website', 1, 1200], ['Product photo shoot (half day)', 1, 350]],
};
const NOTES = { fr: 'Merci pour votre confiance !', en: 'Thank you for your trust!' };

const browser = await chromium.launch();
const mongo = await MongoClient.connect(DB);
const db = mongo.db();
const step = (s) => console.log(`· ${s}`);
const shot = (name) => join(OUT, `${name}.png`);

async function makeLogo() {
  const p = await browser.newPage({ viewport: { width: 520, height: 160 }, deviceScaleFactor: 1 });
  await p.setContent(`<html><head><link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@700;800&display=block" rel="stylesheet"></head>
  <body style="margin:0;background:#fff;width:520px;height:160px;display:flex;align-items:center;gap:22px;padding-left:16px;box-sizing:border-box;font-family:'Plus Jakarta Sans'">
  <svg width="120" height="120" viewBox="0 0 120 120"><rect width="120" height="120" rx="30" fill="#C2410C"/><path d="M30 92V52a30 30 0 0 1 60 0v40" stroke="#FFF7ED" stroke-width="12" fill="none" stroke-linecap="round"/><circle cx="60" cy="54" r="9" fill="#FDBA74"/></svg>
  <div><div style="font-weight:800;font-size:44px;color:#1C1917;letter-spacing:-.02em;line-height:1">Atelier Nour</div><div style="font-weight:700;font-size:17px;color:#C2410C;letter-spacing:.18em;margin-top:8px">DESIGN STUDIO</div></div></body></html>`, { waitUntil: 'networkidle' });
  await p.evaluate(() => document.fonts.ready);
  const buf = await p.screenshot({ type: 'png' });
  await p.close();
  const path = join(OUT, 'demo-logo.png');
  writeFileSync(path, buf);
  return path;
}

/** Fresh account + profile + client + quote → invoice, driven through the English UI (stable labels). */
async function story(docLang, logoPath) {
  const ctx = await browser.newContext({ baseURL: BASE, viewport: { width: 1280, height: 900 }, colorScheme: 'light', locale: 'en-GB', timezoneId: 'Europe/Paris' });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE });
  const page = await ctx.newPage();
  page.on('dialog', (d) => d.accept());
  const fill = (name, value) => page.locator(`[name="${name}"]`).fill(value);

  const email = `visuals-${randomUUID().slice(0, 8)}@example.com`;
  const password = 'demo-visuals-2026';
  const res = await page.request.post('/api/auth/sign-up/email', { data: { name: 'Nour Alaoui', email, password, uiLocale: 'en' }, headers: { Origin: BASE } });
  if (!res.ok()) throw new Error(`sign-up: ${res.status()} ${await res.text()}`);
  const user = await db.collection('user').findOneAndUpdate({ email }, { $set: { emailVerified: true, timeZone: 'Europe/Paris' } }, { returnDocument: 'after' });
  await db.collection('subscriptions').insertOne({ userId: String(user._id), plan: 'manual', provider: 'manual', status: 'active', startsAt: new Date(), expiresAt: null, remindersSent: [], createdAt: new Date(), updatedAt: new Date() });
  const login = await page.request.post('/api/auth/sign-in/email', { data: { email, password }, headers: { Origin: BASE } });
  if (!login.ok()) throw new Error(`sign-in: ${login.status()} ${await login.text()}`);

  await page.goto('/en/app/settings', { waitUntil: 'networkidle' });
  await page.locator('[name="address.country"]').selectOption('FR');
  await page.locator('[name="ids.SIREN"]').waitFor();
  for (const [k, v] of Object.entries(SELLER)) await fill(k, v);
  await page.locator('[name="defaultCurrency"]').selectOption('EUR');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.getByText('Saved ✓').waitFor();
  await page.reload({ waitUntil: 'networkidle' });
  await page.locator('input[name="logo"]').setInputFiles(logoPath);
  await page.locator('img[src^="/api/logo/"]').first().waitFor();

  await page.goto('/en/app/clients/new', { waitUntil: 'networkidle' });
  await fill('name', CLIENT.name);
  await fill('contactName', CLIENT.contactName);
  await fill('email', CLIENT.email);
  await fill('phone', CLIENT.phone);
  await fill('address.line1', CLIENT.line1);
  await fill('address.postalCode', CLIENT.postalCode);
  await fill('address.city', CLIENT.city);
  await page.locator('[name="address.country"]').selectOption('FR');
  await page.locator('[name="ids.SIREN"]').fill(CLIENT.siren);
  await page.locator('[name="preferredDocLocale"]').selectOption(docLang);
  await page.locator('[name="preferredCurrency"]').selectOption('EUR');
  await page.getByRole('button', { name: 'Save', exact: true }).click();
  await page.waitForURL(/\/en\/app\/clients$/);

  // Draft quote
  await page.goto('/en/app/documents/new?type=quote', { waitUntil: 'networkidle' });
  await page.locator('#client').selectOption({ label: CLIENT.name });
  await page.locator('#docLocale').selectOption(docLang);
  const lines = LINES[docLang];
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) await page.getByRole('button', { name: '+ Add a line' }).click();
    const [d, q, p] = lines[i];
    await page.locator(`#d-${i}`).fill(d);
    await page.locator(`#q-${i}`).fill(String(q));
    await page.locator(`#p-${i}`).fill(String(p));
  }
  await page.locator('#notes').fill(NOTES[docLang]);
  await page.getByRole('button', { name: 'Save draft' }).click();
  await page.waitForURL(/\/documents\/[0-9a-f]{24}$/);
  const quote = page.url().split('/').pop();
  return { ctx, page, quote, email };
}

async function issue(page) {
  await page.getByRole('button', { name: /^Issue / }).click();
  await page.getByText('This document is issued').waitFor();
}
async function markSent(page) {
  await page.getByRole('button', { name: 'Mark as sent' }).click();
  await page.getByRole('button', { name: 'Mark as sent' }).waitFor({ state: 'detached' });
}

async function phonePage(ctx, ui, pb) {
  const m = await pb.newContext({ baseURL: BASE, ...PHONE, locale: BROWSER_LOCALE[ui] });
  await m.addCookies(await ctx.cookies());
  const p = await m.newPage();
  return { m, p };
}
const ready = async (p) => { await p.evaluate(() => document.fonts.ready); await p.waitForTimeout(500); };

/** Full-page shot with the viewport stretched to the page height, so fixed/sticky bars sit at the real bottom. */
async function fullShot(p, name) {
  const vp = p.viewportSize();
  const h = await p.evaluate(() => document.documentElement.scrollHeight);
  await p.setViewportSize({ width: vp.width, height: h });
  await p.waitForTimeout(400);
  const h2 = await p.evaluate(() => document.documentElement.scrollHeight);
  if (h2 !== h) { await p.setViewportSize({ width: vp.width, height: h2 }); await p.waitForTimeout(300); }
  await p.screenshot({ path: shot(name) });
  await p.setViewportSize(vp);
}

let pdfjsFiles;
async function rasterize(pdfBuf, out) {
  if (!pdfjsFiles) {
    pdfjsFiles = {};
    for (const name of ['pdf.min.mjs', 'pdf.worker.min.mjs']) {
      const r = await fetch(`${PDFJS}/${name}`);
      if (!r.ok) throw new Error(`pdf.js download failed: ${name}`);
      pdfjsFiles[name] = Buffer.from(await r.arrayBuffer());
    }
  }
  const p = await browser.newPage({ viewport: { width: 1075, height: 1600 }, deviceScaleFactor: 1 });
  await p.route('http://pdf.local/**', (route) => {
    const n = new URL(route.request().url()).pathname.slice(1);
    if (n === 'index.html') return route.fulfill({ contentType: 'text/html', body: '<!doctype html><body style="margin:0;background:#fff"><canvas id="c" style="display:block"></canvas></body>' });
    if (n === 'doc.pdf') return route.fulfill({ contentType: 'application/pdf', body: pdfBuf });
    return route.fulfill({ contentType: 'text/javascript', body: pdfjsFiles[n] });
  });
  await p.goto('http://pdf.local/index.html');
  await p.evaluate(async () => {
    const pdfjs = await import('http://pdf.local/pdf.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = 'http://pdf.local/pdf.worker.min.mjs';
    const pdf = await pdfjs.getDocument('http://pdf.local/doc.pdf').promise;
    const pg = await pdf.getPage(1);
    const vp = pg.getViewport({ scale: 1075 / pg.getViewport({ scale: 1 }).width });
    const c = document.getElementById('c');
    c.width = Math.round(vp.width); c.height = Math.round(vp.height);
    await pg.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
  });
  await p.locator('#c').screenshot({ path: shot(out) });
  await p.close();
}

async function run(ui, logoPath) {
  const docLang = ui === 'en' ? 'en' : 'fr';
  const { ctx, page, quote, email } = await story(docLang, logoPath);
  step(`${ui}: account ${email}, draft quote ${quote}`);
  // Phone browser launched in the UI language, so native date inputs use that locale's format
  const pb = await chromium.launch({ args: [`--lang=${BROWSER_LOCALE[ui]}`] });
  const { m, p } = await phonePage(ctx, ui, pb);

  // 1a. Draft quote editor, full page
  await p.goto(`/${ui}/app/documents/${quote}`); await ready(p);
  await fullShot(p, `quote-editor-${ui}-full`);

  // Issue → sent → accepted
  await issue(page);
  await markSent(page);
  await page.getByRole('button', { name: 'Mark accepted' }).click();
  await page.getByRole('button', { name: 'Mark accepted' }).waitFor({ state: 'detached' });

  // 1b. Accepted quote page with "Convert to invoice"
  await p.goto(`/${ui}/app/documents/${quote}`); await ready(p);
  await fullShot(p, `quote-page-${ui}-full`);

  // Convert → issue → sent
  await page.goto(`/en/app/documents/${quote}`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Convert to invoice' }).click();
  await page.waitForURL((u) => !u.pathname.endsWith(quote));
  const invoice = page.url().split('/').pop();
  await issue(page);
  await markSent(page);
  step(`${ui}: invoice ${invoice}`);

  // 2. Invoice PDF, page 1
  const res = await page.request.get(`/api/documents/${invoice}/pdf`);
  if (!res.ok() || res.headers()['content-type'] !== 'application/pdf') throw new Error(`PDF: ${res.status()}`);
  await rasterize(await res.body(), `invoice-pdf-${ui}`);

  // 3. Public client page from "Copy client link", opened logged-out on a phone in the UI locale
  await page.goto(`/en/app/documents/${invoice}`, { waitUntil: 'networkidle' });
  await page.getByRole('button', { name: 'Copy client link' }).click();
  await page.getByRole('button', { name: 'Link copied!' }).waitFor();
  const link = (await page.evaluate(() => navigator.clipboard.readText())).replace(/\/(en|fr|ar)\/d\//, `/${ui}/d/`);
  const pub = await pb.newContext({ ...PHONE, locale: BROWSER_LOCALE[ui] });
  const pp = await pub.newPage();
  await pp.goto(link); await ready(pp);
  await fullShot(pp, `invoice-share-${ui}-full`);
  await pp.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' })); await pp.waitForTimeout(300);
  await pp.screenshot({ path: shot(`invoice-share-${ui}`) });
  await pub.close();

  await m.close();
  await pb.close();
  await ctx.close();
  step(`${ui}: done`);
}

try {
  const logoPath = await makeLogo();
  for (const ui of ONLY ?? ['fr', 'en', 'ar']) await run(ui, logoPath);
} finally {
  if (DROP) { await db.dropDatabase(); console.log('· margokit_visuals dropped'); }
  await mongo.close();
  await browser.close();
}
