// 10 wizardry-themed profile avatars — bold gradient backgrounds with a single
// magical glyph (hat, orb, cauldron, sigil, etc.). Designed to read at 36px
// (nav) up through 76px (dashboard profile). Shipped inline as URI-encoded
// SVG data URIs — no network, no broken images.
//
// Order is stable: existing rows with `avatar_index` in [0..9] keep the same
// slot, so previously-picked avatars stay picked (with a fresh look).

const AVATARS = [
  // 0 — Sage: brand wizard hat with star
  {
    name: 'Sage',
    stops: ['#a855f7', '#581c87'],
    glyph: `<path d="M50 16 Q56 38 70 64 L30 64 Q44 38 50 16 Z" fill="#fff"/>
            <ellipse cx="50" cy="66" rx="30" ry="4.5" fill="#fff"/>
            <ellipse cx="50" cy="62" rx="22" ry="3" fill="#fbbf24"/>
            <path d="M55 38 L57 42 L61 42 L58 45 L59 49 L55 47 L51 49 L52 45 L49 42 L53 42 Z" fill="#fbbf24"/>`,
  },
  // 1 — Lunar: indigo crescent + scattered stars
  {
    name: 'Lunar',
    stops: ['#312e81', '#0f0a1f'],
    direction: 'v',
    glyph: `<path d="M62 26 A24 24 0 1 0 62 74 A17 17 0 1 1 62 26 Z" fill="#fef3c7"/>
            <circle cx="22" cy="28" r="1.4" fill="#fff" opacity="0.8"/>
            <circle cx="32" cy="50" r="0.9" fill="#fff" opacity="0.6"/>
            <circle cx="20" cy="68" r="1.6" fill="#fff" opacity="0.9"/>
            <circle cx="34" cy="80" r="1" fill="#fff" opacity="0.5"/>`,
  },
  // 2 — Arcane: electric bolt of spellcasting power
  {
    name: 'Arcane',
    stops: ['#8b5cf6', '#3730a3'],
    direction: 'v',
    glyph: `<path d="M58 14 L28 56 L46 56 L40 86 L72 42 L54 42 Z" fill="#fff"/>`,
  },
  // 3 — Oracle: divination crystal ball on a gold stand
  {
    name: 'Oracle',
    stops: ['#67e8f9', '#1d4ed8'],
    direction: 'v',
    glyph: `<path d="M36 74 L64 74 L60 82 L40 82 Z" fill="#fbbf24"/>
            <circle cx="50" cy="48" r="22" fill="#fff" opacity="0.96"/>
            <ellipse cx="43" cy="40" rx="6" ry="4" fill="#fff"/>
            <circle cx="50" cy="48" r="22" fill="none" stroke="#1e3a8a" stroke-width="1.2" opacity="0.25"/>
            <circle cx="56" cy="54" r="1.6" fill="#1e3a8a" opacity="0.5"/>
            <circle cx="44" cy="56" r="1.2" fill="#1e3a8a" opacity="0.4"/>`,
  },
  // 4 — Alchemist: bubbling cauldron over hearthlight
  {
    name: 'Alchemist',
    stops: ['#34d399', '#065f46'],
    glyph: `<circle cx="42" cy="32" r="3" fill="#fff" opacity="0.75"/>
            <circle cx="56" cy="26" r="2.2" fill="#fff" opacity="0.6"/>
            <circle cx="50" cy="38" r="2.6" fill="#fff" opacity="0.55"/>
            <path d="M26 52 Q26 80 50 80 Q74 80 74 52 Z" fill="#fff"/>
            <ellipse cx="50" cy="52" rx="25" ry="4.5" fill="#fbbf24"/>
            <rect x="32" y="80" width="5" height="6" fill="#fff"/>
            <rect x="63" y="80" width="5" height="6" fill="#fff"/>`,
  },
  // 5 — Grimoire: open spellbook with a guiding star
  {
    name: 'Grimoire',
    stops: ['#fbbf24', '#92400e'],
    direction: 'v',
    glyph: `<path d="M50 18 L53 26 L62 26 L55 32 L58 41 L50 36 L42 41 L45 32 L38 26 L47 26 Z" fill="#fff"/>
            <path d="M20 52 L48 48 L48 82 L20 82 Z" fill="#fff"/>
            <path d="M52 48 L80 52 L80 82 L52 82 Z" fill="#fff"/>
            <rect x="48" y="48" width="4" height="34" fill="#7c2d12"/>
            <g stroke="#92400e" stroke-width="1" opacity="0.35">
              <line x1="26" y1="58" x2="42" y2="56"/>
              <line x1="26" y1="64" x2="42" y2="62"/>
              <line x1="26" y1="70" x2="42" y2="68"/>
              <line x1="58" y1="56" x2="74" y2="58"/>
              <line x1="58" y1="62" x2="74" y2="64"/>
              <line x1="58" y1="68" x2="74" y2="70"/>
            </g>`,
  },
  // 6 — Comet: pink/purple shooting star with a trail
  {
    name: 'Comet',
    stops: ['#f472b6', '#6d28d9'],
    glyph: `<circle cx="70" cy="32" r="9" fill="#fff"/>
            <path d="M64 38 L22 80" stroke="#fff" stroke-width="6.5" stroke-linecap="round" opacity="0.85"/>
            <path d="M60 38 L18 76" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity="0.45"/>`,
  },
  // 7 — Sigil: arcane pentagram inside a runic circle
  {
    name: 'Sigil',
    stops: ['#1e1b4b', '#0a0612'],
    radial: true,
    glyph: `<circle cx="50" cy="50" r="28" fill="none" stroke="#a855f7" stroke-width="2.2" opacity="0.85"/>
            <path d="M50 24 L58 46 L80 46 L62 60 L70 82 L50 68 L30 82 L38 60 L20 46 L42 46 Z" fill="none" stroke="#fff" stroke-width="2.4" stroke-linejoin="round"/>`,
  },
  // 8 — Wand: rose-gold wand with sparkle tip
  {
    name: 'Wand',
    stops: ['#fda4af', '#9f1239'],
    direction: 'v',
    glyph: `<g transform="rotate(-38 50 50)">
              <rect x="20" y="48" width="48" height="6" rx="2.5" fill="#fff"/>
              <rect x="20" y="48" width="10" height="6" rx="2.5" fill="#fbbf24"/>
            </g>
            <g transform="translate(72 26)">
              <path d="M0 -14 L3.5 -3.5 L14 0 L3.5 3.5 L0 14 L-3.5 3.5 L-14 0 L-3.5 -3.5 Z" fill="#fef3c7"/>
              <circle cx="0" cy="0" r="3.5" fill="#fff"/>
            </g>
            <circle cx="32" cy="78" r="1.6" fill="#fff" opacity="0.7"/>
            <circle cx="58" cy="84" r="1.2" fill="#fff" opacity="0.5"/>`,
  },
  // 9 — Astromancer: a small constellation chart
  {
    name: 'Astromancer',
    stops: ['#7c3aed', '#db2777'],
    glyph: `<g stroke="#fff" stroke-width="1.2" opacity="0.55">
              <line x1="28" y1="30" x2="54" y2="42"/>
              <line x1="54" y1="42" x2="72" y2="24"/>
              <line x1="54" y1="42" x2="42" y2="66"/>
              <line x1="42" y1="66" x2="66" y2="74"/>
              <line x1="66" y1="74" x2="80" y2="58"/>
            </g>
            <g fill="#fff">
              <circle cx="28" cy="30" r="3.2"/>
              <circle cx="54" cy="42" r="2.6"/>
              <circle cx="72" cy="24" r="2.2"/>
              <circle cx="42" cy="66" r="2.6"/>
              <circle cx="66" cy="74" r="3.2"/>
              <circle cx="80" cy="58" r="2.2"/>
            </g>`,
  },
];

const buildSvg = (a) => {
  const [from, to] = a.stops;
  let bg;
  if (a.radial) {
    bg = `<defs><radialGradient id="g"><stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/></radialGradient></defs>`;
  } else {
    const x2 = a.direction === 'v' ? 0 : 1;
    const y2 = 1;
    bg = `<defs><linearGradient id="g" x1="0" y1="0" x2="${x2}" y2="${y2}"><stop offset="0%" stop-color="${from}"/><stop offset="100%" stop-color="${to}"/></linearGradient></defs>`;
  }
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${bg}<rect width="100" height="100" fill="url(#g)"/>${a.glyph}</svg>`;
};

// URI-encoded (not base64) — smaller payload, renders identically.
const toDataUri = (svg) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;

const AVATAR_OPTIONS = AVATARS.map(a => toDataUri(buildSvg(a)));

// Names exposed for accessibility (used as aria-labels on picker buttons).
export const AVATAR_NAMES = AVATARS.map(a => a.name);

export default AVATAR_OPTIONS;
