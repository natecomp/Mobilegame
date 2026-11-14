/*
 * Counting Critters — ages 3–6
 *
 * Critters are scattered on the field. The child taps each one to count it
 * (the narrator counts along: "one, two, three...") and then picks the total.
 * Numbers grow from 1–3 up to 10 over the round. A wrong pick resets the
 * count so the child can count again; there's no penalty.
 */
(function () {
  'use strict';

  const { register, util: U } = window.EduGames;
  const { el } = U;

  const ROUNDS = 10;
  const GRID_CELLS = 12; // 4 x 3 field

  const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

  const CRITTERS = [
    { e: '🐞', one: 'ladybug', many: 'ladybugs' },
    { e: '🐠', one: 'fish', many: 'fish' },
    { e: '🐥', one: 'chick', many: 'chicks' },
    { e: '🦋', one: 'butterfly', many: 'butterflies' },
    { e: '🍎', one: 'apple', many: 'apples' },
    { e: '🐸', one: 'frog', many: 'frogs' },
    { e: '🚗', one: 'car', many: 'cars' },
    { e: '⭐', one: 'star', many: 'stars' },
    { e: '🐢', one: 'turtle', many: 'turtles' },
    { e: '🍓', one: 'strawberry', many: 'strawberries' },
    { e: '🎈', one: 'balloon', many: 'balloons' },
    { e: '🐝', one: 'bee', many: 'bees' },
    { e: '🦆', one: 'duck', many: 'ducks' },
    { e: '🍪', one: 'cookie', many: 'cookies' },
  ];

  /** Three nearby answer choices that include the right one, in order. */
  function choicesFor(n) {
    const set = new Set([n]);
    const nearby = U.shuffle([n - 2, n - 1, n + 1, n + 2].filter((v) => v >= 1 && v <= 10));
    for (const v of nearby) {
      if (set.size >= 3) break;
      set.add(v);
    }
    return [...set].sort((a, b) => a - b);
  }

  function mount(api) {
    let round = 0;
    const deck = U.shuffle(CRITTERS);

    const banner = el('div', { class: 'prompt-banner' });
    const field = el('div', { class: 'count-field' });
    const counter = el('div', { class: 'count-tally', 'aria-live': 'polite' });
    const choices = el('div', { class: 'number-row' });
    api.stage.append(banner, field, counter, choices);

    function next() {
      if (round >= ROUNDS) {
        api.finish({ total: ROUNDS });
        return;
      }
      api.setProgress(round, ROUNDS);

      const maxN = Math.min(10, 3 + round);
      const n = U.randInt(Math.max(1, maxN - 4), maxN);
      const critter = deck[round % deck.length];
      const cells = new Set(U.sample([...Array(GRID_CELLS).keys()], n));
      const prompt = `How many ${critter.many}? Tap each one to count!`;

      let counted = 0;
      let misses = 0;
      let solved = false;
      const critterButtons = [];

      banner.replaceChildren(el('span', { class: 'prompt-text' }, `How many ${critter.many}?`));
      counter.textContent = '';

      const resetCount = () => {
        counted = 0;
        counter.textContent = '';
        critterButtons.forEach((b) => {
          b.classList.remove('counted');
          b.querySelector('.count-num')?.remove();
        });
      };

      field.replaceChildren(
        ...[...Array(GRID_CELLS).keys()].map((i) => {
          if (!cells.has(i)) return el('span', { class: 'count-cell' });
          const btn = el(
            'button',
            {
              class: 'critter pop-in',
              'aria-label': critter.one,
              style: {
                animationDelay: critterButtons.length * 60 + 'ms',
                '--tilt': U.randInt(-14, 14) + 'deg',
                '--nudge-x': U.randInt(-12, 12) + '%',
                '--nudge-y': U.randInt(-12, 12) + '%',
              },
            },
            el('span', { class: 'critter-emoji', 'aria-hidden': 'true' }, critter.e)
          );
          btn.addEventListener('click', () => {
            if (solved || btn.classList.contains('counted')) return;
            counted++;
            btn.classList.add('counted');
            btn.append(el('span', { class: 'count-num' }, counted));
            api.sfx.tap(440 + counted * 50);
            api.speak(NUMBER_WORDS[counted]);
            counter.textContent = `${counted} counted`;
            if (counted === n) {
              counter.textContent = `All counted! Now tap the number.`;
              choices.classList.add('ready');
            }
          });
          critterButtons.push(btn);
          return el('span', { class: 'count-cell' }, btn);
        })
      );

      choices.classList.remove('ready');
      choices.replaceChildren(
        ...choicesFor(n).map((value) => {
          const btn = el('button', { class: 'number-btn', 'aria-label': String(value) }, value);
          btn.addEventListener('click', () => {
            if (solved) return;
            if (value === n) {
              solved = true;
              btn.classList.add('correct');
              api.sfx.correct();
              api.confetti();
              if (misses === 0) api.addStar();
              api.speak(`Yes! ${NUMBER_WORDS[n]} ${n === 1 ? critter.one : critter.many}!`);
              round++;
              api.after(1900, next);
            } else {
              misses++;
              U.replayClass(btn, 'shake');
              api.sfx.wrong();
              api.speak(`Hmm, not ${NUMBER_WORDS[value]}. Let's count again! Tap each one.`);
              resetCount();
              choices.classList.remove('ready');
            }
          });
          return btn;
        })
      );

      api.prompt(prompt);
    }

    next();
  }

  register({
    id: 'counting',
    title: 'Counting Critters',
    emoji: '🐞',
    color: '#22c55e',
    ages: [3, 6],
    description: 'Tap the bugs, fish and frogs to count them, then pick how many you found.',
    skills: ['Counting 1–10', 'Number recognition'],
    mount,
  });
})();
