import React, { useState, useMemo } from 'react';
import Icon from '../ui/icons';

// =============================================================================
// Grammar exercise components — used inside the topic page sections.
//
// Each exercise component receives:
//   { exercise, onResult: ({ correct, userAnswer }) => void }
// and renders self-contained UI: input → check button → result panel.
// Mastery tests reuse these too, but suppress the result panel until the end.
// =============================================================================

// ---------- Helpers ----------------------------------------------------------

const normalise = (s) => String(s || '').toLowerCase().trim().replace(/\s+/g, ' ');

const matchAnswer = (userArr, correctArr) => {
  // Both are arrays (one per blank). Compare case-insensitively, allow
  // "Ø" as an alias for the empty string (and vice-versa).
  if (userArr.length !== correctArr.length) return false;
  return userArr.every((u, i) => {
    const a = normalise(u).replace(/^ø$/, '');
    const b = normalise(correctArr[i]).replace(/^ø$/, '');
    return a === b;
  });
};

const ResultPanel = ({ correct, explanation, modelAnswer }) => (
  <div className={`panel ${correct ? 'panel-success' : 'panel-error'}`} style={{ marginTop: 'var(--space-4)' }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
      <Icon name={correct ? 'checkCircle' : 'xCircle'} size={18} style={{ color: correct ? '#34d399' : '#f87171' }} />
      <strong style={{ color: correct ? '#34d399' : '#f87171' }}>{correct ? 'Correct!' : 'Not quite'}</strong>
    </div>
    {modelAnswer && (
      <div style={{ marginBottom: explanation ? 'var(--space-2)' : 0, color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
        <strong style={{ color: 'var(--text-primary)' }}>Model:</strong> {modelAnswer}
      </div>
    )}
    {explanation && (
      <div style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-sm)' }}>
        {explanation}
      </div>
    )}
  </div>
);

// ---------- Gap-fill ---------------------------------------------------------
// `exercise.question` contains one or more `___` markers. Each gap renders as
// an inline input. Allows "Ø" or empty input for zero-article cases.

export const GapFill = ({ exercise, onResult, hideFeedback }) => {
  const blanks = (exercise.question.match(/___/g) || []).length;
  const [values, setValues] = useState(Array(blanks).fill(''));
  const [submitted, setSubmitted] = useState(false);
  const [correct, setCorrect] = useState(false);

  const parts = useMemo(() => exercise.question.split('___'), [exercise.question]);

  const handleChange = (i, v) => {
    if (submitted) return;
    setValues(prev => prev.map((x, idx) => (idx === i ? v : x)));
  };

  const handleCheck = () => {
    const isCorrect = matchAnswer(values, exercise.answer);
    setCorrect(isCorrect);
    setSubmitted(true);
    if (onResult) onResult({ correct: isCorrect, userAnswer: values });
  };

  return (
    <div>
      <p style={{ fontSize: 'var(--text-md)', lineHeight: 1.7, color: 'var(--text-primary)', marginBottom: 'var(--space-4)' }}>
        {parts.map((p, i) => (
          <React.Fragment key={i}>
            {p}
            {i < blanks && (
              <input
                type="text"
                value={values[i]}
                onChange={(e) => handleChange(i, e.target.value)}
                disabled={submitted}
                aria-label={`Blank ${i + 1}`}
                placeholder={i === 0 && submitted === false ? 'a / the / Ø' : ''}
                style={{
                  display: 'inline-block',
                  width: '7em',
                  margin: '0 4px',
                  padding: '2px 8px',
                  border: 'none',
                  borderBottom: `2px solid ${submitted ? (correct ? 'var(--success)' : 'var(--error)') : 'var(--purple-500)'}`,
                  background: 'transparent',
                  color: 'var(--text-primary)',
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                  outline: 'none',
                }}
              />
            )}
          </React.Fragment>
        ))}
      </p>
      {!submitted ? (
        <button type="button" className="btn btn-primary btn-sm" onClick={handleCheck} disabled={values.every(v => v === '')}>
          Check
        </button>
      ) : hideFeedback ? null : (
        <ResultPanel correct={correct} explanation={exercise.explanation} modelAnswer={!correct ? exercise.answer.map(a => a || 'Ø').join(' / ') : null} />
      )}
    </div>
  );
};

// ---------- Multiple choice --------------------------------------------------

export const MultipleChoice = ({ exercise, onResult, hideFeedback }) => {
  const [selected, setSelected] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (idx) => {
    if (submitted) return;
    setSelected(idx);
    setSubmitted(true);
    const isCorrect = idx === exercise.answer;
    if (onResult) onResult({ correct: isCorrect, userAnswer: idx });
  };

  const correct = submitted && selected === exercise.answer;

  return (
    <div>
      <p style={{ fontSize: 'var(--text-md)', color: 'var(--text-primary)', marginBottom: 'var(--space-4)', lineHeight: 1.6 }}>
        {exercise.question}
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-2)', marginBottom: 'var(--space-2)' }}>
        {exercise.options.map((opt, i) => {
          const isSelected = selected === i;
          const isAnswer = exercise.answer === i;
          let bg = 'transparent';
          let border = '1px solid var(--border-color)';
          if (submitted) {
            if (isAnswer) {
              bg = 'var(--correct-bg)';
              border = '1px solid rgba(16, 185, 129, 0.4)';
            } else if (isSelected) {
              bg = 'var(--incorrect-bg)';
              border = '1px solid rgba(239, 68, 68, 0.4)';
            }
          } else if (isSelected) {
            border = '2px solid var(--purple-500)';
            bg = 'var(--purple-600-20)';
          }
          return (
            <button
              key={i}
              type="button"
              onClick={() => handleSubmit(i)}
              disabled={submitted}
              style={{
                padding: 'var(--space-3) var(--space-4)',
                borderRadius: 'var(--r-md)',
                border,
                background: bg,
                color: 'var(--text-primary)',
                cursor: submitted ? 'default' : 'pointer',
                textAlign: 'left',
                fontFamily: 'inherit',
                fontSize: 'var(--text-md)',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {submitted && !hideFeedback && (
        <ResultPanel correct={correct} explanation={exercise.explanation} />
      )}
    </div>
  );
};

// ---------- Transformation ---------------------------------------------------

export const Transform = ({ exercise, onResult, hideFeedback }) => {
  const [value, setValue] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);

  const isCorrect = useMemo(() => {
    if (!submitted) return false;
    return normalise(value) === normalise(exercise.answer);
  }, [submitted, value, exercise.answer]);

  const handleCheck = () => {
    setSubmitted(true);
    if (onResult) onResult({ correct: normalise(value) === normalise(exercise.answer), userAnswer: value });
  };

  return (
    <div>
      <p style={{ fontSize: 'var(--text-md)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)', lineHeight: 1.6 }}>
        {exercise.prompt}
      </p>
      <textarea
        className="form-textarea"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        disabled={submitted}
        placeholder="Type your answer here…"
        style={{ marginBottom: 'var(--space-3)' }}
      />
      {!submitted ? (
        <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-primary btn-sm" onClick={handleCheck} disabled={!value.trim()}>
            Check
          </button>
          {exercise.hints?.length > 0 && (
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => setShowHint(s => !s)}>
              <Icon name="lightbulb" size={14} style={{ color: 'var(--amber-400)' }} />
              {showHint ? 'Hide hint' : 'Show hint'}
            </button>
          )}
          {showHint && (
            <ul style={{ width: '100%', margin: 'var(--space-2) 0 0', paddingLeft: 'var(--space-5)', color: 'var(--text-tertiary)', fontSize: 'var(--text-sm)' }}>
              {exercise.hints.map((h, i) => <li key={i}>{h}</li>)}
            </ul>
          )}
        </div>
      ) : hideFeedback ? null : (
        <ResultPanel correct={isCorrect} explanation={null} modelAnswer={exercise.answer} />
      )}
    </div>
  );
};

// ---------- Mini-task (Apply) -----------------------------------------------
// Student types a free response, then taps "Reveal model" to compare.

export const MiniTask = ({ exercise }) => {
  const [value, setValue] = useState('');
  const [revealed, setRevealed] = useState(false);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', marginBottom: 'var(--space-3)' }}>
        <span className="pill">{exercise.taskType}</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>Free production</span>
      </div>
      <p style={{ fontSize: 'var(--text-md)', color: 'var(--text-primary)', marginBottom: 'var(--space-3)', lineHeight: 1.6 }}>
        {exercise.prompt}
      </p>
      <textarea
        className="form-textarea"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Your answer…"
        style={{ marginBottom: 'var(--space-3)' }}
      />
      {!revealed ? (
        <button type="button" className="btn btn-primary btn-sm" onClick={() => setRevealed(true)} disabled={!value.trim()}>
          Reveal model answer
        </button>
      ) : (
        <div className="panel panel-info">
          <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>Model answer</div>
          <p style={{ color: 'var(--text-primary)', marginBottom: 'var(--space-3)', lineHeight: 1.6 }}>
            {exercise.modelAnswer}
          </p>
          {exercise.criteria && (
            <>
              <div className="eyebrow" style={{ marginBottom: 'var(--space-2)' }}>What to check</div>
              <ul style={{ paddingLeft: 'var(--space-5)', color: 'var(--text-secondary)', fontSize: 'var(--text-sm)', margin: 0 }}>
                {exercise.criteria.map((c, i) => <li key={i}>{c}</li>)}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  );
};

// ---------- Dispatcher -------------------------------------------------------

export const Exercise = ({ exercise, onResult, hideFeedback }) => {
  switch (exercise.type) {
    case 'gap-fill': return <GapFill exercise={exercise} onResult={onResult} hideFeedback={hideFeedback} />;
    case 'mcq':      return <MultipleChoice exercise={exercise} onResult={onResult} hideFeedback={hideFeedback} />;
    case 'transform':return <Transform exercise={exercise} onResult={onResult} hideFeedback={hideFeedback} />;
    case 'mini-task':return <MiniTask exercise={exercise} />;
    default:
      return <div className="panel">Unsupported exercise type: <code>{exercise.type}</code></div>;
  }
};
