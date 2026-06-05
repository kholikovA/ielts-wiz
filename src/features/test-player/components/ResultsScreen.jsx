import React, { useMemo, useState } from 'react';
import { buildLabelResolver, ResultMarker } from './review';

const tierFor = (band, ratio) => {
  const r = band != null ? band / 9 : ratio;
  if (r >= 0.85) return 'elite';
  if (r >= 0.72) return 'high';
  if (r >= 0.55) return 'mid';
  return 'low';
};

function PassageGroup({ part, rows, resolver, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen);
  const correct = rows.filter((r) => r.correct).length;
  return (
    <div className="qreview-group">
      <button type="button" className="qreview-toggle" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <span>Reading Passage {part.part_number}{part.passage_title ? ` — ${part.passage_title}` : ''}</span>
        <span style={{ fontVariantNumeric: 'tabular-nums', opacity: 0.8 }}>{correct}/{rows.length}</span>
      </button>
      {open && (
        <div className="qreview-body">
          {rows.map((r) => <ResultMarker key={r.q} r={r} resolver={resolver} />)}
        </div>
      )}
    </div>
  );
}

// Post-submit results: overall card (score / band + counts) and a collapsible
// per-passage review of every question.
export default function ResultsScreen({ grade, spec, banner, onReviewInContext, onDownloadImage, onRetake }) {
  const { correct, total, band, results } = grade;
  const wrong = results.filter((r) => !r.correct && !r.unanswered).length;
  const unanswered = results.filter((r) => r.unanswered).length;
  const tier = tierFor(band, correct / total);
  const resolver = useMemo(() => buildLabelResolver(spec), [spec]);

  const partOf = useMemo(() => {
    const m = {};
    spec.parts.forEach((p) => p.question_groups.forEach((g) => g.questions.forEach((q) => { m[q.number] = p.part_number; })));
    return m;
  }, [spec]);
  const byPart = spec.parts.map((p) => ({ part: p, rows: results.filter((r) => partOf[r.q] === p.part_number) }));

  return (
    <div className="results-screen open" data-testid="results">
      <div className="results-actions-top">
        {onReviewInContext && (
          <button className="results-action-btn" onClick={onReviewInContext}>Review in context</button>
        )}
        <div className="results-actions-top-right">
          {onDownloadImage && (
            <button className="results-action-btn results-action-btn-primary" onClick={onDownloadImage}>Download image</button>
          )}
          {onRetake && <button className="results-action-btn" onClick={onRetake}>Done</button>}
        </div>
      </div>

      <div className="results-header">
        <h1>{banner ? 'Reviewing your attempt' : 'Test Complete'}</h1>
        {banner && <p className="results-message" style={{ opacity: 0.8 }}>{banner}</p>}
        <div className="results-stats">
          <div className={`overall-card tier-${tier}`}>
            <div className="overall-main">
              <div className="overall-score" data-testid="overall-score">
                {band != null ? band.toFixed(1) : `${Math.round((100 * correct) / total)}%`}
              </div>
              <div className="overall-score-label">{band != null ? 'Band score' : 'Score'}</div>
            </div>
            <div className="overall-counts">
              <div className="count-row correct"><span>Correct</span><strong data-testid="count-correct">{correct}</strong></div>
              <div className="count-row wrong"><span>Incorrect</span><strong>{wrong}</strong></div>
              <div className="count-row unanswered"><span>Unanswered</span><strong>{unanswered}</strong></div>
            </div>
          </div>
        </div>
        <p className="results-message">{correct} of {total} correct.</p>
      </div>

      <div className="results-list">
        {byPart.map(({ part, rows }, i) => (
          <PassageGroup key={part.part_number} part={part} rows={rows} resolver={resolver} defaultOpen={i === 0} />
        ))}
      </div>
    </div>
  );
}
