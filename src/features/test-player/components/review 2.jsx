import React from 'react';

const stripTags = (s) => String(s).replace(/<[^>]+>/g, '');

// Resolve an answer value to display text. For matching headings / sentence
// endings the stored value is a bank id/letter — show the heading/ending text.
export function buildLabelResolver(spec) {
  const byQnum = {};
  spec.parts.forEach((part) => {
    part.question_groups.forEach((g) => {
      if (g.type === 'matching_headings' || g.type === 'sentence_endings') {
        const labels = {};
        (g.heading_bank || g.ending_bank || []).forEach((it) => { labels[it.id ?? it.letter] = it.text; });
        g.questions.forEach((q) => { byQnum[q.number] = labels; });
      }
    });
  });
  return (qnum, value) => {
    if (value == null || value === '') return '';
    const v = Array.isArray(value) ? value.join(', ') : String(value);
    const labels = byQnum[qnum];
    if (labels && labels[v] != null) return stripTags(labels[v]);
    return v;
  };
}

// One per-question result line (Q#, your answer vs correct). Same look as the
// standalone HTML's result-marker.
export function ResultMarker({ r, resolver }) {
  const cls = r.unanswered ? 'unanswered' : r.correct ? 'correct' : 'wrong';
  const correctTxt = resolver(r.q, r.correctAns);
  const userTxt = resolver(r.q, r.userAns);
  return (
    <div className={`result-marker ${cls}`}>
      <span className="label">Q{r.q}</span>
      {r.unanswered ? (
        <span><em>No answer</em> &middot; Correct: <span className="correct-answer">{correctTxt}</span></span>
      ) : r.correct ? (
        <span><span className="your-answer">{userTxt}</span> &middot; ✓</span>
      ) : (
        <span><span className="your-answer strike">{userTxt}</span> &middot; Correct: <span className="correct-answer">{correctTxt}</span></span>
      )}
    </div>
  );
}
