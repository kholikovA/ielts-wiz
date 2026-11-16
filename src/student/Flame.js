import React, { useId } from 'react';

// The streak flame. state: 'lit' | 'empty' (just the silhouette) | 'ignite'
// (starts as the silhouette, then catches fire). tone picks the colours;
// `alive` makes a lit flame flicker. Styles are in welcome.css.
const OUTER = 'M60 6C66 34 98 48 98 92a38 38 0 0 1-76 0c0-18 8-30 18-40 2 14 10 18 14 10 4-16-4-34 6-56Z';
const INNER = 'M60 62c4 16 20 22 20 42a20 20 0 0 1-40 0c0-12 8-18 12-26 2 6 6 4 8-16Z';

export default function Flame({ size = 40, state = 'lit', tone = 'attendance', alive = false, phase = 0 }) {
  const id = useId().replace(/:/g, '');
  return (
    <svg className={`flame flame--${tone} is-${state}${alive ? ' is-alive' : ''}`} viewBox="0 0 120 150"
      width={size} height={Math.round(size * 1.25)} style={{ '--phase': `${-phase * 0.37}s` }} aria-hidden="true">
      <defs>
        <linearGradient id={`${id}o`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="flame-s1" /><stop offset="1" className="flame-s2" /></linearGradient>
        <linearGradient id={`${id}i`} x1="0" y1="0" x2="0" y2="1"><stop offset="0" className="flame-s3" /><stop offset="1" className="flame-s4" /></linearGradient>
      </defs>
      <path className="flame-ghost" d={OUTER} />
      {state !== 'empty' && (
        <g className="flame-fire">
          <path fill={`url(#${id}o)`} d={OUTER} />
          <path className="flame-core" fill={`url(#${id}i)`} d={INNER} />
        </g>
      )}
    </svg>
  );
}
