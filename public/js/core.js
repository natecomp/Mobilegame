/*
 * Little Learners Arcade — core engine.
 *
 * Exposes a single global, `EduGames`, that games use to register themselves
 * and that provides shared services: DOM helpers, randomness, speech,
 * sound effects, confetti and persistent progress.
 */
(function () {
  'use strict';

  const EG = (window.EduGames = window.EduGames || {});

  /* ------------------------------------------------------------------ */
  /* Game registry                                                       */
  /* ------------------------------------------------------------------ */

  EG.games = [];

  /**
   * Register a game.
   * @param {object} game
   * @param {string} game.id        URL-safe id, e.g. "counting"
   * @param {string} game.title
   * @param {string} game.emoji
   * @param {string} game.color     accent color for the card + game screen
   * @param {[number, number]} game.ages  inclusive age range, e.g. [3, 6]
   * @param {string} game.description
   * @param {string[]} game.skills
   * @param {(api: object) => void} game.mount
   */
  EG.register = function (game) {
    EG.games.push(game);
  };

  /* ------------------------------------------------------------------ */
  /* Utilities                                                           */
  /* ------------------------------------------------------------------ */

  const U = (EG.util = {
    randInt(min, max) {
      return Math.floor(Math.random() * (max - min + 1)) + min;
    },
    pick(arr) {
      return arr[Math.floor(Math.random() * arr.length)];
    },
    shuffle(arr) {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
      }
      return a;
    },
    sample(arr, n) {
      return U.shuffle(arr).slice(0, n);
    },
    /** "a" or "an" for a word. */
    article(word) {
      return /^[aeiou]/i.test(word) ? 'an' : 'a';
    },
    /** Restart a CSS animation class on an element. */
    replayClass(node, cls) {
      node.classList.remove(cls);
      void node.offsetWidth; // force reflow so the animation restarts
      node.classList.add(cls);
    },
    /**
     * Tiny hyperscript helper.
     *   el('button', { class: 'btn', onclick: fn, 'aria-label': 'Go' }, 'Go')
     */
    el(tag, attrs, ...children) {
      const node = document.createElement(tag);
      if (attrs) {
        for (const [key, value] of Object.entries(attrs)) {
          if (value == null || value === false) continue;
          if (key === 'class') node.className = value;
          else if (key === 'style' && typeof value === 'object') {
            for (const [prop, v] of Object.entries(value)) {
              // Custom properties (--foo) can't be assigned as style fields.
              if (prop.startsWith('--')) node.style.setProperty(prop, v);
              else node.style[prop] = v;
            }
          }
          else if (key === 'dataset') Object.assign(node.dataset, value);
          else if (key.startsWith('on') && typeof value === 'function') node.addEventListener(key.slice(2), value);
          else if (key === 'html') node.innerHTML = value;
          else node.setAttribute(key, value === true ? '' : value);
        }
      }
      append(node, children);
      return node;
    },
  });

  function append(node, children) {
    for (const child of children) {
      if (child == null || child === false) continue;
      if (Array.isArray(child)) append(node, child);
      else node.append(child instanceof Node ? child : String(child));
    }
  }

  /* ------------------------------------------------------------------ */
  /* Persistent progress (localStorage, fails soft)                      */
  /* ------------------------------------------------------------------ */

  const STORE_KEY = 'little-learners:v1';

  function readStore() {
    try {
      return JSON.parse(localStorage.getItem(STORE_KEY)) || {};
    } catch (e) {
      return {};
    }
  }

  EG.store = {
    state: Object.assign({ stars: 0, sound: true, voice: true, ageFilter: 'all', best: {} }, readStore()),
    save() {
      try {
        localStorage.setItem(STORE_KEY, JSON.stringify(this.state));
      } catch (e) {
        /* private mode / storage disabled: progress just won't persist */
      }
    },
    set(key, value) {
      this.state[key] = value;
      this.save();
    },
    addStars(n) {
      this.state.stars += n;
      this.save();
    },
    /** Records a best score; returns true when it is a new best. */
    recordBest(key, score) {
      const prev = this.state.best[key] || 0;
      if (score > prev) {
        this.state.best[key] = score;
        this.save();
        return true;
      }
      return false;
    },
    /** Best score for a game, across all of its levels. */
    bestFor(gameId) {
      let best = 0;
      for (const [key, score] of Object.entries(this.state.best)) {
        if (key === gameId || key.startsWith(gameId + ':')) best = Math.max(best, score);
      }
      return best;
    },
  };

  /* ------------------------------------------------------------------ */
  /* Speech — read prompts aloud for pre-readers                         */
  /* ------------------------------------------------------------------ */

  const synth = 'speechSynthesis' in window ? window.speechSynthesis : null;
  let voice = null;

  function chooseVoice() {
    if (!synth) return;
    const voices = synth.getVoices();
    voice =
      voices.find((v) => /^en[-_]US/i.test(v.lang) && v.localService) ||
      voices.find((v) => /^en[-_]US/i.test(v.lang)) ||
      voices.find((v) => /^en/i.test(v.lang)) ||
      null;
  }
  if (synth) {
    chooseVoice();
    synth.addEventListener?.('voiceschanged', chooseVoice);
  }

  EG.speechSupported = !!synth;

  /** Speak text aloud. Resolves when finished (or immediately if muted). */
  EG.speak = function (text, opts = {}) {
    if (!synth || !EG.store.state.voice || !text) return Promise.resolve();
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = opts.rate || 0.9;
    u.pitch = opts.pitch || 1.1;
    if (voice) u.voice = voice;
    u.lang = voice ? voice.lang : 'en-US';
    return new Promise((resolve) => {
      u.onend = resolve;
      u.onerror = resolve;
      synth.speak(u);
      setTimeout(resolve, 8000); // safety net: some browsers never fire onend
    });
  };

  EG.stopSpeech = function () {
    if (synth) synth.cancel();
  };

  /* ------------------------------------------------------------------ */
  /* Sound effects — synthesized with WebAudio, no asset files needed    */
  /* ------------------------------------------------------------------ */

  let audioCtx = null;

  function tone(freq, dur, { type = 'triangle', delay = 0, volume = 0.18 } = {}) {
    if (!EG.store.state.sound) return;
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (!Ctx) return;
      audioCtx = audioCtx || new Ctx();
      if (audioCtx.state === 'suspended') audioCtx.resume();
      const t = audioCtx.currentTime + delay;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(freq, t);
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(volume, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(audioCtx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.05);
    } catch (e) {
      /* audio is a nice-to-have */
    }
  }

  EG.sfx = {
    tap(freq = 660) {
      tone(freq, 0.09);
    },
    correct() {
      [523, 659, 784].forEach((f, i) => tone(f, 0.2, { delay: i * 0.09 }));
    },
    wrong() {
      tone(240, 0.16, { type: 'sine', volume: 0.12 });
      tone(200, 0.22, { type: 'sine', volume: 0.12, delay: 0.12 });
    },
    win() {
      [523, 659, 784, 1047, 784, 1047].forEach((f, i) => tone(f, 0.26, { delay: i * 0.12 }));
    },
  };

  /* ------------------------------------------------------------------ */
  /* Level picker — shared by games that offer difficulty levels         */
  /* ------------------------------------------------------------------ */

  /**
   * Render a level menu into api.stage. Remembers the choice in api.memory so
   * "Play again" skips the menu; returns a "Change level" finish action.
   *
   * @param {object} api       game api
   * @param {string} title     heading, e.g. "Pick a level"
   * @param {{id: string, label: string, emoji: string, sub: string}[]} levels
   * @param {(level: object) => void} onPick
   */
  EG.chooseLevel = function (api, title, levels, onPick) {
    const remembered = levels.find((l) => l.id === api.memory.levelId);
    if (remembered) {
      onPick(remembered);
      return;
    }
    api.prompt(title);
    api.stage.append(
      U.el(
        'div',
        { class: 'level-picker' },
        U.el('h2', { class: 'level-title' }, title),
        U.el(
          'div',
          { class: 'level-grid' },
          levels.map((level, i) =>
            U.el(
              'button',
              {
                class: 'level-btn pop-in',
                style: { animationDelay: i * 60 + 'ms' },
                onclick: () => {
                  EG.sfx.tap();
                  api.memory.levelId = level.id;
                  api.stage.replaceChildren();
                  onPick(level);
                },
              },
              U.el('span', { class: 'level-emoji', 'aria-hidden': 'true' }, level.emoji),
              U.el('span', { class: 'level-label' }, level.label),
              U.el('span', { class: 'level-sub' }, level.sub)
            )
          )
        )
      )
    );
  };

  /** Finish-screen action that sends the player back to the level menu. */
  EG.changeLevelAction = function (api) {
    return {
      label: '📚 Change level',
      onClick: () => {
        delete api.memory.levelId;
        api.restart();
      },
    };
  };

  /* ------------------------------------------------------------------ */
  /* No zooming                                                          */
  /* ------------------------------------------------------------------ */
  // Little hands pinch and double-tap by accident. CSS touch-action and the
  // viewport tag stop zooming in most browsers, but iOS Safari still pinch-zooms,
  // so its gesture events are cancelled here. Ctrl+wheel is a trackpad pinch.
  const noDefault = (e) => e.preventDefault();
  const active = { passive: false };
  ['gesturestart', 'gesturechange', 'gestureend'].forEach((t) => document.addEventListener(t, noDefault, active));
  document.addEventListener('touchmove', (e) => e.touches.length > 1 && e.preventDefault(), active);
  document.addEventListener('wheel', (e) => e.ctrlKey && e.preventDefault(), active);

  /* ------------------------------------------------------------------ */
  /* Confetti                                                            */
  /* ------------------------------------------------------------------ */

  const CONFETTI_COLORS = ['#ef4444', '#f97316', '#facc15', '#22c55e', '#3b82f6', '#a855f7', '#ec4899'];
  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');

  EG.confetti = function (count = 36) {
    if (reduceMotion?.matches) return;
    const layer = U.el('div', { class: 'confetti', 'aria-hidden': 'true' });
    for (let i = 0; i < count; i++) {
      layer.append(
        U.el('i', {
          style: {
            left: Math.random() * 100 + '%',
            background: U.pick(CONFETTI_COLORS),
            animationDuration: 1.2 + Math.random() * 1.2 + 's',
            animationDelay: Math.random() * 0.25 + 's',
            borderRadius: Math.random() < 0.4 ? '50%' : '2px',
          },
        })
      );
      const piece = layer.lastChild;
      piece.style.setProperty('--dx', (Math.random() - 0.5) * 240 + 'px');
      piece.style.setProperty('--rot', (Math.random() - 0.5) * 1440 + 'deg');
    }
    document.body.append(layer);
    setTimeout(() => layer.remove(), 2800);
  };
})();
