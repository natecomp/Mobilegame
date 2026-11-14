# 🎈 Little Learners Arcade

A mobile-first web app that hosts educational games for kids **ages 2–10**.
It is plain HTML, CSS and JavaScript, with no build step, no dependencies and no sound or image files.

## The games

| Game | Ages | What kids practice | How it works |
|---|---|---|---|
| 🔷 **Shape & Color Safari** | 2–4 | Shapes, colors, listening | "Find the red star!" Rounds go from shapes, to colors, to both, with tricky look-alikes. A wrong tap names what was tapped and shows a picture hint. |
| 🐞 **Counting Critters** | 3–6 | Counting 1–10, numerals | Tap each critter to count it (the narrator counts along), then pick the total. Numbers grow from 1–3 up to 10. A wrong pick says "let's count again". |
| 🔤 **ABC Adventure** | 4–6 | Letters, phonics | A big letter appears. Find the picture that starts with it. Early rounds show uppercase letters with labels; later rounds show lowercase letters and hide the labels, so kids have to listen for the sound. |
| 🐝 **Spelling Bee Garden** | 5–9 | Spelling, phonics | See a picture, hear the word, and tap letter tiles in order. 3 levels: Sprout (3 letters, with faint letters to trace), Bloom (4–5 letters), Sunflower (6+ letters, with decoy tiles). There's also a 💡 hint button. |
| 🚀 **Math Rocket** | 6–10 | +, −, ×, ÷ | 10-question missions on a big keypad (the keyboard works too). 6 levels: from adding within 10 with dot pictures, up to three-digit numbers and missing-number puzzles. 2 tries per question, then the answer is explained. |

### Built for little kids
- **Reads aloud**: every prompt is spoken (Web Speech API), so pre-readers can play on their own. 🔊 repeats it.
- **No losing**: mistakes give a gentle hint, never a "game over". You earn a ⭐ for each question solved on the first try.
- **Big touch targets** and no double-tap zoom. Layouts tested from iPhone SE size up to desktop.
- **Sound effects** are made in code with WebAudio. 🔔 and 🗣️ in the hub toggle sounds and the voice.
- **Saves progress**: total stars, best score per game and level, and the age filter are kept in `localStorage`.
- **Installable, works offline**: it's a Progressive Web App (see below).
- Respects `prefers-reduced-motion`.

## Run it

Open `index.html` in a browser to play straight away. To get offline play and installing, serve it over http(s):

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

## Install it (Progressive Web App)

Little Learners is an installable PWA. After the first visit it works with **no internet connection**, and it opens full screen from the home screen like a native app.

| Device | How to install |
|---|---|
| Android (Chrome, Edge, Samsung Internet) | Tap **Install** on the card in the hub, or use the browser menu: **Install app** |
| Windows / Mac / ChromeOS (Chrome, Edge) | Tap **Install** in the hub, or use the install icon in the address bar |
| iPhone / iPad (Safari) | Tap **Install** in the hub for step-by-step help: **Share** → **Add to Home Screen** |

If the install card is dismissed, a small 📲 button stays in the hub's top bar. Long-pressing the installed app icon (Android, desktop) gives shortcuts straight into each game.

**Installing needs HTTPS.** Browsers only allow installing from `https://` (or `http://localhost`). Any static host with HTTPS works as-is, e.g. GitHub Pages, Netlify, Cloudflare Pages or Vercel. There's no build step: just publish the repository folder.

### How it works
- `manifest.webmanifest` holds the name, colors, icons (including maskable icons for Android), game shortcuts and install-dialog screenshots.
- `sw.js` is the service worker. It precaches every app file on install, then serves cache-first, so loads are instant and play works offline. The font is self-hosted for the same reason.
- `js/pwa.js` registers the worker, shows the hub's **Install** card (and the iOS instructions), and shows **"A new version is ready"** when an update has downloaded. Updates apply only when that button is tapped, never mid-game.

### Releasing changes ⚠️
Installed apps keep serving their cached copy until the service worker changes. **After editing any app file, run:**

```bash
node tools/bump-version.js
```

This stamps `sw.js` with a hash of all precached files, so devices pick up the update. It also fails if `PRECACHE` lists a missing file, and warns about files that aren't precached. **If you add a file** (e.g. a new game), add it to `PRECACHE` in `sw.js` too. `node tools/bump-version.js --check` exits non-zero when the version is stale, which is handy in CI.

Asset scripts (they need Playwright: `npm i -D playwright`):
- `node tools/make-icons.js` renders the PNG icons from `icons/icon.svg` and `icons/icon-maskable.svg`.
- `node tools/make-screenshots.js` regenerates the `screenshots/` used in the install dialog.

## Project layout

```
index.html              entry point; loads the scripts below in order
css/styles.css          all styling (mobile-first)
js/core.js              EduGames engine: registry, DOM helper, speech, sfx, confetti, storage, level picker
js/pwa.js               service worker registration, install button, update notice
js/app.js               hub (age filter, game cards, install/update cards) + game screen shell + end card
js/games/*.js           one file per game; each calls EduGames.register({...})
sw.js                   service worker (offline cache)
manifest.webmanifest    PWA metadata
icons/                  app icons (SVG sources + generated PNGs)
fonts/                  self-hosted Fredoka font + its license (OFL)
screenshots/            install-dialog screenshots referenced by the manifest
tools/                  bump-version, make-icons, make-screenshots
```

## Adding a game

1. Create `js/games/mygame.js`:

```js
(function () {
  const { register, util: U } = window.EduGames;

  register({
    id: 'mygame',               // used in the URL: #/play/mygame
    title: 'My Game',
    emoji: '🦄',
    color: '#ec4899',           // card + header color
    ages: [4, 7],               // used by the hub's age filter
    description: 'One sentence for the game card.',
    skills: ['Skill A', 'Skill B'],
    mount(api) {
      let round = 0;
      const ROUNDS = 10;
      const next = () => {
        if (round >= ROUNDS) return api.finish({ total: ROUNDS });
        api.setProgress(round, ROUNDS);
        api.prompt('Tap the button!');            // spoken; 🔊 repeats it
        api.stage.replaceChildren(
          U.el('button', { class: 'btn primary', onclick: () => {
            api.sfx.correct(); api.confetti(); api.addStar();
            round++; api.after(1000, next);       // timers auto-cancel on exit
          } }, 'Tap me')
        );
      };
      next();
    },
  });
})();
```

2. Add `<script src="js/games/mygame.js"></script>` to `index.html`, before `js/app.js`.
3. Add `'./js/games/mygame.js'` to `PRECACHE` in `sw.js`, then run `node tools/bump-version.js`.
   You can also add a shortcut for it in `manifest.webmanifest`.

### The game `api`

| Member | Purpose |
|---|---|
| `stage` | element to render into |
| `prompt(text)` / `speak(text)` | speak the main instruction (repeatable) / a one-off line |
| `sfx.tap(freq?)`, `sfx.correct()`, `sfx.wrong()` | sound effects |
| `confetti(n?)` | celebrate |
| `addStar()` | award a star (updates the header and saved total) |
| `setProgress(done, total)` | progress dots in the header |
| `after(ms, fn)`, `wait(ms)` | timers that are cancelled when the player leaves or restarts |
| `onCleanup(fn)` | e.g. remove a `keydown` listener |
| `finish({ total, bestKey?, detail?, actions? })` | show the end card (Play again / More games / your own actions) |
| `memory` | object that survives "Play again" (e.g. the chosen level) |
| `util` | `el`, `pick`, `shuffle`, `sample`, `randInt`, `article`, `replayClass` |

For games with difficulty levels, use `EduGames.chooseLevel(api, title, levels, onPick)` and add
`EduGames.changeLevelAction(api)` to `finish({ actions })`. See `spelling.js` and `math.js`.
