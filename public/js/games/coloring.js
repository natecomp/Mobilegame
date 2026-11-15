/*
 * Color Studio — ages 2–10
 *
 * Pick a picture, pick a color, and tap to fill (great for little hands),
 * or switch to the crayon to draw freehand (great for older kids). Picking a
 * color says its name aloud. Undo works for everything, including clearing
 * the page. Each picture's progress is saved, and finished pictures can be
 * saved as an image (share sheet on phones/tablets, download on computers).
 *
 * Pages live in coloring-pages.js.
 */
(function () {
  'use strict';

  const EG = window.EduGames;
  const { register, util: U, store } = EG;
  const { el } = U;

  const NS = 'http://www.w3.org/2000/svg';
  const INK = '#2d2a4a';
  const BLANK = '#ffffff';
  const STORAGE_PREFIX = 'little-learners:coloring:';
  const FILLABLE = 'circle,ellipse,rect,polygon,path,text'; // <text> = bubble letters

  // The crayon box, in rainbow order, then skin tones and neutrals.
  const PALETTE = [
    { name: 'red', hex: '#ef4444' },
    { name: 'orange', hex: '#f97316' },
    { name: 'yellow', hex: '#facc15' },
    { name: 'light yellow', hex: '#fef08a' },
    { name: 'light green', hex: '#a3e635' },
    { name: 'green', hex: '#16a34a' },
    { name: 'dark green', hex: '#166534' },
    { name: 'mint', hex: '#86efac' },
    { name: 'teal', hex: '#14b8a6' },
    { name: 'sky blue', hex: '#7dd3fc' },
    { name: 'blue', hex: '#2563eb' },
    { name: 'dark blue', hex: '#1e3a8a' },
    { name: 'lavender', hex: '#c4b5fd' },
    { name: 'purple', hex: '#9333ea' },
    { name: 'pink', hex: '#f472b6' },
    { name: 'light pink', hex: '#fbcfe8' },
    { name: 'peach', hex: '#fed7aa' },
    { name: 'tan', hex: '#d6b48a' },
    { name: 'light brown', hex: '#b0784a' },
    { name: 'brown', hex: '#92400e' },
    { name: 'dark brown', hex: '#4a2c17' },
    { name: 'gray', hex: '#9ca3af' },
    { name: 'black', hex: '#1f2937' },
    { name: 'white', hex: BLANK },
  ];
  const byHex = new Map(PALETTE.map((c) => [c.hex, c]));
  const RECENT_MAX = 3;
  const HOLD_TO_CLEAR_MS = 800;

  /** Dark or light text, whichever reads better on this color. */
  function inkOn(hex) {
    const n = parseInt(hex.slice(1), 16);
    const [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? INK : '#fff';
  }
  const titleCase = (s) => s.replace(/\b\w/g, (c) => c.toUpperCase());

  const SIZES = [
    { id: 'small', width: 6, dot: 10 },
    { id: 'medium', width: 14, dot: 18 },
    { id: 'big', width: 28, dot: 28 },
  ];

  const PRAISE = ['What a beautiful picture!', 'Wow, you are an artist!', 'I love your colors!', 'That looks amazing!'];

  /* ------------------------------------------------------------------ */
  /* Page rendering + saved state                                        */
  /* ------------------------------------------------------------------ */

  /**
   * Builds the layered SVG for a page:
   *   regions (fillable) → crayon strokes → outlines → details
   * so outlines always stay crisp on top of the color.
   */
  function buildPage(page) {
    const svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('viewBox', '0 0 400 400');
    svg.setAttribute('class', 'coloring-svg');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', page.title);
    const lineAttrs = `fill="none" stroke="${INK}" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"`;
    svg.innerHTML =
      `<g class="regions">${page.regions}</g>` +
      `<g class="strokes" fill="none" stroke-linecap="round" stroke-linejoin="round"></g>` +
      `<g class="outlines" ${lineAttrs}></g>` +
      `<g class="details" ${lineAttrs}>${page.lines || ''}</g>`;

    const regionsLayer = svg.querySelector('.regions');
    const outlinesLayer = svg.querySelector('.outlines');
    const regions = [...regionsLayer.querySelectorAll(FILLABLE)];

    // Outlines sit above the crayon layer, so each one is masked by every
    // shape drawn after it: only the edges you'd actually see get ink.
    const transformOf = (node) => {
      const list = [];
      for (let n = node.parentNode; n && n !== regionsLayer; n = n.parentNode) {
        const t = n.getAttribute('transform');
        if (t) list.unshift(t);
      }
      return list.join(' ');
    };
    const copy = (shape, fill) => {
      const c = shape.cloneNode(true); // deep: keeps the letters of <text>
      c.setAttribute('fill', fill);
      const t = transformOf(shape);
      if (!t) return c;
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('transform', t);
      g.append(c);
      return g;
    };
    const defs = document.createElementNS(NS, 'defs');
    regions.forEach((shape, i) => {
      if (i === 0) return; // the background's edge is the page edge: no outline
      const outline = copy(shape, 'none');
      const later = regions.slice(i + 1);
      if (later.length === 0) {
        outlinesLayer.append(outline); // topmost shape: nothing covers it
        return;
      }
      const id = `cs-${page.id}-mask-${i}`;
      const mask = document.createElementNS(NS, 'mask');
      mask.setAttribute('id', id);
      mask.setAttribute('maskUnits', 'userSpaceOnUse');
      for (const [k, v] of Object.entries({ x: -10, y: -10, width: 420, height: 420 })) mask.setAttribute(k, v);
      const paper = document.createElementNS(NS, 'rect');
      for (const [k, v] of Object.entries({ x: -10, y: -10, width: 420, height: 420, fill: '#fff' })) paper.setAttribute(k, v);
      mask.append(paper, ...later.map((s) => copy(s, '#000')));
      defs.append(mask);
      const g = document.createElementNS(NS, 'g');
      g.setAttribute('mask', `url(#${id})`);
      g.append(outline);
      outlinesLayer.append(g);
    });
    svg.prepend(defs);

    regions.forEach((r, i) => {
      r.setAttribute('fill', BLANK);
      r.classList.add('region');
      r.dataset.index = i;
    });
    return { svg, regions, strokesLayer: svg.querySelector('.strokes') };
  }

  function strokeElement({ c, w, d }) {
    const path = document.createElementNS(NS, 'path');
    path.setAttribute('stroke', c);
    path.setAttribute('stroke-width', w);
    path.setAttribute('d', d);
    return path;
  }

  function blankState(built) {
    return { fills: built.regions.map(() => BLANK), strokes: [] };
  }

  function loadState(page, built) {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_PREFIX + page.id));
      if (saved && Array.isArray(saved.fills) && saved.fills.length === built.regions.length && Array.isArray(saved.strokes)) {
        return saved;
      }
    } catch (e) {
      /* corrupt or unavailable storage: start fresh */
    }
    return blankState(built);
  }

  function saveState(page, state) {
    try {
      localStorage.setItem(STORAGE_PREFIX + page.id, JSON.stringify(state));
    } catch (e) {
      /* storage full or disabled: the picture just won't be remembered */
    }
  }

  function applyState(built, state) {
    built.regions.forEach((r, i) => r.setAttribute('fill', state.fills[i]));
    built.strokesLayer.replaceChildren(...state.strokes.map(strokeElement));
  }

  const isEmpty = (state) => state.strokes.length === 0 && state.fills.every((f) => f === BLANK);

  /* ------------------------------------------------------------------ */
  /* Export as PNG                                                       */
  /* ------------------------------------------------------------------ */

  /** The app font as a data: URL, so lettering looks right in saved pictures. */
  let fontDataUrl = null;
  async function getFontDataUrl() {
    if (fontDataUrl) return fontDataUrl;
    const blob = await (await fetch('fonts/fredoka-latin.woff2')).blob();
    fontDataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
    return fontDataUrl;
  }

  async function exportPicture(page, svg) {
    const SIZE = 1200;
    const clone = svg.cloneNode(true);
    clone.setAttribute('xmlns', NS);
    clone.setAttribute('width', SIZE);
    clone.setAttribute('height', SIZE);
    // A picture rendered as an image can't see the page's fonts: embed ours.
    if (clone.querySelector('text')) {
      try {
        const style = document.createElementNS(NS, 'style');
        style.textContent = `@font-face{font-family:'Fredoka';src:url(${await getFontDataUrl()}) format('woff2');font-weight:300 700;}`;
        clone.prepend(style);
      } catch (e) {
        /* fall back to a system font */
      }
    }
    const svgUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)], { type: 'image/svg+xml;charset=utf-8' }));
    try {
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = svgUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = SIZE;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = BLANK;
      ctx.fillRect(0, 0, SIZE, SIZE);
      ctx.drawImage(img, 0, 0, SIZE, SIZE);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
      const name = `little-learners-${page.id}.png`;
      const file = new File([blob], name, { type: 'image/png' });

      // Phones/tablets: the share sheet lets kids (and parents) save to Photos.
      const touch = window.matchMedia?.('(pointer: coarse)').matches;
      if (touch && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: page.title });
          return 'shared';
        } catch (e) {
          if (e.name === 'AbortError') return 'cancelled';
        }
      }
      const href = URL.createObjectURL(blob);
      const a = el('a', { href, download: name, hidden: true });
      document.body.append(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(href), 10000);
      return 'downloaded';
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  }

  /* ------------------------------------------------------------------ */
  /* Gallery sections — the current holiday goes first                   */
  /* ------------------------------------------------------------------ */

  function orderedCategories(date) {
    const cats = EG.coloringCategories || [{ id: 'everyday', title: 'Pictures', emoji: '🖍️' }];
    const month = date.getMonth(); // 0 = January
    const lead = month === 10 ? ['thanksgiving', 'christmas'] : month === 11 ? ['christmas'] : [];
    const rank = (c) => (lead.includes(c.id) ? lead.indexOf(c.id) : lead.length + cats.indexOf(c));
    return cats.slice().sort((a, b) => rank(a) - rank(b));
  }

  /* ------------------------------------------------------------------ */
  /* Full screen                                                         */
  /* ------------------------------------------------------------------ */
  // A picture always gets the whole window (see .cs-immersive). Where the
  // browser allows it (Android, iPad, computers; not iPhone) the studio also
  // goes truly full screen, hiding the browser and system bars.
  const root = document.documentElement;
  const fullscreenElement = () => document.fullscreenElement || document.webkitFullscreenElement;
  const canFullscreen = () =>
    !!(document.fullscreenEnabled || document.webkitFullscreenEnabled) && !window.matchMedia?.('(display-mode: fullscreen)').matches;
  // Both calls can refuse (e.g. no tap to start it); the window layout still applies then.
  const quietly = (target, fn, ...args) => {
    try {
      fn?.apply(target, args)?.catch?.(() => {});
    } catch {
      /* ignore */
    }
  };
  const enterFullscreen = () =>
    !fullscreenElement() && quietly(root, root.requestFullscreen || root.webkitRequestFullscreen, { navigationUI: 'hide' });
  const exitFullscreen = () => fullscreenElement() && quietly(document, document.exitFullscreen || document.webkitExitFullscreen);
  // Opening a picture on a phone/tablet goes full screen by itself; on a computer it's a button.
  const autoFullscreen = () => !!window.matchMedia?.('(pointer: coarse)').matches;

  const ICON_EXPAND =
    '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/></svg>';
  const ICON_SHRINK =
    '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/></svg>';

  /* ------------------------------------------------------------------ */
  /* Game                                                                */
  /* ------------------------------------------------------------------ */

  const ICON_BACK =
    '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>';
  const ICON_CHECK =
    '<svg viewBox="0 0 24 24" width="1.1em" height="1.1em" fill="none" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';

  function mount(api) {
    const pages = EG.coloringPages || [];
    // Tool choices carry over between pictures within a visit.
    const prefs = api.memory.prefs || (api.memory.prefs = { color: PALETTE[0], tool: 'fill', size: SIZES[1] });
    const doneMap = () => store.state.coloringDone || {};
    // The last few colors actually used, newest first (kept between visits).
    const recentColors = () => (store.state.coloringRecent || []).map((h) => byHex.get(h)).filter(Boolean);

    let currentUndo = null; // undo for the open page (Ctrl/⌘+Z)
    const onKey = (e) => {
      if (currentUndo && (e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        currentUndo();
      }
    };
    document.addEventListener('keydown', onKey);
    api.onCleanup(() => document.removeEventListener('keydown', onKey));

    const screen = api.stage.closest('.game-screen');
    let fullscreenBtn = null; // the open page's toggle, if any
    let exitingOnPurpose = false;
    const setImmersive = (on) => screen?.classList.toggle('cs-immersive', on);
    const paintFullscreenBtn = () => {
      if (!fullscreenBtn) return;
      const on = !!fullscreenElement();
      fullscreenBtn.innerHTML = on ? ICON_SHRINK : ICON_EXPAND;
      fullscreenBtn.setAttribute('aria-label', on ? 'Exit full screen' : 'Full screen');
      fullscreenBtn.title = on ? 'Exit full screen' : 'Full screen';
      fullscreenBtn.setAttribute('aria-pressed', String(on));
    };
    const onFullscreenChange = () => {
      // Left full screen with the browser's own controls (Back, Esc): don't keep forcing it.
      if (!fullscreenElement() && !exitingOnPurpose && fullscreenBtn) prefs.fullscreen = false;
      exitingOnPurpose = false;
      paintFullscreenBtn();
    };
    document.addEventListener('fullscreenchange', onFullscreenChange);
    document.addEventListener('webkitfullscreenchange', onFullscreenChange);
    api.onCleanup(() => {
      document.removeEventListener('fullscreenchange', onFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', onFullscreenChange);
      setImmersive(false);
      exitingOnPurpose = true;
      exitFullscreen();
    });

    /** A gallery button showing the picture with its saved colors. */
    function thumb(page, i) {
      const built = buildPage(page);
      applyState(built, loadState(page, built));
      return el(
        'button',
        {
          class: 'cs-thumb pop-in',
          style: { animationDelay: i * 50 + 'ms' },
          'aria-label': page.title,
          onclick: () => {
            api.sfx.tap();
            openPage(page);
          },
        },
        built.svg,
        el('span', { class: 'cs-thumb-label' }, el('span', { 'aria-hidden': 'true' }, page.emoji), ' ', page.title),
        doneMap()[page.id] ? el('span', { class: 'cs-done', title: 'Finished!' }, '⭐') : null
      );
    }

    function showGallery() {
      currentUndo = null;
      fullscreenBtn = null;
      setImmersive(false);
      window.scrollTo(0, 0);
      delete api.memory.pageId;
      api.prompt('Pick a picture to color!');
      let n = 0;
      api.stage.replaceChildren(
        el(
          'div',
          { class: 'cs-gallery' },
          el('h2', { class: 'level-title' }, 'Pick a picture to color'),
          orderedCategories(new Date()).map((cat) => {
            const inCat = pages.filter((p) => (p.category || 'everyday') === cat.id);
            if (!inCat.length) return null;
            return el(
              'section',
              { class: 'cs-section', 'aria-label': cat.title },
              el('h3', { class: 'cs-section-title' }, el('span', { 'aria-hidden': 'true' }, cat.emoji), ' ', cat.title),
              el('div', { class: 'cs-grid' }, inCat.map((page) => thumb(page, n++)))
            );
          })
        )
      );
    }

    function openPage(page) {
      api.memory.pageId = page.id;
      setImmersive(true);
      if (canFullscreen() && (prefs.fullscreen ?? autoFullscreen())) enterFullscreen();
      const built = buildPage(page);
      const { svg, regions, strokesLayer } = built;
      const state = loadState(page, built);
      applyState(built, state);
      const history = [];
      const save = () => saveState(page, state);

      /* ---------- Painting ---------- */

      function fillRegion(region) {
        const i = Number(region.dataset.index);
        const prev = state.fills[i];
        if (prev === prefs.color.hex) return;
        history.push({ type: 'fill', i, prev });
        state.fills[i] = prefs.color.hex;
        region.setAttribute('fill', prefs.color.hex);
        api.sfx.tap(500 + Math.random() * 300);
        noteRecent();
        save();
      }

      const toSvgPoint = (e) => {
        const pt = svg.createSVGPoint();
        pt.x = e.clientX;
        pt.y = e.clientY;
        const p = pt.matrixTransform(svg.getScreenCTM().inverse());
        return { x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 };
      };

      let drawing = null; // { id, path, d, last }

      svg.addEventListener('pointerdown', (e) => {
        sizePop.hidden = true;
        if (prefs.tool === 'fill') {
          const region = e.target.closest?.('.region');
          if (region) fillRegion(region);
          return;
        }
        if (drawing) return; // ignore a second finger while drawing
        e.preventDefault();
        svg.setPointerCapture?.(e.pointerId);
        const p = toSvgPoint(e);
        const d = `M${p.x} ${p.y} l0.01 0`;
        const path = strokeElement({ c: prefs.color.hex, w: prefs.size.width, d });
        strokesLayer.append(path);
        drawing = { id: e.pointerId, path, d, last: p };
      });

      svg.addEventListener('pointermove', (e) => {
        if (!drawing || e.pointerId !== drawing.id) return;
        const events = e.getCoalescedEvents ? e.getCoalescedEvents() : [e];
        for (const ev of events.length ? events : [e]) {
          const p = toSvgPoint(ev);
          if (Math.hypot(p.x - drawing.last.x, p.y - drawing.last.y) < 2.5) continue;
          drawing.d += ` L${p.x} ${p.y}`;
          drawing.last = p;
        }
        drawing.path.setAttribute('d', drawing.d);
      });

      const endStroke = (e) => {
        if (!drawing || e.pointerId !== drawing.id) return;
        state.strokes.push({ c: prefs.color.hex, w: prefs.size.width, d: drawing.d });
        history.push({ type: 'stroke' });
        drawing = null;
        noteRecent();
        save();
      };
      svg.addEventListener('pointerup', endStroke);
      svg.addEventListener('pointercancel', endStroke);

      /* ---------- Undo / clear / done ---------- */

      function undo() {
        const action = history.pop();
        if (!action) {
          api.speak('Nothing to undo.');
          return;
        }
        api.sfx.tap(400);
        if (action.type === 'fill') {
          state.fills[action.i] = action.prev;
          regions[action.i].setAttribute('fill', action.prev);
        } else if (action.type === 'stroke') {
          state.strokes.pop();
          strokesLayer.lastChild?.remove();
        } else if (action.type === 'clear') {
          state.fills = action.fills;
          state.strokes = action.strokes;
          applyState(built, state);
        }
        save();
      }

      function clearPage() {
        if (isEmpty(state)) return;
        history.push({ type: 'clear', fills: state.fills.slice(), strokes: state.strokes.slice() });
        Object.assign(state, blankState(built));
        applyState(built, state);
        api.sfx.wrong();
        api.speak('Fresh page! Tap undo if you want it back.');
        save();
      }

      async function savePicture(btn) {
        btn.disabled = true;
        try {
          const result = await exportPicture(page, svg);
          if (result === 'downloaded') api.speak('Picture saved!');
        } catch (e) {
          console.error(e);
          api.speak('Oops, the picture could not be saved.');
        } finally {
          btn.disabled = false;
        }
      }

      function finishPage() {
        if (isEmpty(state)) {
          api.speak('Color something first!');
          return;
        }
        const colored = state.fills.filter((f) => f !== BLANK).length;
        const enough = colored >= Math.ceil(regions.length / 2) || state.strokes.length >= 8;
        let earned = false;
        if (enough && !doneMap()[page.id]) {
          store.set('coloringDone', { ...doneMap(), [page.id]: true });
          api.addStar();
          earned = true;
        }
        api.sfx.win();
        api.confetti(90);
        const praise = U.pick(PRAISE);
        api.speak(enough ? praise : `${praise} Keep going and color even more!`);

        const close = () => overlay.remove();
        const saveBtn = el('button', { class: 'btn primary', onclick: () => savePicture(saveBtn) }, '💾 Save picture');
        const overlay = el(
          'div',
          { class: 'overlay' },
          el(
            'div',
            { class: 'end-card', role: 'dialog', 'aria-label': 'Picture finished' },
            el('div', { class: 'cs-preview' }, svg.cloneNode(true)),
            el('h2', null, praise),
            earned ? el('p', { class: 'end-best' }, '⭐ You earned a star!') : null,
            !enough ? el('p', { class: 'end-detail' }, 'Color more of the picture to earn a star.') : null,
            el(
              'div',
              { class: 'end-actions' },
              saveBtn,
              el('button', { class: 'btn', onclick: () => { close(); showGallery(); } }, '🖼️ Color another'),
              el('button', { class: 'btn', onclick: close }, '🖍️ Keep coloring')
            )
          )
        );
        api.stage.append(overlay);
      }

      /* ---------- Controls ---------- */

      const pickColor = (c, { say = true } = {}) => {
        prefs.color = c;
        paintControls();
        api.sfx.tap(700);
        if (!say) return;
        api.speak(c.name);
        nameBubble.textContent = titleCase(c.name);
        U.replayClass(nameBubble, 'show');
      };

      // Crayon box
      const crayons = PALETTE.map((c) =>
        el('button', {
          class: 'cs-crayon' + (c.hex === BLANK ? ' white' : ''),
          style: { '--swatch': c.hex },
          'aria-label': c.name,
          title: c.name,
          onclick: () => pickColor(c),
        })
      );
      const recent = el('div', { class: 'cs-recent', role: 'group', 'aria-label': 'Recent colors' });
      function paintRecent() {
        const list = recentColors();
        recent.hidden = list.length === 0;
        recent.replaceChildren(
          ...list.map((c) =>
            el('button', {
              class: 'cs-dot',
              style: { '--swatch': c.hex },
              'aria-label': 'recent ' + c.name,
              title: c.name,
              onclick: () => pickColor(c),
            })
          )
        );
      }
      function noteRecent() {
        const hex = prefs.color.hex;
        const list = store.state.coloringRecent || [];
        if (list[0] === hex) return;
        store.set('coloringRecent', [hex, ...list.filter((h) => h !== hex)].slice(0, RECENT_MAX));
        paintRecent();
      }
      const colors = el('div', { class: 'cs-colors' }, el('div', { class: 'cs-crayons', role: 'group', 'aria-label': 'Crayons' }, crayons));

      // Fill / Crayon switch, with crayon sizes popping up from the Crayon button
      const mode = (id, icon, label) =>
        el(
          'button',
          { class: 'cs-mode', dataset: { tool: id }, 'aria-label': label },
          el('span', { class: 'cs-mode-icon', 'aria-hidden': 'true' }, icon),
          el('span', null, label)
        );
      const fillBtn = mode('fill', '🪣', 'Fill');
      const crayonBtn = mode('crayon', '🖍️', 'Crayon');
      const sizeDot = el('span', { class: 'cs-mode-size', 'aria-hidden': 'true' });
      crayonBtn.append(sizeDot);

      const sizeButtons = SIZES.map((sz) =>
        el(
          'button',
          {
            class: 'cs-size',
            'aria-label': sz.id + ' crayon',
            title: sz.id,
            onclick: () => {
              prefs.size = sz;
              sizePop.hidden = true;
              paintControls();
              api.sfx.tap(300 + sz.width * 20);
            },
          },
          el('span', { class: 'cs-size-dot', style: { width: sz.dot + 'px', height: sz.dot + 'px' } })
        )
      );
      const sizePop = el('div', { class: 'cs-size-pop', role: 'group', 'aria-label': 'Crayon size', hidden: true }, sizeButtons);

      fillBtn.addEventListener('click', () => {
        sizePop.hidden = true;
        if (prefs.tool === 'fill') return;
        prefs.tool = 'fill';
        paintControls();
        api.sfx.tap();
        api.speak('Tap to fill!');
      });
      crayonBtn.addEventListener('click', () => {
        if (prefs.tool === 'crayon') {
          sizePop.hidden = !sizePop.hidden; // tap again to change the size
          api.sfx.tap();
          return;
        }
        prefs.tool = 'crayon';
        sizePop.hidden = false;
        paintControls();
        api.sfx.tap();
        api.speak('Draw with your crayon!');
      });
      const modes = el('div', { class: 'cs-modes', role: 'group', 'aria-label': 'Tool' }, fillBtn, crayonBtn, sizePop);

      // Top bar
      const topBtn = (id, icon, label, onClick, extra = '') =>
        el(
          'button',
          { class: 'cs-btn ' + extra, dataset: { tool: id }, 'aria-label': label, title: label, onclick: onClick },
          icon.startsWith('<svg') ? el('span', { 'aria-hidden': 'true', html: icon }) : el('span', { 'aria-hidden': 'true' }, icon)
        );
      const saveBtn = topBtn('save', '💾', 'Save picture', () => savePicture(saveBtn));
      const clearBtn = topBtn('clear', '🗑️', 'Clear the picture (hold)', null, 'clear');
      clearBtn.style.setProperty('--hold', HOLD_TO_CLEAR_MS + 'ms');

      // Clearing takes a press-and-hold so a stray tap can't wipe a picture.
      let holdTimer = null;
      const stopHold = () => {
        clearTimeout(holdTimer);
        holdTimer = null;
        clearBtn.classList.remove('holding');
      };
      clearBtn.addEventListener('pointerdown', () => {
        if (isEmpty(state)) return;
        clearBtn.classList.add('holding');
        holdTimer = setTimeout(() => {
          stopHold();
          clearPage();
        }, HOLD_TO_CLEAR_MS);
      });
      clearBtn.addEventListener('pointerup', () => {
        if (!holdTimer) return;
        stopHold();
        U.replayClass(clearBtn, 'wobble');
        api.speak('Hold the trash can down to clear the picture.');
      });
      clearBtn.addEventListener('pointerleave', stopHold);
      clearBtn.addEventListener('pointercancel', stopHold);
      clearBtn.addEventListener('contextmenu', (e) => e.preventDefault()); // long press = hold, not a menu
      clearBtn.addEventListener('click', (e) => {
        if (e.detail === 0) clearPage(); // keyboard (Enter/Space); Undo brings it back
        else if (isEmpty(state)) api.speak('The page is already clean.');
      });

      fullscreenBtn = canFullscreen()
        ? el('button', {
            class: 'cs-btn',
            dataset: { tool: 'fullscreen' },
            onclick: () => {
              api.sfx.tap();
              if (fullscreenElement()) {
                prefs.fullscreen = false;
                exitingOnPurpose = true;
                exitFullscreen();
              } else {
                prefs.fullscreen = true;
                enterFullscreen();
              }
            },
          })
        : null;

      const top = el(
        'div',
        { class: 'cs-top' },
        topBtn('pages', ICON_BACK, 'All pictures', showGallery, 'back'),
        topBtn('undo', '↩️', 'Undo', undo),
        clearBtn,
        el('span', { class: 'cs-spacer' }),
        fullscreenBtn,
        saveBtn,
        topBtn('done', ICON_CHECK, 'Done', finishPage, 'done')
      );

      function paintControls() {
        crayons.forEach((b, i) => b.setAttribute('aria-pressed', String(PALETTE[i] === prefs.color)));
        fillBtn.setAttribute('aria-pressed', String(prefs.tool === 'fill'));
        crayonBtn.setAttribute('aria-pressed', String(prefs.tool === 'crayon'));
        sizeButtons.forEach((b, i) => b.setAttribute('aria-pressed', String(SIZES[i] === prefs.size)));
        const dot = Math.round(prefs.size.dot * 0.6);
        sizeDot.style.width = sizeDot.style.height = dot + 'px';
        studio.style.setProperty('--current', prefs.color.hex);
        studio.style.setProperty('--current-ink', inkOn(prefs.color.hex));
        board.classList.toggle('crayon-mode', prefs.tool === 'crayon');
      }

      const nameBubble = el('div', { class: 'cs-name', 'aria-hidden': 'true' });
      const board = el('div', { class: 'cs-board' }, svg, nameBubble);
      const studio = el(
        'div',
        { class: 'cs-studio' },
        top,
        el('div', { class: 'cs-board-wrap' }, board),
        el('div', { class: 'cs-dock' }, modes, recent, colors)
      );
      // Tapping anywhere else closes the size pop-up.
      studio.addEventListener('pointerdown', (e) => {
        if (!sizePop.hidden && !modes.contains(e.target)) sizePop.hidden = true;
      });
      api.stage.replaceChildren(studio);
      paintControls();
      paintRecent();
      paintFullscreenBtn();
      // Bring the chosen crayon into view in the scrolling crayon box.
      const chosen = crayons[PALETTE.indexOf(prefs.color)];
      if (chosen && colors.scrollWidth > colors.clientWidth) {
        const c = chosen.getBoundingClientRect();
        const box = colors.getBoundingClientRect();
        colors.scrollLeft += c.left + c.width / 2 - (box.left + box.width / 2);
      }

      currentUndo = undo;

      api.prompt(`${page.title}! Pick a color, then tap the picture to color it in.`);
    }

    const resume = pages.find((p) => p.id === api.memory.pageId);
    if (resume) openPage(resume);
    else showGallery();
  }

  register({
    id: 'coloring',
    title: 'Color Studio',
    emoji: '🎨',
    color: '#ec4899',
    ages: [2, 10],
    description: 'Tap to fill or draw with crayons. Animals, Christmas Nativity and Thanksgiving pictures, then save your art!',
    skills: ['Colors', 'Creativity', 'Fine motor'],
    mount,
  });
})();
