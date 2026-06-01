import React, { useState, useEffect, useRef, useMemo } from 'react';
import Icon from '../ui/icons';
import { logActivity } from '../../lib/progressStore';

// Word counter — counts whitespace-separated tokens of any non-empty length.
const countWords = (text) => (text.trim() ? text.trim().split(/\s+/).length : 0);

const formatTime = (sec) => {
  const m = Math.floor(Math.abs(sec) / 60);
  const s = Math.abs(sec) % 60;
  const sign = sec < 0 ? '-' : '';
  return `${sign}${m}:${String(s).padStart(2, '0')}`;
};

// localStorage key for an in-progress draft.
const draftKey = (id) => `iw.v1.writing.draft.${id}`;

const WritingPractice = ({ prompt, onBack }) => {
  const [phase, setPhase] = useState('intro'); // intro | writing | review
  const [text, setText] = useState(() => {
    try { return localStorage.getItem(draftKey(prompt.id)) || ''; } catch { return ''; }
  });
  const [remaining, setRemaining] = useState(prompt.timeLimitMin * 60);
  const [criteriaState, setCriteriaState] = useState({}); // { 'rubricId:idx': bool }
  const [showModel, setShowModel] = useState(false);
  const timerRef = useRef(null);

  // Auto-save draft on every text change.
  useEffect(() => {
    if (phase !== 'writing') return;
    try { localStorage.setItem(draftKey(prompt.id), text); } catch {}
  }, [text, phase, prompt.id]);

  // Countdown timer.
  useEffect(() => {
    if (phase !== 'writing') return;
    timerRef.current = setInterval(() => {
      setRemaining(r => r - 1);
    }, 1000);
    return () => clearInterval(timerRef.current);
  }, [phase]);

  const wordCount = useMemo(() => countWords(text), [text]);
  const onTarget = wordCount >= prompt.wordTarget;

  const start = () => {
    setPhase('writing');
    setRemaining(prompt.timeLimitMin * 60);
  };

  const submit = () => {
    clearInterval(timerRef.current);
    // Log activity (note: writing isn't auto-graded — we log a 0/0 marker so
    // it appears on the heatmap as effort, not a score).
    logActivity({ t: 'writing', id: prompt.id, correct: wordCount, total: prompt.wordTarget });
    setPhase('review');
  };

  const checkedCount = useMemo(
    () => Object.values(criteriaState).filter(Boolean).length,
    [criteriaState]
  );
  const totalCriteria = useMemo(
    () => prompt.rubric.reduce((sum, r) => sum + r.criteria.length, 0),
    [prompt.rubric]
  );

  if (phase === 'intro') {
    return (
      <div className="page-shell">
        <div className="page-section" style={{ maxWidth: '780px' }}>
          <button type="button" className="btn btn-secondary" onClick={onBack} style={{ marginBottom: 'var(--space-5)' }}>
            <Icon name="arrowLeft" size={16} /> Back to prompts
          </button>

          <div className="card" style={{ padding: 'var(--space-8)' }}>
            <div className="eyebrow" style={{ marginBottom: 'var(--space-3)' }}>
              {prompt.id} · {prompt.type.startsWith('task1') ? 'Task 1' : 'Task 2'} · {prompt.timeLimitMin} min · {prompt.wordTarget}+ words
            </div>
            <h1 className="h2" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
              {prompt.title}
            </h1>
            <div className="panel" style={{ padding: 'var(--space-5)', marginBottom: 'var(--space-5)', whiteSpace: 'pre-line', color: 'var(--text-primary)', lineHeight: 1.7 }}>
              {prompt.prompt}
            </div>
            <p className="body" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)' }}>
              Once you start, a timer counts down from {prompt.timeLimitMin} minutes. Your draft auto-saves as you type — you won't lose anything if you close the tab. When you submit, you'll get a self-grading rubric{prompt.bandNineModel ? ' and an annotated Band 9 model' : ''}.
            </p>
            <button type="button" className="btn btn-primary btn-lg" onClick={start}>
              <Icon name="edit" size={16} /> Start writing
            </button>
            {text && (
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', marginTop: 'var(--space-3)' }}>
                Draft restored — {countWords(text)} words from your last session.
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (phase === 'writing') {
    const overTime = remaining < 0;
    return (
      <div className="page-shell">
        <div className="page-section" style={{ maxWidth: '1100px' }}>
          {/* Sticky stat bar */}
          <div className="card" style={{ position: 'sticky', top: '90px', zIndex: 5, marginBottom: 'var(--space-4)', padding: 'var(--space-3) var(--space-5)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
              <div className="eyebrow" style={{ margin: 0 }}>
                {prompt.id} · {prompt.type.startsWith('task1') ? 'Task 1' : 'Task 2'}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-5)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
                  <Icon name="clock" size={16} style={{ color: overTime ? 'var(--error)' : remaining < 300 ? 'var(--amber-400)' : 'var(--text-secondary)' }} />
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: overTime ? 'var(--error)' : 'var(--text-primary)' }}>
                    {formatTime(remaining)}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: onTarget ? 'var(--success)' : 'var(--text-primary)', fontSize: 'var(--text-lg)' }}>
                    {wordCount}
                  </span>
                  <span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-xs)' }}>/ {prompt.wordTarget}</span>
                </div>
                <button type="button" className="btn btn-primary btn-sm" onClick={submit}>
                  Submit
                </button>
              </div>
            </div>
          </div>

          {/* Two-pane: prompt on left, textarea on right */}
          <div className="writing-layout" style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 'var(--space-5)' }}>
            <div className="card" style={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto', position: 'sticky', top: '160px', alignSelf: 'start' }}>
              <h2 className="h3" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
                {prompt.title}
              </h2>
              <div style={{ whiteSpace: 'pre-line', color: 'var(--text-secondary)', lineHeight: 1.7, fontSize: 'var(--text-sm)' }}>
                {prompt.prompt}
              </div>
            </div>
            <textarea
              className="form-textarea"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Start writing here…"
              autoFocus
              style={{
                minHeight: 'calc(100vh - 220px)',
                fontSize: 'var(--text-md)',
                lineHeight: 1.7,
                padding: 'var(--space-6)',
                fontFamily: '"Georgia", "Times New Roman", serif',
              }}
            />
          </div>

          <style>{`
            @media (max-width: 880px) {
              .writing-layout { grid-template-columns: 1fr !important; }
              .writing-layout > .card { position: static !important; max-height: none !important; }
            }
          `}</style>
        </div>
      </div>
    );
  }

  // Review phase
  return (
    <div className="page-shell">
      <div className="page-section" style={{ maxWidth: '900px' }}>
        <button type="button" className="btn btn-secondary" onClick={onBack} style={{ marginBottom: 'var(--space-5)' }}>
          <Icon name="arrowLeft" size={16} /> Back to prompts
        </button>

        {/* Result strip */}
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 'var(--space-5)' }}>
            <div>
              <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Words written</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: onTarget ? 'var(--success)' : 'var(--amber-400)', lineHeight: 1 }}>
                {wordCount}<span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', fontWeight: 500 }}> / {prompt.wordTarget}</span>
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Time used</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                {formatTime(prompt.timeLimitMin * 60 - remaining)}
              </div>
            </div>
            <div>
              <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Self-check</div>
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 'var(--text-2xl)', fontWeight: 700, color: 'var(--purple-400)', lineHeight: 1 }}>
                {checkedCount}<span style={{ color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)', fontWeight: 500 }}> / {totalCriteria}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Self-grading rubric */}
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <h2 className="h3" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
            Self-grade against the rubric
          </h2>
          <p className="body" style={{ fontSize: 'var(--text-sm)', marginBottom: 'var(--space-5)' }}>
            Tick every criterion your response satisfies. The honesty here is the practice — if you can't confidently tick a box, that's the area to work on.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {prompt.rubric.map((band) => (
              <div key={band.id}>
                <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 'var(--space-2)' }}>
                  {band.label}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)' }}>
                  {band.criteria.map((c, i) => {
                    const k = `${band.id}:${i}`;
                    const checked = !!criteriaState[k];
                    return (
                      <label key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 'var(--space-3)', cursor: 'pointer', padding: 'var(--space-2)', borderRadius: 'var(--r-md)', background: checked ? 'var(--correct-bg)' : 'transparent', transition: 'background var(--dur-fast) var(--ease)' }}>
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) => setCriteriaState(prev => ({ ...prev, [k]: e.target.checked }))}
                          style={{ marginTop: 4 }}
                        />
                        <span style={{ color: checked ? 'var(--text-primary)' : 'var(--text-secondary)', fontSize: 'var(--text-sm)', lineHeight: 1.5 }}>
                          {c}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Your response */}
        <div className="card" style={{ marginBottom: 'var(--space-5)' }}>
          <h2 className="h3" style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-3)' }}>
            Your response
          </h2>
          <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)', lineHeight: 1.7, fontFamily: '"Georgia", serif' }}>
            {text || <span style={{ color: 'var(--text-tertiary)', fontStyle: 'italic' }}>(empty)</span>}
          </div>
        </div>

        {/* Model answer */}
        {prompt.bandNineModel ? (
          <div className="card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
              <h2 className="h3" style={{ color: 'var(--text-primary)' }}>
                Band 9 model answer
              </h2>
              <button
                type="button"
                className={showModel ? 'btn btn-primary btn-sm' : 'btn btn-secondary btn-sm'}
                onClick={() => setShowModel(s => !s)}
              >
                {showModel ? 'Hide' : 'Reveal'}
              </button>
            </div>
            {showModel && (
              <>
                <div style={{ whiteSpace: 'pre-wrap', color: 'var(--text-primary)', lineHeight: 1.8, fontFamily: '"Georgia", serif', marginBottom: 'var(--space-5)' }}>
                  {prompt.bandNineModel.text}
                </div>
                {prompt.bandNineModel.annotations?.length > 0 && (
                  <>
                    <div className="eyebrow" style={{ marginBottom: 'var(--space-3)' }}>Why this scores Band 9</div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {prompt.bandNineModel.annotations.map((a, i) => (
                        <div key={i} style={{ padding: 'var(--space-3) var(--space-4)', borderLeft: '3px solid var(--purple-500)', background: 'var(--answer-bg)', borderRadius: '0 var(--r-md) var(--r-md) 0' }}>
                          <div style={{ fontStyle: 'italic', color: 'var(--purple-300)', marginBottom: 'var(--space-1)', fontSize: 'var(--text-sm)' }}>
                            "{a.phrase}"
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>{a.why}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        ) : (
          <div className="panel panel-info">
            <p className="body" style={{ fontSize: 'var(--text-sm)', margin: 0 }}>
              A Band 9 model for this prompt is pending. The team is rolling out one model answer per prompt as part of the content sprint.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WritingPractice;
