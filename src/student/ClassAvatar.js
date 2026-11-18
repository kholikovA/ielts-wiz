import React from 'react';

// Deterministic generated picture for a class: the same name always gets the
// same gradient, pattern and initials. No storage, no uploads.

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function classInitials(name) {
  const words = String(name || '').trim().split(/\s+/).filter(Boolean);
  if (!words.length) return '?';
  if (/^\d+$/.test(words[0])) return words[0].slice(0, 2);
  const letters = words.slice(0, 2).map((w) => Array.from(w)[0]);
  return letters.join('').toUpperCase();
}

const PATTERNS = 4;

export default function ClassAvatar({ name, size = 40, className = '' }) {
  const key = String(name || '').trim().toLowerCase();
  const h = hash(key);
  const hue = h % 360;
  const hue2 = (hue + 35 + ((h >>> 9) % 50)) % 360;
  const pattern = (h >>> 3) % PATTERNS;
  const rot = (h >>> 13) % 360;
  const id = `ca-${h.toString(36)}`;
  const text = classInitials(name);

  let shapes;
  switch (pattern) {
    case 0: // two soft circles
      shapes = (<>
        <circle cx="34" cy="6" r="16" fill="#fff" opacity="0.18" />
        <circle cx="4" cy="38" r="12" fill="#fff" opacity="0.12" />
      </>);
      break;
    case 1: // diagonal bands
      shapes = (<g transform={`rotate(${rot % 90 + 20} 20 20)`}>
        <rect x="-10" y="6" width="60" height="6" fill="#fff" opacity="0.14" />
        <rect x="-10" y="24" width="60" height="10" fill="#fff" opacity="0.1" />
      </g>);
      break;
    case 2: // quarter rings
      shapes = (<>
        <circle cx="40" cy="40" r="22" fill="none" stroke="#fff" strokeWidth="5" opacity="0.16" />
        <circle cx="40" cy="40" r="11" fill="#fff" opacity="0.12" />
      </>);
      break;
    default: // tilted square
      shapes = (<g transform={`rotate(${rot} 30 10)`}>
        <rect x="18" y="-2" width="24" height="24" rx="5" fill="#fff" opacity="0.16" />
        <rect x="-6" y="28" width="14" height="14" rx="3" fill="#fff" opacity="0.12" />
      </g>);
  }

  return (
    <svg className={`class-avatar ${className}`.trim()} width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={`hsl(${hue} 68% 58%)`} />
          <stop offset="1" stopColor={`hsl(${hue2} 64% 44%)`} />
        </linearGradient>
        <clipPath id={`${id}-c`}><rect width="40" height="40" rx="10" /></clipPath>
      </defs>
      <g clipPath={`url(#${id}-c)`}>
        <rect width="40" height="40" fill={`url(#${id})`} />
        {shapes}
      </g>
      <text x="20" y="20" dy="0.35em" textAnchor="middle" fill="#fff"
        fontSize={text.length > 1 ? 15 : 18} fontWeight="650"
        fontFamily="inherit" style={{ letterSpacing: '0.01em' }}>{text}</text>
    </svg>
  );
}
