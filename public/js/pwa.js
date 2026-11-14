/*
 * Little Learners Arcade — Progressive Web App support.
 *
 * - Registers the service worker (offline play + installability).
 * - Captures the browser's install prompt so the hub can offer an
 *   "Install" button (Chrome, Edge, Samsung Internet, Android).
 * - On iPhone/iPad, where there is no install prompt, explains
 *   Share → "Add to Home Screen" instead.
 * - Surfaces "a new version is ready" without ever reloading mid-game.
 *
 * The hub reads state from EduGames.pwa and re-renders on change.
 */
(function () {
  'use strict';

  const EG = window.EduGames;
  const { el } = EG.util;

  const listeners = new Set();
  const notify = () => listeners.forEach((fn) => fn());

  const standaloneQuery = window.matchMedia?.('(display-mode: standalone)');
  const isStandalone = () => !!(standaloneQuery?.matches || navigator.standalone === true);
  const isIOS =
    /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1); // iPadOS reports as Mac

  let deferredPrompt = null;
  let waitingWorker = null;
  let reloadRequested = false;

  const pwa = (EG.pwa = {
    /** Subscribe to state changes; returns an unsubscribe function. */
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    get standalone() {
      return isStandalone();
    },
    /** True when we can offer an install action on this device. */
    get canInstall() {
      if (isStandalone()) return false;
      return !!deferredPrompt || isIOS;
    },
    get updateReady() {
      return !!waitingWorker;
    },
    async install() {
      if (deferredPrompt) {
        const prompt = deferredPrompt;
        deferredPrompt = null;
        prompt.prompt();
        try {
          await prompt.userChoice;
        } catch (e) {
          /* ignore */
        }
        notify();
      } else if (isIOS) {
        showIOSInstructions();
      }
    },
    /** Activate the waiting service worker; the page reloads once it takes over. */
    applyUpdate() {
      if (!waitingWorker) return;
      reloadRequested = true;
      waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    },
  });

  /* ---------------- Install prompt ---------------- */

  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault(); // we show our own button instead of the mini-infobar
    deferredPrompt = event;
    notify();
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });

  standaloneQuery?.addEventListener?.('change', notify);

  function showIOSInstructions() {
    const close = () => overlay.remove();
    const overlay = el(
      'div',
      { class: 'overlay', onclick: (e) => e.target === overlay && close() },
      el(
        'div',
        { class: 'end-card install-help', role: 'dialog', 'aria-label': 'How to install' },
        el('div', { class: 'end-emoji', 'aria-hidden': 'true' }, '📲'),
        el('h2', null, 'Add to Home Screen'),
        el(
          'ol',
          { class: 'install-steps' },
          el('li', null, 'Tap the ', el('b', null, 'Share'), ' button ', el('span', { class: 'ios-share', 'aria-hidden': 'true' }, shareIcon()), ' in the browser bar.'),
          el('li', null, 'Scroll down and choose ', el('b', null, 'Add to Home Screen'), '.'),
          el('li', null, 'Tap ', el('b', null, 'Add'), '. Little Learners will appear with your apps!')
        ),
        el('div', { class: 'end-actions' }, el('button', { class: 'btn primary', onclick: close }, 'Got it!'))
      )
    );
    document.body.append(overlay);
  }

  function shareIcon() {
    return el('span', {
      html:
        '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" ' +
        'stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v12"/><path d="M8 7l4-4 4 4"/>' +
        '<path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/></svg>',
    });
  }

  /* ---------------- Service worker ---------------- */

  // Service workers need http(s); opening index.html from disk still works, just not offline.
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;

  function trackWaiting(reg) {
    const setWaiting = (worker) => {
      waitingWorker = worker;
      notify();
    };
    // Only an *update* if a worker already controls this page.
    if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
    reg.addEventListener('updatefound', () => {
      const worker = reg.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed' && navigator.serviceWorker.controller) setWaiting(worker);
      });
    });
  }

  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadRequested) {
      reloadRequested = false;
      location.reload();
    }
  });

  window.addEventListener('load', async () => {
    try {
      const reg = await navigator.serviceWorker.register('sw.js');
      trackWaiting(reg);
      // Check for updates whenever the app comes back to the foreground.
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') reg.update().catch(() => {});
      });
    } catch (e) {
      console.warn('Service worker registration failed:', e);
    }
  });
})();
