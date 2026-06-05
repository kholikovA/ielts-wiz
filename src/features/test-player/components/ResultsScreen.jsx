import React, { useMemo, useState } from 'react';
import { buildLabelResolver } from './review';

// Faithful port of the standalone HTML's renderResults: overall tier card with a
// magical decoration, icon-only counts, per-passage colour cards, a hat coaching
// line, and collapsible per-passage question lists.

const TIER_DECO = {
  low: "<svg viewBox='0 0 200 120' preserveAspectRatio='xMidYMid slice' xmlns='http://www.w3.org/2000/svg'><g fill='#ffffff' fill-opacity='0.12'><path d='M150 40 l3 8.6 8.6 3 -8.6 3 -3 8.6 -3 -8.6 -8.6 -3 8.6 -3 z'/><circle cx='40' cy='44' r='1.7'/><circle cx='30' cy='82' r='1.4'/><circle cx='172' cy='84' r='1.6'/><circle cx='96' cy='26' r='1.3'/></g></svg>",
  mid: "<svg viewBox='0 0 200 120' preserveAspectRatio='xMidYMid slice' xmlns='http://www.w3.org/2000/svg'><g fill='#ffffff' fill-opacity='0.13'><path d='M46 32 a21 21 0 1 0 0 42 a16 16 0 1 1 0 -42 z'/><path d='M150 40 l2.4 6.8 6.8 2.4 -6.8 2.4 -2.4 6.8 -2.4 -6.8 -6.8 -2.4 6.8 -2.4 z'/><circle cx='168' cy='80' r='2'/><circle cx='120' cy='26' r='1.5'/></g></svg>",
  high: "<svg viewBox='0 0 200 120' preserveAspectRatio='xMidYMid slice' xmlns='http://www.w3.org/2000/svg'><g fill='#ffffff' fill-opacity='0.14'><path d='M42 42 l2.8 8 8 2.8 -8 2.8 -2.8 8 -2.8 -8 -8 -2.8 8 -2.8 z'/><path d='M158 38 l2 5.6 5.6 2 -5.6 2 -2 5.6 -2 -5.6 -5.6 -2 5.6 -2 z'/><path d='M150 86 l1.5 4.2 4.2 1.5 -4.2 1.5 -1.5 4.2 -1.5 -4.2 -4.2 -1.5 4.2 -1.5 z'/><circle cx='30' cy='84' r='2'/><circle cx='110' cy='24' r='1.5'/><circle cx='180' cy='68' r='1.6'/></g></svg>",
  elite: "<svg viewBox='0 0 200 120' preserveAspectRatio='xMidYMid slice' xmlns='http://www.w3.org/2000/svg'><g fill='#ffffff' fill-opacity='0.13'><path d='M150 26 L182 84 H118 Z'/><rect x='114' y='84' width='72' height='9' rx='4.5'/></g><g fill='#fcd34d' fill-opacity='0.32'><path d='M44 42 l2.6 7.2 7.2 2.6 -7.2 2.6 -2.6 7.2 -2.6 -7.2 -7.2 -2.6 7.2 -2.6 z'/><path d='M26 80 l1.8 5 5 1.8 -5 1.8 -1.8 5 -1.8 -5 -5 -1.8 5 -1.8 z'/><path d='M74 24 l1.5 4.2 4.2 1.5 -4.2 1.5 -1.5 4.2 -1.5 -4.2 -4.2 -1.5 4.2 -1.5 z'/><circle cx='150' cy='62' r='1.8'/><circle cx='104' cy='44' r='1.4'/></g></svg>",
};
const Svg = ({ html }) => <span className="stat-deco" dangerouslySetInnerHTML={{ __html: html }} />;

const CountIcon = {
  correct: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
  wrong: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" /></svg>,
  unanswered: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="8" y1="12" x2="16" y2="12" /></svg>,
};
const Chev = () => <svg className="qreview-chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>;
const Hat = () => <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true"><path d="M16 3 L25 24 H7 Z" /><rect x="5" y="24" width="22" height="3.4" rx="1.7" /><circle cx="16" cy="15" r="1.2" /><circle cx="13.5" cy="19" r="0.9" /><circle cx="19" cy="18" r="0.8" /></svg>;

const tierFor = (band, ratio, isFull) => {
  if (isFull && band != null) {
    if (band >= 8.5) return 'elite';
    if (band >= 7) return 'high';
    if (band >= 5.5) return 'mid';
    return 'low';
  }
  if (ratio >= 0.9) return 'elite';
  if (ratio >= 0.75) return 'high';
  if (ratio >= 0.55) return 'mid';
  return 'low';
};
const colorFor = (ratio) => (ratio >= 0.7 ? 'green' : ratio >= 0.5 ? 'yellow' : 'red');

// Build the ordered render units for a part: mcq_multi groups collapse to one row.
function partUnits(part, byQ) {
  const units = [];
  const multiQnums = new Set();
  part.question_groups.forEach((g) => {
    if (g.type === 'mcq_multi') {
      const qns = g.questions.map((q) => q.number).sort((a, b) => a - b);
      qns.forEach((n) => multiQnums.add(n));
      const correctLetters = qns.map((n) => byQ[n]?.correctAns).filter(Boolean);
      const userLetters = String(byQ[qns[0]]?.userAns || '').split(',').map((s) => s.trim()).filter(Boolean);
      const hits = userLetters.filter((l) => correctLetters.includes(l)).length;
      units.push({
        multi: true,
        range: qns.length > 1 ? `${qns[0]}–${qns[qns.length - 1]}` : `${qns[0]}`,
        userLetters, correctLetters, hits, size: qns.length, primary: qns[0],
      });
    }
  });
  part.question_groups.forEach((g) => g.questions.forEach((q) => {
    if (!multiQnums.has(q.number) && byQ[q.number]) units.push({ multi: false, r: byQ[q.number] });
  }));
  return units.sort((a, b) => (a.multi ? a.primary : a.r.q) - (b.multi ? b.primary : b.r.q));
}

function PassageGroup({ part, units, correctInPart, total, resolver }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`qreview-group${open ? ' open' : ''}`}>
      <button type="button" className="qreview-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Chev />
        <span className="qreview-title">Passage {part.part_number}</span>
        <span className="qreview-count">{correctInPart} / {total} correct</span>
      </button>
      {open && (
        <div className="qreview-body">
          {units.map((u) => {
            if (u.multi) {
              const gcls = u.hits === u.size ? 'correct' : 'wrong';
              return (
                <div className={`result-item ${gcls}`} key={`m${u.primary}`}>
                  <div className={`result-num ${gcls}`}>{u.range}</div>
                  <div className="result-detail">
                    <span className="label">Your answers:</span> {u.userLetters.join(', ') || <em style={{ color: 'var(--text-muted)' }}>No answer</em>}<br />
                    <span className="label">Correct:</span> <span className="correct-answer">{u.correctLetters.join(', ')}</span> <span style={{ color: 'var(--text-muted)' }}>({u.hits}/{u.size})</span>
                  </div>
                </div>
              );
            }
            const r = u.r;
            const cls = r.unanswered ? 'unanswered' : r.correct ? 'correct' : 'wrong';
            const numCls = r.unanswered ? '' : cls;
            return (
              <div className={`result-item ${cls}`} key={r.q}>
                <div className={`result-num ${numCls}`}>{r.q}</div>
                <div className="result-detail">
                  {r.unanswered
                    ? <><span className="label">Your answer:</span> <em style={{ color: 'var(--text-muted)' }}>No answer</em></>
                    : <><span className="label">Your answer:</span> <span className={`your-answer ${r.correct ? '' : 'wrong'}`}>{resolver(r.q, r.userAns)}</span></>}
                  <br />
                  <span className="label">Correct:</span> <span className="correct-answer">{resolver(r.q, r.correctAns)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ResultsScreen({ grade, spec, banner, onReviewInContext, onDownloadImage, onRetake }) {
  const { correct, total, band, results } = grade;
  const isFull = total >= 40;
  const wrong = results.filter((r) => !r.correct && !r.unanswered).length;
  const unanswered = results.filter((r) => r.unanswered).length;
  const ratio = total ? correct / total : 0;
  const tier = tierFor(band, ratio, isFull);
  const resolver = useMemo(() => buildLabelResolver(spec), [spec]);

  const byQ = useMemo(() => {
    const m = {}; results.forEach((r) => { m[r.q] = r; }); return m;
  }, [results]);
  const partOf = useMemo(() => {
    const m = {};
    spec.parts.forEach((p) => p.question_groups.forEach((g) => g.questions.forEach((q) => { m[q.number] = p.part_number; })));
    return m;
  }, [spec]);

  const passages = spec.parts.map((p) => {
    const rows = results.filter((r) => partOf[r.q] === p.part_number);
    const c = rows.filter((r) => r.correct).length;
    return { part: p, units: partUnits(p, byQ), correctInPart: c, total: rows.length, color: colorFor(rows.length ? c / rows.length : 0), mistakes: rows.length - c };
  });

  const bigNum = isFull ? (band != null ? band.toFixed(1) : '—') : `${correct} / ${total}`;
  const bigLabel = isFull ? 'Band Score' : 'Correct';

  let line;
  if (isFull && band != null) {
    if (band >= 8) line = <><strong>Outstanding.</strong> Expert-level — you're exam-ready.</>;
    else if (band >= 7) line = <><strong>Strong work.</strong> A Band 7+ is what most universities ask for.</>;
    else if (band >= 6) line = <><strong>Solid.</strong> You're close — tightening a couple of question types lifts you to 7.</>;
    else if (band >= 5) line = <><strong>Good progress.</strong> Aim your next sessions at the parts that cost you most.</>;
    else line = <><strong>Every attempt builds the muscle.</strong> Review the misses below and go again.</>;
  } else if (ratio >= 0.9) line = <><strong>Sharp</strong> — nearly flawless. On to the next one.</>;
  else if (ratio >= 0.7) line = <><strong>Nice work.</strong> A few slips to clean up — see below.</>;
  else if (ratio >= 0.5) line = <><strong>Decent base.</strong> The review below shows exactly where to focus.</>;
  else line = <><strong>Good for showing up.</strong> Work the misses, then retake — it climbs fast.</>;
  const worst = passages.slice().sort((a, b) => b.mistakes - a.mistakes)[0];
  const worstLine = worst && worst.mistakes > 0 ? ` Passage ${worst.part.part_number} needs another pass.` : '';

  return (
    <div className="results-screen open" data-testid="results">
      <div className="results-actions-top">
        {onReviewInContext && (
          <button className="results-action-btn" onClick={onReviewInContext}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            Review in context
          </button>
        )}
        <div className="results-actions-top-right">
          {onDownloadImage && (
            <button className="results-action-btn results-action-btn-primary" onClick={onDownloadImage}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
              Download image
            </button>
          )}
          {onRetake && (
            <button className="results-action-btn" onClick={onRetake}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
              Done
            </button>
          )}
        </div>
      </div>

      <div className="results-header">
        <h1>{banner ? 'Reviewing your attempt' : 'Test Complete'}</h1>
        <div className="results-stats">
          <div className={`overall-card tier-${tier}`}>
            <Svg html={TIER_DECO[tier]} />
            <div className="overall-main">
              <div className="overall-score" data-testid="overall-score">{bigNum}</div>
              <span className="overall-score-label">{bigLabel}</span>
            </div>
            <div className="overall-counts">
              <div className="count-row correct">{CountIcon.correct}<span data-testid="count-correct">{correct}</span></div>
              <div className="count-row wrong">{CountIcon.wrong}<span>{wrong}</span></div>
              <div className="count-row unanswered">{CountIcon.unanswered}<span>{unanswered}</span></div>
            </div>
          </div>
          {passages.length > 0 && (
            <div className="passage-column">
              {passages.map((ps) => (
                <div className={`stat passage ${ps.color}`} key={ps.part.part_number}>
                  <div className="stat-value">{ps.correctInPart} / {ps.total}</div>
                  <div className="stat-label">Passage {ps.part.part_number}</div>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="results-message"><Hat /><span>{line}{worstLine}</span></p>
        {banner && <p className="results-message" style={{ opacity: 0.8 }}>{banner}</p>}
      </div>

      <div className="results-list">
        {passages.map((ps) => (
          <PassageGroup key={ps.part.part_number} part={ps.part} units={ps.units} correctInPart={ps.correctInPart} total={ps.total} resolver={resolver} />
        ))}
      </div>
    </div>
  );
}
