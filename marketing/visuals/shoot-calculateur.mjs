/**
 * Captures du calculateur de bénéfice (page publique, lecture seule) pour la campagne kits.
 * Exemple marocain : produit vendu 249 MAD en paiement à la livraison.
 *   node marketing/visuals/shoot-calculateur.mjs
 */
import { mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
const HERE = dirname(fileURLToPath(import.meta.url));
const ROOT = join(HERE, '..', '..');
const OUT = join(ROOT, 'marketing', 'campagne-kits', 'captures');
mkdirSync(OUT, { recursive: true });
const { chromium } = await import(join(ROOT, 'app', 'node_modules', 'playwright', 'index.mjs'));
const BASE = process.env.BASE_URL || 'https://margokit.com';
const EX = { cur: 'MAD', pl: 'direct', p: 249, pc: 90, pk: 5, sh: 35, rc: 25, pf: 0, ff: 0, pay: 0, ad: 40, rr: 25, b: 3000 };
const q = (o) => new URLSearchParams(Object.entries(o).map(([k, v]) => [k, String(v)])).toString();
const browser = await chromium.launch({ args: ['--lang=fr-FR'] });
for (const [name, params] of [['calc', EX], ['calc-refus-35', { ...EX, rr: 35 }], ['calc-prix-279', { ...EX, p: 279 }]]) {
  for (const [variant, vp, dsf] of [['mobile', { width: 390, height: 844 }, 3], ['desktop', { width: 1440, height: 900 }, 2]]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dsf, isMobile: variant === 'mobile', locale: 'fr-FR' });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/fr/calculator?${q(params)}`, { waitUntil: 'networkidle' });
    await p.evaluate(() => document.fonts.ready);
    await p.screenshot({ path: join(OUT, `${name}-${variant}-full.png`), fullPage: true });
    await p.locator('#results').scrollIntoViewIfNeeded();
    await p.evaluate(() => window.scrollBy(0, -90));
    await p.waitForTimeout(300);
    await p.screenshot({ path: join(OUT, `${name}-resultats-${variant}.png`) });
    await p.evaluate(() => window.scrollTo(0, 0));
    await p.screenshot({ path: join(OUT, `${name}-${variant}.png`) });
    await ctx.close();
  }
  console.log('✓', name);
}
await browser.close();
