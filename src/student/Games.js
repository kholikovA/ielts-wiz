import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Icon from '../components/ui/icons';
import * as api from './api';
import { useHub, useAsync, Loaded, BackLink, PageTitle, EmptyPanel, Coin } from './ui';
import { GAMES, buildRound, normalise, shortMeaning } from './gameRounds';

function Result({ correct, total, coins, onAgain, onExit }) {
  return (
    <div className="card hub-empty">
      <div className="coming-soon-icon"><Icon name="award" size={24} /></div>
      <h2>{correct}/{total} correct</h2>
      <p>{coins ? <>You earned <strong>+{coins}</strong> <Coin /></> : 'Nice practice.'}</p>
      <div className="hub-actions" style={{ marginTop: 8 }}>
        <button type="button" className="btn" onClick={onExit}>All games</button>
        <button type="button" className="btn btn-primary" onClick={onAgain}><Icon name="refresh" size={14} /> Play again</button>
      </div>
    </div>
  );
}

// Multiple choice: shared by meaning, reverse and gap fill. Keys 1–4 answer.
function ChoiceQuestion({ q, onAnswer }) {
  const [picked, setPicked] = useState(null);
  useEffect(() => setPicked(null), [q]);
  const choose = useCallback((i) => {
    if (picked !== null) return;
    setPicked(i);
    setTimeout(() => onAnswer(i === q.answer), i === q.answer ? 550 : 1300);
  }, [picked, q, onAnswer]);
  useEffect(() => {
    const onKey = (e) => { const n = Number(e.key); if (n >= 1 && n <= q.options.length) choose(n - 1); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [q, choose]);
  return (
    <>
      <div className="card game-prompt">
        <small>{q.ask}</small>
        {q.big ? <strong>{q.prompt}</strong> : <p>{q.prompt}</p>}
      </div>
      <div className="game-options">
        {q.options.map((o, i) => {
          const cls = picked === null ? '' : i === q.answer ? ' is-right' : i === picked ? ' is-wrong' : '';
          return (
            <button key={i} type="button" className={`game-opt${cls}`} disabled={picked !== null} onClick={() => choose(i)}>
              <kbd>{i + 1}</kbd>{o}
            </button>
          );
        })}
      </div>
    </>
  );
}

// Typed recall: spell / unscramble.
function TypeQuestion({ q, onAnswer }) {
  const [value, setValue] = useState('');
  const [verdict, setVerdict] = useState(null);
  const input = useRef(null);
  useEffect(() => { setValue(''); setVerdict(null); input.current?.focus(); }, [q]);
  const submit = (e) => {
    e.preventDefault();
    if (verdict) return;
    const ok = normalise(value) === normalise(q.term);
    setVerdict(ok ? 'right' : 'wrong');
    setTimeout(() => onAnswer(ok), ok ? 600 : 1800);
  };
  return (
    <>
      <div className="card game-prompt">
        <small>{q.ask}</small>
        <p>{q.prompt}</p>
        {q.letters && <div className="game-letters">{q.letters.map((l, i) => <span key={i}>{l}</span>)}</div>}
      </div>
      <form className="game-type" onSubmit={submit}>
        <input ref={input} className="form-input" value={value} onChange={(e) => setValue(e.target.value)}
          placeholder={q.hint ? `Starts with "${q.hint}"` : 'Type the word'} autoComplete="off" autoCapitalize="off" spellCheck="false" disabled={Boolean(verdict)} />
        <button className="btn btn-primary" disabled={!value.trim() || Boolean(verdict)}>Check</button>
      </form>
      <div className={`game-feedback${verdict ? ` is-${verdict}` : ''}`}>
        {verdict === 'right' && 'Correct'}
        {verdict === 'wrong' && <>Answer: <strong>{q.term}</strong></>}
      </div>
    </>
  );
}

// Match pairs: a board of 5 words and 5 meanings. A pair counts as correct if
// it was matched without a wrong attempt on that word.
function PairsBoard({ q, onDone }) {
  const [sel, setSel] = useState(null);
  const [matched, setMatched] = useState(new Set());
  const [missed, setMissed] = useState(new Set());
  const [flash, setFlash] = useState(null);
  useEffect(() => { setSel(null); setMatched(new Set()); setMissed(new Set()); }, [q]);

  const pickTerm = (idx) => { if (!matched.has(idx)) setSel(idx); };
  const pickMeaning = (idx) => {
    const termIdx = q.meaningOrder[idx];
    if (sel === null || matched.has(termIdx)) return;
    if (termIdx === sel) {
      const next = new Set(matched); next.add(sel);
      setMatched(next); setSel(null);
      if (next.size === q.pairs.length) setTimeout(() => onDone(q.pairs.length - missed.size), 400);
    } else {
      setMissed((m) => new Set(m).add(sel));
      setFlash(idx); setTimeout(() => setFlash(null), 400);
    }
  };

  return (
    <>
      <div className="card game-prompt"><small>Pick a word, then its meaning</small></div>
      <div className="game-pairs">
        <div className="hub-stack" style={{ gap: 8 }}>
          {q.pairs.map((p, i) => (
            <button key={i} type="button" className={`game-opt${matched.has(i) ? ' is-gone' : sel === i ? ' is-picked' : ''}`} onClick={() => pickTerm(i)} disabled={matched.has(i)}>
              <strong>{p.term}</strong>
            </button>
          ))}
        </div>
        <div className="hub-stack" style={{ gap: 8 }}>
          {q.meaningOrder.map((termIdx, i) => (
            <button key={i} type="button" className={`game-opt${matched.has(termIdx) ? ' is-gone' : flash === i ? ' is-wrong' : ''}`} onClick={() => pickMeaning(i)} disabled={matched.has(termIdx)}>
              {shortMeaning(q.pairs[termIdx].meaning, 90)}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}

function Play({ game, words, onExit }) {
  const [round, setRound] = useState(() => buildRound(game, words));
  const [i, setI] = useState(0);
  const [score, setScore] = useState({ correct: 0, total: 0 });
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
    setI((n) => n + 1);
  }, []);
  const boardDone = useCallback((correctPairs) => {
    const size = round[i].pairs.length;
    setScore((s) => ({ correct: s.correct + correctPairs, total: s.total + size }));
    setI((n) => n + 1);
  }, [round, i]);

  const again = () => {
    setRound(buildRound(game, words)); setI(0); setScore({ correct: 0, total: 0 }); setCoins(null);
    started.current = Date.now(); saved.current = false;
  };

  if (finished) return <Result correct={score.correct} total={score.total} coins={coins} onAgain={again} onExit={onExit} />;

  const q = round[i];
  return (
    <div className="game">
      <div className="game-top">
        <span>{game.title}</span>
        <span className="hub-bar"><span style={{ width: `${(i / round.length) * 100}%` }} /></span>
        <span className="hub-num">{i + 1}/{round.length}</span>
      </div>
      {q.type === 'choice' && <ChoiceQuestion q={q} onAnswer={answer} />}
      {q.type === 'type' && <TypeQuestion q={q} onAnswer={answer} />}
      {q.type === 'pairs' && <PairsBoard q={q} onDone={boardDone} />}
    </div>
  );
}

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
      <>
        <BackLink to="/games" label="Word games" />
        <Loaded state={words}>
          {() => (game.available(usable)
            ? <Play key={game.id} game={game} words={usable} onExit={() => go('/games')} />
            : <EmptyPanel icon="gamepad" title="Not enough words yet" lead={game.needs} />)}
        </Loaded>
      </>
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
            <div className="hub-grid">
              {GAMES.map((g) => {
                const ok = g.available(usable);
                return (
                  <button key={g.id} type="button" className={`card card-interactive game-card${ok ? '' : ' is-disabled'}`}
                    onClick={() => go(`/games/${g.id}`)} disabled={!ok} style={{ textAlign: 'left', font: 'inherit' }}>
                    <span className="hub-kind-icon"><Icon name={g.icon} size={18} /></span>
                    <strong>{g.title}</strong>
                    <p>{ok ? g.desc : g.needs}</p>
                  </button>
                );
              })}
            </div>
            <p className="form-help" style={{ marginTop: 16 }}>{usable.length} words in your pool.</p>
          </>
        )}
      </Loaded>
    </>
  );
}
