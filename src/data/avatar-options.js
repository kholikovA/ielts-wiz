// 10 wizard-themed profile avatars, generated inline as SVG data URIs so they
// ship with the JS bundle (no network call, no broken images, no third-party
// CDN). Each variant uses a different skin tone, hairstyle, hat colour, and
// accent (star/moon, glasses, beard) so users actually pick a distinct one.

const WIZARDS = [
  // 5 masculine-coded
  { skin: '#f3d2a8', hat: '#7c3aed', hair: 'short', hairColor: '#1f2937', accent: 'star', beard: false },
  { skin: '#d4a373', hat: '#1e40af', hair: 'short', hairColor: '#7c2d12', accent: 'moon', beard: true  },
  { skin: '#fae0c1', hat: '#059669', hair: 'short', hairColor: '#d97706', accent: 'star', beard: false, glasses: true },
  { skin: '#a47148', hat: '#b91c1c', hair: 'bald',  hairColor: '#000000', accent: 'moon', beard: true  },
  { skin: '#e8c39e', hat: '#d97706', hair: 'short', hairColor: '#374151', accent: 'star', beard: false },
  // 5 feminine-coded
  { skin: '#f3d2a8', hat: '#db2777', hair: 'long',  hairColor: '#1f2937', accent: 'star' },
  { skin: '#d4a373', hat: '#0891b2', hair: 'long',  hairColor: '#92400e', accent: 'moon' },
  { skin: '#fae0c1', hat: '#7c3aed', hair: 'bangs', hairColor: '#374151', accent: 'star', glasses: true },
  { skin: '#e8c39e', hat: '#16a34a', hair: 'curly', hairColor: '#7c2d12', accent: 'moon' },
  { skin: '#a47148', hat: '#a855f7', hair: 'pony',  hairColor: '#1f2937', accent: 'star' },
];

const hairPath = (style, color) => {
  switch (style) {
    case 'short':
      return `<path d="M28 50 Q28 35 50 35 Q72 35 72 50 L72 55 L62 50 Q50 45 38 50 L28 55 Z" fill="${color}"/>`;
    case 'bald':
      return '';
    case 'long':
      return `<path d="M22 50 Q22 32 50 32 Q78 32 78 50 L78 80 L70 76 L70 55 Q60 50 50 50 Q40 50 30 55 L30 76 L22 80 Z" fill="${color}"/>`;
    case 'bangs':
      return `<path d="M28 50 Q28 32 50 32 Q72 32 72 50 L66 55 Q50 42 34 55 Z" fill="${color}"/>`;
    case 'curly':
      return `<g fill="${color}"><circle cx="32" cy="48" r="8"/><circle cx="42" cy="42" r="9"/><circle cx="50" cy="40" r="9"/><circle cx="58" cy="42" r="9"/><circle cx="68" cy="48" r="8"/></g>`;
    case 'pony':
      return `<path d="M28 50 Q28 35 50 35 Q72 35 72 50 L72 55 L62 50 Q50 45 38 50 L28 55 Z M70 50 Q80 60 78 75 L72 73 L70 60 Z" fill="${color}"/>`;
    default:
      return '';
  }
};

const accentPath = (kind) => {
  if (kind === 'star') {
    return `<path d="M50 14 L52 19 L57 19 L53 22 L55 27 L50 24 L45 27 L47 22 L43 19 L48 19 Z" fill="#fcd34d"/>`;
  }
  if (kind === 'moon') {
    return `<path d="M48 16 a5 5 0 1 0 5 7 a3.5 3.5 0 1 1 -5 -7 Z" fill="#fcd34d"/>`;
  }
  return '';
};

const beardPath = (color) =>
  `<path d="M36 72 Q40 84 50 86 Q60 84 64 72 Q60 78 50 78 Q40 78 36 72 Z" fill="${color}"/>`;

const glassesPath = () =>
  `<g stroke="#1f2937" stroke-width="2" fill="none"><circle cx="42" cy="62" r="5"/><circle cx="58" cy="62" r="5"/><path d="M47 62 L53 62"/></g>`;

const buildWizardSvg = (w) => {
  const bg = '#0f0a1f';
  const hatBand = '#fbbf24';
  const head  = `<circle cx="50" cy="65" r="22" fill="${w.skin}"/>`;
  const eyes  = `<circle cx="42" cy="62" r="2" fill="#1f2937"/><circle cx="58" cy="62" r="2" fill="#1f2937"/>`;
  const mouth = `<path d="M44 73 Q50 76 56 73" stroke="#1f2937" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
  const hat   = `
    <path d="M28 50 L50 8 L72 50 Z" fill="${w.hat}"/>
    <ellipse cx="50" cy="50" rx="24" ry="4" fill="${hatBand}"/>
    ${accentPath(w.accent)}
  `;
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="${bg}"/>
    ${hairPath(w.hair, w.hairColor)}
    ${head}
    ${w.beard ? beardPath(w.hairColor) : ''}
    ${eyes}
    ${mouth}
    ${w.glasses ? glassesPath() : ''}
    ${hat}
  </svg>`;
};

// URI-encoded (not base64) — smaller payload, renders identically.
const toDataUri = (svg) =>
  `data:image/svg+xml;utf8,${encodeURIComponent(svg.replace(/\s+/g, ' ').trim())}`;

const AVATAR_OPTIONS = WIZARDS.map(w => toDataUri(buildWizardSvg(w)));

export default AVATAR_OPTIONS;
