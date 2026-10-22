import React from 'react';

// Hub profile characters: flat, bold, friendly busts (Duolingo-ish, but with
// squircle tiles, rosy cheeks and simpler faces). Pure inline SVG, 120×120.
// Stored as profiles.avatar_character ('m1'…'m5', 'f1'…'f5'); never reorder ids.

const INK = '#1f2433';
const BLUSH = '#ff7a7a';

const Face = ({ cx = 60, cy = 56, open, glasses, freckles }) => (
  <>
    <ellipse cx={cx - 9} cy={cy} rx="3.3" ry="4.3" fill={INK} />
    <ellipse cx={cx + 9} cy={cy} rx="3.3" ry="4.3" fill={INK} />
    <circle cx={cx - 8} cy={cy - 1.6} r="1.1" fill="#fff" />
    <circle cx={cx + 10} cy={cy - 1.6} r="1.1" fill="#fff" />
    <circle cx={cx - 15} cy={cy + 8} r="4.2" fill={BLUSH} opacity="0.35" />
    <circle cx={cx + 15} cy={cy + 8} r="4.2" fill={BLUSH} opacity="0.35" />
    {freckles && (
      <g fill="#b9603a" opacity="0.7">
        <circle cx={cx - 17} cy={cy + 6} r="0.9" /><circle cx={cx - 14} cy={cy + 9} r="0.9" /><circle cx={cx - 19} cy={cy + 9.5} r="0.9" />
        <circle cx={cx + 17} cy={cy + 6} r="0.9" /><circle cx={cx + 14} cy={cy + 9} r="0.9" /><circle cx={cx + 19} cy={cy + 9.5} r="0.9" />
      </g>
    )}
    {open
      ? <path d={`M${cx - 7} ${cy + 9} Q${cx} ${cy + 17} ${cx + 7} ${cy + 9} Z`} fill="#7a2335" />
      : <path d={`M${cx - 6} ${cy + 10} Q${cx} ${cy + 15} ${cx + 6} ${cy + 10}`} fill="none" stroke={INK} strokeWidth="2.6" strokeLinecap="round" />}
    {glasses && (
      <g fill="none" stroke={INK} strokeWidth="2.4">
        <circle cx={cx - 9} cy={cy} r="7.5" fill="#fff" fillOpacity="0.18" />
        <circle cx={cx + 9} cy={cy} r="7.5" fill="#fff" fillOpacity="0.18" />
        <path d={`M${cx - 1.5} ${cy - 1} Q${cx} ${cy - 3} ${cx + 1.5} ${cy - 1}`} />
      </g>
    )}
  </>
);

// Shoulders, neck, head and ears in the given skin tone and top colour.
const Bust = ({ skin, top, collar }) => (
  <>
    <path d="M18 122 C18 98 36 88 60 88 C84 88 102 98 102 122 Z" fill={top} />
    {collar}
    <rect x="51" y="72" width="18" height="20" rx="7" fill={skin} />
    <rect x="51" y="72" width="18" height="20" rx="7" fill="#000" opacity="0.1" />
    <circle cx="36" cy="57" r="5.5" fill={skin} />
    <circle cx="84" cy="57" r="5.5" fill={skin} />
    <ellipse cx="60" cy="54" rx="24" ry="26" fill={skin} />
  </>
);

const SKIN = { fair: '#fde2cc', light: '#f6cfae', tan: '#dfa676', medium: '#c4865a', dark: '#8e5a3c', deep: '#6a3f28' };

export const CHARACTERS = [
  {
    id: 'm1', name: 'Leo', bg: '#2bb3a3',
    art: () => (
      <>
        <Bust skin={SKIN.light} top="#ff8a3d" collar={<path d="M44 90 Q60 104 76 90" fill="none" stroke="#e86f22" strokeWidth="5" strokeLinecap="round" />} />
        <path d="M35 53 C33 34 46 25 62 26 C77 27 87 37 85 53 C81 45 75 41 67 41 C58 41 48 39 42 35 C40 41 37 47 35 53 Z" fill="#6b3f22" />
        <path d="M47 33 C50 20 70 15 79 27 C71 24 61 27 55 36 Z" fill="#6b3f22" />
        <Face />
      </>
    ),
  },
  {
    id: 'm2', name: 'Kofi', bg: '#ffc845',
    art: () => (
      <>
        <Bust skin={SKIN.deep} top="#2f4b9a" collar={<path d="M48 89 L60 100 L72 89" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinejoin="round" />} />
        <path d="M36 47 L36 35 Q36 26 46 25 L74 25 Q84 26 84 35 L84 47 Q79 39 60 39 Q41 39 36 47 Z" fill="#17120f" />
        <Face glasses />
      </>
    ),
  },
  {
    id: 'm3', name: 'Arman', bg: '#8b7cf6',
    art: () => (
      <>
        <Bust skin={SKIN.tan} top="#f4f1ea" collar={<><path d="M44 88 L56 98 L52 104 Z M76 88 L64 98 L68 104 Z" fill="#dcd6c8" /><path d="M57 96 L63 96 L61 118 L59 118 Z" fill="#c2413b" /></>} />
        <path d="M36 51 C34 32 48 25 62 26 C77 27 87 38 84 51 C82 45 78 41 72 39 L47 39 C42 41 38 45 36 51 Z" fill="#221a16" />
        <path d="M35 55 C36 74 47 83 60 83 C73 83 84 74 85 55 C81 66 74 70 60 70 C46 70 39 66 35 55 Z" fill="#221a16" />
        <Face />
        <path d="M51 65 Q60 61 69 65 Q60 68 51 65 Z" fill="#221a16" />
      </>
    ),
  },
  {
    id: 'm4', name: 'Finn', bg: '#4cc46c',
    art: () => (
      <>
        <Bust skin={SKIN.fair} top="#ffffff" collar={<g fill="#2f6fde"><rect x="22" y="100" width="76" height="5" /><rect x="20" y="110" width="80" height="5" /></g>} />
        <g fill="#e2672c">
          <circle cx="40" cy="44" r="8" /><circle cx="47" cy="34" r="8.5" /><circle cx="58" cy="29" r="9" />
          <circle cx="70" cy="30" r="8.5" /><circle cx="79" cy="37" r="8" /><circle cx="83" cy="47" r="6.5" /><circle cx="37" cy="52" r="5.5" />
        </g>
        <Face freckles open />
      </>
    ),
  },
  {
    id: 'm5', name: 'Jun', bg: '#ff6f61',
    art: () => (
      <>
        <Bust skin={SKIN.light} top="#4a4f5e" />
        <path d="M40 98 C38 82 82 82 80 98" fill="none" stroke="#14161d" strokeWidth="4" />
        <rect x="33" y="92" width="11" height="14" rx="5" fill="#14161d" />
        <rect x="76" y="92" width="11" height="14" rx="5" fill="#14161d" />
        <path d="M35 54 C33 33 46 25 60 25 C75 25 87 33 85 54 L80 46 L74 51 L68 44 L62 50 L56 44 L50 50 L44 45 L40 50 Z" fill="#14161d" />
        <Face />
      </>
    ),
  },
  {
    id: 'f1', name: 'Mia', bg: '#b69cff',
    art: () => (
      <>
        <path d="M31 58 C29 30 45 21 60 21 C76 21 92 30 89 58 L92 100 L28 100 Z" fill="#7a4524" />
        <Bust skin={SKIN.light} top="#ef4f5e" />
        <path d="M33 70 L33 104 L44 104 L42 70 Z M87 70 L87 104 L76 104 L78 70 Z" fill="#7a4524" />
        <path d="M36 50 C35 32 47 25 60 25 C73 25 85 32 84 50 C78 42 70 37 62 40 C55 35 45 40 36 50 Z" fill="#8a5130" />
        <Face />
      </>
    ),
  },
  {
    id: 'f2', name: 'Amara', bg: '#ff9f43',
    art: () => (
      <>
        <g fill="#1d130d">
          <circle cx="60" cy="38" r="30" /><circle cx="36" cy="46" r="16" /><circle cx="84" cy="46" r="16" />
        </g>
        <Bust skin={SKIN.dark} top="#16a39a" />
        <path d="M36 47 C38 33 50 29 60 29 C70 29 82 33 84 47 C76 41 68 39 60 39 C52 39 44 41 36 47 Z" fill="#1d130d" />
        <circle cx="35" cy="66" r="4.5" fill="none" stroke="#ffd166" strokeWidth="2.2" />
        <circle cx="85" cy="66" r="4.5" fill="none" stroke="#ffd166" strokeWidth="2.2" />
        <Face open />
      </>
    ),
  },
  {
    id: 'f3', name: 'Layla', bg: '#ff8fb1',
    art: () => (
      <>
        <path d="M18 122 C18 98 36 88 60 88 C84 88 102 98 102 122 Z" fill="#3d4a8f" />
        <path d="M30 60 C30 29 44 19 60 19 C76 19 90 29 90 60 C93 86 84 106 60 112 C36 106 27 86 30 60 Z" fill="#1b9c80" />
        <ellipse cx="60" cy="58" rx="20" ry="23" fill={SKIN.medium} />
        <path d="M38 50 C42 36 50 32 60 32 C70 32 78 36 82 50 C76 42 68 39 60 39 C52 39 44 42 38 50 Z" fill="#16876f" />
        <Face cy={58} />
      </>
    ),
  },
  {
    id: 'f4', name: 'Sofia', bg: '#45b5ff',
    art: () => (
      <>
        <ellipse cx="88" cy="44" rx="10" ry="19" fill="#f2b632" transform="rotate(18 88 44)" />
        <Bust skin={SKIN.fair} top="#7c4ddb" />
        <path d="M36 52 C34 32 48 24 62 25 C76 26 87 36 84 51 C76 40 62 36 48 40 C42 42 38 46 36 52 Z" fill="#f6c23e" />
        <circle cx="80" cy="31" r="4" fill="#ff5d8f" />
        <Face open />
      </>
    ),
  },
  {
    id: 'f5', name: 'Aiko', bg: '#5fd3b8',
    art: () => (
      <>
        <path d="M31 60 C29 33 44 23 60 23 C76 23 91 33 89 60 L89 76 C82 78 78 74 78 70 L42 70 C42 74 38 78 31 76 Z" fill="#191623" />
        <Bust skin={SKIN.fair} top="#f2b84b" collar={<path d="M44 89 Q60 99 76 89" fill="none" stroke="#d99a2b" strokeWidth="5" strokeLinecap="round" />} />
        <path d="M35 47 C35 32 46 27 60 27 C74 27 85 32 85 47 C80 45 74 42 70 38 C64 44 50 46 35 47 Z" fill="#191623" />
        <rect x="71" y="35" width="10" height="4" rx="2" fill="#ff6b6b" transform="rotate(-20 76 37)" />
        <Face glasses />
      </>
    ),
  },
];

const BY_ID = new Map(CHARACTERS.map((c) => [c.id, c]));
export const characterById = (id) => BY_ID.get(id) || null;

export function Character({ id, size = 40, className = '' }) {
  const c = BY_ID.get(id);
  if (!c) return null;
  return (
    <svg className={`hub-char ${className}`.trim()} viewBox="0 0 120 120" width={size} height={size} role="img" aria-label={c.name}>
      <rect width="120" height="120" fill={c.bg} />
      {c.art()}
    </svg>
  );
}
