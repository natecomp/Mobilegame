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

  const BG = '<rect x="0" y="0" width="400" height="400"/>';

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
  ];

  window.EduGames.coloringPages = PAGES;
})();
