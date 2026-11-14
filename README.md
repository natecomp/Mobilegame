# 🎈 Little Learners Arcade

A mobile-first web app that hosts educational games for kids **ages 2–10**.
It is plain HTML, CSS and JavaScript, with no build step and no runtime dependencies. It's an installable PWA that works offline, and it's set up to deploy on **Cloudflare**.

## The games

| Game | Ages | What kids practice | How it works |
|---|---|---|---|
| 🔷 **Shape & Color Safari** | 2–4 | Shapes, colors, listening | "Find the red star!" Rounds go from shapes, to colors, to both, with tricky look-alikes. A wrong tap names what was tapped and shows a picture hint. |
| 🐞 **Counting Critters** | 3–6 | Counting 1–10, numerals | Tap each critter to count it (the narrator counts along), then pick the total. Numbers grow from 1–3 up to 10. A wrong pick says "let's count again". |
| 🔤 **ABC Adventure** | 4–6 | Letters, phonics | A big letter appears. Find the picture that starts with it. Early rounds show uppercase letters with labels; later rounds show lowercase letters and hide the labels, so kids have to listen for the sound. |
| 🐝 **Spelling Bee Garden** | 5–9 | Spelling, phonics | See a picture, hear the word, and tap letter tiles in order. 3 levels: Sprout (3 letters, with faint letters to trace), Bloom (4–5 letters), Sunflower (6+ letters, with decoy tiles). There's also a 💡 hint button. |
| 🚀 **Math Rocket** | 6–10 | +, −, ×, ÷ | 10-question missions on a big keypad (the keyboard works too). 6 levels: from adding within 10 with dot pictures, up to three-digit numbers and missing-number puzzles. 2 tries per question, then the answer is explained. |
| 🎨 **Color Studio** | 2–10 | Colors, creativity, fine motor | 17 coloring pages in 3 sections. **Animals & Fun**: kitty, fish, house, butterfly, rocket, flowers, ice cream and dino. **Christmas: Jesus Is Born**: Baby Jesus in the manger, the Star of Bethlehem ("Jesus is born"), an angel ("Glory to God"), gifts for Jesus, and an Advent wreath ("Jesus is the light"). **Thanksgiving**: turkey, pumpkin patch, "Give thanks" with pumpkin pie, and a cornucopia. The current holiday's section is shown first (Thanksgiving in November, Christmas in December). Big outlined words can be colored in too. **Fill** mode: pick a color and tap an area (toddler friendly). **Crayon** mode: draw freehand in 3 sizes. Picking a color says its name. Undo also restores a cleared page. Each picture is saved automatically, and **Save** exports a PNG (share sheet on phones/tablets so it can go to Photos; download on computers). **Done** celebrates, with a ⭐ the first time a picture is mostly colored. |

### Built for little kids
- **Reads aloud**: every prompt is spoken (Web Speech API), so pre-readers can play on their own. 🔊 repeats it.
- **No losing**: mistakes give a gentle hint, never a "game over". You earn a ⭐ for each question solved on the first try.
- **Big touch targets** and no double-tap zoom. Layouts tested from iPhone SE size up to desktop.
- **Sound effects** are made in code with WebAudio. 🔔 and 🗣️ in the hub toggle sounds and the voice.
- **Saves progress**: total stars, best score per game and level, and the age filter are kept in `localStorage`.
- **Installable, works offline**: it's a Progressive Web App (see below).
- Respects `prefers-reduced-motion`.

## Run it

The website lives in **`public/`**. Open `public/index.html` in a browser to play straight away. For offline play and installing, serve it over http(s). The closest match to production is Cloudflare's local runtime:

```bash
npm install          # once: installs wrangler (Cloudflare's CLI)
npm run dev          # http://localhost:8787, with the same headers as production
```

## Deploy to Cloudflare

The repo is ready for **Cloudflare Workers static assets** (`wrangler.jsonc`), which Cloudflare recommends for new sites. There's no server code: Cloudflare serves the files in `public/`.

**Option A: deploy from GitHub (recommended).** Every push deploys automatically.
1. In the Cloudflare dashboard, go to **Workers & Pages → Create → Import a repository** and pick this repo.
2. Leave the build command empty. Set the **deploy command** to `npm run deploy`.
3. Save and deploy. You get a `*.workers.dev` URL, and you can add your own domain under the Worker's **Domains & Routes** settings.

**Option B: deploy from your computer.**
```bash
npx wrangler login   # once
npm run deploy
```

`npm run deploy` runs `tools/bump-version.js` before `wrangler deploy`, so the offline cache version always matches what ships (see *Releasing changes* below).

**Using Cloudflare Pages instead?** That works too: set the build command to `node tools/bump-version.js` and the build output directory to `public`.

`public/_headers` (honored by both Workers and Pages) sets:
- A strict Content-Security-Policy and other security headers. Everything is same-origin, with no third-party requests or trackers.
- `no-cache` on `sw.js` and the manifest, so app updates roll out promptly.
- A week of browser caching for fonts and icons.

## Install it (Progressive Web App)

Little Learners is an installable PWA. After the first visit it works with **no internet connection**, and it opens full screen from the home screen like a native app.

| Device | How to install |
|---|---|
| Android (Chrome, Edge, Samsung Internet) | Tap **Install** on the card in the hub, or use the browser menu: **Install app** |
| Windows / Mac / ChromeOS (Chrome, Edge) | Tap **Install** in the hub, or use the install icon in the address bar |
| iPhone / iPad (Safari) | Tap **Install** in the hub for step-by-step help: **Share** → **Add to Home Screen** |

If the install card is dismissed, a small 📲 button stays in the hub's top bar. Long-pressing the installed app icon (Android, desktop) gives shortcuts straight into each game.

**Installing needs HTTPS.** Browsers only allow installing from `https://` (or `http://localhost`). Cloudflare provides HTTPS automatically.

### How it works
(Paths below are inside `public/`.)
- `manifest.webmanifest` holds the name, colors, icons (including maskable icons for Android), game shortcuts and install-dialog screenshots.
- `sw.js` is the service worker. It precaches every app file on install, then serves cache-first, so loads are instant and play works offline. The font is self-hosted for the same reason.
- `js/pwa.js` registers the worker, shows the hub's **Install** card (and the iOS instructions), and shows **"A new version is ready"** when an update has downloaded. Updates apply only when that button is tapped, never mid-game.

### Releasing changes ⚠️
Installed apps keep serving their cached copy until the service worker changes. `npm run deploy` handles this automatically. If you deploy another way, **run this after editing any app file:**

```bash
npm run bump         # same as: node tools/bump-version.js
```

This stamps `public/sw.js` with a hash of all precached files (and the worker itself), so devices pick up the update. It also fails if `PRECACHE` lists a missing file, and warns about files that aren't precached. **If you add a file** (e.g. a new game), add it to `PRECACHE` in `sw.js` too. `node tools/bump-version.js --check` exits non-zero when the version is stale, which is handy in CI.

Asset scripts (they need Playwright: `npm i -D playwright`):
- `node tools/make-icons.js` renders the PNG icons from `public/icons/icon.svg` and `icon-maskable.svg`.
- `node tools/make-screenshots.js` regenerates `public/screenshots/`, used in the install dialog.

## Project layout

```
public/                     ← everything that gets deployed
  index.html                entry point; loads the scripts below in order
  css/styles.css            all styling (mobile-first)
  js/core.js                EduGames engine: registry, DOM helper, speech, sfx, confetti, storage, level picker
  js/pwa.js                 service worker registration, install button, update notice
  js/app.js                 hub (age filter, game cards, install/update cards) + game screen + end card
  js/games/*.js             one file per game; each calls EduGames.register({...})
  js/games/coloring-pages.js  the Color Studio pictures (SVG)
  sw.js                     service worker (offline cache)
  manifest.webmanifest      PWA metadata
  _headers                  Cloudflare security + caching headers
  icons/  fonts/  screenshots/
tools/                      bump-version, make-icons, make-screenshots
wrangler.jsonc              Cloudflare deployment config
package.json                npm run dev / deploy / bump / check
```

## Adding a coloring page

Append an entry to `PAGES` in `public/js/games/coloring-pages.js`, then run `npm run bump`. Pages use a 400×400 canvas. Set `category` to `'everyday'`, `'christmas'` or `'thanksgiving'` (sections are listed in `CATEGORIES` in the same file):

```js
{
  id: 'turtle', category: 'everyday', title: 'Turtle', emoji: '🐢',
  // Fillable shapes, back to front. Start with the full background.
  regions: `<rect x="0" y="0" width="400" height="400"/>
            <ellipse cx="200" cy="230" rx="120" ry="80"/>
            <circle cx="320" cy="210" r="35"/>`,
  // Details on top that can't be filled (eyes, smiles…). Add fill="#2d2a4a" for solid dots.
  lines: `<circle cx="330" cy="200" r="5" fill="#2d2a4a"/>`,
}
```

Shapes may overlap: each outline is automatically hidden wherever a later shape covers it.
Helpers in that file: `words('GIVE THANKS', y, size)` adds big outlined letters to color in; `star()`, `leaf()`, `pumpkin()`, `flame()`, `petals()` and `fan()` draw common shapes.

## Adding a game

1. Create `public/js/games/mygame.js`:

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

2. Add `<script src="js/games/mygame.js"></script>` to `public/index.html`, before `js/app.js`.
3. Add `'./js/games/mygame.js'` to `PRECACHE` in `public/sw.js`, then run `npm run bump`.
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
