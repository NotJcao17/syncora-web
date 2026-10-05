// Capturas de revisión: node scripts/shoot.mjs [desktop|mobile] [salida] [url]
// Usa el Chrome instalado (playwright-core no descarga navegadores).
import { chromium } from 'playwright-core';
import { mkdirSync } from 'node:fs';

const mode = process.argv[2] ?? 'desktop';
const out = process.argv[3] ?? 'shots';
const url = process.argv[4] ?? 'http://127.0.0.1:4321/';
mkdirSync(out, { recursive: true });

const viewport = mode === 'mobile' ? { width: 390, height: 844 } : { width: 1440, height: 900 };
const browser = await chromium.launch({
  executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  headless: true,
});
const context = await browser.newContext({
  viewport,
  deviceScaleFactor: mode === 'mobile' ? 2 : 1,
  isMobile: mode === 'mobile',
  hasTouch: mode === 'mobile',
  userAgent:
    mode === 'mobile'
      ? 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36'
      : undefined,
});
const page = await context.newPage();
const errors = [];
page.on('pageerror', (e) => errors.push(String(e)));
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()));
page.on('response', (r) => r.status() >= 400 && errors.push(`${r.status()} ${r.url()}`));

// Primera carga con intro: captura a mitad de la animación.
await page.goto(url, { waitUntil: 'networkidle' });
await page.waitForTimeout(700);
await page.screenshot({ path: `${out}/${mode}-00-intro.png` });
await page.waitForTimeout(2600);

const stops = [
  ['hero', '[data-hero]', 0],
  ['hero-scroll', '[data-hero]', 0.45],
  ['tour', '[data-tour-step="inicio"]', 0],
  ['tour-3', '[data-tour-step="playlist"]', 0],
  ['lyrics', '[data-lyrics]', 0.35],
  ['ai', '[data-ai]', 0.1],
  ['rail', '[data-rail]', 0],
  ['rail-mid', '[data-rail]', 0.6],
  ['wrapped', '[data-wrapped-fan]', -0.25],
  ['wrapped-stats', '.wrapped__stats', -0.2],
  ['desk', '[data-desk-window]', -0.3],
  ['download', '[data-dl]', 0],
  ['download-panels', '.dl__grid', -0.15],
  ['faq', '#preguntas', 0],
  ['footer', 'footer', -0.5],
];

let i = 1;
for (const [name, sel, frac] of stops) {
  const y = await page.evaluate(
    ([s, f]) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const top = el.getBoundingClientRect().top + window.scrollY;
      // fracción del alto del elemento (o de la pantalla si es negativa)
      const extra = f >= 0 ? el.getBoundingClientRect().height * f : window.innerHeight * f;
      return Math.max(0, Math.round(top + extra));
    },
    [sel, frac],
  );
  if (y === null) continue;
  // Bajar en pasos para que ScrollTrigger y los pins se enteren.
  await page.evaluate(async (target) => {
    const step = 220;
    while (Math.abs(window.scrollY - target) > step) {
      window.scrollBy(0, Math.sign(target - window.scrollY) * step);
      await new Promise((r) => setTimeout(r, 16));
    }
    window.scrollTo(0, target);
  }, y);
  await page.waitForTimeout(1400);
  await page.screenshot({ path: `${out}/${mode}-${String(i).padStart(2, '0')}-${name}.png` });
  i++;
}

const metrics = await page.evaluate(() => ({
  docWidth: document.documentElement.scrollWidth,
  vw: window.innerWidth,
  height: document.documentElement.scrollHeight,
}));
console.log(JSON.stringify({ mode, metrics, errors: [...new Set(errors)].slice(0, 15) }, null, 1));
await browser.close();
