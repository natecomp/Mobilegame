/*
 * Stamps sw.js with a VERSION derived from the contents of every precached
 * file, so installed apps pick up changes. Run after editing any app file:
 *
 *   node tools/bump-version.js          rewrite VERSION in sw.js
 *   node tools/bump-version.js --check  exit 1 if VERSION is out of date (for CI)
 *
 * It also fails if a PRECACHE entry is missing on disk, and warns about app
 * files that exist but aren't precached (they wouldn't work offline).
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const ROOT = path.join(__dirname, '..');
const SW = path.join(ROOT, 'sw.js');
const APP_DIRS = ['css', 'js', 'fonts', 'icons'];
const NOT_PRECACHED_ON_PURPOSE = new Set(['icons/icon-maskable.svg', 'fonts/OFL.txt']);

const sw = fs.readFileSync(SW, 'utf8');
const listMatch = sw.match(/const PRECACHE = \[([\s\S]*?)\];/);
if (!listMatch) throw new Error('Could not find PRECACHE list in sw.js');
const entries = [...listMatch[1].matchAll(/'([^']+)'/g)].map((m) => m[1]);

const files = entries
  .filter((e) => e !== './')
  .map((e) => e.replace(/^\.\//, ''));

let ok = true;
const hash = crypto.createHash('sha256');
for (const rel of files) {
  const abs = path.join(ROOT, rel);
  if (!fs.existsSync(abs)) {
    console.error(`✗ PRECACHE lists ${rel}, but it does not exist`);
    ok = false;
    continue;
  }
  hash.update(rel).update('\0').update(fs.readFileSync(abs));
}

// Warn about app files that would be missing offline.
const listed = new Set(files);
const walk = (dir) =>
  fs.readdirSync(path.join(ROOT, dir), { withFileTypes: true }).flatMap((d) => {
    const rel = path.posix.join(dir, d.name);
    return d.isDirectory() ? walk(rel) : [rel];
  });
for (const rel of APP_DIRS.flatMap(walk)) {
  if (!listed.has(rel) && !NOT_PRECACHED_ON_PURPOSE.has(rel)) {
    console.warn(`! ${rel} is not in PRECACHE — it won't be available offline`);
  }
}
if (!ok) process.exit(1);

const version = hash.digest('hex').slice(0, 8);
const current = (sw.match(/const VERSION = '([^']*)';/) || [])[1];

if (process.argv.includes('--check')) {
  if (current !== version) {
    console.error(`✗ sw.js VERSION is ${current}, expected ${version}. Run: node tools/bump-version.js`);
    process.exit(1);
  }
  console.log(`✓ sw.js VERSION ${version} is up to date`);
} else if (current === version) {
  console.log(`✓ sw.js VERSION already ${version}`);
} else {
  fs.writeFileSync(SW, sw.replace(/const VERSION = '[^']*';/, `const VERSION = '${version}';`));
  console.log(`✓ sw.js VERSION ${current} → ${version}`);
}
