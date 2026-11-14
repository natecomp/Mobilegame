/*
 * Spelling Bee Garden — ages 5–9
 *
 * The child sees a picture, hears the word, and taps letter tiles in order to
 * spell it. Three levels:
 *   Sprout  — 3-letter words, faint letters shown in the slots to copy
 *   Bloom   — 4–5 letter words, one decoy tile
 *   Sunflower — 6+ letter words, two decoy tiles
 * The 💡 hint highlights the next tile (that word earns no star).
 */
(function () {
  'use strict';

  const EG = window.EduGames;
  const { register, util: U } = EG;
  const { el } = U;

  const ROUNDS = 8;
  const ALPHABET = 'abcdefghijklmnopqrstuvwxyz';

  const WORDS = {
    sprout: [
      ['cat', '🐱'], ['dog', '🐶'], ['sun', '☀️'], ['bus', '🚌'], ['pig', '🐷'], ['hat', '🎩'],
      ['bee', '🐝'], ['cow', '🐮'], ['fox', '🦊'], ['egg', '🥚'], ['bed', '🛏️'], ['box', '📦'],
      ['owl', '🦉'], ['ant', '🐜'], ['key', '🔑'], ['cup', '🥤'], ['map', '🗺️'], ['bat', '🦇'],
    ],
    bloom: [
      ['fish', '🐟'], ['frog', '🐸'], ['star', '⭐'], ['cake', '🎂'], ['duck', '🦆'], ['bear', '🐻'],
      ['moon', '🌙'], ['boat', '⛵'], ['tree', '🌳'], ['lion', '🦁'], ['kite', '🪁'], ['milk', '🥛'],
      ['bird', '🐦'], ['corn', '🌽'], ['drum', '🥁'], ['sock', '🧦'], ['apple', '🍎'], ['tiger', '🐯'],
      ['horse', '🐴'], ['snake', '🐍'], ['train', '🚂'], ['pizza', '🍕'], ['house', '🏠'], ['robot', '🤖'],
      ['whale', '🐳'], ['zebra', '🦓'], ['mouse', '🐭'], ['cloud', '☁️'], ['bread', '🍞'], ['sheep', '🐑'],
    ],
    sunflower: [
      ['rabbit', '🐰'], ['turtle', '🐢'], ['banana', '🍌'], ['monkey', '🐵'], ['rocket', '🚀'],
      ['flower', '🌸'], ['carrot', '🥕'], ['pencil', '✏️'], ['penguin', '🐧'], ['octopus', '🐙'],
      ['dolphin', '🐬'], ['rainbow', '🌈'], ['giraffe', '🦒'], ['elephant', '🐘'], ['umbrella', '☂️'],
      ['butterfly', '🦋'], ['dinosaur', '🦕'], ['sandwich', '🥪'], ['pumpkin', '🎃'], ['snowman', '⛄'],
    ],
  };

  const LEVELS = [
    { id: 'sprout', label: 'Sprout', emoji: '🌱', sub: '3-letter words', decoys: 0, ghost: true },
    { id: 'bloom', label: 'Bloom', emoji: '🌷', sub: '4–5 letter words', decoys: 1, ghost: false },
    { id: 'sunflower', label: 'Sunflower', emoji: '🌻', sub: 'Big words!', decoys: 2, ghost: false },
  ];

  function play(api, level) {
    const words = U.sample(WORDS[level.id], ROUNDS);
    let round = 0;

    const picture = el('button', { class: 'spell-picture', 'aria-label': 'Hear the word' });
    const slotsRow = el('div', { class: 'slots' });
    const tilesRow = el('div', { class: 'tiles' });
    const hintBtn = el('button', { class: 'btn small hint-btn' }, '💡 Hint');
    api.stage.append(picture, slotsRow, tilesRow, el('div', { class: 'spell-tools' }, hintBtn));

    function next() {
      if (round >= ROUNDS) {
        api.finish({ total: ROUNDS, bestKey: 'spelling:' + level.id, actions: [EG.changeLevelAction(api)] });
        return;
      }
      api.setProgress(round, ROUNDS);

      const [word, emoji] = words[round];
      const decoys = U.sample([...ALPHABET].filter((c) => !word.includes(c)), level.decoys);
      const letters = U.shuffle([...word, ...decoys]);
      let filled = 0;
      let perfect = true;
      let done = false;

      const say = () => api.prompt(`Spell ${word}.`);
      picture.replaceChildren(el('span', { 'aria-hidden': 'true' }, emoji), el('span', { class: 'spell-speaker' }, '🔊'));
      picture.onclick = say;
      U.replayClass(picture, 'pop-in');

      const slots = [...word].map((ch) => el('span', { class: 'slot' + (level.ghost ? ' ghost' : ''), 'data-ghost': ch }));
      slotsRow.replaceChildren(...slots);

      const tiles = letters.map((ch, i) => {
        const tile = el('button', { class: 'tile pop-in', style: { animationDelay: i * 50 + 'ms' }, 'aria-label': ch }, ch);
        tile.addEventListener('click', () => {
          if (done || tile.disabled) return;
          if (ch === word[filled]) {
            tile.disabled = true;
            tile.classList.add('used');
            tile.classList.remove('hinted');
            slots[filled].textContent = ch;
            slots[filled].classList.add('filled');
            filled++;
            api.sfx.tap(500 + filled * 40);
            if (filled === word.length) {
              done = true;
              slotsRow.classList.add('complete');
              api.sfx.correct();
              api.confetti();
              if (perfect) api.addStar();
              api.speak(`${word.toUpperCase().split('').join(', ')}. ${word}! ${U.pick(['Great spelling!', 'You got it!', 'Super speller!'])}`);
              round++;
              api.after(2400, () => {
                slotsRow.classList.remove('complete');
                next();
              });
            } else {
              api.speak(ch.toUpperCase());
            }
          } else {
            perfect = false;
            U.replayClass(tile, 'shake');
            api.sfx.wrong();
          }
        });
        return tile;
      });
      tilesRow.replaceChildren(...tiles);

      hintBtn.onclick = () => {
        if (done) return;
        perfect = false;
        const need = word[filled];
        const tile = tiles.find((t) => !t.disabled && t.textContent === need);
        if (tile) U.replayClass(tile, 'hinted');
        api.speak(`Next letter: ${need.toUpperCase()}`);
      };

      say();
    }

    next();
  }

  function mount(api) {
    EG.chooseLevel(api, 'Pick your spelling level', LEVELS, (level) => play(api, level));
  }

  register({
    id: 'spelling',
    title: 'Spelling Bee Garden',
    emoji: '🐝',
    color: '#eab308',
    ages: [5, 9],
    description: 'Hear a word, see a picture, and tap the letters in order to spell it.',
    skills: ['Spelling', 'Phonics', 'Reading'],
    mount,
  });
})();
