import React, { useId } from 'react';

// The IELTS Wiz logo: a "W" that climbs into a spark, on an indigo tile, with
// the wordmark beside it. The same drawing is in public/favicon.svg and
// public/logo*.svg (for places that need a file).
export function LogoMark({ size = 32, className }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={className} width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="IELTS Wiz" style={{ flexShrink: 0, display: 'block' }}>
      <defs>
        <linearGradient id={`${id}g`} x1="6" y1="2" x2="42" y2="46" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#818cf8" /><stop offset=".55" stopColor="#4f46e5" /><stop offset="1" stopColor="#3730a3" />
        </linearGradient>
        <radialGradient id={`${id}h`} cx="14" cy="8" r="30" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#fff" stopOpacity=".3" /><stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="48" height="48" rx="13" fill={`url(#${id}g)`} />
      <rect width="48" height="48" rx="13" fill={`url(#${id}h)`} />
      <path d="M10.5 17.5 16.6 33 24 21.5 31.4 33 35.6 21.2" fill="none" stroke="#fff" strokeWidth="4.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M37.2 7.2c.5 3.4 1.9 4.8 5.3 5.3-3.4.5-4.8 1.9-5.3 5.3-.5-3.4-1.9-4.8-5.3-5.3 3.4-.5 4.8-1.9 5.3-5.3Z" fill="#fcd34d" />
    </svg>
  );
}

// Mark + wordmark. `tag` adds a small second line (e.g. "Student Hub").
export default function Brand({ size = 32, tag, className = '' }) {
  return (
    <span className={`brand ${className}`.trim()} style={{ display: 'inline-flex', alignItems: 'center', gap: Math.round(size * 0.3), color: 'inherit' }}>
      <LogoMark size={size} />
      <span className="brand-text" style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1, minWidth: 0 }}>
        <span className="brand-word" style={{ fontSize: Math.round(size * 0.56), fontWeight: 700, letterSpacing: '-0.03em', whiteSpace: 'nowrap' }}>
          <span style={{ fontWeight: 500, opacity: 0.62, letterSpacing: '-0.015em' }}>IELTS</span> Wiz
        </span>
        {tag && <span className="brand-tag" style={{ fontSize: Math.max(10, Math.round(size * 0.34)), fontWeight: 500, opacity: 0.55, letterSpacing: '0.01em', marginTop: 2 }}>{tag}</span>}
      </span>
    </span>
  );
}
