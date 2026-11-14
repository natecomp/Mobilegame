/*
 * Little Learners Arcade — service worker.
 *
 * Strategy: precache the whole app on install, then serve cache-first so the
 * app opens instantly and works fully offline.
 *
 * Updating: when files change, run `node tools/bump-version.js`. It rewrites
 * VERSION below from a hash of the precached files. Browsers then install the
 * new worker in the background; the hub shows an "Update" button, and the new
 * version takes over only when it's tapped (never in the middle of a game).
 */

const VERSION = 'c770faa2';
const CACHE_PREFIX = 'little-learners-';
const CACHE = CACHE_PREFIX + VERSION;

const PRECACHE = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/styles.css',
  './fonts/fredoka-latin.woff2',
  './js/core.js',
  './js/pwa.js',
  './js/games/shapes.js',
  './js/games/counting.js',
  './js/games/letters.js',
  './js/games/spelling.js',
  './js/games/math.js',
  './js/app.js',
  './icons/icon.svg',
  './icons/favicon-32.png',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((cache) =>
      // cache: 'reload' bypasses the HTTP cache so we never precache stale files.
      cache.addAll(PRECACHE.map((url) => new Request(url, { cache: 'reload' })))
    )
  );
  // No skipWaiting() here: an update waits until the page asks for it.
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(keys.filter((k) => k.startsWith(CACHE_PREFIX) && k !== CACHE).map((k) => caches.delete(k)));
      await self.clients.claim();
    })()
  );
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return; // let the browser handle anything external

  // Page loads: the app is a single page (routes live in the #hash).
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        const cached = (await caches.match(request, { ignoreSearch: true })) || (await caches.match('./index.html'));
        return cached || fetch(request);
      })()
    );
    return;
  }

  event.respondWith(
    (async () => {
      const cached = await caches.match(request, { ignoreSearch: true });
      if (cached) return cached;
      const response = await fetch(request);
      // Cache anything else from our origin we didn't know about (e.g. screenshots).
      if (response.ok && response.type === 'basic') {
        const cache = await caches.open(CACHE);
        cache.put(request, response.clone());
      }
      return response;
    })()
  );
});
