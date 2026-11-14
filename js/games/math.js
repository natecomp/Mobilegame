/*
 * Math Rocket — ages 6–10
 *
 * Ten questions per mission, answered on an on-screen keypad (or the
 * keyboard). Six levels, from adding within 10 (with dot pictures) to a mixed
 * challenge with three-digit numbers and missing-number puzzles. Two tries per
 * question; after the second miss the answer is shown and explained.
 */
(function () {
  'use strict';

  const EG = window.EduGames;
  const { register, util: U } = EG;
  const { el, randInt } = U;

  const ROUNDS = 10;

  const add = (a, b) => ({ text: `${a} + ${b}`, answer: a + b, parts: [a, b] });
  const sub = (a, b) => ({ text: `${a} − ${b}`, answer: a - b });
  const mul = (a, b) => ({ text: `${a} × ${b}`, answer: a * b });
  const div = (a, b) => ({ text: `${a} ÷ ${b}`, answer: a / b });

  const LEVELS = [
    {
      id: 'add10', label: 'Add to 10', emoji: '🍎', sub: 'Ages 5–6 · with pictures', dots: true,
      gen() {
        const a = randInt(0, 9);
        return add(a, randInt(a === 0 ? 1 : 0, 10 - a));
      },
    },
    {
      id: 'addsub20', label: 'Add & subtract to 20', emoji: '🚲', sub: 'Ages 6–7',
      gen() {
        if (Math.random() < 0.5) {
          const a = randInt(2, 12);
          return add(a, randInt(1, 20 - a));
        }
        const a = randInt(5, 20);
        return sub(a, randInt(1, a));
      },
    },
    {
      id: 'twodigit', label: 'Two-digit + and −', emoji: '🚗', sub: 'Ages 7–8',
      gen() {
        if (Math.random() < 0.5) {
          const a = randInt(10, 89);
          return add(a, randInt(10, 99 - a));
        }
        const a = randInt(20, 99);
        return sub(a, randInt(10, a - 1));
      },
    },
    {
      id: 'times', label: 'Times tables', emoji: '✈️', sub: 'Ages 8–9 · 2× to 10×',
      gen() {
        return mul(randInt(2, 10), randInt(1, 10));
      },
    },
    {
      id: 'divide', label: 'Division', emoji: '🚁', sub: 'Ages 9–10',
      gen() {
        const b = randInt(2, 10);
        return div(b * randInt(1, 10), b);
      },
    },
    {
      id: 'mixed', label: 'Mixed challenge', emoji: '🚀', sub: 'Ages 9–10 · big numbers',
      gen() {
        switch (randInt(0, 4)) {
          case 0: {
            const a = randInt(100, 899);
            return add(a, randInt(10, 999 - a));
          }
          case 1: {
            const a = randInt(200, 999);
            return sub(a, randInt(50, a - 1));
          }
          case 2:
            return mul(randInt(3, 12), randInt(3, 12));
          case 3: {
            const b = randInt(3, 12);
            return div(b * randInt(2, 12), b);
          }
          default: {
            // Missing number: ? + b = c
            const x = randInt(5, 60);
            const b = randInt(5, 40);
            return { text: `? + ${b} = ${x + b}`, answer: x, missing: true };
          }
        }
      },
    },
  ];

  const spoken = (q) =>
    (q.missing ? 'What number plus ' + q.text.split('+ ')[1].replace('=', 'equals') + '?' : 'What is ' + q.text + '?')
      .replace('−', 'minus')
      .replace('×', 'times')
      .replace('÷', 'divided by');

  function formatTime(ms) {
    const s = Math.round(ms / 1000);
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
  }

  function play(api, level) {
    let round = 0;
    const startedAt = Date.now();

    const visual = el('div', { class: 'math-visual', 'aria-hidden': 'true' });
    const question = el('div', { class: 'math-question', 'aria-live': 'polite' });
    const feedback = el('div', { class: 'math-feedback', 'aria-live': 'polite' });
    const keypad = el('div', { class: 'keypad' });
    api.stage.append(visual, question, feedback, keypad);

    let current = null; // { q, input, tries, locked, display }

    function press(key) {
      if (!current || current.locked) return;
      if (key === 'del') current.input = current.input.slice(0, -1);
      else if (key === 'ok') return check();
      else if (current.input.length < 4) current.input = (current.input === '0' ? '' : current.input) + key;
      api.sfx.tap(600);
      paintInput();
    }

    function paintInput() {
      current.display.textContent = current.input || ' ';
      current.display.classList.toggle('empty', !current.input);
    }

    function check() {
      if (!current.input) return;
      const { q } = current;
      if (Number(current.input) === q.answer) {
        current.locked = true;
        current.display.classList.add('right');
        api.sfx.correct();
        api.confetti(24);
        if (current.tries === 0) api.addStar();
        const msg = U.pick(['Correct!', 'Blast off!', 'Nailed it!', 'You got it!']);
        feedback.textContent = '✅ ' + msg;
        api.speak(msg);
        round++;
        api.after(1300, next);
        return;
      }
      current.tries++;
      api.sfx.wrong();
      U.replayClass(current.display, 'shake');
      if (current.tries === 1) {
        feedback.textContent = '🤔 Not quite — try again!';
        api.speak('Not quite. Try again!');
        current.input = '';
        api.after(500, paintInput);
      } else {
        current.locked = true;
        current.input = String(q.answer);
        paintInput();
        current.display.classList.add('reveal');
        const explain = q.missing
          ? `${q.answer} + ${q.text.split('+ ')[1]}`
          : `${q.text} = ${q.answer}`;
        feedback.textContent = `💡 ${explain}`;
        api.speak(`The answer is ${q.answer}.`);
        round++;
        api.after(2600, next);
      }
    }

    function next() {
      if (round >= ROUNDS) {
        api.finish({
          total: ROUNDS,
          bestKey: 'math:' + level.id,
          detail: `⏱️ Mission time: ${formatTime(Date.now() - startedAt)}`,
          actions: [EG.changeLevelAction(api)],
        });
        current = null;
        return;
      }
      api.setProgress(round, ROUNDS);
      const q = level.gen();
      const display = el('span', { class: 'math-answer empty' }, ' ');
      current = { q, input: '', tries: 0, locked: false, display };

      question.replaceChildren(
        q.missing
          ? el('span', null, el('span', { class: 'math-blank' }, display), ' ' + q.text.slice(2))
          : el('span', null, q.text + ' = ', display)
      );
      U.replayClass(question, 'pop-in');
      feedback.textContent = '';

      visual.replaceChildren();
      if (level.dots && q.parts) {
        const [a, b] = q.parts;
        visual.append(
          el('span', { class: 'dots' }, Array.from({ length: a }, () => el('i', { class: 'dot a' }))),
          el('span', { class: 'dots-plus' }, '+'),
          el('span', { class: 'dots' }, Array.from({ length: b }, () => el('i', { class: 'dot b' })))
        );
      }
      api.prompt(spoken(q));
    }

    const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'];
    keypad.append(
      ...keys.map((k) =>
        el(
          'button',
          {
            class: 'key' + (k === 'ok' ? ' key-ok' : k === 'del' ? ' key-del' : ''),
            'aria-label': k === 'ok' ? 'Check answer' : k === 'del' ? 'Delete' : k,
            onclick: () => press(k),
          },
          k === 'ok' ? '✓' : k === 'del' ? '⌫' : k
        )
      )
    );

    const onKey = (e) => {
      if (/^[0-9]$/.test(e.key)) press(e.key);
      else if (e.key === 'Backspace') press('del');
      else if (e.key === 'Enter') press('ok');
      else return;
      e.preventDefault();
    };
    document.addEventListener('keydown', onKey);
    api.onCleanup(() => document.removeEventListener('keydown', onKey));

    next();
  }

  function mount(api) {
    EG.chooseLevel(api, 'Choose your mission', LEVELS, (level) => play(api, level));
  }

  register({
    id: 'math',
    title: 'Math Rocket',
    emoji: '🚀',
    color: '#a855f7',
    ages: [6, 10],
    description: 'Blast through addition, subtraction, times tables and division missions.',
    skills: ['Addition', 'Subtraction', 'Multiplication', 'Division'],
    mount,
  });
})();
