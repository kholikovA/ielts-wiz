import React, { useMemo, useState } from 'react';
import { buildLabelResolver } from './review';
import { perTypeStats, generateFeedback } from '../grading';
import { submitTestReport } from '../../../lib/cloudSync';

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

const ICON = {
  report: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" /><line x1="4" y1="22" x2="4" y2="15" /></svg>,
  review: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7-11-7-11-7z" /><circle cx="12" cy="12" r="3" /></svg>,
  share: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" /></svg>,
  finish: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
};

const tierFor = (band, ratio, isFull) => {
  if (isFull && band != null) { if (band >= 8.5) return 'elite'; if (band >= 7) return 'high'; if (band >= 5.5) return 'mid'; return 'low'; }
  if (ratio >= 0.9) return 'elite'; if (ratio >= 0.75) return 'high'; if (ratio >= 0.55) return 'mid'; return 'low';
};
const colorFor = (ratio) => (ratio >= 0.7 ? 'green' : ratio >= 0.5 ? 'yellow' : 'red');

function partUnits(part, byQ) {
  const units = []; const multiQnums = new Set();
  part.question_groups.forEach((g) => {
    if (g.type === 'mcq_multi') {
      const qns = g.questions.map((q) => q.number).sort((a, b) => a - b);
      qns.forEach((n) => multiQnums.add(n));
      const correctLetters = qns.map((n) => byQ[n]?.correctAns).filter(Boolean);
      const userLetters = String(byQ[qns[0]]?.userAns || '').split(',').map((s) => s.trim()).filter(Boolean);
      const hits = userLetters.filter((l) => correctLetters.includes(l)).length;
      units.push({ multi: true, range: qns.length > 1 ? `${qns[0]}–${qns[qns.length - 1]}` : `${qns[0]}`, userLetters, correctLetters, hits, size: qns.length, primary: qns[0] });
    }
  });
  part.question_groups.forEach((g) => g.questions.forEach((q) => {
    if (!multiQnums.has(q.number) && byQ[q.number]) units.push({ multi: false, r: byQ[q.number] });
  }));
  return units.sort((a, b) => (a.multi ? a.primary : a.r.q) - (b.multi ? b.primary : b.r.q));
}

function ResultItems({ units, resolver }) {
  return units.map((u) => {
    if (u.multi) {
      const gcls = u.hits === u.size ? 'correct' : 'wrong';
      return (
        <div className={`result-item ${gcls}`} key={`m${u.primary}`}>
          <div className={`result-num ${gcls}`}>{u.range}</div>
          <div className="result-detail">
            <span className="label">Your answers:</span>
            <span className="your-answer">{u.userLetters.join(', ') || <em style={{ color: 'var(--text-muted)' }}>No answer</em>}</span>
            <span className="label">Correct:</span>
            <span className="correct-answer">{u.correctLetters.join(', ')} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({u.hits}/{u.size})</span></span>
          </div>
        </div>
      );
    }
    const r = u.r;
    const cls = r.unanswered ? 'unanswered' : r.correct ? 'correct' : 'wrong';
    return (
      <div className={`result-item ${cls}`} key={r.q}>
        <div className={`result-num ${r.unanswered ? '' : cls}`}>{r.q}</div>
        <div className="result-detail">
          <span className="label">Your answer:</span>
          {r.unanswered
            ? <span><em style={{ color: 'var(--text-muted)' }}>No answer</em></span>
            : <span className={`your-answer ${r.correct ? '' : 'wrong'}`}>{resolver(r.q, r.userAns)}</span>}
          <span className="label">Correct:</span>
          <span className="correct-answer">{resolver(r.q, r.correctAns)}</span>
        </div>
      </div>
    );
  });
}

function Collapsible({ title, defaultOpen, children }) {
  const [open, setOpen] = useState(!!defaultOpen);
  return (
    <div className={`rsec${open ? ' open' : ''}`}>
      <button type="button" className="rsec-head" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        <Chev /><span className="rsec-title">{title}</span>
      </button>
      {open && <div className="rsec-body">{children}</div>}
    </div>
  );
}

function ReportModal({ onClose, testKind, testId, grade }) {
  const [msg, setMsg] = useState('');
  const [state, setState] = useState('idle');
  const send = async () => {
    setState('sending');
    const res = await submitTestReport({ kind: testKind, test_id: testId, message: msg, context: { correct: grade.correct, total: grade.total, band: grade.band } });
    if (res.ok) { setState('sent'); setTimeout(onClose, 1100); } else setState('error');
  };
  return (
    <div className="modal-overlay" style={{ display: 'flex' }} onClick={onClose}>
      <div className="modal report-modal" onClick={(e) => e.stopPropagation()}>
        <h3>Report a problem</h3>
        <p className="report-sub">Spotted a wrong answer, a typo, or anything off in this test? Tell us and we'll fix it.</p>
        <textarea className="report-textarea" placeholder="Describe the issue — include the question number if you can." value={msg} onChange={(e) => setMsg(e.target.value)} autoFocus />
        {state === 'error' && <p className="report-error">Couldn't send — please try again.</p>}
        <div className="confirm-actions">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={!msg.trim() || state === 'sending' || state === 'sent'} onClick={send}>
            {state === 'sent' ? 'Sent ✓' : state === 'sending' ? 'Sending…' : 'Send report'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ResultsScreen({ grade, spec, banner, onReviewInContext, onShare, onFinish, testKind, testId, elapsedSec, durationSec, signedIn = true }) {
  const { correct, total, band, results } = grade;
  const isFull = total >= 40;
  const wrong = results.filter((r) => !r.correct && !r.unanswered).length;
  const unanswered = results.filter((r) => r.unanswered).length;
  const ratio = total ? correct / total : 0;
  const tier = tierFor(band, ratio, isFull);
  const [reportOpen, setReportOpen] = useState(false);
  const [activePassage, setActivePassage] = useState(0);
  const resolver = useMemo(() => buildLabelResolver(spec), [spec]);
  const types = useMemo(() => perTypeStats(spec, grade), [spec, grade]);
  const feedback = useMemo(() => generateFeedback({ grade, types, elapsedSec, durationSec }), [grade, types, elapsedSec, durationSec]);

  const byQ = useMemo(() => { const m = {}; results.forEach((r) => { m[r.q] = r; }); return m; }, [results]);
  const partOf = useMemo(() => {
    const m = {};
    spec.parts.forEach((p) => p.question_groups.forEach((g) => g.questions.forEach((q) => { m[q.number] = p.part_number; })));
    return m;
  }, [spec]);
  const passages = spec.parts.map((p) => {
    const rows = results.filter((r) => partOf[r.q] === p.part_number);
    const c = rows.filter((r) => r.correct).length;
    return { part: p, units: partUnits(p, byQ), correctInPart: c, total: rows.length, color: colorFor(rows.length ? c / rows.length : 0) };
  });
  const active = passages[Math.min(activePassage, passages.length - 1)] || passages[0];

  const bigNum = isFull ? (band != null ? band.toFixed(1) : '—') : `${correct} / ${total}`;
  const bigLabel = isFull ? 'Band Score' : 'Correct';

  return (
    <div className="results-screen results-v2 open" data-testid="results">
      <h1 className="results-v2-title">{banner ? 'Reviewing your attempt' : 'Test Complete'}</h1>

      {!signedIn && (
        <p className="results-savenotice" data-testid="save-notice" role="status">
          <span className="savenotice-dot" aria-hidden="true" />
          You're not signed in — this result isn't saved yet. <strong>Sign in</strong> and it'll be stored to your account automatically.
        </p>
      )}

      <div className="results-grid">
        <div className="results-left">
          {banner && <p className="results-message" style={{ opacity: 0.85, justifyContent: 'center', margin: 0 }}>{banner}</p>}
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
                    <div className="stat-value">{ps.correctInPart}</div>
                    <div className="stat-label">Passage {ps.part.part_number}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {types.length > 0 && (
            <div className="type-breakdown">
              <div className="type-breakdown-title">By question type</div>
              {types.map((t) => (
                <div className="type-row" key={t.label}>
                  <span className="type-label">{t.label}</span>
                  <span className="type-bar"><span className={`type-bar-fill ${colorFor(t.total ? t.correct / t.total : 0)}`} style={{ width: `${t.pct}%` }} /></span>
                  <span className="type-score">{t.correct}/{t.total}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="results-right">
          {feedback.length > 0 && (
            <Collapsible title="Feedback" defaultOpen>
              <ul className="feedback-list">
                {feedback.map((f, i) => (
                  <li className={`feedback-item ${f.tone}`} key={i}><span className="feedback-dot" />{f.text}</li>
                ))}
              </ul>
            </Collapsible>
          )}
          <Collapsible title="Per-passage breakdown" defaultOpen>
            <div className="passage-tabs">
              {passages.map((ps, i) => (
                <button key={ps.part.part_number} className={`passage-tab${active === ps ? ' active' : ''}`} onClick={() => setActivePassage(i)}>
                  Passage {ps.part.part_number}
                  <span className="passage-tab-count">{ps.correctInPart}/{ps.total}</span>
                </button>
              ))}
            </div>
            <div className="passage-tab-body">
              <ResultItems units={active.units} resolver={resolver} />
            </div>
          </Collapsible>
        </div>
      </div>

      <div className="results-actions-bottom">
        <button className="rbtn rbtn-report" onClick={() => setReportOpen(true)}>{ICON.report}<span>Report</span></button>
        {onReviewInContext && <button className="rbtn rbtn-review" onClick={onReviewInContext}>{ICON.review}<span>Review mistakes</span></button>}
        {onShare && <button className="rbtn rbtn-share" onClick={onShare}>{ICON.share}<span>Share result</span></button>}
        {onFinish && <button className="rbtn rbtn-finish" onClick={onFinish}>{ICON.finish}<span>Finish</span></button>}
      </div>

      {reportOpen && <ReportModal onClose={() => setReportOpen(false)} testKind={testKind} testId={testId} grade={grade} />}
    </div>
  );
}
