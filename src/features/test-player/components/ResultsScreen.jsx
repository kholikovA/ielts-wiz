import React from 'react';

const fmt = (v) => (Array.isArray(v) ? v.join(', ') : v == null ? '' : String(v));

const tierFor = (band, ratio) => {
  const r = band != null ? band / 9 : ratio;
  if (r >= 0.85) return 'elite';
  if (r >= 0.72) return 'high';
  if (r >= 0.55) return 'mid';
  return 'low';
};

// Post-submit results: the headline overall card (score / band + counts) plus a
// per-question review list. (The collapsible per-passage grouping and inline
// in-context markers are a follow-up; this is the same data, flat.)
export default function ResultsScreen({ grade, title, onRetake }) {
  const { correct, total, band, results } = grade;
  const wrong = results.filter((r) => !r.correct && !r.unanswered).length;
  const unanswered = results.filter((r) => r.unanswered).length;
  const tier = tierFor(band, correct / total);

  return (
    <div className="results-screen open" data-testid="results">
      <div className="results-header">
        <h1>Test Complete</h1>
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
        <p className="results-message">{correct} of {total} correct{title ? ` — ${title}` : ''}.</p>
        {onRetake && (
          <button className="btn-primary" onClick={onRetake} style={{ marginTop: 12 }}>Retake</button>
        )}
      </div>
      <div className="results-list">
        {results.map((r) => (
          <div key={r.q} className={`result-marker ${r.unanswered ? 'unanswered' : r.correct ? 'correct' : 'wrong'}`}>
            <span className="label">Q{r.q}</span>
            {r.unanswered ? (
              <span><em>No answer</em> &middot; Correct: <span className="correct-answer">{fmt(r.correctAns)}</span></span>
            ) : r.correct ? (
              <span><span className="your-answer">{fmt(r.userAns)}</span> &middot; ✓</span>
            ) : (
              <span><span className="your-answer strike">{fmt(r.userAns)}</span> &middot; Correct: <span className="correct-answer">{fmt(r.correctAns)}</span></span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
