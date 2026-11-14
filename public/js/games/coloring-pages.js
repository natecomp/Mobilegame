/*
 * Coloring pages for Color Studio (all original artwork).
 *
 * Each page is drawn on a 400 x 400 canvas:
 *   regions — shapes a child can fill. Order matters: later shapes sit on
 *             top. The first region should be the full background.
 *   lines   — decorative details drawn on top that can't be filled
 *             (eyes, whiskers, ...). Shapes here are outlines unless they
 *             set their own fill.
 *
 * Optional fields: category ('everyday' | 'christmas' | 'thanksgiving'),
 * and words(...) for big outlined letters children can color in.
 *
 * To add a page, append to PAGES. No other code changes are needed.
 */
(function () {
  'use strict';

  /** Points for an n-pointed star polygon. */
  function star(cx, cy, outer, inner = outer * 0.45, points = 5) {
    const pts = [];
    for (let i = 0; i < points * 2; i++) {
      const r = i % 2 ? inner : outer;
      const a = (Math.PI / points) * i - Math.PI / 2;
      pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
    }
    return `<polygon points="${pts.join(' ')}"/>`;
  }

  /** Petals arranged in a ring around (cx, cy). */
  function petals(cx, cy, count, dist, rx, ry) {
    let out = '';
    for (let i = 0; i < count; i++) {
      out += `<ellipse cx="${cx}" cy="${cy - dist}" rx="${rx}" ry="${ry}" transform="rotate(${(360 / count) * i} ${cx} ${cy})"/>`;
    }
    return out;
  }


  /** Big outlined letters children can fill in (a fillable <text> region). */
  function words(text, y, size, x = 200) {
    return (
      `<text x="${x}" y="${y}" font-size="${size}" font-family="Fredoka, sans-serif" font-weight="700" ` +
      `text-anchor="middle" letter-spacing="2" stroke-width="3">${text}</text>`
    );
  }

  /** A candle flame (teardrop) sitting on top of a candle at (cx, top). */
  function flame(cx, top) {
    return `<path d="M${cx} ${top - 34} Q${cx + 15} ${top - 12} ${cx} ${top - 2} Q${cx - 15} ${top - 12} ${cx} ${top - 34} Z"/>`;
  }

  /** Feathers fanned out behind a turkey, centred on (cx, cy). */
  function fan(cx, cy, angles, dist, rx, ry) {
    return angles
      .map((a) => `<ellipse cx="${cx}" cy="${cy - dist}" rx="${rx}" ry="${ry}" transform="rotate(${a} ${cx} ${cy})"/>`)
      .join('');
  }

  /** A pumpkin made of three overlapping lobes, with a stem. */
  function pumpkin(cx, cy, w, h) {
    const side = w * 0.32;
    return (
      `<path d="M${cx - w * 0.06} ${cy - h * 0.42} L${cx - w * 0.04} ${cy - h * 0.62} L${cx + w * 0.07} ${cy - h * 0.62} L${cx + w * 0.06} ${cy - h * 0.4} Z"/>` +
      `<ellipse cx="${cx - side}" cy="${cy}" rx="${w * 0.3}" ry="${h * 0.45}"/>` +
      `<ellipse cx="${cx + side}" cy="${cy}" rx="${w * 0.3}" ry="${h * 0.45}"/>` +
      `<ellipse cx="${cx}" cy="${cy}" rx="${w * 0.27}" ry="${h * 0.5}"/>`
    );
  }

  // Maple leaf outline in a ±50 box (stem included), pointing up.
  const MAPLE = [
    [0, -50], [8, -30], [20, -36], [16, -14], [36, -22], [30, -8], [46, -2], [24, 10], [28, 22], [6, 16],
    [4, 44], [-4, 44], [-6, 16], [-28, 22], [-24, 10], [-46, -2], [-30, -8], [-36, -22], [-16, -14], [-20, -36], [-8, -30],
  ];

  /** An autumn maple leaf of radius r, rotated by rot degrees. */
  function leaf(cx, cy, r, rot = 0) {
    const a = (rot * Math.PI) / 180;
    const k = r / 50;
    const pts = MAPLE.map(([x, y]) => {
      const px = cx + k * (x * Math.cos(a) - y * Math.sin(a));
      const py = cy + k * (x * Math.sin(a) + y * Math.cos(a));
      return `${px.toFixed(1)},${py.toFixed(1)}`;
    });
    return `<polygon points="${pts.join(' ')}"/>`;
  }

  const BG = '<rect x="0" y="0" width="400" height="400"/>';

  // Gallery sections. The current holiday is shown first (see coloring.js).
  const CATEGORIES = [
    { id: 'everyday', title: 'Animals & Fun', emoji: '🐾' },
    { id: 'christmas', title: 'Christmas: Jesus Is Born', emoji: '⭐' },
    { id: 'thanksgiving', title: 'Thanksgiving', emoji: '🦃' },
  ];

  const PAGES = [
    {
      id: 'kitty',
      title: 'Kitty Cat',
      emoji: '🐱',
      regions: `${BG}
        <polygon points="95,170 120,55 190,120"/>
        <polygon points="305,170 280,55 210,120"/>
        <polygon points="117,140 128,88 166,120"/>
        <polygon points="283,140 272,88 234,120"/>
        <ellipse cx="200" cy="220" rx="130" ry="115"/>
        <polygon points="200,345 155,318 155,372"/>
        <polygon points="200,345 245,318 245,372"/>
        <circle cx="200" cy="345" r="13"/>
        <ellipse cx="200" cy="258" rx="55" ry="38"/>
        <ellipse cx="150" cy="195" rx="22" ry="28"/>
        <ellipse cx="250" cy="195" rx="22" ry="28"/>
        <polygon points="185,230 215,230 200,246"/>`,
      lines: `
        <ellipse cx="153" cy="198" rx="8" ry="14" fill="#2d2a4a"/>
        <ellipse cx="253" cy="198" rx="8" ry="14" fill="#2d2a4a"/>
        <path d="M200 246 V258 M200 258 Q188 272 176 264 M200 258 Q212 272 224 264"/>
        <path d="M150 250 L78 236 M150 263 L74 268 M250 250 L322 236 M250 263 L326 268"/>`,
    },
    {
      id: 'fish',
      title: 'Happy Fish',
      emoji: '🐠',
      regions: `${BG}
        <path d="M0 362 Q100 340 200 360 T400 352 V400 H0 Z"/>
        <path d="M38 372 C18 330 66 310 44 262 C30 224 72 204 58 165 L80 170 C94 212 56 228 70 266 C92 318 48 338 64 372 Z"/>
        <path d="M350 365 C335 330 372 312 356 275 L375 278 C390 318 356 334 368 365 Z"/>
        <polygon points="300,200 378,132 356,200 378,268"/>
        <path d="M150 130 Q200 66 262 128 Z"/>
        <path d="M178 274 Q200 322 236 272 Z"/>
        <ellipse cx="200" cy="200" rx="120" ry="80"/>
        <path d="M170 123 Q150 200 170 277 L196 280 Q176 200 196 120 Z"/>
        <path d="M232 125 Q212 200 232 275 L256 268 Q238 200 256 132 Z"/>
        <path d="M262 205 Q292 190 300 222 Q280 234 262 205 Z"/>
        <circle cx="125" cy="185" r="16"/>
        <circle cx="80" cy="110" r="14"/>
        <circle cx="58" cy="70" r="9"/>
        <circle cx="92" cy="42" r="6"/>`,
      lines: `
        <circle cx="128" cy="186" r="7" fill="#2d2a4a"/>
        <path d="M88 212 Q100 220 113 213"/>
        <path d="M150 168 Q163 200 150 232"/>`,
    },
    {
      id: 'house',
      title: 'Cozy House',
      emoji: '🏡',
      regions: `${BG}
        <circle cx="332" cy="72" r="38"/>
        <path d="M70 122 Q44 122 50 99 Q56 78 78 83 Q86 56 116 61 Q142 46 157 73 Q180 73 177 99 Q176 122 150 122 Z"/>
        <path d="M0 300 Q200 280 400 300 V400 H0 Z"/>
        <polygon points="186,400 214,400 211,320 189,320"/>
        <rect x="250" y="95" width="30" height="72"/>
        <rect x="100" y="175" width="200" height="145"/>
        <polygon points="80,182 200,85 320,182"/>
        <circle cx="200" cy="145" r="15"/>
        <rect x="175" y="240" width="50" height="80" rx="4"/>
        <rect x="118" y="205" width="45" height="45"/>
        <rect x="237" y="205" width="45" height="45"/>
        <rect x="340" y="230" width="20" height="78"/>
        <circle cx="350" cy="210" r="38"/>`,
      lines: `
        <path d="M140.5 205 V250 M118 227.5 H163 M259.5 205 V250 M237 227.5 H282"/>
        <circle cx="215" cy="282" r="4" fill="#2d2a4a"/>
        <path d="M332 22 V8 M370 34 L380 24 M382 72 H396 M294 34 L284 24 M370 110 L380 120"/>`,
    },
    {
      id: 'butterfly',
      title: 'Butterfly',
      emoji: '🦋',
      regions: `${BG}
        <path d="M0 372 Q200 352 400 372 V400 H0 Z"/>
        <path d="M195 190 C150 80 50 60 60 140 C65 190 130 205 195 200 Z"/>
        <path d="M205 190 C250 80 350 60 340 140 C335 190 270 205 205 200 Z"/>
        <path d="M195 207 C130 212 80 262 110 302 C140 337 185 292 197 227 Z"/>
        <path d="M205 207 C270 212 320 262 290 302 C260 337 215 292 203 227 Z"/>
        <circle cx="110" cy="132" r="22"/>
        <circle cx="290" cy="132" r="22"/>
        <circle cx="158" cy="168" r="10"/>
        <circle cx="242" cy="168" r="10"/>
        <circle cx="140" cy="268" r="16"/>
        <circle cx="260" cy="268" r="16"/>
        <ellipse cx="200" cy="232" rx="14" ry="80"/>
        <circle cx="200" cy="142" r="20"/>
        <circle cx="158" cy="72" r="8"/>
        <circle cx="242" cy="72" r="8"/>`,
      lines: `
        <path d="M193 125 Q176 88 162 78 M207 125 Q224 88 238 78"/>
        <circle cx="193" cy="139" r="3" fill="#2d2a4a"/>
        <circle cx="207" cy="139" r="3" fill="#2d2a4a"/>
        <path d="M192 149 Q200 156 208 149"/>`,
    },
    {
      id: 'rocket',
      title: 'Space Rocket',
      emoji: '🚀',
      regions: `${BG}
        <circle cx="88" cy="300" r="50"/>
        <path fill-rule="evenodd" d="M8 300 a80 18 0 1 0 160 0 a80 18 0 1 0 -160 0 Z M30 300 a58 10 0 1 0 116 0 a58 10 0 1 0 -116 0 Z"/>
        <circle cx="330" cy="70" r="30"/>
        ${star(60, 70, 22)}
        ${star(330, 300, 18)}
        ${star(360, 190, 12)}
        ${star(110, 180, 12)}
        <g transform="rotate(12 200 220)">
          <path d="M176 300 Q200 385 224 300 Z"/>
          <path d="M187 300 Q200 350 213 300 Z"/>
          <polygon points="160,228 118,302 162,292"/>
          <polygon points="240,228 282,302 238,292"/>
          <rect x="160" y="160" width="80" height="140"/>
          <path d="M160 161 Q200 48 240 161 Z"/>
          <rect x="160" y="258" width="80" height="18"/>
          <circle cx="200" cy="205" r="24"/>
        </g>`,
      lines: `
        <g transform="rotate(12 200 220)"><path d="M186 192 Q193 185 202 186"/></g>`,
    },
    {
      id: 'flowers',
      title: 'Flower Garden',
      emoji: '🌻',
      regions: `${BG}
        <circle cx="58" cy="58" r="34"/>
        <path d="M0 292 Q100 272 200 290 T400 286 V400 H0 Z"/>
        <rect x="192" y="200" width="16" height="185"/>
        <path d="M200 300 Q250 258 292 280 Q252 322 200 300 Z"/>
        <path d="M200 332 Q150 290 108 312 Q148 354 200 332 Z"/>
        ${petals(200, 158, 8, 52, 26, 40)}
        <circle cx="200" cy="158" r="32"/>
        <rect x="80" y="262" width="8" height="118"/>
        <path d="M64 226 L64 254 Q84 282 104 254 L104 226 L94 242 L84 224 L74 242 Z"/>
        <rect x="318" y="262" width="8" height="118"/>
        ${petals(322, 240, 5, 20, 13, 18)}
        <circle cx="322" cy="240" r="12"/>`,
      lines: `
        <circle cx="190" cy="152" r="3.5" fill="#2d2a4a"/>
        <circle cx="210" cy="152" r="3.5" fill="#2d2a4a"/>
        <path d="M187 166 Q200 178 213 166"/>`,
    },
    {
      id: 'icecream',
      title: 'Ice Cream',
      emoji: '🍦',
      regions: `${BG}
        <circle cx="60" cy="70" r="14"/>
        <circle cx="340" cy="110" r="18"/>
        <circle cx="70" cy="300" r="20"/>
        <circle cx="330" cy="320" r="12"/>
        <circle cx="320" cy="210" r="9"/>
        <circle cx="90" cy="190" r="10"/>
        <polygon points="148,232 252,232 200,372"/>
        <circle cx="200" cy="206" r="56"/>
        <path d="M146 222 Q150 256 162 240 Q172 266 184 246 Q198 272 214 248 Q226 264 236 242 Q248 256 254 222 Z"/>
        <circle cx="200" cy="136" r="48"/>
        <circle cx="206" cy="80" r="14"/>`,
      lines: `
        <clipPath id="cone-clip"><polygon points="148,232 252,232 200,372"/></clipPath>
        <g clip-path="url(#cone-clip)" stroke-width="3">
          <path d="M140 250 L230 380 M160 230 L250 360 M190 230 L270 345 M120 270 L190 372"/>
          <path d="M260 250 L170 380 M240 230 L150 360 M210 230 L130 345 M280 270 L210 372"/>
        </g>
        <path d="M206 66 Q210 48 226 42"/>
        <path d="M178 116 l8 -6 M214 108 l6 8 M190 146 l9 2 M226 140 l-4 9 M172 152 l3 -9" stroke-width="5"/>`,
    },
    {
      id: 'dino',
      title: 'Friendly Dino',
      emoji: '🦕',
      regions: `${BG}
        <circle cx="66" cy="64" r="32"/>
        <path d="M282 292 L342 186 L372 186 L400 236 V292 Z"/>
        <path d="M340 182 Q357 138 374 182 Z"/>
        <path d="M0 300 Q200 284 400 300 V400 H0 Z"/>
        <path d="M120 262 Q42 252 18 202 Q72 244 132 226 Z"/>
        <rect x="108" y="268" width="28" height="48" rx="9"/>
        <rect x="190" y="268" width="28" height="48" rx="9"/>
        <path d="M212 232 Q250 202 254 152 Q256 110 290 110 Q336 110 336 140 Q336 168 302 170 Q282 172 276 192 Q266 242 238 262 Z"/>
        <polygon points="96,216 106,172 134,196"/>
        <polygon points="124,196 144,150 168,190"/>
        <polygon points="160,188 182,146 206,192"/>
        <polygon points="198,194 222,160 236,210"/>
        <ellipse cx="165" cy="240" rx="86" ry="54"/>
        <ellipse cx="172" cy="258" rx="50" ry="24"/>
        <circle cx="128" cy="226" r="10"/>
        <circle cx="200" cy="216" r="12"/>`,
      lines: `
        <circle cx="300" cy="132" r="6" fill="#2d2a4a"/>
        <path d="M308 152 Q320 160 330 150"/>
        <circle cx="328" cy="134" r="2.5" fill="#2d2a4a"/>`,
    },

    /* ------------------------------- Christmas ------------------------------- */
    {
      id: 'manger',
      category: 'christmas',
      title: 'Baby Jesus',
      emoji: '👶',
      regions: `${BG}
        <path d="M0 330 Q200 315 400 330 V400 H0 Z"/>
        <rect x="70" y="170" width="260" height="165"/>
        <polygon points="40,182 200,82 360,182"/>
        ${star(200, 42, 30, 13)}
        <path d="M92 338 Q108 300 140 312 Q170 290 200 305 Q230 288 260 312 Q292 300 308 338 Z"/>
        <polygon points="128,342 148,288 160,288 140,342"/>
        <polygon points="272,342 252,288 240,288 260,342"/>
        <polygon points="118,250 282,250 262,300 138,300"/>
        <circle cx="140" cy="232" r="27"/>
        <ellipse cx="205" cy="240" rx="62" ry="22"/>
        <circle cx="140" cy="236" r="18"/>`,
      lines: `
        <path d="M156 42 H140 M244 42 H260 M176 14 L166 4 M224 14 L234 4"/>
        <path d="M188 220 Q181 240 188 260 M222 219 Q215 240 222 261"/>
        <path d="M131 234 q3 3 6 0 M143 234 q3 3 6 0 M135 242 q5 4 10 0"/>
        <path d="M118 326 l10 -12 M176 316 l6 -12 M236 316 l-4 -13 M282 326 l-9 -11"/>`,
    },
    {
      id: 'bethlehem',
      category: 'christmas',
      title: 'Star of Bethlehem',
      emoji: '🌟',
      regions: `${BG}
        <polygon points="200,14 216,72 274,88 216,104 200,170 184,104 126,88 184,72"/>
        ${star(56, 58, 13)}
        ${star(342, 48, 15)}
        ${star(330, 150, 9)}
        ${star(78, 160, 9)}
        <path d="M0 262 Q100 214 200 250 T400 240 V400 H0 Z"/>
        <rect x="66" y="236" width="62" height="70"/>
        <path d="M66 236 Q97 200 128 236 Z"/>
        <rect x="150" y="256" width="48" height="50"/>
        <rect x="216" y="222" width="58" height="84"/>
        <rect x="290" y="244" width="62" height="62"/>
        <path d="M290 244 Q321 212 352 244 Z"/>
        <path d="M0 300 Q200 282 400 300 V400 H0 Z"/>
        ${words('JESUS IS BORN', 366, 42)}`,
      lines: `
        <path d="M168 56 L150 38 M232 56 L250 38 M168 120 L150 138 M232 120 L250 138"/>
        <path d="M90 306 V280 Q97 270 104 280 V306 M166 270 h16 v14 h-16 Z M232 240 h12 v12 h-12 Z M252 240 h12 v12 h-12 Z M236 306 V282 h18 v24 M306 262 h12 v12 h-12 Z"/>`,
    },
    {
      id: 'angel',
      category: 'christmas',
      title: 'Christmas Angel',
      emoji: '😇',
      regions: `${BG}
        ${star(58, 58, 14)}
        ${star(342, 70, 12)}
        ${star(66, 210, 9)}
        ${star(336, 216, 10)}
        <path d="M178 156 Q92 100 68 172 Q80 236 180 210 Z"/>
        <path d="M222 156 Q308 100 332 172 Q320 236 220 210 Z"/>
        <circle cx="200" cy="110" r="35"/>
        <path d="M200 138 L136 306 Q200 322 264 306 Z"/>
        <polygon points="196,162 156,232 198,226"/>
        <polygon points="204,162 244,232 202,226"/>
        <circle cx="200" cy="224" r="14"/>
        <circle cx="200" cy="118" r="28"/>
        <ellipse cx="200" cy="68" rx="34" ry="9"/>
        ${words('GLORY TO GOD', 370, 40)}`,
      lines: `
        <path d="M187 116 q4 3 8 0 M205 116 q4 3 8 0 M193 128 q7 6 14 0"/>
        <path d="M200 240 V312"/>`,
    },
    {
      id: 'gifts',
      category: 'christmas',
      title: 'Gifts for Jesus',
      emoji: '🎁',
      regions: `${BG}
        ${star(200, 58, 34)}
        <rect x="0" y="330" width="400" height="70"/>
        <rect x="40" y="250" width="100" height="80"/>
        <path d="M40 250 Q90 204 140 250 Z"/>
        <rect x="82" y="262" width="16" height="22" rx="3"/>
        <rect x="182" y="226" width="36" height="28"/>
        <path d="M170 330 L160 262 Q200 242 240 262 L230 330 Z"/>
        <ellipse cx="200" cy="226" rx="24" ry="8"/>
        <circle cx="200" cy="213" r="8"/>
        <rect x="265" y="265" width="90" height="65"/>
        <rect x="302" y="265" width="16" height="65"/>
        <ellipse cx="294" cy="252" rx="18" ry="11" transform="rotate(-20 294 252)"/>
        <ellipse cx="326" cy="252" rx="18" ry="11" transform="rotate(20 326 252)"/>
        <circle cx="310" cy="256" r="8"/>
        ${words('GIFTS FOR JESUS', 376, 34)}`,
      lines: `
        <path d="M156 58 H138 M244 58 H262 M200 102 V118"/>
        <path d="M40 300 H140 M164 290 H236"/>
        <circle cx="90" cy="271" r="3" fill="#2d2a4a"/>`,
    },
    {
      id: 'advent',
      category: 'christmas',
      title: 'Advent Wreath',
      emoji: '🕯️',
      regions: `${BG}
        <rect x="0" y="360" width="400" height="40"/>
        <rect x="186" y="150" width="28" height="140"/>
        <rect x="147" y="180" width="26" height="86"/>
        <rect x="227" y="180" width="26" height="86"/>
        <path fill-rule="evenodd" d="M50 300 a150 55 0 1 0 300 0 a150 55 0 1 0 -300 0 Z M105 300 a95 28 0 1 0 190 0 a95 28 0 1 0 -190 0 Z"/>
        <ellipse cx="128" cy="258" rx="22" ry="10" transform="rotate(12 128 258)"/>
        <ellipse cx="272" cy="258" rx="22" ry="10" transform="rotate(-12 272 258)"/>
        <ellipse cx="150" cy="346" rx="24" ry="10" transform="rotate(-8 150 346)"/>
        <ellipse cx="200" cy="352" rx="24" ry="10"/>
        <ellipse cx="250" cy="346" rx="24" ry="10" transform="rotate(8 250 346)"/>
        <ellipse cx="70" cy="322" rx="22" ry="10" transform="rotate(-40 70 322)"/>
        <ellipse cx="330" cy="322" rx="22" ry="10" transform="rotate(40 330 322)"/>
        <circle cx="175" cy="352" r="7"/>
        <circle cx="225" cy="352" r="7"/>
        <circle cx="108" cy="340" r="7"/>
        <circle cx="292" cy="340" r="7"/>
        <rect x="82" y="208" width="26" height="98"/>
        <rect x="292" y="208" width="26" height="98"/>
        ${flame(200, 150)}
        ${flame(160, 180)}
        ${flame(240, 180)}
        ${flame(95, 208)}
        ${flame(305, 208)}
        ${words('JESUS IS THE LIGHT', 56, 30)}`,
      lines: '',
    },

    /* ----------------------------- Thanksgiving ----------------------------- */
    {
      id: 'turkey',
      category: 'thanksgiving',
      title: 'Thankful Turkey',
      emoji: '🦃',
      regions: `${BG}
        <path d="M0 332 Q200 314 400 332 V400 H0 Z"/>
        ${fan(200, 236, [-75, -50, -25, 0, 25, 50, 75], 92, 28, 66)}
        <ellipse cx="200" cy="248" rx="64" ry="60"/>
        <path d="M150 238 Q130 282 176 294 Q166 262 150 238 Z"/>
        <path d="M250 238 Q270 282 224 294 Q234 262 250 238 Z"/>
        <circle cx="200" cy="172" r="32"/>
        <polygon points="192,176 208,176 200,192"/>
        <path d="M206 184 Q216 202 205 210 Q198 200 203 188 Z"/>
        ${leaf(54, 356, 22, 15)}
        ${leaf(350, 362, 20, -20)}
        ${leaf(310, 370, 14, 40)}`,
      lines: `
        <circle cx="188" cy="164" r="5" fill="#2d2a4a"/>
        <circle cx="212" cy="164" r="5" fill="#2d2a4a"/>
        <path d="M186 306 V334 M174 342 L186 334 L186 344 M198 342 L186 334"/>
        <path d="M214 306 V334 M202 342 L214 334 L214 344 M226 342 L214 334"/>`,
    },
    {
      id: 'pumpkins',
      category: 'thanksgiving',
      title: 'Pumpkin Patch',
      emoji: '🎃',
      regions: `${BG}
        <circle cx="336" cy="66" r="34"/>
        <path d="M60 112 Q36 112 42 90 Q48 70 70 75 Q78 50 106 55 Q130 42 144 66 Q166 66 163 90 Q162 112 138 112 Z"/>
        <path d="M0 262 Q200 240 400 262 V400 H0 Z"/>
        <ellipse cx="62" cy="292" rx="18" ry="46" transform="rotate(-12 62 292)"/>
        <path d="M68 342 Q22 318 30 256 Q52 298 68 342 Z"/>
        <path d="M68 342 Q108 320 100 258 Q82 300 68 342 Z"/>
        ${pumpkin(200, 300, 170, 120)}
        <path d="M212 238 Q244 206 268 226 Q244 252 212 238 Z"/>
        ${pumpkin(326, 340, 90, 66)}`,
      lines: `
        <path d="M262 236 q18 4 14 18 q-4 12 10 14"/>
        <path d="M55 262 l8 6 M52 282 l8 6 M54 302 l8 6 M58 322 l7 5"/>`,
    },
    {
      id: 'givethanks',
      category: 'thanksgiving',
      title: 'Give Thanks',
      emoji: '🥧',
      regions: `${BG}
        <polygon points="72,82 20,82 38,110 20,138 72,138"/>
        <polygon points="328,82 380,82 362,110 380,138 328,138"/>
        <rect x="58" y="66" width="284" height="64" rx="6"/>
        ${words('GIVE THANKS', 114, 40)}
        ${leaf(58, 228, 30, 10)}
        ${leaf(344, 220, 26, -15)}
        <path d="M88 300 L110 342 H290 L312 300 Z"/>
        <ellipse cx="200" cy="300" rx="114" ry="32"/>
        <ellipse cx="200" cy="296" rx="92" ry="21"/>
        <path d="M178 292 Q172 272 190 270 Q200 252 212 270 Q230 272 222 292 Z"/>
        <path d="M60 350 Q80 328 100 350 Z"/>
        <ellipse cx="80" cy="366" rx="16" ry="19"/>
        <path d="M300 350 Q320 328 340 350 Z"/>
        <ellipse cx="320" cy="366" rx="16" ry="19"/>`,
      lines: `
        <path d="M80 330 v-8 M320 330 v-8"/>
        <path d="M126 336 L116 310 M160 340 L154 314 M200 342 V316 M240 340 L246 314 M274 336 L284 310"/>`,
    },
    {
      id: 'cornucopia',
      category: 'thanksgiving',
      title: 'Cornucopia',
      emoji: '🍇',
      regions: `${BG}
        <rect x="0" y="330" width="400" height="70"/>
        <path d="M250 158 C170 158 110 190 72 232 C58 248 40 236 46 214 C36 234 50 260 78 252 C122 266 182 302 250 302 Z"/>
        <ellipse cx="250" cy="230" rx="32" ry="72"/>
        <circle cx="300" cy="212" r="13"/>
        <circle cx="322" cy="212" r="13"/>
        <circle cx="311" cy="232" r="13"/>
        <circle cx="290" cy="234" r="13"/>
        <circle cx="332" cy="234" r="13"/>
        <circle cx="300" cy="254" r="13"/>
        <circle cx="322" cy="254" r="13"/>
        <circle cx="270" cy="168" r="28"/>
        <path d="M272 140 Q290 122 304 134 Q290 148 272 140 Z"/>
        <path d="M352 258 Q378 262 376 300 Q372 330 348 330 Q322 330 322 302 Q322 278 340 268 Q342 258 352 258 Z"/>
        ${pumpkin(262, 300, 90, 62)}`,
      lines: `
        <clipPath id="horn-clip"><path d="M250 158 C170 158 110 190 72 232 C58 248 40 236 46 214 C36 234 50 260 78 252 C122 266 182 302 250 302 Z"/></clipPath>
        <g clip-path="url(#horn-clip)" stroke-width="3">
          <path d="M120 180 Q140 230 128 290 M170 166 Q190 230 176 300 M210 160 Q228 230 214 305"/>
        </g>
        <path d="M270 140 V132 M352 258 q2 -8 8 -12"/>`,
    },
  ];

  window.EduGames.coloringPages = PAGES;
  window.EduGames.coloringCategories = CATEGORIES;
})();
