/**
 * Renders every marketing PNG into marketing/visuals/out/.
 *
 *   node marketing/visuals/render.mjs              # all visuals (re-shoots the live calculator)
 *   node marketing/visuals/render.mjs --no-shots   # reuse assets/calc-*.png (offline)
 *   node marketing/visuals/render.mjs pin-03       # only names containing "pin-03"
 *   node marketing/visuals/render.mjs --html       # also write the HTML next to each PNG (debug)
 *
 * Uses the Playwright + Chromium already installed for the app e2e tests (app/node_modules).
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const { chromium } = await import(join(ROOT, 'app', 'node_modules', 'playwright', 'index.mjs'));
const { covers, pins } = await import('./visuals.mjs');

const OUT = join(HERE, 'out');
const ASSETS = join(HERE, 'assets');
mkdirSync(OUT, { recursive: true });
mkdirSync(ASSETS, { recursive: true });

const args = process.argv.slice(2);
const noShots = args.includes('--no-shots');
const writeHtml = args.includes('--html');
const filter = args.find((a) => !a.startsWith('--'));

const CALC = 'https://margokit.vercel.app';
// Same example as the Seller Pack price calculator defaults → $5.65 profit on a $25 sale.
const QUERY = 'pl=custom&p=25&pc=6&pk=0.5&sh=5&rc=3&pf=0&ff=0&pay=2.9&ad=4&rr=20&b=300';
// Rows of the results list: 1 margin, 2 real cost, 3 minimum price, 4 price 30%, 5 price 50%, 6 max ad cost, 7 break-even ROAS, 8 orders to recoup
const VARIANTS = { results: [], hlPrice: [3, 4], hlRoas: [7], hlFive: [2, 3, 4, 6, 7] };

const browser = await chromium.launch();

async function shootCalculator() {
  const page = await browser.newPage({ viewport: { width: 1280, height: 1100 }, deviceScaleFactor: 2 });
  for (const lang of ['en', 'fr']) {
    await page.goto(`${CALC}/${lang}?cur=${lang === 'en' ? 'USD' : 'EUR'}&${QUERY}`, { waitUntil: 'networkidle' });
    await page.evaluate(() => document.fonts.ready);
    const form = page.locator('fieldset').first();
    await form.screenshot({ path: join(ASSETS, `calc-${lang}-form.png`) });
    for (const [name, rows] of Object.entries(VARIANTS)) {
      await page.evaluate((rows) => {
        document.querySelectorAll('.mk-hl').forEach((el) => el.remove());
        const items = [...document.querySelectorAll('#results dl > div')];
        items.forEach((el) => { el.style.cssText = ''; });
        rows.forEach((r, i) => {
          const el = items[r - 1];
          el.style.cssText = `background:#F7FEE7;box-shadow:0 0 0 2px #A3E635;border-radius:10px;padding-left:${rows.length >= 3 ? 40 : 10}px;padding-right:10px;margin:4px -10px;position:relative`;
          if (rows.length >= 3) {
            const b = document.createElement('span');
            b.className = 'mk-hl';
            b.textContent = String(i + 1);
            b.style.cssText = 'position:absolute;left:9px;top:50%;transform:translateY(-50%);width:22px;height:22px;border-radius:50%;background:#0F172A;color:#A3E635;font:700 12px/22px Inter,sans-serif;text-align:center';
            el.appendChild(b);
          }
        });
      }, rows);
      const box = await page.locator('#results').boundingBox();
      const dl = await page.locator('#results dl').boundingBox();
      await page.screenshot({ path: join(ASSETS, `calc-${lang}-${name}.png`),
        clip: { x: box.x, y: box.y, width: box.width, height: dl.y + dl.height - box.y + 14 } });
    }
  }
  await page.close();
}

if (!noShots) await shootCalculator();
const dataUrl = (f) => `data:image/png;base64,${readFileSync(join(ASSETS, f)).toString('base64')}`;
const shots = {};
for (const lang of ['en', 'fr']) {
  shots[lang] = { form: dataUrl(`calc-${lang}-form.png`) };
  for (const name of Object.keys(VARIANTS)) {
    const f = `calc-${lang}-${name}.png`;
    if (!existsSync(join(ASSETS, f))) throw new Error(`Missing ${f} — run without --no-shots first.`);
    shots[lang][name] = dataUrl(f);
  }
}

const list = [...covers(), ...pins(shots)].filter((v) => !filter || v.name.includes(filter));
const page = await browser.newPage({ deviceScaleFactor: 1 });
for (const v of list) {
  await page.setViewportSize({ width: v.w, height: v.h });
  await page.setContent(v.html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  const file = join(OUT, `${v.name}.png`);
  await page.screenshot({ path: file, clip: { x: 0, y: 0, width: v.w, height: v.h } });
  if (writeHtml) writeFileSync(join(OUT, `${v.name}.html`), v.html);
  // Verify exact pixel size from the PNG header
  const buf = readFileSync(file);
  const w = buf.readUInt32BE(16);
  const h = buf.readUInt32BE(20);
  if (w !== v.w || h !== v.h) throw new Error(`${v.name}: ${w}×${h}, expected ${v.w}×${v.h}`);
  console.log(`✓ ${v.name}.png  ${w}×${h}`);
}
await browser.close();
