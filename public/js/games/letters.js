/*
 * ABC Adventure — ages 4–6
 *
 * A big letter appears and the narrator asks which picture starts with it.
 * Early rounds show uppercase letters with labelled pictures, so the child
 * can match letter shapes. Later rounds show lowercase letters and hide the
 * labels, so the child has to listen for the starting sound.
 */
(function () {
  'use strict';

  const { register, util: U } = window.EduGames;
  const { el } = U;

  const ROUNDS = 10;
  const LABELS_UNTIL = 5; // rounds 0..4 show word labels

  // Letter -> words that start with it. X is left out: few kid-friendly words start with it.
  const WORDS = {
    A: [['apple', '🍎'], ['ant', '🐜'], ['airplane', '✈️']],
    B: [['banana', '🍌'], ['bee', '🐝'], ['bus', '🚌']],
    C: [['cat', '🐱'], ['car', '🚗'], ['cake', '🎂']],
    D: [['dog', '🐶'], ['duck', '🦆'], ['drum', '🥁']],
    E: [['egg', '🥚'], ['elephant', '🐘']],
    F: [['fish', '🐟'], ['frog', '🐸'], ['flower', '🌸']],
    G: [['grapes', '🍇'], ['goat', '🐐'], ['gift', '🎁']],
    H: [['hat', '🎩'], ['horse', '🐴'], ['house', '🏠']],
    I: [['ice cream', '🍦'], ['island', '🏝️']],
    J: [['juice', '🧃'], ['jeans', '👖']],
    K: [['kite', '🪁'], ['key', '🔑'], ['kangaroo', '🦘']],
    L: [['lion', '🦁'], ['leaf', '🍃'], ['lemon', '🍋']],
    M: [['moon', '🌙'], ['monkey', '🐵'], ['milk', '🥛']],
    N: [['nose', '👃'], ['nut', '🥜']],
    O: [['octopus', '🐙'], ['owl', '🦉']],
    P: [['pig', '🐷'], ['pizza', '🍕'], ['penguin', '🐧']],
    Q: [['queen', '👸']],
    R: [['rainbow', '🌈'], ['rabbit', '🐰'], ['robot', '🤖']],
    S: [['sun', '☀️'], ['snake', '🐍'], ['sock', '🧦']],
    T: [['tree', '🌳'], ['tiger', '🐯'], ['train', '🚂']],
    U: [['umbrella', '☂️'], ['unicorn', '🦄']],
    V: [['violin', '🎻'], ['volcano', '🌋'], ['van', '🚐']],
    W: [['watermelon', '🍉'], ['whale', '🐳'], ['worm', '🪱']],
    Y: [['yo-yo', '🪀'], ['yarn', '🧶']],
    Z: [['zebra', '🦓']],
  };
  const LETTERS = Object.keys(WORDS);

  const toItem = (letter) => {
    const [word, emoji] = U.pick(WORDS[letter]);
    return { letter, word, emoji };
  };

  /** Word label with its first letter highlighted. */
  const wordLabel = (word) => el('span', { class: 'word-label' }, el('b', null, word[0]), word.slice(1));

  function mount(api) {
    let round = 0;
    const targets = U.sample(LETTERS, ROUNDS);

    const letterCard = el('div', { class: 'letter-card' });
    const banner = el('div', { class: 'prompt-banner' });
    const board = el('div', { class: 'picture-board' });
    api.stage.append(letterCard, banner, board);

    function next() {
      if (round >= ROUNDS) {
        api.finish({ total: ROUNDS });
        return;
      }
      api.setProgress(round, ROUNDS);

      const letter = targets[round];
      const showLabels = round < LABELS_UNTIL;
      const count = round < 3 ? 3 : 4;
      const target = toItem(letter);
      const others = U.sample(LETTERS.filter((l) => l !== letter), count - 1).map(toItem);
      const items = U.shuffle([target, ...others]);
      const prompt = `The letter ${letter}. Which one starts with ${letter}?`;

      let misses = 0;
      let solved = false;

      letterCard.replaceChildren(
        showLabels
          ? el('span', { class: 'letter-big' }, letter, el('small', null, letter.toLowerCase()))
          : el('span', { class: 'letter-big' }, letter.toLowerCase(), el('small', null, letter))
      );
      U.replayClass(letterCard, 'pop-in');
      banner.replaceChildren(el('span', { class: 'prompt-text' }, `Which one starts with ${letter}?`));

      board.className = 'picture-board count-' + count;
      board.replaceChildren(
        ...items.map((item, i) => {
          const label = wordLabel(item.word);
          if (!showLabels) label.classList.add('hidden-label');
          const btn = el(
            'button',
            { class: 'picture-btn pop-in', style: { animationDelay: i * 70 + 'ms' }, 'aria-label': item.word },
            el('span', { class: 'picture-emoji', 'aria-hidden': 'true' }, item.emoji),
            label
          );
          btn.addEventListener('click', () => {
            if (solved) return;
            label.classList.remove('hidden-label');
            if (item.letter === letter) {
              solved = true;
              btn.classList.add('correct');
              api.sfx.correct();
              api.confetti();
              if (misses === 0) api.addStar();
              api.speak(`Yes! ${letter} is for ${item.word}!`);
              round++;
              api.after(1900, next);
            } else {
              misses++;
              U.replayClass(btn, 'shake');
              btn.classList.add('dimmed');
              api.sfx.wrong();
              api.speak(`That's ${U.article(item.word)} ${item.word}. ${item.word} starts with ${item.letter}. Try again!`);
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
    id: 'letters',
    title: 'ABC Adventure',
    emoji: '🔤',
    color: '#f97316',
    ages: [4, 6],
    description: 'Meet a letter, then find the picture that starts with its sound. Apple, bee, cat!',
    skills: ['Letters', 'Phonics', 'Vocabulary'],
    mount,
  });
})();
