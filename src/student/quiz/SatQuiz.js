import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../../components/ui/icons';
import MathText from './MathText';
import ReferenceSheet from './SatReference';
import { numbering } from './quiz';
import { useHub } from '../ui';

// SAT-style screens for quizzes with payload.style === 'sat', modelled on Bluebook:
//   SatTake    one question at a time: timer, Directions, Calculator (Desmos), Reference,
//              More (Line Reader, shortcuts), Mark for Review, answer eliminator (ABC),
//              question navigator, Check Your Work
//   SatResults score + question map; answers and explanations only behind Review and analyze
//   SatReview  the same layout, read-only, with the correct answer and the explanation

const LETTERS = 'ABCDEFGHIJ';
const flat = (payload) => payload.sections.flatMap((s) => s.questions);
const answeredOf = (q, v) => (q.type === 'mcq' ? Array.isArray(v) && v.length > 0 : String(v ?? '').trim() !== '');

// What a student may type in a student-produced response (like the real test).
const cleanSpr = (s) => String(s).replace(/[^0-9./-]/g, '').slice(0, 6);

const DIRECTIONS = String.raw`The questions in this section address a number of important math skills. Use of a calculator is permitted for all questions. A reference sheet, calculator, and these directions can be accessed throughout the test.

Unless otherwise indicated:
• All variables and expressions represent real numbers.
• Figures provided are drawn to scale.
• All figures lie in a plane.
• The domain of a given function \(f\) is the set of all real numbers \(x\) for which \(f(x)\) is a real number.

For multiple-choice questions, solve each problem and choose the correct answer from the choices provided. Each multiple-choice question has a single correct answer.

For student-produced response questions, solve each problem and enter your answer as described below.
• If you find more than one correct answer, enter only one answer.
• You can enter up to 5 characters for a positive answer and up to 6 characters (including the negative sign) for a negative answer.
• If your answer is a fraction that doesn't fit in the provided space, enter the decimal equivalent.
• If your answer is a decimal that doesn't fit in the provided space, enter it by truncating or rounding at the fourth digit.
• If your answer is a mixed number (such as \(3\tfrac{1}{2}\)), enter it as an improper fraction (7/2) or its decimal equivalent (3.5).
• Don't enter symbols such as a percent sign, comma, or dollar sign.`;

const RW_DIRECTIONS = 'The questions in this section address a number of important reading and writing skills. Each question includes one or more passages, which may include a table or graph. Read each passage and question carefully, and then choose the best answer to the question based on the passage(s).\n\nAll questions in this section are multiple-choice with four answer choices. Each question has a single best answer.';

const SPR_EXAMPLES = [
  ['3.5', '3.5\n3.50\n7/2', '31/2\n3 1/2'],
  [String.raw`\(\dfrac{2}{3}\)`, '2/3\n.6666\n.6667\n0.666\n0.667', '0.66\n.66\n0.67\n.67'],
  [String.raw`\(-\dfrac{1}{3}\)`, '-1/3\n-.3333\n-0.333', '-.33\n-0.33'],
];

function SprDirections() {
  return (
    <aside className="sat-spr-dir">
      <h3>Student-produced response directions</h3>
      <ul>
        <li>If you find more than one correct answer, enter only one answer.</li>
        <li>You can enter up to 5 characters for a positive answer and up to 6 characters (including the negative sign) for a negative answer.</li>
        <li>If your answer is a fraction that doesn't fit in the provided space, enter the decimal equivalent.</li>
        <li>If your answer is a decimal that doesn't fit in the provided space, enter it by truncating or rounding at the fourth digit.</li>
        <li>If your answer is a mixed number (such as <MathText text={String.raw`\(3\tfrac{1}{2}\)`} />), enter it as an improper fraction (7/2) or its decimal equivalent (3.5).</li>
        <li>Don't enter symbols such as a percent sign, comma, or dollar sign.</li>
      </ul>
      <h4>Examples</h4>
      <table className="sat-spr-table">
        <thead><tr><th>Answer</th><th>Acceptable ways to enter answer</th><th>Unacceptable: will NOT receive credit</th></tr></thead>
        <tbody>
          {SPR_EXAMPLES.map(([a, ok, no]) => (
            <tr key={ok}><td><MathText text={a} /></td><td className="mono">{ok.split('\n').map((x) => <div key={x}>{x}</div>)}</td><td className="mono">{no.split('\n').map((x) => <div key={x}>{x}</div>)}</td></tr>
          ))}
        </tbody>
      </table>
    </aside>
  );
}

function Choices({ q, value, onPick, review, elim, onElim, eliminating }) {
  const picked = Array.isArray(value) ? value : [];
  const key = review?.key || [];
  const crossed = elim || [];
  return (
    <div className="sat-choices" role="radiogroup">
      {q.options.map((o, i) => {
        const on = picked.includes(i);
        const out = crossed.includes(i);
        const state = review ? (key.includes(i) ? ' is-key' : on ? ' is-wrong' : '') : '';
        return (
          <div key={i} className={`sat-choice-row${eliminating ? ' has-elim' : ''}`}>
            <button type="button" role="radio" aria-checked={on} disabled={Boolean(review)}
              className={`sat-choice${on ? ' is-on' : ''}${out && !review ? ' is-out' : ''}${state}`}
              onClick={() => { if (out) onElim?.(i, false); onPick?.([i]); }}>
              <span className="sat-letter">{LETTERS[i]}</span>
              <MathText text={o} className="sat-choice-text" />
              {review && key.includes(i) && <span className="sat-tag sat-tag--key">Correct answer</span>}
              {review && on && <span className="sat-tag sat-tag--you">Your answer</span>}
            </button>
            {eliminating && !review && (
              out
                ? <button type="button" className="sat-undo" onClick={() => onElim(i, false)}>Undo</button>
                : <button type="button" className="sat-strike" onClick={() => { onElim(i, true); if (on) onPick([]); }} aria-label={`Cross out choice ${LETTERS[i]}`}><span>{LETTERS[i]}</span></button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function sprPreview(v) {
  if (!v) return null;
  const neg = v.startsWith('-');
  const body = neg ? v.slice(1) : v;
  if (body.includes('/')) {
    const [n, d] = body.split('/');
    return `\\(${neg ? '-' : ''}\\dfrac{${n || '\\,'}}{${d || '\\,'}}\\)`;
  }
  return `\\(${v}\\)`;
}

function Spr({ value, onChange, review }) {
  const v = String(value ?? '');
  return (
    <div className="sat-spr">
      <input className={`sat-spr-input${review ? (review.ok ? ' is-key' : ' is-wrong') : ''}`} value={v} readOnly={Boolean(review)}
        onChange={(e) => onChange?.(cleanSpr(e.target.value))} inputMode="decimal" autoComplete="off" spellCheck={false} aria-label="Your answer" />
      {!review && <div className="sat-preview"><span>Answer Preview:</span> <MathText text={sprPreview(v)} /></div>}
      {review && (
        <div className="sat-spr-review">
          <span><strong>Your answer:</strong> {v || 'Omitted'}</span>
          <span><strong>Correct answers:</strong> {(review.key || []).join(', ')}</span>
        </div>
      )}
    </div>
  );
}

function Question({ q, n, value, setValue, marked, onMark, review, elim, onElim, eliminating, onToggleElim }) {
  const spr = q.type !== 'mcq';
  const content = (
    <article className="sat-q">
      <div className="sat-qbar">
        <span className="sat-qnum">{n}</span>
        {onMark ? (
          <button type="button" className={`sat-mark${marked ? ' is-on' : ''}`} onClick={onMark} aria-pressed={marked}>
            <Icon name="bookmark" size={16} /> Mark for Review
          </button>
        ) : review && (
          <span className={`sat-verdict ${review.state}`}>
            <Icon name={review.state === 'is-ok' ? 'checkCircle' : 'xCircle'} size={15} />
            {review.state === 'is-ok' ? 'Correct' : review.state === 'is-omit' ? 'Omitted' : 'Incorrect'}
          </span>
        )}
        {review && q.bank?.id && <span className="sat-qid">Question ID <code>{q.bank.id}</code></span>}
        {!spr && onToggleElim && (
          <button type="button" className={`sat-abc${eliminating ? ' is-on' : ''}`} onClick={onToggleElim} aria-pressed={eliminating}
            title="Cross out answer choices you think are wrong"><span>ABC</span></button>
        )}
      </div>
      <div className="sat-qbody">
        {q.image && <img className="sat-figure" src={q.image} alt="Figure for this question" />}
        <MathText block text={q.prompt} className="sat-prompt" />
        {!spr
          ? <Choices q={q} value={value} onPick={setValue} review={review && { key: review.key }} elim={elim} onElim={onElim} eliminating={eliminating} />
          : <Spr value={value} onChange={setValue} review={review && { key: review.key, ok: review.state === 'is-ok' }} />}
        {review?.explanation && (
          <section className="sat-explain" aria-label="Explanation">
            <h3>Explanation</h3>
            <MathText block text={review.explanation} />
          </section>
        )}
      </div>
    </article>
  );
  if (q.passage) {
    return (
      <div className="sat-rw">
        <div className="sat-rw-passage"><MathText block text={q.passage} /></div>
        <div className="sat-rw-q">{content}</div>
      </div>
    );
  }
  if (!spr || review) return content;
  return <div className="sat-spr-layout"><SprDirections />{content}</div>;
}

// Grid of question numbers (navigator, Check Your Work, results).
function Grid({ items, current, onGo }) {
  return (
    <div className="sat-grid">
      {items.map((it, i) => (
        <button key={it.id} type="button" className={`sat-cell ${it.cls || ''}${i === current ? ' is-current' : ''}`} onClick={() => onGo?.(i)}
          aria-label={`Question ${i + 1}${it.label ? `, ${it.label}` : ''}`}>
          {i === current && <Icon name="target" size={11} className="sat-cell-pin" />}
          {it.flag && <Icon name="bookmark" size={12} className="sat-cell-flag" />}
          {i + 1}
        </button>
      ))}
    </div>
  );
}

// Desmos graphing calculator in a floating window (as in Bluebook): drag it by its
// header, widen it, close it. It stays mounted once opened, so graphs survive
// moving between questions. Uses the Desmos API (the desmos.com app won't run in
// an iframe); set REACT_APP_DESMOS_API_KEY to your own key from desmos.com/api.
const DESMOS_KEY = process.env.REACT_APP_DESMOS_API_KEY || 'dcb31709b452b1cf9dc26972add0fda6';
let desmosLoading = null;
function loadDesmos() {
  if (window.Desmos) return Promise.resolve(window.Desmos);
  if (!desmosLoading) {
    desmosLoading = new Promise((resolve, reject) => {
      const el = document.createElement('script');
      el.src = `https://www.desmos.com/api/v1.11/calculator.js?apiKey=${DESMOS_KEY}`;
      el.async = true;
      el.onload = () => resolve(window.Desmos);
      el.onerror = () => { desmosLoading = null; reject(new Error('The calculator could not load. Check your connection.')); };
      document.head.appendChild(el);
    });
  }
  return desmosLoading;
}

// Calculator layout: docked beside the question (split screen, draggable divider,
// left or right) or floating (draggable window). Remembered per device.
const CALC_PREFS = 'iw.v1.hub.satcalc';
const readPrefs = () => {
  try { return { mode: 'dock', side: 'left', pct: 50, ...JSON.parse(localStorage.getItem(CALC_PREFS)) }; } catch { return { mode: 'dock', side: 'left', pct: 50 }; }
};

function Calculator({ open, onClose, prefs, setPrefs }) {
  const [pos, setPos] = useState({ x: 24, y: 84 });
  const [failed, setFailed] = useState(null);
  const host = React.useRef(null);
  const calc = React.useRef(null);
  const docked = prefs.mode === 'dock';
  useEffect(() => {
    let live = true;
    loadDesmos().then((Desmos) => {
      if (!live || !host.current || calc.current) return;
      calc.current = Desmos.GraphingCalculator(host.current, {
        keypad: true, expressions: true, settingsMenu: true, zoomButtons: true, expressionsTopbar: true,
        border: false, lockViewport: false, images: false, folders: false, notes: false, links: false,
      });
    }).catch((e) => live && setFailed(e.message));
    return () => { live = false; };
  }, []);
  useEffect(() => () => { calc.current?.destroy?.(); calc.current = null; }, []);
  useEffect(() => { if (open) requestAnimationFrame(() => calc.current?.resize?.()); }, [open, prefs.mode, prefs.side, prefs.pct]);
  const startDrag = (e) => {
    if (docked || e.target.closest('button')) return;
    const box = e.currentTarget.parentElement.getBoundingClientRect();
    const dx = e.clientX - box.left; const dy = e.clientY - box.top;
    const move = (ev) => {
      const maxX = window.innerWidth - 120; const maxY = window.innerHeight - 60;
      setPos({ x: Math.min(maxX, Math.max(0, ev.clientX - dx)), y: Math.min(maxY, Math.max(0, ev.clientY - dy)) });
    };
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  const tool = (icon, label, onClick) => (
    <button type="button" onClick={onClick} aria-label={label} title={label}><Icon name={icon} size={15} /></button>
  );
  return (
    <div className={`sat-calc ${docked ? 'is-docked' : 'is-floating'}`} hidden={!open} style={docked ? undefined : { left: pos.x, top: pos.y }}
      role="dialog" aria-label="Desmos graphing calculator">
      <div className="sat-calc-head" onPointerDown={startDrag}>
        <strong>Calculator</strong>
        <span className="sat-calc-tools">
          {docked && tool('swap', prefs.side === 'left' ? 'Move to the right' : 'Move to the left', () => setPrefs({ side: prefs.side === 'left' ? 'right' : 'left' }))}
          {docked ? tool('maximize', 'Pop out as a window', () => setPrefs({ mode: 'float' })) : tool('columns', 'Dock beside the question', () => setPrefs({ mode: 'dock' }))}
          {tool('close', 'Close calculator', onClose)}
        </span>
      </div>
      <div className="sat-calc-frame" ref={host}>
        {failed && <p className="sat-calc-error">{failed}</p>}
      </div>
    </div>
  );
}

function ToolButton({ icon, label, on, onClick }) {
  return (
    <button type="button" className={`sat-tool${on ? ' is-on' : ''}`} onClick={onClick} aria-pressed={Boolean(on)}>
      <Icon name={icon} size={18} /><span>{label}</span>
    </button>
  );
}

// A movable window (Reference sheet; Calculator in pop-out mode has its own).
function FloatPanel({ title, onClose, children, className = '', start = { x: null, y: 84 } }) {
  const [pos, setPos] = useState(() => ({ x: start.x ?? Math.max(16, window.innerWidth - 560), y: start.y }));
  const startDrag = (e) => {
    if (e.target.closest('button')) return;
    const box = e.currentTarget.parentElement.getBoundingClientRect();
    const dx = e.clientX - box.left; const dy = e.clientY - box.top;
    const move = (ev) => setPos({ x: Math.min(window.innerWidth - 120, Math.max(0, ev.clientX - dx)), y: Math.min(window.innerHeight - 60, Math.max(0, ev.clientY - dy)) });
    const up = () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  return (
    <div className={`sat-float ${className}`} style={{ left: pos.x, top: pos.y }} role="dialog" aria-label={title}>
      <div className="sat-calc-head" onPointerDown={startDrag}>
        <strong>{title}</strong>
        <span className="sat-calc-tools"><button type="button" onClick={onClose} aria-label={`Close ${title}`} title="Close"><Icon name="close" size={16} /></button></span>
      </div>
      <div className="sat-float-body">{children}</div>
    </div>
  );
}

// Line Reader: a bright band that follows the pointer; the rest is dimmed.
function LineReader() {
  const [y, setY] = useState(() => window.innerHeight / 2);
  useEffect(() => {
    const move = (e) => setY(e.clientY);
    window.addEventListener('pointermove', move);
    return () => window.removeEventListener('pointermove', move);
  }, []);
  const h = 72;
  return (
    <div className="sat-reader" aria-hidden="true">
      <div style={{ height: Math.max(0, y - h / 2) }} />
      <div className="sat-reader-band" style={{ height: h }} />
      <div className="sat-reader-rest" />
    </div>
  );
}

function Timer({ endsAt, onTimeUp }) {
  const [now, setNow] = useState(() => Date.now());
  const [hidden, setHidden] = useState(false);
  const [alert5, setAlert5] = useState(false);
  const fired = useRef(false);
  const warned = useRef(false);
  useEffect(() => { const t = setInterval(() => setNow(Date.now()), 500); return () => clearInterval(t); }, []);
  const left = Math.max(0, Math.ceil((endsAt - now) / 1000));
  useEffect(() => {
    if (left <= 300 && left > 0 && !warned.current) { warned.current = true; setAlert5(true); setHidden(false); setTimeout(() => setAlert5(false), 8000); }
    if (left === 0 && !fired.current) { fired.current = true; onTimeUp?.(); }
  }, [left, onTimeUp]);
  const mm = Math.floor(left / 60); const ss = String(left % 60).padStart(2, '0');
  return (
    <div className={`sat-timer${left <= 300 ? ' is-low' : ''}`}>
      {hidden ? <span className="sat-timer-hidden"><Icon name="clock" size={18} /></span> : <strong aria-live={left <= 300 ? 'polite' : 'off'}>{mm}:{ss}</strong>}
      <button type="button" className="sat-timer-btn" onClick={() => setHidden((h) => !h)}>{hidden ? 'Show' : 'Hide'}</button>
      {alert5 && <div className="sat-toast" role="alert">5 minutes remaining in this quiz.</div>}
    </div>
  );
}

function Shell({ title, timer, extra, children, footer, keys, subject = 'math' }) {
  const math = subject !== 'rw';
  const { profile } = useHub() || {};
  const [calc, setCalc] = useState(null); // null = never opened; then true/false
  const [refOpen, setRefOpen] = useState(false);
  const [dirOpen, setDirOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [reader, setReader] = useState(false);
  const [shortcuts, setShortcuts] = useState(false);
  const [prefs, setPrefsState] = useState(readPrefs);
  const setPrefs = (patch) => setPrefsState((p) => {
    const next = { ...p, ...patch };
    try { localStorage.setItem(CALC_PREFS, JSON.stringify(next)); } catch { /* storage off */ }
    return next;
  });
  const body = useRef(null);
  const split = Boolean(calc) && prefs.mode === 'dock';
  const dragDivider = (e) => {
    e.preventDefault();
    const box = body.current.getBoundingClientRect();
    document.body.classList.add('is-resizing');
    const move = (ev) => {
      const raw = prefs.side === 'left' ? (ev.clientX - box.left) / box.width : (box.right - ev.clientX) / box.width;
      setPrefs({ pct: Math.round(Math.min(70, Math.max(25, raw * 100))) });
    };
    const up = () => { document.body.classList.remove('is-resizing'); window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up); };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
  };
  // Keyboard shortcuts (Alt + key), as listed under More.
  const keysRef = useRef(keys);
  keysRef.current = keys;
  const mathRef = useRef(math);
  mathRef.current = math;
  useEffect(() => {
    const onKey = (e) => {
      if (!e.altKey || e.metaKey || e.ctrlKey) return;
      const k = e.key.toLowerCase();
      const map = {
        c: () => mathRef.current && setCalc((c) => !c), r: () => mathRef.current && setRefOpen((o) => !o), l: () => setReader((x) => !x),
        arrowright: keysRef.current?.next, arrowleft: keysRef.current?.prev, m: keysRef.current?.mark, x: keysRef.current?.elim,
      };
      const fn = map[k] || map[e.code === 'KeyC' ? 'c' : e.code === 'KeyR' ? 'r' : e.code === 'KeyL' ? 'l' : e.code === 'KeyM' ? 'm' : e.code === 'KeyX' ? 'x' : ''];
      if (fn) { e.preventDefault(); fn(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <div className="sat">
      <header className="sat-top">
        <div className="sat-title">
          <strong>{title}</strong>
          <small className="sat-subject">{math ? 'Math' : 'Reading and Writing'}</small>
          <button type="button" className="sat-dir-btn" onClick={() => setDirOpen((o) => !o)} aria-expanded={dirOpen}>
            Directions <Icon name="chevronDown" size={14} className={dirOpen ? 'is-up' : ''} />
          </button>
          {dirOpen && (
            <div className="sat-dir" role="dialog" aria-label="Directions">
              <MathText block text={math ? DIRECTIONS : RW_DIRECTIONS} />
              <div className="sat-dir-foot"><button type="button" className="sat-btn" onClick={() => setDirOpen(false)}>Close</button></div>
            </div>
          )}
        </div>
        <div className="sat-top-mid">{timer}</div>
        <div className="sat-top-right">
          {math && <ToolButton icon="calculator" label="Calculator" on={Boolean(calc)} onClick={() => setCalc((c) => !c)} />}
          {math && <ToolButton icon="formula" label="Reference" on={refOpen} onClick={() => setRefOpen((o) => !o)} />}
          <div className="sat-more-wrap">
            <ToolButton icon="moreVertical" label="More" on={moreOpen} onClick={() => setMoreOpen((o) => !o)} />
            {moreOpen && (
              <div className="sat-more" role="menu">
                <button type="button" role="menuitemcheckbox" aria-checked={reader} onClick={() => { setReader((x) => !x); setMoreOpen(false); }}>
                  <Icon name="lineReader" size={16} /> Line Reader {reader && <Icon name="check" size={14} />}
                </button>
                <button type="button" role="menuitem" onClick={() => { setShortcuts(true); setMoreOpen(false); }}>
                  <Icon name="command" size={16} /> Keyboard Shortcuts
                </button>
              </div>
            )}
          </div>
          {extra}
        </div>
      </header>
      <div ref={body} className={`sat-body${split ? ` is-split is-${prefs.side}` : ''}`} style={{ '--calc-pct': `${prefs.pct}%` }}>
        <main className="sat-main">{children}</main>
        {split && (
          <div className="sat-divider" role="separator" aria-orientation="vertical" aria-label="Resize calculator" tabIndex={0}
            onPointerDown={dragDivider}
            onKeyDown={(e) => {
              const step = (e.key === 'ArrowLeft' ? -5 : e.key === 'ArrowRight' ? 5 : 0) * (prefs.side === 'left' ? 1 : -1);
              if (step) setPrefs({ pct: Math.min(70, Math.max(25, prefs.pct + step)) });
            }}><span /></div>
        )}
        {calc !== null && <Calculator open={calc} onClose={() => setCalc(false)} prefs={prefs} setPrefs={setPrefs} />}
      </div>
      <footer className="sat-foot">
        <span className="sat-foot-left">{profile?.name || ''}</span>
        {footer}
      </footer>
      {refOpen && <FloatPanel title="Reference" className="sat-ref-panel" onClose={() => setRefOpen(false)}><ReferenceSheet /></FloatPanel>}
      {shortcuts && (
        <FloatPanel title="Keyboard Shortcuts" className="sat-keys-panel" start={{ x: null, y: 120 }} onClose={() => setShortcuts(false)}>
          <table className="sat-keys">
            <tbody>
              {[['Alt + →', 'Next question'], ['Alt + ←', 'Previous question'], ['Alt + M', 'Mark for Review'], ['Alt + X', 'Answer eliminator (ABC)'],
                ...(math ? [['Alt + C', 'Calculator'], ['Alt + R', 'Reference']] : []), ['Alt + L', 'Line Reader']].map(([k, d]) => <tr key={k}><td><kbd>{k}</kbd></td><td>{d}</td></tr>)}
            </tbody>
          </table>
        </FloatPanel>
      )}
      {reader && <LineReader />}
    </div>
  );
}

function useIndex(storeKey, count) {
  const [i, setI] = useState(() => {
    try { const v = Number(sessionStorage.getItem(storeKey)); return Number.isInteger(v) && v >= 0 && v < count ? v : 0; } catch { return 0; }
  });
  useEffect(() => { try { sessionStorage.setItem(storeKey, String(i)); } catch { /* storage off */ } }, [i, storeKey]);
  return [i, setI];
}

function useStoredSet(key) {
  const [set, setSet] = useState(() => { try { return new Set(JSON.parse(localStorage.getItem(key)) || []); } catch { return new Set(); } });
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify([...set])); } catch { /* storage off */ } }, [set, key]);
  return [set, setSet];
}

// Time limit: payload.time_limit_min, or the SAT Math pace (35 minutes per 22 questions). 0 = untimed.
export const satMinutes = (payload) => {
  const n = flat(payload).length;
  if (payload.time_limit_min != null) return Number(payload.time_limit_min);
  return Math.round(payload.subject === 'rw' ? (n * 32) / 27 : (n * 35) / 22);
};
export const satStartKey = (id) => `iw.v1.hub.satstart.${id}`;

export function SatTake({ a, answers, setAnswer, onSubmit, onTimeUp, busy, warning }) {
  const qs = useMemo(() => flat(a.payload), [a.payload]);
  const [i, setI] = useIndex(`iw.v1.hub.sat.${a.id}`, qs.length + 1);
  const [navOpen, setNavOpen] = useState(false);
  const [marked, setMarked] = useStoredSet(`iw.v1.hub.satmark.${a.id}`);
  const elimKey = `iw.v1.hub.satelim.${a.id}`;
  const [elim, setElim] = useState(() => { try { return JSON.parse(localStorage.getItem(elimKey)) || {}; } catch { return {}; } });
  useEffect(() => { try { localStorage.setItem(elimKey, JSON.stringify(elim)); } catch { /* storage off */ } }, [elim, elimKey]);
  const [eliminating, setEliminating] = useState(false);
  useEffect(() => { document.querySelector('.sat-main')?.scrollTo?.(0, 0); }, [i]);

  const minutes = satMinutes(a.payload);
  const [endsAt] = useState(() => {
    if (!minutes) return null;
    const key = satStartKey(a.id);
    let started = null;
    try { started = Number(localStorage.getItem(key)) || null; } catch { /* storage off */ }
    if (!started) { started = Date.now(); try { localStorage.setItem(key, String(started)); } catch { /* storage off */ } }
    return started + minutes * 60000;
  });

  const checking = i >= qs.length;
  const q = qs[Math.min(i, qs.length - 1)];
  const toggleMark = (id) => setMarked((m) => { const n = new Set(m); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const setOneElim = (qid, idx, on) => setElim((e) => {
    const cur = new Set(e[qid] || []);
    if (on) cur.add(idx); else cur.delete(idx);
    return { ...e, [qid]: [...cur] };
  });
  const cells = qs.map((x) => ({ id: x.id, cls: answeredOf(x, answers[x.id]) ? 'is-answered' : 'is-empty', flag: marked.has(x.id) }));
  const go = useCallback((k) => { setI(Math.max(0, Math.min(qs.length, k))); setNavOpen(false); }, [qs.length, setI]);
  const timeUp = useCallback(() => onTimeUp?.(), [onTimeUp]);

  return (
    <Shell
      title={a.title}
      subject={a.payload.subject}
      timer={endsAt ? <Timer endsAt={endsAt} onTimeUp={timeUp} /> : null}
      extra={warning}
      keys={{ next: () => go(i + 1), prev: () => go(i - 1), mark: () => !checking && toggleMark(q.id), elim: () => setEliminating((x) => !x) }}
      footer={(
        <>
          {!checking ? (
            <button type="button" className="sat-navbtn" onClick={() => setNavOpen((o) => !o)} aria-expanded={navOpen}>
              Question {i + 1} of {qs.length} <Icon name="chevronDown" size={14} className={navOpen ? 'is-up' : ''} />
            </button>
          ) : <span />}
          <div className="sat-foot-right">
            {i > 0 && <button type="button" className="sat-btn" onClick={() => go(i - 1)}>Back</button>}
            {!checking
              ? <button type="button" className="sat-btn" onClick={() => go(i + 1)}>Next</button>
              : <button type="button" className="sat-btn" disabled={busy} onClick={onSubmit}>{busy ? 'Submitting…' : 'Submit'}</button>}
          </div>
          {navOpen && !checking && (
            <div className="sat-nav" role="dialog" aria-label="Questions">
              <div className="sat-nav-head"><strong>{a.title}</strong><button type="button" className="hub-icon-btn" onClick={() => setNavOpen(false)} aria-label="Close"><Icon name="close" size={16} /></button></div>
              <div className="sat-legend">
                <span><Icon name="target" size={12} /> Current</span><span><i className="sat-sw is-empty" /> Unanswered</span><span><Icon name="bookmark" size={12} className="sat-red" /> For Review</span>
              </div>
              <Grid items={cells} current={i} onGo={go} />
              <button type="button" className="sat-btn sat-btn--ghost" onClick={() => go(qs.length)}>Go to Review Page</button>
            </div>
          )}
        </>
      )}
    >
      {checking ? (
        <div className="sat-check">
          <h2>Check Your Work</h2>
          <p>On test day, you won't be able to move on to the next module until time expires.</p>
          <p>For this quiz, select <strong>Submit</strong> when you're ready to finish.</p>
          <div className="sat-check-card">
            <div className="sat-check-head">
              <strong>{a.title}</strong>
              <div className="sat-legend"><span><i className="sat-sw is-empty" /> Unanswered</span><span><Icon name="bookmark" size={12} className="sat-red" /> For Review</span></div>
            </div>
            <Grid items={cells} current={-1} onGo={go} />
          </div>
        </div>
      ) : (
        <Question key={q.id} q={q} n={i + 1} value={answers[q.id]} setValue={(v) => setAnswer(q.id, v)}
          marked={marked.has(q.id)} onMark={() => toggleMark(q.id)}
          elim={elim[q.id]} onElim={(idx, on) => setOneElim(q.id, idx, on)} eliminating={eliminating} onToggleElim={() => setEliminating((x) => !x)} />
      )}
    </Shell>
  );
}

function stateOf(q, value, item) {
  if (!answeredOf(q, value)) return 'is-omit';
  return item && item.earned === item.possible ? 'is-ok' : 'is-no';
}

export function SatReview({ a, answers, keyData, marks, onClose, startAt = 0 }) {
  const qs = useMemo(() => flat(a.payload), [a.payload]);
  const nums = useMemo(() => numbering(a.payload), [a.payload]);
  const [i, setI] = useState(startAt);
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [onClose]);
  useEffect(() => { document.querySelector('.sat-overlay .sat-main')?.scrollTo?.(0, 0); }, [i]);
  const q = qs[i];
  const cells = qs.map((x) => {
    const st = stateOf(x, answers?.[x.id], marks.items[x.id]);
    return { id: x.id, cls: st, label: st === 'is-ok' ? 'correct' : st === 'is-omit' ? 'omitted' : 'incorrect' };
  });
  const go = (k) => { setI(k); setNavOpen(false); };
  return (
    <div className="sat-overlay" role="dialog" aria-label={`Review: ${a.title}`}>
      <Shell
        title={`${a.title} · Review`}
        subject={a.payload.subject}
        extra={<button type="button" className="sat-btn sat-btn--ghost sat-exit" onClick={onClose}>Exit review</button>}
        keys={{ next: () => go(Math.min(qs.length - 1, i + 1)), prev: () => go(Math.max(0, i - 1)) }}
        footer={(
          <>
            <button type="button" className="sat-navbtn" onClick={() => setNavOpen((o) => !o)} aria-expanded={navOpen}>
              Question {i + 1} of {qs.length} <Icon name="chevronDown" size={14} className={navOpen ? 'is-up' : ''} />
            </button>
            <div className="sat-foot-right">
              {i > 0 && <button type="button" className="sat-btn" onClick={() => go(i - 1)}>Back</button>}
              {i < qs.length - 1 && <button type="button" className="sat-btn" onClick={() => go(i + 1)}>Next</button>}
            </div>
            {navOpen && (
              <div className="sat-nav" role="dialog" aria-label="Questions">
                <div className="sat-nav-head"><strong>Your answers</strong><button type="button" className="hub-icon-btn" onClick={() => setNavOpen(false)} aria-label="Close"><Icon name="close" size={16} /></button></div>
                <div className="sat-legend"><span><i className="sat-sw is-ok" /> Correct</span><span><i className="sat-sw is-no" /> Incorrect</span><span><i className="sat-sw is-omit" /> Omitted</span></div>
                <Grid items={cells} current={i} onGo={go} />
              </div>
            )}
          </>
        )}
      >
        <Question key={q.id} q={q} n={nums[q.id].from} value={answers?.[q.id]}
          review={{ key: keyData[q.id], state: cells[i].cls, explanation: keyData._rationale?.[q.id] }} />
      </Shell>
    </div>
  );
}

// attempts: { used, max, history: [{ score, submitted_at }], reviewOpened } (optional)
export function SatResults({ a, sub, keyData, marks, submittedLabel, attempts, onRetry, onOpenReview }) {
  const qs = useMemo(() => flat(a.payload), [a.payload]);
  const [review, setReview] = useState(null);
  const [busy, setBusy] = useState(false);
  const answers = sub?.data?.answers || {};
  const states = qs.map((x) => stateOf(x, answers[x.id], marks.items[x.id]));
  const correct = states.filter((s) => s === 'is-ok').length;
  const wrong = states.filter((s) => s === 'is-no').length;
  const omitted = states.filter((s) => s === 'is-omit').length;
  const left = attempts ? Math.max(0, attempts.max - attempts.used) : 0;
  const locked = left > 0 && !attempts?.reviewOpened;
  const open = async (i) => {
    if (locked) {
      if (!await onOpenReview?.()) return;
    }
    setReview(i);
  };
  return (
    <>
      <section className="card sat-result">
        <div className="sat-result-score">
          <span className="eyebrow">{attempts?.max > 1 ? `Attempt ${attempts.used} of ${attempts.max}` : 'Your score'}</span>
          <strong><span>{correct}</span> / {qs.length}</strong>
          <small>{Math.round((correct / (qs.length || 1)) * 100)}% correct{submittedLabel ? ` · ${submittedLabel}` : ''}</small>
        </div>
        <ul className="sat-result-stats">
          <li className="is-ok"><strong>{correct}</strong> correct</li>
          <li className="is-no"><strong>{wrong}</strong> incorrect</li>
          <li className="is-omit"><strong>{omitted}</strong> omitted</li>
        </ul>
        <div className="sat-result-grid">
          <Grid items={qs.map((x, i) => ({ id: x.id, cls: states[i] }))} current={-1} onGo={open} />
          <div className="sat-legend"><span><i className="sat-sw is-ok" /> Correct</span><span><i className="sat-sw is-no" /> Incorrect</span><span><i className="sat-sw is-omit" /> Omitted</span></div>
        </div>
        {attempts?.history?.length > 0 && (
          <ul className="sat-attempts">
            {attempts.history.map((h, k) => (
              <li key={k}><span>Attempt {k + 1}</span><strong>{h.score ? `${h.score.earned} / ${h.score.possible}` : '—'}</strong></li>
            ))}
            <li className="is-current"><span>Attempt {attempts.history.length + 1}</span><strong>{marks.earned} / {marks.possible}</strong></li>
          </ul>
        )}
        <div className="sat-result-actions">
          {left > 0 && !attempts?.reviewOpened && onRetry && (
            <button type="button" className="btn btn-primary sat-result-btn" disabled={busy} onClick={async () => { setBusy(true); try { await onRetry(); } finally { setBusy(false); } }}>
              <Icon name="refresh" size={16} /> Try again ({left} attempt{left === 1 ? '' : 's'} left)
            </button>
          )}
          <button type="button" className={`btn ${locked ? 'btn-secondary' : 'btn-primary'} sat-result-btn`} onClick={() => open(0)}>
            <Icon name="bookOpen" size={16} /> Review and analyze
          </button>
        </div>
        <p className="form-help">
          {locked ? 'Correct answers and explanations are in Review and analyze. Opening them ends your remaining attempts.'
            : 'Correct answers and explanations are in Review and analyze.'}
        </p>
      </section>
      {review != null && <SatReview a={a} answers={answers} keyData={keyData} marks={marks} startAt={review} onClose={() => setReview(null)} />}
    </>
  );
}
