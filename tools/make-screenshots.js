/*
 * Captures the store-style screenshots referenced by manifest.webmanifest
 * (shown in Android's richer install dialog). Requires Playwright:
 *   node tools/make-screenshots.js
 */
const { chromium } = require('playwright');
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'screenshots');
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.webmanifest': 'application/manifest+json' };

const server = http.createServer((req, res) => {
  const rel = decodeURIComponent(new URL(req.url, 'http://x').pathname).replace(/^\/+/, '') || 'index.html';
  const file = path.join(ROOT, rel);
  if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
    res.writeHead(404).end();
    return;
  }
  res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream' });
  fs.createReadStream(file).pipe(res);
});

(async () => {
  await new Promise((r) => server.listen(0, r));
  const base = `http://localhost:${server.address().port}/index.html`;
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const hideInstallUi = '.app-card, .confetti { display: none !important; }';
  const shots = [
    { name: 'hub-narrow.png', hash: '', viewport: { width: 390, height: 844 }, scale: 2 },
    { name: 'counting-narrow.png', hash: '#/play/counting', viewport: { width: 390, height: 844 }, scale: 2, countSome: true },
    { name: 'hub-wide.png', hash: '', viewport: { width: 1280, height: 800 }, scale: 1 },
  ];
  for (const s of shots) {
    const ctx = await browser.newContext({ viewport: s.viewport, deviceScaleFactor: s.scale, serviceWorkers: 'block' });
    const page = await ctx.newPage();
    await page.goto(base + s.hash);
    await page.addStyleTag({ content: hideInstallUi });
    await page.waitForTimeout(900);
    if (s.countSome) {
      const critters = page.locator('.critter');
      const n = await critters.count();
      for (let i = 0; i < Math.max(1, n - 1); i++) await critters.nth(i).click();
      await page.waitForTimeout(500);
    }
    await page.screenshot({ path: path.join(OUT, s.name) });
    console.log('wrote screenshots/' + s.name);
    await ctx.close();
  }
  await browser.close();
  server.close();
})();
