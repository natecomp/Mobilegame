/*
 * Little Learners Arcade — app shell.
 *
 * Hash routes:
 *   #/             game hub
 *   #/play/<id>    a game
 *
 * Each game receives an `api` object (see makeApi) and builds its UI inside
 * `api.stage`. Timers created through `api.after` / `api.wait` are cancelled
 * automatically when the player leaves or restarts, so games never update a
 * screen that is gone.
 */
(function () {
  'use strict';

  const EG = window.EduGames;
  const { el, replayClass } = EG.util;
  const store = EG.store;
  const app = document.getElementById('app');

  const AGE_FILTERS = [
    { id: 'all', label: 'All ages' },
    { id: '2-4', label: 'Ages 2–4', min: 2, max: 4 },
    { id: '5-7', label: 'Ages 5–7', min: 5, max: 7 },
    { id: '8-10', label: 'Ages 8–10', min: 8, max: 10 },
  ];

  let teardownCurrent = null;

  function route() {
    if (teardownCurrent) {
      teardownCurrent();
      teardownCurrent = null;
    }
    const match = location.hash.match(/^#\/play\/([\w-]+)/);
    const game = match && EG.games.find((g) => g.id === match[1]);
    if (game) renderGame(game);
    else renderHub();
    window.scrollTo(0, 0);
  }

  /* ------------------------------------------------------------------ */
  /* Shared bits                                                         */
  /* ------------------------------------------------------------------ */

  function settingsButtons(onChange) {
    const make = (key, onIcon, offIcon, label) => {
      const btn = el('button', {
        class: 'icon-btn toggle',
        'aria-label': label,
        'aria-pressed': String(store.state[key]),
        title: label,
      });
      const paint = () => {
        btn.textContent = store.state[key] ? onIcon : offIcon;
        btn.setAttribute('aria-pressed', String(store.state[key]));
        btn.classList.toggle('off', !store.state[key]);
      };
      btn.addEventListener('click', () => {
        store.set(key, !store.state[key]);
        if (key === 'voice' && !store.state.voice) EG.stopSpeech();
        paint();
        onChange?.();
      });
      paint();
      return btn;
    };
    const buttons = [make('sound', '🔔', '🔕', 'Sound effects')];
    if (EG.speechSupported) buttons.push(make('voice', '🗣️', '🤐', 'Read aloud'));
    return buttons;
  }

  function starBadge() {
    const count = el('span', { class: 'star-count' }, store.state.stars);
    const badge = el('div', { class: 'star-badge', 'aria-label': 'Stars earned', role: 'status' }, '⭐', count);
    return { badge, count };
  }

  /* ------------------------------------------------------------------ */
  /* Hub                                                                 */
  /* ------------------------------------------------------------------ */

  function renderHub() {
    document.title = 'Little Learners Arcade';
    const filter = AGE_FILTERS.find((f) => f.id === store.state.ageFilter) || AGE_FILTERS[0];
    const visible = EG.games.filter(
      (g) => filter.id === 'all' || (g.ages[0] <= filter.max && g.ages[1] >= filter.min)
    );

    const chips = AGE_FILTERS.map((f) =>
      el(
        'button',
        {
          class: 'chip' + (f.id === filter.id ? ' active' : ''),
          'aria-pressed': String(f.id === filter.id),
          onclick: () => {
            store.set('ageFilter', f.id);
            renderHub();
          },
        },
        f.label
      )
    );

    app.replaceChildren(
      el(
        'header',
        { class: 'topbar' },
        el('div', { class: 'brand' }, el('span', { class: 'brand-logo', 'aria-hidden': 'true' }, '🎈'), el('h1', null, 'Little Learners Arcade')),
        el('div', { class: 'topbar-right' }, starBadge().badge, settingsButtons())
      ),
      el(
        'main',
        { class: 'hub' },
        el('p', { class: 'hub-intro' }, 'Pick a game and start learning!'),
        el('div', { class: 'chips', role: 'group', 'aria-label': 'Filter games by age' }, chips),
        el('div', { class: 'game-grid' }, visible.map(gameCard)),
        el(
          'footer',
          { class: 'hub-footer' },
          'Tip for grown-ups: every game reads its instructions aloud, so non-readers can play on their own. ',
          'Turn on your device sound!'
        )
      )
    );
  }

  function gameCard(game) {
    const best = store.bestFor(game.id);
    return el(
      'a',
      { class: 'game-card', href: '#/play/' + game.id, style: { '--tint': game.color } },
      el('div', { class: 'card-art', 'aria-hidden': 'true' }, game.emoji),
      el(
        'div',
        { class: 'card-body' },
        el('div', { class: 'card-top' }, el('h2', null, game.title), el('span', { class: 'age-badge' }, `Ages ${game.ages[0]}–${game.ages[1]}`)),
        el('p', null, game.description),
        el('div', { class: 'skills' }, game.skills.map((s) => el('span', { class: 'skill' }, s))),
        best ? el('div', { class: 'card-best' }, `Best: ${best} ⭐`) : null
      )
    );
  }

  /* ------------------------------------------------------------------ */
  /* Game screen                                                         */
  /* ------------------------------------------------------------------ */

  function renderGame(game) {
    document.title = `${game.title} · Little Learners Arcade`;
    const { badge, count } = starBadge();
    const progress = el('div', { class: 'progress', 'aria-hidden': 'true' });
    const stage = el('main', { class: 'stage' });
    let promptText = '';

    const replay = el(
      'button',
      { class: 'icon-btn', 'aria-label': 'Hear it again', title: 'Hear it again', onclick: () => promptText && EG.speak(promptText) },
      '🔊'
    );
    if (!EG.speechSupported) replay.hidden = true;

    app.replaceChildren(
      el(
        'div',
        { class: 'game-screen', style: { '--accent': game.color } },
        el(
          'header',
          { class: 'game-bar' },
          el('a', { class: 'icon-btn', href: '#/', 'aria-label': 'Back to all games', title: 'All games' }, '🏠'),
          el('h1', { class: 'game-title' }, el('span', { 'aria-hidden': 'true' }, game.emoji), el('span', { class: 'label' }, game.title)),
          progress,
          replay,
          badge
        ),
        stage
      )
    );

    // Per-run state. A "run" is one play-through; restarting begins a new run.
    let run = 0;
    let alive = true;
    let earned = 0;
    let timers = new Set();
    let cleanups = [];
    const memory = {}; // survives restarts within this visit (e.g. chosen level)

    function endRun() {
      run++;
      timers.forEach(clearTimeout);
      timers = new Set();
      cleanups.forEach((fn) => {
        try {
          fn();
        } catch (e) {
          console.error(e);
        }
      });
      cleanups = [];
      EG.stopSpeech();
    }

    const api = {
      game,
      stage,
      memory,
      util: EG.util,
      sfx: EG.sfx,
      confetti: EG.confetti,

      /** Speak a line (ignored once the player has left). */
      speak(text) {
        return alive ? EG.speak(text) : Promise.resolve();
      },
      /** Speak the main instruction; the 🔊 button repeats it. */
      prompt(text) {
        promptText = text;
        return api.speak(text);
      },
      /** setTimeout that is cancelled on exit/restart. */
      after(ms, fn) {
        const myRun = run;
        const id = setTimeout(() => {
          timers.delete(id);
          if (alive && myRun === run) fn();
        }, ms);
        timers.add(id);
        return id;
      },
      wait(ms) {
        return new Promise((resolve) => api.after(ms, resolve));
      },
      /** Register cleanup (e.g. removing a keydown listener). */
      onCleanup(fn) {
        cleanups.push(fn);
      },
      setProgress(done, total) {
        progress.replaceChildren(
          ...Array.from({ length: total }, (_, i) =>
            el('span', { class: 'pip' + (i < done ? ' done' : '') + (i === done ? ' current' : '') })
          )
        );
      },
      addStar() {
        earned++;
        store.addStars(1);
        count.textContent = store.state.stars;
        replayClass(badge, 'pop');
      },
      /**
       * Show the end-of-game card.
       * @param {object} opts
       * @param {number} opts.total     max stars for the run
       * @param {string} [opts.bestKey] storage key for best score (defaults to game id)
       * @param {string} [opts.detail]  extra line, e.g. time taken
       * @param {{label: string, onClick: Function}[]} [opts.actions] extra buttons
       */
      finish({ total, bestKey, detail, actions = [] } = {}) {
        api.setProgress(total, total);
        const isBest = store.recordBest(bestKey || game.id, earned);
        const ratio = total ? earned / total : 1;
        const headline =
          ratio >= 0.9 ? 'Amazing job!' : ratio >= 0.6 ? 'Great work!' : ratio >= 0.3 ? 'Nice playing!' : 'You did it!';
        EG.sfx.win();
        EG.confetti(90);
        api.speak(`${headline} You earned ${earned} ${earned === 1 ? 'star' : 'stars'}!`);

        stage.append(
          el(
            'div',
            { class: 'overlay' },
            el(
              'div',
              { class: 'end-card', role: 'dialog', 'aria-label': 'Game complete' },
              el('div', { class: 'end-emoji', 'aria-hidden': 'true' }, ratio >= 0.6 ? '🏆' : '🌟'),
              el('h2', null, headline),
              el('p', { class: 'end-stars' }, `You earned ${earned} ⭐ out of ${total}`),
              detail ? el('p', { class: 'end-detail' }, detail) : null,
              isBest && earned > 0 ? el('p', { class: 'end-best' }, '🎉 New best score!') : null,
              el(
                'div',
                { class: 'end-actions' },
                el('button', { class: 'btn primary', onclick: start }, '🔁 Play again'),
                actions.map((a) => el('button', { class: 'btn', onclick: a.onClick }, a.label)),
                el('a', { class: 'btn', href: '#/' }, '🎮 More games')
              )
            )
          )
        );
      },
      restart: () => start(),
    };

    function start() {
      endRun();
      earned = 0;
      promptText = '';
      progress.replaceChildren();
      stage.replaceChildren();
      try {
        game.mount(api);
      } catch (e) {
        console.error(e);
        stage.replaceChildren(el('p', { class: 'error' }, 'Oops! This game hit a snag. Please go back and try again.'));
      }
    }

    teardownCurrent = () => {
      alive = false;
      endRun();
    };

    start();
  }

  window.addEventListener('hashchange', route);
  route();
})();
