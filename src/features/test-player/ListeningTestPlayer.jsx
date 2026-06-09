import React, { useMemo, useState, useEffect, useCallback } from 'react';
import './player.css';
import './listening.css';
import ListeningQuestionGroup from './components/ListeningQuestionGroup';
import ResultsScreen from './components/ResultsScreen';
import ListeningReviewView from './review/ListeningReviewView';
import { gradeTest } from './grading';
import { recordAttempt, loadLastSubmission, loadLastSubmissionCloud } from './recording';
import { shareResultImage } from './resultImage';
import { useAuth } from '../../contexts/AuthContext';

const keyOf = (g) => {
  const ns = g.questions.map((q) => q.number).sort((a, b) => a - b);
  return `${g.type}_${ns[0]}_${ns[ns.length - 1]}`;
};
const partQnums = (part) => {
  const ns = [];
  part.question_groups.forEach((g) => g.questions.forEach((q) => ns.push(q.number)));
  return [...new Set(ns)].sort((a, b) => a - b);
};

// `test` is a manifest entry { kind, id, spec }. Mirrors ReadingTestPlayer but with
// an audio header in place of the passage, and a single scrolling question column.
export default function ListeningTestPlayer({ test, review = false, onExit }) {
  const { spec, kind, id } = test;
  const { user } = useAuth();
  const solverName = (user && (user.user_metadata?.full_name || user.user_metadata?.name || user.email)) || '';

  const [answers, setAnswers] = useState({});
  const [grade, setGrade] = useState(null);
  const [submittedAt, setSubmittedAt] = useState(null);
  const [elapsedSec, setElapsedSec] = useState(null);
  const [inReview, setInReview] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [banner, setBanner] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState((spec.duration_minutes || 30) * 60);
  const [activePart, setActivePart] = useState(1);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [theme, setTheme] = useState(() => (typeof document !== 'undefined' && document.documentElement.getAttribute('data-theme')) || 'light');
  const [textSize, setTextSize] = useState('default');

  const setAnswer = useCallback((q, v) => {
    setAnswers((a) => {
      const n = { ...a };
      if (v === '' || v == null) delete n[q]; else n[q] = v;
      return n;
    });
  }, []);

  // Review mode: replay the saved submission read-only.
  useEffect(() => {
    if (!review) return undefined;
    const apply = (saved) => {
      setAnswers(saved.answers);
      setGrade(gradeTest(spec, saved.answers));
      setSubmittedAt(saved.ts ? new Date(saved.ts) : new Date());
      setInReview(true);
      setBanner('You are viewing your previous attempt. Answers are read-only.');
    };
    const local = loadLastSubmission(kind, id);
    if (local && local.answers && Object.keys(local.answers).length) { apply(local); return undefined; }
    let cancelled = false;
    Promise.resolve(loadLastSubmissionCloud(kind, id)).then((remote) => {
      if (cancelled) return;
      if (remote && remote.answers && Object.keys(remote.answers).length) apply(remote);
      else setBanner('No saved attempt found — start the test to create one.');
    }).catch(() => { if (!cancelled) setBanner('No saved attempt found — start the test to create one.'); });
    return () => { cancelled = true; };
  }, [review, kind, id, spec]);

  const totalQuestions = useMemo(
    () => spec.parts.reduce((n, p) => n + p.question_groups.reduce((m, g) => m + g.questions.length, 0), 0),
    [spec]
  );
  const answeredCount = Object.keys(answers).length;
  const resultsByQ = useMemo(() => {
    const m = {};
    (grade?.results || []).forEach((r) => { m[r.q] = r; });
    return m;
  }, [grade]);
  const readOnly = !!grade;

  const doSubmit = useCallback(() => {
    const g = gradeTest(spec, answers);
    const elapsed = (spec.duration_minutes || 30) * 60 - secondsLeft;
    recordAttempt({ kind, id, answers, correct: g.correct, total: g.total, durationSec: elapsed, replaying: review });
    setGrade(g);
    setSubmittedAt(new Date());
    setElapsedSec(elapsed);
    setShowConfirm(false);
    try { window.scrollTo(0, 0); } catch { /* jsdom */ }
  }, [spec, answers, kind, id, review, secondsLeft]);

  useEffect(() => {
    if (grade || review) return undefined;
    const t = setInterval(() => {
      setSecondsLeft((s) => { if (s <= 1) { clearInterval(t); doSubmit(); return 0; } return s - 1; });
    }, 1000);
    return () => clearInterval(t);
  }, [grade, review, doSubmit]);

  const mm = String(Math.floor(secondsLeft / 60)).padStart(2, '0');
  const ss = String(secondsLeft % 60).padStart(2, '0');
  const minutesLeft = Math.max(0, Math.ceil(secondsLeft / 60));

  // Transcript review: transcript (left) with answer locations + question list.
  if (grade && inReview) {
    return (
      <div className="rtp-root test-locked" data-theme={theme} data-text-size={textSize} style={{ height: '100vh', overflow: 'hidden' }}>
        <ListeningReviewView spec={spec} grade={grade} onExit={() => setInReview(false)} />
      </div>
    );
  }

  // Results summary (before the transcript review).
  if (grade && !inReview) {
    return (
      <div className="rtp-root test-locked" data-theme={theme} data-text-size={textSize} style={{ height: '100vh', overflowY: 'auto' }}>
        <ResultsScreen
          grade={grade}
          spec={spec}
          banner={banner}
          onReviewInContext={() => { setInReview(true); setActivePart(1); }}
          onShare={() => shareResultImage({ spec, grade, solverName, submittedAt })}
          onFinish={onExit}
          testKind={kind}
          testId={id}
          elapsedSec={elapsedSec}
          durationSec={(spec.duration_minutes || 30) * 60}
          signedIn={!!user || review}
        />
      </div>
    );
  }

  const audioHeader = (
    <div className="ltp-audio">
      {spec.audio_url ? (
        // eslint-disable-next-line jsx-a11y/media-has-caption
        <audio controls controlsList="nodownload noplaybackrate" onContextMenu={(e) => e.preventDefault()} src={spec.audio_url} />
      ) : (
        <span className="ltp-audio-note">{spec.audio_note || 'Audio plays once. Answer as you listen.'}</span>
      )}
    </div>
  );

  return (
    <div className={`rtp-root${readOnly ? ' test-locked' : ''}`} data-theme={theme} data-text-size={textSize} style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="topbar">
        <div className="brand-area">
          <a href="/" className="brand-link" aria-label="IELTS Wiz home" onClick={(e) => { e.preventDefault(); if (onExit) onExit(); }}>
            <img className="brand-logo brand-logo-light" src="/logo-light.svg" alt="IELTS Wiz" />
            <img className="brand-logo brand-logo-dark" src="/logo-dark.svg" alt="IELTS Wiz" />
          </a>
        </div>
        {!review && !readOnly ? (
          <div className="timer"><span className="timer-mins">{minutesLeft} minutes left</span><span className="timer-secs">{mm}:{ss} left</span></div>
        ) : <div />}
        <div className="topbar-actions">
          <button className="icon-btn" onClick={() => setSettingsOpen(true)} title="Settings" aria-label="Settings">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" /></svg>
          </button>
          {readOnly ? (
            <button className="submit-btn" onClick={() => setInReview(false)}>Score</button>
          ) : (
            <button className="submit-btn" onClick={() => setShowConfirm(true)}>Submit</button>
          )}
        </div>
      </header>

      {audioHeader}

      <div className="part-banner">
        <h2>Listening {spec.parts[activePart - 1]?.section_title || `Section ${activePart}`}</h2>
        <p>
          {readOnly
            ? `Reviewing your answers — ${grade.band != null ? `Band ${grade.band.toFixed(1)} · ` : ''}${grade.correct}/${grade.total} correct.`
            : (spec.parts[activePart - 1]?.section_subtitle || 'Answer the questions for this section.')}
        </p>
      </div>

      {banner && (
        <div className="review-banner" style={{ padding: '8px 16px', background: 'var(--bg-banner)', fontSize: 13, flex: '0 0 auto' }}>{banner}</div>
      )}

      <div className="ltp-body" id="questionsPane">
        {spec.parts.map((part) => (
          <div className={`ltp-section${part.part_number === activePart ? ' active' : ''}`} data-part={part.part_number} key={part.part_number}>
            {part.question_groups.map((g) => (
              <ListeningQuestionGroup
                key={keyOf(g)}
                group={g}
                answers={answers}
                onChange={setAnswer}
                readOnly={readOnly}
                results={readOnly ? resultsByQ : null}
              />
            ))}
          </div>
        ))}
      </div>

      <footer className="footer">
        <a className="back-link" href="/listening" aria-label="Back to tests" onClick={(e) => { e.preventDefault(); if (onExit) onExit(); }}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          Back
        </a>
        {spec.parts.map((part) => {
          const qns = partQnums(part);
          const answered = qns.filter((q) => answers[q] != null && answers[q] !== '').length;
          const isActive = part.part_number === activePart;
          return (
            <div
              key={part.part_number}
              className={`part-section${isActive ? ' active' : ''}`}
              onClick={() => { if (!isActive) { setActivePart(part.part_number); try { document.getElementById('questionsPane').scrollTo(0, 0); } catch { /* jsdom */ } } }}
              style={isActive ? undefined : { cursor: 'pointer' }}
            >
              <span className="part-label">Section {part.part_number}</span>
              <span className="part-progress">{answered}/{qns.length}</span>
            </div>
          );
        })}
      </footer>

      {settingsOpen && (
        <div className="modal-overlay" style={{ display: 'flex' }} onClick={() => setSettingsOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3>Exam Settings
              <button className="modal-close" onClick={() => setSettingsOpen(false)} aria-label="Close">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </h3>
            <div className="settings-section">
              <div className="settings-label">Theme</div>
              <div className="settings-options">
                {['light', 'dark', 'system'].map((t) => (
                  <button key={t} className={`settings-option${theme === t ? ' selected' : ''}`} onClick={() => setTheme(t)} style={{ textTransform: 'capitalize' }}>{t}</button>
                ))}
              </div>
            </div>
            <div className="settings-section">
              <div className="settings-label">Text Size</div>
              <div className="settings-options">
                <button className={`settings-option${textSize === 'default' ? ' selected' : ''}`} onClick={() => setTextSize('default')}>Default</button>
                <button className={`settings-option${textSize === 'large' ? ' selected' : ''}`} onClick={() => setTextSize('large')}>Large</button>
                <button className={`settings-option${textSize === 'xl' ? ' selected' : ''}`} onClick={() => setTextSize('xl')}>Extra Large</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showConfirm && (
        <div className="modal-overlay" style={{ display: 'flex' }}>
          <div className="modal">
            <h3>Are you sure you want to submit?</h3>
            <div className="review-summary">You have answered <strong>{answeredCount}</strong> of <strong>{totalQuestions}</strong> questions.</div>
            <div className="confirm-actions confirm-actions-split">
              <button className="btn-secondary" onClick={() => setShowConfirm(false)}>Continue test</button>
              <button className="btn-primary" onClick={doSubmit}>Submit test</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
