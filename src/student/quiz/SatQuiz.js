import React, { useEffect, useMemo, useState } from 'react';
import Icon from '../../components/ui/icons';
import MathText from './MathText';
import { numbering } from './quiz';

// SAT-style (Bluebook-like) screens for quizzes with payload.style === 'sat':
//   SatTake    one question at a time, Mark for Review, question navigator, Check Your Work
//   SatResults score + question map; answers and explanations only behind Review and analyze
//   SatReview  the same layout, read-only, with the correct answer and the explanation

const LETTERS = 'ABCDEFGHIJ';
const flat = (payload) => payload.sections.flatMap((s) => s.questions);
const answeredOf = (q, v) => (q.type === 'mcq' ? Array.isArray(v) && v.length > 0 : String(v ?? '').trim() !== '');

// What a student may type in a student-produced response (like the real test).
const cleanSpr = (s) => String(s).replace(/[^0-9./-]/g, '').slice(0, 6);

function Choices({ q, value, onPick, review }) {
  const picked = Array.isArray(value) ? value : [];
  const key = review?.key || [];
  return (
    <div className="sat-choices" role="radiogroup">
      {q.options.map((o, i) => {
        const on = picked.includes(i);
        const state = review ? (key.includes(i) ? ' is-key' : on ? ' is-wrong' : '') : '';
        return (
          <button key={i} type="button" role="radio" aria-checked={on} disabled={Boolean(review)}
            className={`sat-choice${on ? ' is-on' : ''}${state}`} onClick={() => onPick?.([i])}>
            <span className="sat-letter">{LETTERS[i]}</span>
            <MathText text={o} className="sat-choice-text" />
            {review && key.includes(i) && <span className="sat-tag sat-tag--key">Correct answer</span>}
            {review && on && !key.includes(i) && <span className="sat-tag sat-tag--you">Your answer</span>}
            {review && on && key.includes(i) && <span className="sat-tag sat-tag--you">Your answer</span>}
          </button>
        );
      })}
    </div>
  );
}

function Spr({ value, onChange, review }) {
  const v = String(value ?? '');
  return (
    <div className="sat-spr">
      <input className={`sat-spr-input${review ? (review.ok ? ' is-key' : ' is-wrong') : ''}`} value={v} readOnly={Boolean(review)}
        onChange={(e) => onChange?.(cleanSpr(e.target.value))} inputMode="decimal" autoComplete="off" spellCheck={false}
        aria-label="Your answer" placeholder={review ? '' : ''} />
      {!review && <div className="sat-preview"><span>Answer Preview:</span> {v ? <MathText text={v.includes('/') ? `\\(\\dfrac{${v.split('/')[0]}}{${v.split('/')[1] || '\\,'}}\\)` : v} /> : null}</div>}
      {review && (
        <div className="sat-spr-review">
          <span><strong>Your answer:</strong> {v || 'Omitted'}</span>
          <span><strong>Correct answers:</strong> {(review.key || []).join(', ')}</span>
        </div>
      )}
      {!review && (
        <ul className="sat-spr-help">
          <li>Enter one answer. If you find more than one correct answer, enter only one.</li>
          <li>You can enter up to 5 characters for a positive answer and up to 6 characters (including the negative sign) for a negative answer.</li>
          <li>If your answer is a fraction that doesn't fit, enter the decimal equivalent. Don't enter symbols such as a percent sign, comma, or dollar sign.</li>
        </ul>
      )}
    </div>
  );
}

function Question({ q, n, value, setValue, marked, onMark, review }) {
  return (
    <article className="sat-q">
      <div className="sat-qbar">
        <span className="sat-qnum">{n}</span>
        {onMark ? (
          <button type="button" className={`sat-mark${marked ? ' is-on' : ''}`} onClick={onMark} aria-pressed={marked}>
            <Icon name="flag" size={15} /> {marked ? 'Marked for Review' : 'Mark for Review'}
          </button>
        ) : review && (
          <span className={`sat-verdict ${review.state}`}>
            <Icon name={review.state === 'is-ok' ? 'checkCircle' : 'xCircle'} size={15} />
            {review.state === 'is-ok' ? 'Correct' : review.state === 'is-omit' ? 'Omitted' : 'Incorrect'}
          </span>
        )}
      </div>
      <div className="sat-qbody">
        {q.image && <img className="sat-figure" src={q.image} alt="Figure for this question" />}
        <MathText block text={q.prompt} className="sat-prompt" />
        {q.type === 'mcq'
          ? <Choices q={q} value={value} onPick={setValue} review={review && { key: review.key }} />
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
}

// Grid of question numbers (navigator, Check Your Work, results).
function Grid({ items, current, onGo }) {
  return (
    <div className="sat-grid">
      {items.map((it, i) => (
        <button key={it.id} type="button" className={`sat-cell ${it.cls || ''}${i === current ? ' is-current' : ''}`} onClick={() => onGo?.(i)}
          aria-label={`Question ${i + 1}${it.label ? `, ${it.label}` : ''}`}>
          {i === current && <Icon name="target" size={11} className="sat-cell-pin" />}
          {it.flag && <Icon name="flag" size={11} className="sat-cell-flag" />}
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

function Calculator({ open, onClose }) {
  const [pos, setPos] = useState({ x: 24, y: 84 });
  const [wide, setWide] = useState(false);
  const [failed, setFailed] = useState(null);
  const host = React.useRef(null);
  const calc = React.useRef(null);
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
  useEffect(() => { if (open) calc.current?.resize?.(); }, [open, wide]);
  const toggleWide = () => setWide((w) => {
    const next = !w;
    if (next) setPos((p) => ({ x: Math.max(8, Math.min(p.x, window.innerWidth - Math.min(820, window.innerWidth - 32) - 8)), y: p.y }));
    return next;
  });
  const startDrag = (e) => {
    if (e.target.closest('button')) return;
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
  return (
    <div className={`sat-calc${wide ? ' is-wide' : ''}`} hidden={!open} style={{ left: pos.x, top: pos.y }} role="dialog" aria-label="Desmos graphing calculator">
      <div className="sat-calc-head" onPointerDown={startDrag}>
        <strong>Calculator</strong>
        <span className="sat-calc-tools">
          <button type="button" onClick={toggleWide} aria-label={wide ? 'Make smaller' : 'Make larger'} title={wide ? 'Make smaller' : 'Make larger'}>
            <Icon name={wide ? 'minimize' : 'maximize'} size={15} />
          </button>
          <button type="button" onClick={onClose} aria-label="Close calculator" title="Close"><Icon name="close" size={16} /></button>
        </span>
      </div>
      <div className="sat-calc-frame" ref={host}>
        {failed && <p className="sat-calc-error">{failed}</p>}
      </div>
    </div>
  );
}

function CalcButton({ open, onToggle }) {
  return (
    <button type="button" className={`sat-tool${open ? ' is-on' : ''}`} onClick={onToggle} aria-pressed={open}>
      <Icon name="calculator" size={18} /><span>Calculator</span>
    </button>
  );
}

function Shell({ title, right, children, footer }) {
  const [calc, setCalc] = useState(null); // null = never opened; then true/false
  return (
    <div className="sat">
      <header className="sat-top">
        <div className="sat-title"><strong>{title}</strong><small>Math</small></div>
        <div className="sat-top-right">
          <CalcButton open={Boolean(calc)} onToggle={() => setCalc((c) => !c)} />
          {right}
        </div>
      </header>
      <main className="sat-main">{children}</main>
      <footer className="sat-foot">{footer}</footer>
      {calc !== null && <Calculator open={calc} onClose={() => setCalc(false)} />}
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

export function SatTake({ a, answers, setAnswer, onSubmit, busy, warning }) {
  const qs = useMemo(() => flat(a.payload), [a.payload]);
  const [i, setI] = useIndex(`iw.v1.hub.sat.${a.id}`, qs.length + 1);
  const [navOpen, setNavOpen] = useState(false);
  const markKey = `iw.v1.hub.satmark.${a.id}`;
  const [marked, setMarked] = useState(() => {
    try { return new Set(JSON.parse(localStorage.getItem(markKey)) || []); } catch { return new Set(); }
  });
  useEffect(() => { try { localStorage.setItem(markKey, JSON.stringify([...marked])); } catch { /* storage off */ } }, [marked, markKey]);
  useEffect(() => { document.querySelector('.sat-main')?.scrollTo?.(0, 0); }, [i]);

  const checking = i >= qs.length;
  const q = qs[Math.min(i, qs.length - 1)];
  const toggleMark = (id) => setMarked((m) => { const n = new Set(m); if (n.has(id)) n.delete(id); else n.add(id); return n; });
  const cells = qs.map((x) => ({ id: x.id, cls: answeredOf(x, answers[x.id]) ? 'is-answered' : 'is-empty', flag: marked.has(x.id) }));
  const go = (k) => { setI(k); setNavOpen(false); };

  return (
    <Shell
      title={a.title}
      right={warning}
      footer={(
        <>
          <span className="sat-foot-left" />
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
                <span><Icon name="target" size={12} /> Current</span><span><i className="sat-sw is-empty" /> Unanswered</span><span><Icon name="flag" size={12} /> For Review</span>
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
          <p>Questions you haven't answered or marked for review are shown below. Select a question to go back to it. When you're ready, select Submit.</p>
          <div className="sat-check-card">
            <div className="sat-check-head">
              <strong>{a.title}</strong>
              <div className="sat-legend"><span><i className="sat-sw is-empty" /> Unanswered</span><span><Icon name="flag" size={12} /> For Review</span></div>
            </div>
            <Grid items={cells} current={-1} onGo={go} />
          </div>
        </div>
      ) : (
        <Question key={q.id} q={q} n={i + 1} value={answers[q.id]} setValue={(v) => setAnswer(q.id, v)}
          marked={marked.has(q.id)} onMark={() => toggleMark(q.id)} />
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
        right={<button type="button" className="sat-btn sat-btn--ghost" onClick={onClose}>Exit review</button>}
        footer={(
          <>
            <span className="sat-foot-left" />
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

export function SatResults({ a, sub, keyData, marks, submittedLabel }) {
  const qs = useMemo(() => flat(a.payload), [a.payload]);
  const [review, setReview] = useState(null);
  const answers = sub?.data?.answers || {};
  const states = qs.map((x) => stateOf(x, answers[x.id], marks.items[x.id]));
  const correct = states.filter((s) => s === 'is-ok').length;
  const wrong = states.filter((s) => s === 'is-no').length;
  const omitted = states.filter((s) => s === 'is-omit').length;
  return (
    <>
      <section className="card sat-result">
        <div className="sat-result-score">
          <span className="eyebrow">Your score</span>
          <strong><span>{correct}</span> / {qs.length}</strong>
          <small>{Math.round((correct / (qs.length || 1)) * 100)}% correct{submittedLabel ? ` · ${submittedLabel}` : ''}</small>
        </div>
        <ul className="sat-result-stats">
          <li className="is-ok"><strong>{correct}</strong> correct</li>
          <li className="is-no"><strong>{wrong}</strong> incorrect</li>
          <li className="is-omit"><strong>{omitted}</strong> omitted</li>
        </ul>
        <div className="sat-result-grid">
          <Grid items={qs.map((x, i) => ({ id: x.id, cls: states[i] }))} current={-1} onGo={(i) => setReview(i)} />
          <div className="sat-legend"><span><i className="sat-sw is-ok" /> Correct</span><span><i className="sat-sw is-no" /> Incorrect</span><span><i className="sat-sw is-omit" /> Omitted</span></div>
        </div>
        <button type="button" className="btn btn-primary sat-result-btn" onClick={() => setReview(0)}>
          <Icon name="bookOpen" size={16} /> Review and analyze
        </button>
        <p className="form-help">Correct answers and explanations are in Review and analyze.</p>
      </section>
      {review != null && <SatReview a={a} answers={answers} keyData={keyData} marks={marks} startAt={review} onClose={() => setReview(null)} />}
    </>
  );
}
