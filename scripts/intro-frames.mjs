// Cuadros de la intro y prueba de movimiento reducido.
import { chromium } from 'playwright-core';
const out = process.argv[2];
const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
const page = await ctx.newPage();
await page.goto('http://127.0.0.1:4321/', { waitUntil: 'domcontentloaded' });
for (const t of [150, 450, 800, 1150, 1500, 1850, 2300]) {
  await page.waitForTimeout(t === 150 ? 150 : 350 - 0);
  await page.screenshot({ path: `${out}/intro-${t}.png` });
}
// Movimiento reducido: todo visible sin animación.
const rctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
const r = await rctx.newPage();
await r.goto('http://127.0.0.1:4321/', { waitUntil: 'networkidle' });
const state = await r.evaluate(() => ({
  introDisplay: getComputedStyle(document.querySelector('[data-intro]')).display,
  heroOpacity: getComputedStyle(document.querySelector('[data-hero-reveal]')).opacity,
  lyricsSung: document.querySelectorAll('[data-lyric].is-sung').length,
  aiResult: document.querySelector('[data-screen="resultado"]')?.classList.contains('is-on'),
  lenis: document.documentElement.classList.contains('lenis'),
}));
console.log(JSON.stringify(state));
await browser.close();
