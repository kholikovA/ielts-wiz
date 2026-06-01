// 10 magical-essence profile avatars. Each is a bold gradient with a single
// iconographic glyph, designed to read at 36px (nav) up to 76px (dashboard).
// Shipped inline as URI-encoded SVG data URIs — no network, no broken images.
//
// Order is stable: existing rows with `avatar_index` in [0..9] keep the same
// slot. Adding new avatars must append, never reorder.

const AVATARS = [
  // 0 — Aurora: brand purple sparkle
  {
    name: 'Aurora',
    stops: ['#a855f7', '#6d28d9'],
    glyph: `<path d="M50 22 L54 46 L78 50 L54 54 L50 78 L46 54 L22 50 L46 46 Z" fill="#fff"/>
            <circle cx="26" cy="26" r="1.6" fill="#fff" opacity="0.7"/>
            <circle cx="76" cy="32" r="1.2" fill="#fff" opacity="0.5"/>
            <circle cx="72" cy="74" r="1.5" fill="#fff" opacity="0.6"/>`,
  },
  // 1 — Midnight: indigo crescent + stars
  {
    name: 'Midnight',
    stops: ['#312e81', '#0f0a1f'],
    direction: 'v',
    glyph: `<path d="M62 26 A24 24 0 1 0 62 74 A17 17 0 1 1 62 26 Z" fill="#fef3c7"/>
            <circle cx="22" cy="28" r="1.4" fill="#fff" opacity="0.8"/>
            <circle cx="32" cy="50" r="0.9" fill="#fff" opacity="0.6"/>
            <circle cx="20" cy="68" r="1.6" fill="#fff" opacity="0.9"/>
            <circle cx="34" cy="80" r="1" fill="#fff" opacity="0.5"/>`,
  },
  // 2 — Ember: amber→red bolt
  {
    name: 'Ember',
    stops: ['#fbbf24', '#b91c1c'],
    direction: 'v',
    glyph: `<path d="M58 16 L30 56 L46 56 L40 84 L70 42 L54 42 Z" fill="#fff"/>`,
  },
  // 3 — Frost: cyan→blue crystal
  {
    name: 'Frost',
    stops: ['#67e8f9', '#1d4ed8'],
    direction: 'v',
    glyph: `<path d="M50 18 L76 42 L50 82 L24 42 Z" fill="#fff" opacity="0.97"/>
            <path d="M50 18 L50 82 M24 42 L76 42 M36 30 L42 42 L50 82 M64 30 L58 42" stroke="#0c4a6e" stroke-width="1.2" fill="none" opacity="0.35"/>`,
  },
  // 4 — Verdant: emerald leaf
  {
    name: 'Verdant',
    stops: ['#34d399', '#065f46'],
    glyph: `<path d="M28 72 Q28 28 72 28 Q72 72 28 72 Z" fill="#fff" opacity="0.95"/>
            <path d="M28 72 L72 28" stroke="#065f46" stroke-width="2" stroke-linecap="round"/>`,
  },
  // 5 — Solstice: gold radial sun
  {
    name: 'Solstice',
    stops: ['#fde047', '#b45309'],
    radial: true,
    glyph: `<g stroke="#fff" stroke-width="3.5" stroke-linecap="round">
              <line x1="50" y1="10" x2="50" y2="22"/>
              <line x1="50" y1="78" x2="50" y2="90"/>
              <line x1="10" y1="50" x2="22" y2="50"/>
              <line x1="78" y1="50" x2="90" y2="50"/>
              <line x1="22" y1="22" x2="30" y2="30"/>
              <line x1="70" y1="70" x2="78" y2="78"/>
              <line x1="22" y1="78" x2="30" y2="70"/>
              <line x1="70" y1="30" x2="78" y2="22"/>
            </g>
            <circle cx="50" cy="50" r="20" fill="#fff"/>`,
  },
  // 6 — Twilight: pink→purple comet
  {
    name: 'Twilight',
    stops: ['#f472b6', '#6d28d9'],
    glyph: `<circle cx="70" cy="32" r="9" fill="#fff"/>
            <path d="M64 38 L22 80" stroke="#fff" stroke-width="6.5" stroke-linecap="round" opacity="0.85"/>
            <path d="M60 38 L18 76" stroke="#fff" stroke-width="3.5" stroke-linecap="round" opacity="0.45"/>`,
  },
  // 7 — Void: navy→black infinity
  {
    name: 'Void',
    stops: ['#1e293b', '#000000'],
    radial: true,
    glyph: `<path d="M28 50 Q28 34 42 34 Q52 34 58 50 Q64 66 72 66 Q84 66 84 50 Q84 34 72 34 Q64 34 58 50 Q52 66 42 66 Q28 66 28 50 Z" fill="none" stroke="#a855f7" stroke-width="4.5" stroke-linecap="round"/>`,
  },
  // 8 — Bloom: rose lotus
  {
    name: 'Bloom',
    stops: ['#fda4af', '#9f1239'],
    direction: 'v',
    glyph: `<g fill="#fff" opacity="0.95">
              <ellipse cx="50" cy="32" rx="9" ry="16"/>
              <ellipse cx="50" cy="68" rx="9" ry="16"/>
              <ellipse cx="32" cy="50" rx="16" ry="9"/>
              <ellipse cx="68" cy="50" rx="16" ry="9"/>
            </g>
            <circle cx="50" cy="50" r="7" fill="#fbbf24"/>`,
  },
  // 9 — Cosmic: purple→pink constellation
  {
    name: 'Cosmic',
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
