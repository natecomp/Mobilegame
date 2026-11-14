/*
 * Renders the PNG app icons from the SVG sources in icons/.
 * Requires Playwright:  node tools/make-icons.js
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const ICONS = path.join(__dirname, '..', 'icons');
const OUTPUTS = [
  { src: 'icon.svg', out: 'icon-192.png', size: 192 },
  { src: 'icon.svg', out: 'icon-512.png', size: 512 },
  { src: 'icon-maskable.svg', out: 'maskable-192.png', size: 192 },
  { src: 'icon-maskable.svg', out: 'maskable-512.png', size: 512 },
  // iOS draws its own rounded corners and dislikes transparency: use the full-bleed art.
  { src: 'icon-maskable.svg', out: 'apple-touch-icon.png', size: 180 },
  { src: 'icon.svg', out: 'favicon-32.png', size: 32 },
];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const { src, out, size } of OUTPUTS) {
    const svg = fs.readFileSync(path.join(ICONS, src), 'utf8');
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(
      `<html><body style="margin:0;background:transparent">` +
        `<img src="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" width="${size}" height="${size}" style="display:block">` +
        `</body></html>`
    );
    await page.waitForFunction(() => document.images[0].complete);
    await page.screenshot({ path: path.join(ICONS, out), omitBackground: true, clip: { x: 0, y: 0, width: size, height: size } });
    console.log('wrote icons/' + out);
  }
  await browser.close();
})();
