import React from 'react';
import MathText from './MathText';

// The SAT Math reference sheet (as in Bluebook): figures, formulas and the three facts.

const L = ({ x, y, children, anchor = 'middle' }) => (
  <text x={x} y={y} textAnchor={anchor} className="ref-l">{children}</text>
);
const Dot = ({ x, y }) => <circle cx={x} cy={y} r="1.8" className="ref-dot" />;
const RightMark = ({ x, y, dx = 8, dy = -8 }) => <path d={`M${x + dx} ${y} V${y + dy} H${x}`} className="ref-thin" />;

const FIGS = [
  {
    key: 'circle',
    svg: (
      <svg viewBox="0 0 120 100">
        <circle cx="60" cy="50" r="38" className="ref-shape" />
        <Dot x={60} y={50} /><line x1="60" y1="50" x2="98" y2="50" className="ref-shape" />
        <L x={79} y={45}>r</L>
      </svg>
    ),
    tex: String.raw`\(A=\pi r^2\)` + '\n' + String.raw`\(C=2\pi r\)`,
  },
  {
    key: 'rect',
    svg: (
      <svg viewBox="0 0 120 100">
        <rect x="12" y="24" width="90" height="52" className="ref-shape" />
        <L x={57} y={92}>ℓ</L><L x={112} y={54}>w</L>
      </svg>
    ),
    tex: String.raw`\(A=\ell w\)`,
  },
  {
    key: 'tri',
    svg: (
      <svg viewBox="0 0 120 100">
        <polygon points="10,80 110,80 78,16" className="ref-shape" />
        <line x1="78" y1="16" x2="78" y2="80" className="ref-dash" />
        <RightMark x={78} y={80} dx={-8} />
        <L x={86} y={54}>h</L><L x={60} y={96}>b</L>
      </svg>
    ),
    tex: String.raw`\(A=\tfrac{1}{2}bh\)`,
  },
  {
    key: 'right',
    svg: (
      <svg viewBox="0 0 120 100">
        <polygon points="20,80 104,80 20,18" className="ref-shape" />
        <RightMark x={20} y={80} />
        <L x={62} y={96}>b</L><L x={10} y={53}>a</L><L x={68} y={44}>c</L>
      </svg>
    ),
    tex: String.raw`\(c^2=a^2+b^2\)`,
  },
  {
    key: 'special',
    wide: true,
    svg: (
      <svg viewBox="0 0 240 100">
        <polygon points="20,82 112,82 20,28" className="ref-shape" />
        <RightMark x={20} y={82} />
        <L x={9} y={59}>x</L><L x={66} y={97}>x√3</L><L x={72} y={46}>2x</L>
        <L x={24} y={50} anchor="start">60°</L><L x={78} y={78} anchor="start">30°</L>
        <polygon points="150,82 218,82 150,14" className="ref-shape" />
        <RightMark x={150} y={82} />
        <L x={141} y={52}>s</L><L x={184} y={97}>s</L><L x={196} y={44} anchor="start">s√2</L>
        <L x={153} y={36} anchor="start">45°</L><L x={192} y={78} anchor="start">45°</L>
      </svg>
    ),
    tex: '',
    caption: 'Special Right Triangles',
  },
  {
    key: 'prism',
    svg: (
      <svg viewBox="0 0 120 100">
        <rect x="14" y="36" width="66" height="48" className="ref-shape" />
        <path d="M14 36 L38 16 H104 V64 L80 84 M80 36 L104 16" className="ref-shape" />
        <path d="M14 84 L38 64 H104 M38 64 V16" className="ref-dash" />
        <L x={47} y={97}>ℓ</L><L x={98} y={82} anchor="start">w</L><L x={112} y={42} anchor="start">h</L>
      </svg>
    ),
    tex: String.raw`\(V=\ell wh\)`,
  },
  {
    key: 'cyl',
    svg: (
      <svg viewBox="0 0 120 100">
        <ellipse cx="60" cy="20" rx="34" ry="9" className="ref-shape" />
        <path d="M26 20 V80 A34 9 0 0 0 94 80 V20" className="ref-shape" />
        <path d="M26 80 A34 9 0 0 1 94 80" className="ref-dash" />
        <Dot x={60} y={20} /><line x1="60" y1="20" x2="94" y2="20" className="ref-shape" />
        <L x={77} y={16}>r</L><L x={102} y={54} anchor="start">h</L>
      </svg>
    ),
    tex: String.raw`\(V=\pi r^2h\)`,
  },
  {
    key: 'sphere',
    svg: (
      <svg viewBox="0 0 120 100">
        <circle cx="60" cy="50" r="38" className="ref-shape" />
        <path d="M22 50 A38 10 0 0 0 98 50" className="ref-shape" />
        <path d="M22 50 A38 10 0 0 1 98 50" className="ref-dash" />
        <Dot x={60} y={50} /><line x1="60" y1="50" x2="98" y2="50" className="ref-shape" />
        <L x={79} y={45}>r</L>
      </svg>
    ),
    tex: String.raw`\(V=\tfrac{4}{3}\pi r^3\)`,
  },
  {
    key: 'cone',
    svg: (
      <svg viewBox="0 0 120 100">
        <path d="M22 80 L60 12 L98 80" className="ref-shape" />
        <path d="M22 80 A38 9 0 0 0 98 80" className="ref-shape" />
        <path d="M22 80 A38 9 0 0 1 98 80" className="ref-dash" />
        <line x1="60" y1="12" x2="60" y2="80" className="ref-dash" />
        <Dot x={60} y={80} /><line x1="60" y1="80" x2="98" y2="80" className="ref-dash" />
        <RightMark x={60} y={80} dx={7} dy={-7} />
        <L x={52} y={52}>h</L><L x={80} y={76}>r</L>
      </svg>
    ),
    tex: String.raw`\(V=\tfrac{1}{3}\pi r^2h\)`,
  },
  {
    key: 'pyramid',
    svg: (
      <svg viewBox="0 0 120 100">
        <path d="M14 84 H82 L106 64 M14 84 L60 14 L82 84 M60 14 L106 64" className="ref-shape" />
        <path d="M14 84 L38 64 H106 M38 64 L60 14" className="ref-dash" />
        <line x1="60" y1="14" x2="60" y2="74" className="ref-dash" />
        <Dot x={60} y={74} />
        <L x={48} y={97}>ℓ</L><L x={100} y={82} anchor="start">w</L><L x={66} y={50} anchor="start">h</L>
      </svg>
    ),
    tex: String.raw`\(V=\tfrac{1}{3}\ell wh\)`,
  },
];

export default function ReferenceSheet() {
  return (
    <div className="ref">
      <div className="ref-grid">
        {FIGS.map((f) => (
          <figure key={f.key} className={`ref-fig${f.wide ? ' is-wide' : ''}`}>
            {f.svg}
            <figcaption>{f.caption ? <span className="ref-cap">{f.caption}</span> : f.tex.split('\n').map((t) => <MathText key={t} text={t} />)}</figcaption>
          </figure>
        ))}
      </div>
      <div className="ref-facts">
        <p>The number of degrees of arc in a circle is 360.</p>
        <p>The number of radians of arc in a circle is <MathText text={String.raw`\(2\pi\)`} />.</p>
        <p>The sum of the measures in degrees of the angles of a triangle is 180.</p>
      </div>
    </div>
  );
}
