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

const VERSION = '2aedf076';
const CACHE_PREFIX = 'little-learners-';
const CACHE = CACHE_PREFIX + VERSION;

// './' is the app page (index.html). Hosts like Cloudflare redirect /index.html
// to /, so it is cached under './' only.
const PRECACHE = [
  './',
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
  './js/games/coloring-pages.js',
  './js/games/coloring.js',
  './js/app.js',
  './icons/icon.svg',
  './icons/favicon-32.png',
  './icons/apple-touch-icon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-192.png',
  './icons/maskable-512.png',
];

/**
 * Browsers refuse to use a *redirected* response for a page load, so store a
 * clean copy (e.g. Cloudflare answers /index.html with a redirect to /).
 */
async function cleanResponse(response) {
  if (!response.redirected) return response;
  const body = await response.blob();
  return new Response(body, { status: response.status, statusText: response.statusText, headers: response.headers });
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE);
      await Promise.all(
        PRECACHE.map(async (url) => {
          // cache: 'reload' bypasses the HTTP cache so we never precache stale files.
          const response = await fetch(new Request(url, { cache: 'reload' }));
          if (!response.ok) throw new Error(`Precache failed for ${url}: ${response.status}`);
          await cache.put(url, await cleanResponse(response));
        })
      );
    })()
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
        const cached = (await caches.match(request, { ignoreSearch: true })) || (await caches.match('./'));
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
        cache.put(request, await cleanResponse(response.clone()));
      }
      return response;
    })()
  );
});
