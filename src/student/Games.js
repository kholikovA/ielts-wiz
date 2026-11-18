import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Icon from '../components/ui/icons';
import * as api from './api';
import { useHub, useAsync, Loaded, BackLink, PageTitle, EmptyPanel, Coin, NoPaste } from './ui';
import { GAMES, buildRound, normalise, shortMeaning } from './gameRounds';
import { SessionTop, SpeakButton, KeyHints, DoneScreen } from './cardKit';

// Word games. Same visual language as the flashcards (cardKit + .fcx-* styles),
// plus game pieces (.gm-*): answer tiles, letter tiles, match boards.

const BLANK_RE = /_{3,}/;

// Prompt text with a "_____" gap drawn as a styled blank.
function GapText({ text }) {
  const [before, after] = text.split(BLANK_RE);
  if (after === undefined) return text;
  return <>{before}<span className="fcx-blank" aria-label="blank">&nbsp;</span>{after}</>;
}

function Prompt({ q, reveal }) {
  return (
    <div className="fcx-card gm-prompt">
      <div className="fcx-card-head">
        <span className="fcx-badge">{q.ask}</span>
        {q.big && <SpeakButton text={q.prompt} />}
        {!q.big && reveal && <SpeakButton text={reveal} />}
      </div>
      <div className="fcx-card-body">
        {q.big
          ? <span className="fcx-word">{q.prompt}</span>
          : <span className="fcx-prompt gm-prompt-text"><GapText text={q.prompt} /></span>}
        {q.extra}
      </div>
    </div>
  );
}

// Duolingo-style verdict panel with a Continue button (Enter).
function Verdict({ ok, answer, onNext }) {
  const [praise] = useState(() => PRAISE[Math.floor(Math.random() * PRAISE.length)]);
  return (
    <div className={`fcx-feedback fcx-feedback--${ok ? 'success' : 'danger'}`} role="status">
      <div className="fcx-feedback-head">
        <span className="fcx-feedback-icon"><Icon name={ok ? 'check' : 'close'} size={22} /></span>
        <div>
          <strong>{ok ? praise : 'Not quite'}</strong>
          {!ok && <span className="fcx-feedback-answer">Correct answer: <b>{answer}</b></span>}
        </div>
      </div>
      <div className="fcx-feedback-actions">
        <button type="button" className={`fcx-btn fcx-btn--${ok ? 'success' : 'danger'}`} onClick={onNext} autoFocus>Continue</button>
      </div>
    </div>
  );
}
const PRAISE = ['Correct!', 'Nice!', 'Great job!', 'Spot on!', 'Excellent!'];

// Multiple choice: shared by meaning, reverse and gap fill. Keys 1–4 answer, Enter continues.
function ChoiceQuestion({ q, onAnswer }) {
  const [picked, setPicked] = useState(null);
  const ok = picked === q.answer;
  const next = useCallback(() => onAnswer(ok), [onAnswer, ok]);
  const choose = useCallback((i) => { if (picked === null) setPicked(i); }, [picked]);
  useEffect(() => {
    const onKey = (e) => {
      if (picked !== null) {
        if (e.key === 'Enter') { e.preventDefault(); next(); }
        return;
      }
      const n = Number(e.key);
      if (n >= 1 && n <= q.options.length) choose(n - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, picked, choose, next]);

  const long = q.options.some((o) => o.length > 34);
  const answerText = q.options[q.answer];
  return (
    <>
      <Prompt q={q} reveal={picked !== null && !q.big ? answerText : null} />
      <div className={`gm-options${long ? ' gm-options--list' : ''}`}>
        {q.options.map((o, i) => {
          const cls = picked === null ? '' : i === q.answer ? ' is-right' : i === picked ? ' is-wrong' : ' is-dim';
          return (
            <button key={i} type="button" className={`gm-opt${cls}`} disabled={picked !== null} onClick={() => choose(i)}>
              <kbd>{i + 1}</kbd><span>{o}</span>
            </button>
          );
        })}
      </div>
      {picked === null
        ? <KeyHints items={[['1–4', 'Choose']]} />
        : <Verdict ok={ok} answer={answerText} onNext={next} />}
    </>
  );
}

// Which letter tiles the typed text has used up (greedy, case-insensitive).
function usedTiles(letters, typed) {
  const used = new Set();
  for (const ch of typed.replace(/\s+/g, '').toLowerCase()) {
    const i = letters.findIndex((l, k) => !used.has(k) && l.toLowerCase() === ch);
    if (i >= 0) used.add(i);
  }
  return used;
}

// Typed recall: spell / unscramble. Tap letter tiles or type.
function TypeQuestion({ q, onAnswer }) {
  const [value, setValue] = useState('');
  const [verdict, setVerdict] = useState(null);
  const input = useRef(null);
  useEffect(() => { input.current?.focus(); }, []);
  const ok = verdict === 'right';
  const submit = (e) => {
    e.preventDefault();
    if (verdict) { onAnswer(ok); return; }
    if (!value.trim()) return;
    setVerdict(normalise(value) === normalise(q.term) ? 'right' : 'wrong');
  };
  const used = q.letters ? usedTiles(q.letters, value) : null;

  return (
    <form className="gm-type" onSubmit={submit}>
      <Prompt q={{
        ...q,
        extra: (
          <>
            {q.letters && (
              <div className="gm-letters">
                {q.letters.map((l, i) => (
                  <button key={i} type="button" className={`gm-letter${used.has(i) ? ' is-used' : ''}`} disabled={Boolean(verdict) || used.has(i)}
                    onClick={() => { setValue((v) => v + l.toLowerCase()); input.current?.focus(); }}>{l}</button>
                ))}
              </div>
            )}
            <input ref={input} className={`fcx-input${verdict ? ` is-${verdict === 'right' ? 'correct' : 'wrong'}` : ''}`} value={value}
              onChange={(e) => setValue(e.target.value)} readOnly={Boolean(verdict)}
              placeholder={q.hint ? `Starts with “${q.hint}”` : 'Type the word'} aria-label="Your answer"
              autoComplete="off" autoCorrect="off" autoCapitalize="off" spellCheck={false} />
          </>
        ),
      }} reveal={verdict ? q.term : null} />
      {!verdict ? (
        <>
          <div className="fcx-actions">
            {q.letters
              ? <button type="button" className="fcx-btn fcx-btn--neutral" onClick={() => { setValue(''); input.current?.focus(); }} disabled={!value}>Clear</button>
              : <button type="button" className="fcx-btn fcx-btn--neutral" onClick={() => setVerdict('wrong')}>I don't know</button>}
            <button type="submit" className="fcx-btn fcx-btn--primary" disabled={!value.trim()}>Check</button>
          </div>
          <KeyHints items={[['Enter', 'Check']]} />
        </>
      ) : (
        <div className={`fcx-feedback fcx-feedback--${ok ? 'success' : 'danger'}`} role="status">
          <div className="fcx-feedback-head">
            <span className="fcx-feedback-icon"><Icon name={ok ? 'check' : 'close'} size={22} /></span>
            <div>
              <strong>{ok ? 'Correct!' : 'Not quite'}</strong>
              {!ok && <span className="fcx-feedback-answer">Correct answer: <b>{q.term}</b></span>}
            </div>
          </div>
          <div className="fcx-feedback-actions">
            <button type="submit" className={`fcx-btn fcx-btn--${ok ? 'success' : 'danger'}`} autoFocus>Continue</button>
          </div>
        </div>
      )}
    </form>
  );
}

// Match pairs: a board of 5 words and 5 meanings; pick from either side.
// A pair counts as correct if it was matched without a wrong attempt on that word.
function PairsBoard({ q, onDone }) {
  const [term, setTerm] = useState(null);
  const [meaning, setMeaning] = useState(null); // index into meaningOrder
  const [matched, setMatched] = useState(new Set());
  const [fresh, setFresh] = useState(null); // term just matched (green flash)
  const [missed, setMissed] = useState(new Set());
  const [wrong, setWrong] = useState(null); // { term, meaning } shaking
  const done = useRef(new Set());
  const missedRef = useRef(missed);
  missedRef.current = missed;

  useEffect(() => {
    if (term === null || meaning === null) return;
    const termIdx = q.meaningOrder[meaning];
    if (termIdx === term) {
      const t = term;
      done.current.add(t);
      setFresh(t);
      setTimeout(() => {
        setMatched((m) => new Set(m).add(t));
        setFresh((f) => (f === t ? null : f));
      }, 450);
      if (done.current.size === q.pairs.length) setTimeout(() => onDone(q.pairs.length - missedRef.current.size), 800);
    } else {
      setMissed((m) => new Set(m).add(term));
      setWrong({ term, meaning });
      setTimeout(() => setWrong(null), 500);
    }
    setTerm(null); setMeaning(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [term, meaning]);

  const state = (isTerm, idx) => {
    const t = isTerm ? idx : q.meaningOrder[idx];
    if (matched.has(t)) return ' is-gone';
    if (fresh === t) return ' is-right';
    if (wrong && (isTerm ? wrong.term === idx : wrong.meaning === idx)) return ' is-wrong';
    if (isTerm ? term === idx : meaning === idx) return ' is-picked';
    return '';
  };

  return (
    <>
      <div className="gm-pairs-head">
        <strong>Tap the matching pairs</strong>
        <span>{matched.size} / {q.pairs.length} matched</span>
      </div>
      <div className="gm-pairs">
        <div className="gm-col">
          {q.pairs.map((p, i) => (
            <button key={i} type="button" className={`gm-tile gm-tile--term${state(true, i)}`}
              onClick={() => !done.current.has(i) && setTerm(i)} disabled={matched.has(i) || fresh === i}>
              {p.term}
            </button>
          ))}
        </div>
        <div className="gm-col">
          {q.meaningOrder.map((termIdx, i) => (
            <button key={i} type="button" className={`gm-tile${state(false, i)}`}
              onClick={() => !done.current.has(termIdx) && setMeaning(i)} disabled={matched.has(termIdx) || fresh === termIdx}>
              {shortMeaning(q.pairs[termIdx].meaning, 90)}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function Result({ correct, total, best, coins, onAgain, onExit }) {
  const pct = total ? Math.round((correct / total) * 100) : 0;
  const title = pct === 100 ? 'Perfect round!' : pct >= 70 ? 'Great job!' : pct >= 40 ? 'Good effort!' : 'Keep practising!';
  const stats = [
    { label: 'Score', value: `${correct}/${total}` },
    { label: 'Accuracy', value: `${pct}%`, tone: pct >= 70 ? 'success' : undefined },
  ];
  if (best >= 3) stats.push({ label: 'Best streak', value: best });
  return (
    <DoneScreen icon="award" tone={pct >= 40 ? 'success' : 'wait'} title={title}
      text={coins === null ? 'Saving your result…' : coins ? <>You earned <strong>+{coins}</strong> <Coin size={16} /></> : 'Nice practice. Play again to earn more.'}
      stats={stats}>
      <button type="button" className="fcx-btn fcx-btn--primary" onClick={onAgain}><Icon name="refresh" size={18} /> Play again</button>
      <button type="button" className="fcx-btn fcx-btn--neutral" onClick={onExit}>All games</button>
    </DoneScreen>
  );
}

function Play({ game, words, onExit }) {
  const [round, setRound] = useState(() => buildRound(game, words));
  const [i, setI] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(0);
  const [best, setBest] = useState(0);
  const [coins, setCoins] = useState(null);
  const started = useRef(Date.now());
  const saved = useRef(false);

  const finished = i >= round.length;
  useEffect(() => {
    if (!finished || saved.current || !score.total) return;
    saved.current = true;
    api.saveGame(game.id, score.correct, score.total, Date.now() - started.current).then(setCoins).catch(() => setCoins(0));
  }, [finished, game.id, score]);

  const answer = useCallback((ok) => {
    setScore((s) => ({ correct: s.correct + (ok ? 1 : 0), total: s.total + 1 }));
    setStreak((n) => {
      const next = ok ? n + 1 : 0;
      setBest((b) => Math.max(b, next));
      return next;
    });
    setI((n) => n + 1);
  }, []);
  const boardDone = useCallback((correctPairs) => {
    const size = round[i].pairs.length;
    setScore((s) => ({ correct: s.correct + correctPairs, total: s.total + size }));
    setI((n) => n + 1);
  }, [round, i]);

  const again = () => {
    setRound(buildRound(game, words)); setI(0); setScore({ correct: 0, total: 0 }); setCoins(null);
    setStreak(0); setBest(0);
    started.current = Date.now(); saved.current = false;
  };

  if (finished) return <Result correct={score.correct} total={score.total} best={best} coins={coins} onAgain={again} onExit={onExit} />;

  const q = round[i];
  return (
    <div className="fcx gm">
      <SessionTop progress={i / round.length} onClose={onExit}>
        {streak >= 2 && <span className="gm-streak" title="Answers in a row"><Icon name="flame" size={16} />{streak}</span>}
        <span className="fcx-tally"><strong>{i + 1}</strong> / {round.length}</span>
      </SessionTop>
      <div className="fcx-stage" key={i}>
        {q.type === 'choice' && <ChoiceQuestion q={q} onAnswer={answer} />}
        {q.type === 'type' && <TypeQuestion q={q} onAnswer={answer} />}
        {q.type === 'pairs' && <PairsBoard q={q} onDone={boardDone} />}
      </div>
    </div>
  );
}

const GAME_TONE = { meaning: 'blue', reverse: 'accent', spell: 'success', gap: 'warn', pairs: 'pink', scramble: 'teal' };

export default function Games({ gameId }) {
  const { user, go } = useHub();
  const words = useAsync(() => api.gameWords(user.id), [user.id]);
  const game = GAMES.find((g) => g.id === gameId);

  // Prefer words already learned; fall back to everything when that's too few.
  const usable = useMemo(() => {
    const list = words.data || [];
    const learned = list.filter((w) => w.learned);
    return learned.length >= 8 ? learned : list;
  }, [words.data]);

  if (game) {
    return (
      <Loaded state={words}>
        {() => (game.available(usable)
          ? <NoPaste><Play key={game.id} game={game} words={usable} onExit={() => go('/games')} /></NoPaste>
          : (
            <>
              <BackLink to="/games" label="Word games" />
              <EmptyPanel icon="gamepad" title="Not enough words yet" lead={game.needs} />
            </>
          ))}
      </Loaded>
    );
  }

  return (
    <>
      <PageTitle eyebrow="Practice" title="Word games" lead="Short rounds that recycle words from your flashcards and saved list. Each round earns coins." />
      <Loaded state={words}>
        {() => usable.length < 4 ? (
          <EmptyPanel icon="gamepad" title="Learn a few words first" lead="Games use words from your flashcards and saved Articles words. You need at least 4.">
            <button type="button" className="btn btn-primary" onClick={() => go('/flashcards/study')}>Study flashcards</button>
          </EmptyPanel>
        ) : (
          <>
            <div className="gm-grid">
              {GAMES.map((g) => {
                const ok = g.available(usable);
                return (
                  <button key={g.id} type="button" className={`fcx-deck gm-card gm-card--${GAME_TONE[g.id] || 'accent'}${ok ? '' : ' is-disabled'}`}
                    onClick={() => go(`/games/${g.id}`)} disabled={!ok}>
                    <span className="fcx-deck-icon"><Icon name={g.icon} size={22} /></span>
                    <strong>{g.title}</strong>
                    <small>{ok ? g.desc : g.needs}</small>
                    {ok && <span className="gm-card-play"><Icon name="play" size={14} /> Play</span>}
                  </button>
                );
              })}
            </div>
            <p className="gm-pool"><Icon name="layers" size={16} /> {usable.length} words in your pool</p>
          </>
        )}
      </Loaded>
    </>
  );
}
