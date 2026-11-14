/*
 * Shape & Color Safari — ages 2–4
 *
 * The narrator asks for a shape, a color, then both ("Find the red star!").
 * The difficulty steps up through the round: shapes only, then colors only,
 * then shape + color, with tricky look-alike distractors. A wrong tap never
 * costs anything; it names what was tapped and shows a picture hint.
 */
(function () {
  'use strict';

  const { register, util: U } = window.EduGames;
  const { el } = U;

  const ROUNDS = 10;

  const COLORS = [
    { name: 'red', hex: '#ef4444' },
    { name: 'blue', hex: '#3b82f6' },
    { name: 'yellow', hex: '#facc15' },
    { name: 'green', hex: '#22c55e' },
    { name: 'purple', hex: '#a855f7' },
    { name: 'orange', hex: '#f97316' },
  ];

  const SHAPES = {
    circle: '<circle cx="50" cy="50" r="42"/>',
    square: '<rect x="10" y="10" width="80" height="80" rx="6"/>',
    triangle: '<polygon points="50,8 94,90 6,90"/>',
    star: '<polygon points="50,5 61,38 96,38 68,59 79,93 50,72 21,93 32,59 4,38 39,38"/>',
    heart: '<path d="M50 88 C20 66 6 50 6 32 C6 18 17 8 30 8 C40 8 46 14 50 22 C54 14 60 8 70 8 C83 8 94 18 94 32 C94 50 80 66 50 88Z"/>',
    diamond: '<polygon points="50,4 92,50 50,96 8,50"/>',
  };
  const SHAPE_NAMES = Object.keys(SHAPES);

  const PRAISE = ['Yes!', 'You found it!', 'Great job!', 'Wonderful!', 'Hooray!', 'Super!'];

  function shapeSvg(shape, fill, extraClass = '') {
    return el('span', {
      class: 'shape-svg ' + extraClass,
      html:
        `<svg viewBox="0 0 100 100" aria-hidden="true"><g fill="${fill}" stroke="rgba(0,0,0,.18)" ` +
        `stroke-width="3" stroke-linejoin="round">${SHAPES[shape]}</g></svg>`,
    });
  }

  const describe = (item) => `${item.color.name} ${item.shape}`;
  const same = (a, b) => a.shape === b.shape && a.color.name === b.color.name;
  const randomItem = () => ({ shape: U.pick(SHAPE_NAMES), color: U.pick(COLORS) });

  function makeRound(r) {
    const mode = r < 3 ? 'shape' : r < 6 ? 'color' : 'both';
    const count = r < 2 ? 3 : 4;
    let items;
    let target;
    let prompt;

    if (mode === 'shape') {
      items = U.sample(SHAPE_NAMES, count).map((shape) => ({ shape, color: U.pick(COLORS) }));
      target = items[0];
      prompt = `Find the ${target.shape}!`;
    } else if (mode === 'color') {
      items = U.sample(COLORS, count).map((color) => ({ shape: U.pick(SHAPE_NAMES), color }));
      target = items[0];
      prompt = `Find something ${target.color.name}!`;
    } else {
      // Include look-alikes: same shape/other color and same color/other shape.
      target = randomItem();
      items = [
        target,
        { shape: target.shape, color: U.pick(COLORS.filter((c) => c !== target.color)) },
        { shape: U.pick(SHAPE_NAMES.filter((s) => s !== target.shape)), color: target.color },
      ];
      while (items.length < count) {
        const candidate = randomItem();
        if (!items.some((i) => same(i, candidate))) items.push(candidate);
      }
      prompt = `Find the ${describe(target)}!`;
    }
    return { mode, target, prompt, items: U.shuffle(items) };
  }

  function mount(api) {
    let round = 0;
    const banner = el('div', { class: 'prompt-banner' });
    const board = el('div', { class: 'shape-board' });
    api.stage.append(banner, board);

    function hintFor(R) {
      if (R.mode === 'shape') return shapeSvg(R.target.shape, '#cbd5e1', 'hint');
      if (R.mode === 'color') return el('span', { class: 'color-dot hint', style: { background: R.target.color.hex } });
      return shapeSvg(R.target.shape, R.target.color.hex, 'hint');
    }

    function next() {
      if (round >= ROUNDS) {
        api.finish({ total: ROUNDS });
        return;
      }
      api.setProgress(round, ROUNDS);
      const R = makeRound(round);
      let misses = 0;
      let solved = false;

      banner.replaceChildren(el('span', { class: 'prompt-text' }, R.prompt));
      board.className = 'shape-board count-' + R.items.length;
      board.replaceChildren(
        ...R.items.map((item, i) => {
          const btn = el(
            'button',
            { class: 'shape-btn pop-in', style: { animationDelay: i * 70 + 'ms' }, 'aria-label': describe(item) },
            shapeSvg(item.shape, item.color.hex)
          );
          btn.addEventListener('click', () => {
            if (solved) return;
            if (same(item, R.target)) {
              solved = true;
              btn.classList.add('correct');
              board.classList.add('solved');
              api.sfx.correct();
              api.confetti();
              if (misses === 0) api.addStar();
              api.speak(`${U.pick(PRAISE)} That's the ${describe(item)}.`);
              round++;
              api.after(1800, next);
            } else {
              misses++;
              U.replayClass(btn, 'shake');
              api.sfx.wrong();
              api.speak(`That's ${U.article(item.color.name)} ${describe(item)}. ${R.prompt}`);
              if (misses === 1) banner.append(hintFor(R));
            }
          });
          return btn;
        })
      );
      api.prompt(R.prompt);
    }

    next();
  }

  register({
    id: 'shapes',
    title: 'Shape & Color Safari',
    emoji: '🔷',
    color: '#3b82f6',
    ages: [2, 4],
    description: 'Listen and tap! Find circles, stars, hearts and every color of the rainbow.',
    skills: ['Shapes', 'Colors', 'Listening'],
    mount,
  });
})();
