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
- **Installable**: there's a web app manifest, so you can use "Add to Home Screen" on phones and tablets.
- Respects `prefers-reduced-motion`.

## Run it

Open `index.html` in a browser. Or serve the folder, which works best on phones on your network:

```bash
python3 -m http.server 8000
# then visit http://localhost:8000
```

It deploys as-is to any static host (GitHub Pages, Netlify, Vercel, S3 and so on).

## Project layout

```
index.html              entry point; loads the scripts below in order
css/styles.css          all styling (mobile-first)
js/core.js              EduGames engine: registry, DOM helper, speech, sfx, confetti, storage, level picker
js/app.js               hub (age filter, game cards) + game screen shell + end-of-game card
js/games/*.js           one file per game; each calls EduGames.register({...})
manifest.webmanifest    PWA metadata
icon.svg                app icon
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
